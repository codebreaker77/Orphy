document.addEventListener('DOMContentLoaded', () => {
  const islandContainer = document.getElementById('island-container');
  const albumCanvas = document.getElementById('album-canvas');
  const albumCtx = albumCanvas ? albumCanvas.getContext('2d') : null;
  const noArt = document.getElementById('no-art');
  const songTitle = document.getElementById('song-title');
  const songArtist = document.getElementById('song-artist');
  const timeCurrent = document.getElementById('time-current');
  const timeTotal = document.getElementById('time-total');
  const progressBar = document.getElementById('progress-bar');
  const progressFill = document.getElementById('progress-fill');
  
  const btnPrev = document.getElementById('btn-prev');
  const btnToggle = document.getElementById('btn-toggle');
  const btnNext = document.getElementById('btn-next');
  const btnHeart = document.getElementById('btn-heart');
  const btnShuffle = document.getElementById('btn-shuffle');
  const btnRepeat = document.getElementById('btn-repeat');
  const btnRecall = document.getElementById('btn-recall');

  const iconPause = document.getElementById('icon-pause');
  const iconPlay = document.getElementById('icon-play');
  const eqBars = document.querySelectorAll('.eq-bar');
  const eqPeaks = [
    document.getElementById('peak-1'),
    document.getElementById('peak-2'),
    document.getElementById('peak-3'),
    document.getElementById('peak-4'),
    document.getElementById('peak-5')
  ];

  const trackToast = document.getElementById('track-toast');
  const volumeToast = document.getElementById('volume-toast');

  let currentTitle = '';
  let currentDuration = 0;
  let isMusicPlaying = false;
  let hasRenderedThumbnail = false;
  let lastThumbnailUrl = null;
  let toastTimeout = null;
  let volToastTimeout = null;
  let simulatedVol = 100;

  // Spectrum Analyzer State (Pure JS, ZERO DOM layout reads!)
  const barHeights = [2, 2, 2, 2, 2];
  const targetHeights = [2, 2, 2, 2, 2];
  const peakPositions = [0, 0, 0, 0, 0];
  const peakHoldTimers = [0, 0, 0, 0, 0];
  let spectrumPhase = 0;
  let lastPeakTime = performance.now();

  // Right Click Context Menu
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (window.orphy && window.orphy.openIslandContextMenu) {
      window.orphy.openIslandContextMenu();
    }
  });

  // Lock State Handling
  if (window.orphy && window.orphy.getLockState) {
    window.orphy.getLockState().then(locked => {
      if (locked) islandContainer.classList.add('locked');
    });
  }
  if (window.orphy && window.orphy.onLockChanged) {
    window.orphy.onLockChanged(locked => {
      if (locked) {
        islandContainer.classList.add('locked');
      } else {
        islandContainer.classList.remove('locked');
      }
    });
  }

  // Click to Seek
  if (progressBar) {
    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const targetSec = clickRatio * currentDuration;

      progressFill.style.width = `${clickRatio * 100}%`;
      timeCurrent.textContent = formatTime(targetSec);

      if (window.orphy && window.orphy.mediaControl) {
        window.orphy.mediaControl('seek', targetSec);
      }
    });
  }

  // Mouse Wheel Volume Adjustment
  islandContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 5 : -5;
    simulatedVol = Math.max(0, Math.min(100, simulatedVol + delta));
    showVolumeToast(`VOL: ${simulatedVol}%`);
  }, { passive: false });

  // Recall button handler
  if (btnRecall) {
    btnRecall.addEventListener('click', () => {
      btnRecall.style.transform = 'scale(0.85)';
      setTimeout(() => { btnRecall.style.transform = ''; }, 150);
      if (window.orphy && window.orphy.recallBunny) {
        window.orphy.recallBunny();
      }
    });
  }

  // Heart toggle
  if (btnHeart) {
    btnHeart.addEventListener('click', () => {
      btnHeart.classList.toggle('liked');
    });
  }

  // Playback control buttons
  if (btnPrev) btnPrev.addEventListener('click', () => window.orphy?.mediaControl('prev'));
  if (btnToggle) btnToggle.addEventListener('click', () => window.orphy?.mediaControl('toggle'));
  if (btnNext) btnNext.addEventListener('click', () => window.orphy?.mediaControl('next'));

  function showTrackToast(title) {
    if (!trackToast) return;
    trackToast.textContent = `★ ${title.slice(0, 24)} ★`;
    trackToast.classList.add('show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      trackToast.classList.remove('show');
    }, 2400);
  }

  function showVolumeToast(msg) {
    if (!volumeToast) return;
    volumeToast.textContent = msg;
    volumeToast.classList.add('show');
    if (volToastTimeout) clearTimeout(volToastTimeout);
    volToastTimeout = setTimeout(() => {
      volumeToast.classList.remove('show');
    }, 1200);
  }

  function handleMediaUpdate(info) {
    if (!info || !info.title) {
      songTitle.textContent = 'WAITING FOR MUSIC...';
      songArtist.textContent = 'PLAY SOMETHING!';
      if (noArt) noArt.classList.remove('hidden');
      if (albumCtx) albumCtx.clearRect(0, 0, albumCanvas.width, albumCanvas.height);
      timeCurrent.textContent = '0:00';
      timeTotal.textContent = '0:00';
      progressFill.style.width = '0%';
      setPlayPauseState(false);
      isMusicPlaying = false;
      currentTitle = '';
      currentDuration = 0;
      hasRenderedThumbnail = false;
      lastThumbnailUrl = null;
      return;
    }

    const songChanged = currentTitle !== info.title;
    currentTitle = info.title;
    currentDuration = info.duration || 0;
    isMusicPlaying = !!info.isPlaying;

    songTitle.textContent = (info.title || 'UNKNOWN').toUpperCase();
    songArtist.textContent = (info.artist || 'UNKNOWN ARTIST').toUpperCase();

    if (songChanged) {
      showTrackToast(info.title);
    }

    // Render Pixelated Album Cover ONLY when image changes!
    if (info.thumbnailDataUrl) {
      if (songChanged || lastThumbnailUrl !== info.thumbnailDataUrl || !hasRenderedThumbnail) {
        lastThumbnailUrl = info.thumbnailDataUrl;
        hasRenderedThumbnail = true;
        renderPixelAlbumArt(info.thumbnailDataUrl);
        extractThemeFromThumb(info.thumbnailDataUrl);
      }
    } else {
      if (noArt) noArt.classList.remove('hidden');
      if (albumCtx) albumCtx.clearRect(0, 0, albumCanvas.width, albumCanvas.height);
      hasRenderedThumbnail = false;
      lastThumbnailUrl = null;
    }

    // Progress
    const pos = info.position || 0;
    const dur = info.duration || 0;
    const progress = dur > 0 ? (pos / dur) * 100 : 0;
    progressFill.style.width = `${Math.min(progress, 100)}%`;
    timeCurrent.textContent = formatTime(pos);
    timeTotal.textContent = formatTime(dur);

    setPlayPauseState(info.isPlaying);
  }

  // Highly Optimized 60FPS Spectrum Analyzer (NO clientHeight forced reflows!)
  function updateSpectrumPeaks(time) {
    const dt = Math.min(0.05, (time - lastPeakTime) / 1000);
    lastPeakTime = time;

    if (isMusicPlaying) {
      spectrumPhase += dt * 8;
      targetHeights[0] = 3 + Math.sin(spectrumPhase * 1.3) * 4 + Math.sin(spectrumPhase * 2.7) * 3;
      targetHeights[1] = 4 + Math.cos(spectrumPhase * 1.8) * 5 + Math.sin(spectrumPhase * 3.1) * 3;
      targetHeights[2] = 3 + Math.sin(spectrumPhase * 2.2) * 4 + Math.cos(spectrumPhase * 4.0) * 3;
      targetHeights[3] = 4 + Math.cos(spectrumPhase * 2.9) * 4 + Math.sin(spectrumPhase * 5.2) * 3;
      targetHeights[4] = 2 + Math.sin(spectrumPhase * 3.6) * 3 + Math.cos(spectrumPhase * 6.1) * 3;
    } else {
      targetHeights[0] = 2;
      targetHeights[1] = 2;
      targetHeights[2] = 2;
      targetHeights[3] = 2;
      targetHeights[4] = 2;
    }

    for (let i = 0; i < 5; i++) {
      const clampedTarget = Math.max(2, Math.min(13, targetHeights[i]));
      barHeights[i] += (clampedTarget - barHeights[i]) * 0.28;

      const curH = barHeights[i];
      const bar = eqBars[i];
      if (bar) bar.style.height = `${Math.round(curH)}px`;

      if (curH >= peakPositions[i]) {
        peakPositions[i] = curH;
        peakHoldTimers[i] = 0.22;
      } else {
        if (peakHoldTimers[i] > 0) {
          peakHoldTimers[i] -= dt;
        } else {
          peakPositions[i] = Math.max(0, peakPositions[i] - 16 * dt);
        }
      }

      const peakEl = eqPeaks[i];
      if (peakEl) {
        const topPx = Math.max(0, 13 - Math.round(peakPositions[i]));
        peakEl.style.top = `${topPx}px`;
      }
    }

    requestAnimationFrame(updateSpectrumPeaks);
  }
  requestAnimationFrame(updateSpectrumPeaks);

  function renderPixelAlbumArt(dataUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!albumCanvas || !albumCtx) return;
      const w = albumCanvas.width;
      const h = albumCanvas.height;

      albumCtx.imageSmoothingEnabled = false;

      // 36x36 chunky pixel quantization
      const pixelRes = 36;
      const offscreen = document.createElement('canvas');
      offscreen.width = pixelRes;
      offscreen.height = pixelRes;
      const offCtx = offscreen.getContext('2d');
      offCtx.imageSmoothingEnabled = true;
      offCtx.drawImage(img, 0, 0, pixelRes, pixelRes);

      // Blow up with nearest-neighbor crisp pixels
      albumCtx.clearRect(0, 0, w, h);
      albumCtx.drawImage(offscreen, 0, 0, pixelRes, pixelRes, 0, 0, w, h);

      if (noArt) noArt.classList.add('hidden');
    };
    img.src = dataUrl;
  }

  function extractThemeFromThumb(dataUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (window.ThemeEngine) {
        const color = window.ThemeEngine.extractDominantColor(img);
        setThemeColor(color.r, color.g, color.b);
      }
    };
    img.src = dataUrl;
  }

  function setPlayPauseState(isPlaying) {
    if (iconPause && iconPlay) {
      if (isPlaying) {
        iconPause.style.display = 'block';
        iconPlay.style.display = 'none';
      } else {
        iconPause.style.display = 'none';
        iconPlay.style.display = 'block';
      }
    }
  }

  function formatTime(seconds) {
    if (!seconds || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function setThemeColor(r, g, b) {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', `rgb(${r}, ${g}, ${b})`);
    root.style.setProperty('--theme-primary-glow', `rgba(${r}, ${g}, ${b}, 0.4)`);
  }

  // Subscribe to media events
  if (window.orphy) {
    window.orphy.onMediaUpdate(handleMediaUpdate);
    window.orphy.getMediaInfo().then(handleMediaUpdate);
  }
});
