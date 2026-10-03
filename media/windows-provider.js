const { execFile } = require('child_process');

const PS_SCRIPT = `
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1' })[0]
Function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    return $netTask.Result
}
[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime] | Out-Null
$mgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
$session = $mgr.GetCurrentSession()
if ($null -eq $session) { Write-Output '{"title":null}'; exit }
$media = Await ($session.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
$timeline = $session.GetTimelineProperties()
$playback = $session.GetPlaybackInfo()
$thumb = $null
try {
  if ($media.Thumbnail) {
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
  }
} catch { }
$result = @{
  title = $media.Title
  artist = $media.Artist
  album = $media.AlbumTitle
  isPlaying = ($playback.PlaybackStatus -eq 'Playing')
  position = [math]::Round($timeline.Position.TotalSeconds, 1)
  duration = [math]::Round($timeline.EndTime.TotalSeconds, 1)
  thumbnail = $thumb
} | ConvertTo-Json -Compress
Write-Output $result
`;

class WindowsProvider {
  runScript(script) {
    return new Promise((resolve, reject) => {
      execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], (error, stdout, stderr) => {
        if (error) {
          resolve(null);
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  async getMediaInfo() {
    try {
      const output = await this.runScript(PS_SCRIPT);
      if (!output) return null;
      
      const data = JSON.parse(output);
      if (!data.title) return null;
      
      return {
        title: data.title,
        artist: data.artist || '',
        album: data.album || '',
        thumbnailDataUrl: data.thumbnail ? 'data:image/png;base64,' + data.thumbnail : null,
        position: data.position || 0,
        duration: data.duration || 0,
        isPlaying: data.isPlaying || false
      };
    } catch (e) {
      return null;
    }
  }

  async control(action, arg) {
    let method = '';
    if (action === 'toggle') method = 'TryTogglePlayPauseAsync()';
    else if (action === 'next') method = 'TrySkipNextAsync()';
    else if (action === 'prev') method = 'TrySkipPreviousAsync()';
    else if (action === 'seek' && typeof arg === 'number') {
      const secs = Math.max(0, Math.round(arg));
      method = `TryChangePlaybackPositionAsync([System.TimeSpan]::FromSeconds(${secs}))`;
    }
    else return false;

    const script = [
      'Add-Type -AssemblyName System.Runtime.WindowsRuntime',
      "$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]",
      'Function Await($WinRtTask, $ResultType) {',
      '    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)',
      '    $netTask = $asTask.Invoke($null, @($WinRtTask))',
      '    $netTask.Wait(-1) | Out-Null',
      '    return $netTask.Result',
      '}',
      '[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime] | Out-Null',
      '$mgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])',
      '$session = $mgr.GetCurrentSession()',
      'if ($null -ne $session) {',
      '    $session.' + method,
      '}'
    ].join('\n');

    await this.runScript(script);
    return true;
  }
}

module.exports = WindowsProvider;
