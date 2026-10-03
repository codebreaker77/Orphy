const { spawn, execFile } = require('child_process');
const readline = require('readline');

const DAEMON_SCRIPT = `
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1' })[0]
Function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    return $netTask.Result
}
[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime] | Out-Null

$mgr = $null
try {
    $mgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
} catch {
    Write-Output '{"title":null}'
    exit
}

$lastTitle = ""
$lastPlaying = $false
$lastPos = -1

while ($true) {
    try {
        $session = $mgr.GetCurrentSession()
        if ($null -eq $session) {
            if ($lastTitle -ne "") {
                Write-Output '{"title":null}'
                $lastTitle = ""
                $lastPlaying = $false
                $lastPos = -1
            }
        } else {
            $media = Await ($session.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
            $timeline = $session.GetTimelineProperties()
            $playback = $session.GetPlaybackInfo()
            
            $curTitle = if ($media.Title) { $media.Title } else { "" }
            $curArtist = if ($media.Artist) { $media.Artist } else { "" }
            $curAlbum = if ($media.AlbumTitle) { $media.AlbumTitle } else { "" }
            $curPlaying = ($playback.PlaybackStatus -eq 'Playing')
            $curPos = [math]::Round($timeline.Position.TotalSeconds, 1)
            $curDur = [math]::Round($timeline.EndTime.TotalSeconds, 1)

            $songChanged = ($curTitle -ne $lastTitle)
            $playChanged = ($curPlaying -ne $lastPlaying)
            $posMoved = ([math]::Abs($curPos - $lastPos) -ge 1.0)

            if ($songChanged -or $playChanged -or $posMoved) {
                $thumb = $null
                # Only extract thumbnail if song actually changed
                if ($songChanged -and $media.Thumbnail) {
                    try {
                        [Windows.Storage.Streams.IRandomAccessStreamWithContentType,Windows.Storage.Streams,ContentType=WindowsRuntime] | Out-Null
                        $stream = Await ($media.Thumbnail.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
                        $asStream = ([System.IO.WindowsRuntimeStreamExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsStream' -and $_.GetParameters().Count -eq 1 })[0]
                        $netStream = $asStream.Invoke($null, @($stream))
                        $memStream = New-Object System.IO.MemoryStream
                        $netStream.CopyTo($memStream)
                        $bytes = $memStream.ToArray()
                        if ($bytes.Length -gt 0) {
                            $thumb = [Convert]::ToBase64String($bytes)
                        }
                        $memStream.Dispose()
                        $netStream.Dispose()
                        $stream.Dispose()
                    } catch { }
                }

                $obj = @{
                    title = $curTitle
                    artist = $curArtist
                    album = $curAlbum
                    isPlaying = $curPlaying
                    position = $curPos
                    duration = $curDur
                    songChanged = $songChanged
                }
                if ($songChanged) {
                    $obj["thumbnail"] = $thumb
                }
                $json = $obj | ConvertTo-Json -Compress
                Write-Output $json

                $lastTitle = $curTitle
                $lastPlaying = $curPlaying
                $lastPos = $curPos
            }
        }
    } catch { }
    Start-Sleep -Milliseconds 800
}
`;

class WindowsProvider {
  constructor() {
    this.latestMedia = null;
    this.cachedThumbnail = null;
    this.child = null;
    this.onUpdateCallback = null;
    this.isExiting = false;
    this.startDaemon();
  }

  startDaemon() {
    if (this.isExiting) return;

    try {
      this.child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', DAEMON_SCRIPT], {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'ignore']
      });

      const rl = readline.createInterface({ input: this.child.stdout });

      rl.on('line', (line) => {
        try {
          const raw = line.trim();
          if (!raw) return;
          const data = JSON.parse(raw);

          if (!data.title) {
            this.latestMedia = null;
            this.cachedThumbnail = null;
            if (this.onUpdateCallback) this.onUpdateCallback(null);
            return;
          }

          // Cache thumbnail on track change
          if (data.songChanged) {
            this.cachedThumbnail = data.thumbnail ? 'data:image/png;base64,' + data.thumbnail : null;
          }

          this.latestMedia = {
            title: data.title,
            artist: data.artist || '',
            album: data.album || '',
            thumbnailDataUrl: this.cachedThumbnail,
            position: data.position || 0,
            duration: data.duration || 0,
            isPlaying: !!data.isPlaying,
            songChanged: !!data.songChanged
          };

          if (this.onUpdateCallback) {
            this.onUpdateCallback(this.latestMedia);
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      });

      this.child.on('exit', () => {
        this.child = null;
        if (!this.isExiting) {
          setTimeout(() => this.startDaemon(), 2500);
        }
      });
    } catch (err) {
      console.warn('[Orphy] Failed to start Windows media daemon:', err.message);
    }
  }

  onUpdate(callback) {
    this.onUpdateCallback = callback;
  }

  async getMediaInfo() {
    return this.latestMedia;
  }

  async control(action, arg) {
    let scriptBlock = '';
    if (action === 'toggle') {
      scriptBlock = 'Await ($session.TryTogglePlayPauseAsync()) ([bool]) | Out-Null';
    } else if (action === 'next') {
      scriptBlock = 'Await ($session.TrySkipNextAsync()) ([bool]) | Out-Null';
    } else if (action === 'prev') {
      scriptBlock = 'Await ($session.TrySkipPreviousAsync()) ([bool]) | Out-Null';
    } else if (action === 'seek' && typeof arg === 'number') {
      const ticks = Math.max(0, Math.round(arg * 10000000));
      scriptBlock = `Await ($session.TryChangePlaybackPositionAsync([Int64]${ticks})) ([bool]) | Out-Null`;
    } else {
      return false;
    }

    const script = [
      'Add-Type -AssemblyName System.Runtime.WindowsRuntime',
      "$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]",
      'Function Await($WinRtTask, $ResultType) {',
      '    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)',
      '    $netTask = $asTask.Invoke($null, @($WinRtTask))',
      '    $netTask.Wait(1500) | Out-Null',
      '    return $netTask.Result',
      '}',
      '[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime] | Out-Null',
      '$mgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])',
      '$session = $mgr.GetCurrentSession()',
      'if ($null -ne $session) {',
      `    ${scriptBlock}`,
      '}'
    ].join('\n');

    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true }, (err) => {
      if (err) console.warn('[Orphy] Control error:', err.message);
    });
    return true;
  }

  destroy() {
    this.isExiting = true;
    if (this.child) {
      try { this.child.kill(); } catch (e) {}
      this.child = null;
    }
  }
}

module.exports = WindowsProvider;
