document.addEventListener('DOMContentLoaded', () => {
  const islandContainer = document.getElementById('island-container');
  const albumCanvas = document.getElementById('album-canvas');
  const albumCtx = albumCanvas ? albumCanvas.getContext('2d') : null;
  const miniArtCanvas = document.getElementById('mini-art-canvas');
  const miniArtCtx = miniArtCanvas ? miniArtCanvas.getContext('2d') : null;
  const noArt = document.getElementById('no-art');

  const songTitle = document.getElementById('song-title');
  const songArtist = document.getElementById('song-artist');
  const miniSongTitle = document.getElementById('mini-song-title');
  const vibeBadge = document.getElementById('vibe-badge');
  const timeCurrent = document.getElementById('time-current');
  const timeTotal = document.getElementById('time-total');
  const progressBarWrap = document.getElementById('progress-bar-wrap');
  const progressBar = document.getElementById('progress-bar');
  const progressFill = document.getElementById('progress-fill');
  const scrubTooltip = document.getElementById('scrub-tooltip');
  
  // Controls
  const btnPrev = document.getElementById('btn-prev');
  const btnToggle = document.getElementById('btn-toggle');
  const btnNext = document.getElementById('btn-next');
  const btnHeart = document.getElementById('btn-heart');
  const btnShuffle = document.getElementById('btn-shuffle');
  const btnRepeat = document.getElementById('btn-repeat');
  const btnRecall = document.getElementById('btn-recall');
  const btnCarrot = document.getElementById('btn-carrot');
  const btnCollapse = document.getElementById('btn-collapse');
  const miniBtnToggle = document.getElementById('mini-btn-toggle');
  const miniBtnExpand = document.getElementById('mini-btn-expand');

  const iconPause = document.getElementById('icon-pause');
  const iconPlay = document.getElementById('icon-play');
  const eqBars = document.querySelectorAll('.eq-bar');
  const eqPeaks = document.querySelectorAll('.eq-peak');
  const numBands = eqBars.length || 16;

  const trackToast = document.getElementById('track-toast');
  const volumeToast = document.getElementById('volume-toast');

  let currentTitle = '';
  let currentDuration = 0;
  let isMusicPlaying = false;
  let currentGenre = 'standard';
  let hasRenderedThumbnail = false;
  let lastThumbnailUrl = null;
  let toastTimeout = null;
  let volToastTimeout = null;
  let simulatedVol = 100;
  let islandMode = 'expanded'; // 'expanded' or 'collapsed'

  // 16-Band Spectrum Analyzer State (Pure JS, zero layout reflows!)
  const barHeights = new Float32Array(numBands).fill(2);
  const targetHeights = new Float32Array(numBands).fill(2);
  const peakPositions = new Float32Array(numBands).fill(0);
  const peakHoldTimers = new Float32Array(numBands).fill(0);
  let spectrumPhase = 0;
  let lastPeakTime = performance.now();
  let lastEqSendTime = 0;

  // ========================================================
  // DYNAMIC ISLAND 3-STATE MORPHING
  // ========================================================
  function setIslandMode(mode) {
    islandMode = mode;
    if (mode === 'collapsed') {
      islandContainer.classList.remove('state-expanded');
      islandContainer.classList.add('state-collapsed');
    } else {
      islandContainer.classList.remove('state-collapsed');
      islandContainer.classList.add('state-expanded');
    }
    if (window.orphy && window.orphy.sendIslandMode) {
      window.orphy.sendIslandMode(mode);
    }
  }

  if (btnCollapse) {
    btnCollapse.addEventListener('click', (e) => {
      e.stopPropagation();
      setIslandMode('collapsed');
    });
  }

  if (miniBtnExpand) {
    miniBtnExpand.addEventListener('click', (e) => {
      e.stopPropagation();
      setIslandMode('expanded');
    });
  }

  islandContainer.addEventListener('click', (e) => {
    // If in collapsed mode and user clicks the pill, expand it
    if (islandMode === 'collapsed') {
      const target = e.target;
      if (target !== miniBtnToggle && !target.closest('#mini-btn-toggle')) {
        setIslandMode('expanded');
      }
    }
  });

  // Double click to toggle expand/collapse
  islandContainer.addEventListener('dblclick', () => {
    setIslandMode(islandMode === 'expanded' ? 'collapsed' : 'expanded');
  });

  // Cursor Hover Sync to Mascot
  islandContainer.addEventListener('mousemove', (e) => {
    if (window.orphy && window.orphy.sendIslandHover) {
      window.orphy.sendIslandHover({ x: e.clientX, y: e.clientY });
    }
  });

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

  // ========================================================
  // INTERACTIVE PROGRESS DECK & SCRUBBING
  // ========================================================
  let isScrubbing = false;
  let scrubRatio = 0;

  function calculateRatio(e) {
    if (!progressBar) return 0;
    const rect = progressBar.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    const offsetX = e.clientX - rect.left;
    return Math.max(0, Math.min(1, offsetX / rect.width));
  }

  function updateScrubDisplay(ratio) {
    if (currentDuration <= 0) return;
    const targetSec = ratio * currentDuration;
    progressFill.style.width = `${(ratio * 100).toFixed(1)}%`;
    timeCurrent.textContent = formatTime(targetSec);
  }

  function commitSeek(ratio) {
    if (currentDuration <= 0) return;
    const targetSec = Math.round(ratio * currentDuration);
    timeCurrent.textContent = formatTime(targetSec);
    progressFill.style.width = `${(ratio * 100).toFixed(1)}%`;

    if (window.orphy && window.orphy.mediaControl) {
      window.orphy.mediaControl('seek', targetSec);
    }
  }

  if (progressBarWrap) {
    progressBarWrap.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (currentDuration <= 0) return;
      isScrubbing = true;
      scrubRatio = calculateRatio(e);
      updateScrubDisplay(scrubRatio);
    });
  }

  window.addEventListener('mousemove', (e) => {
    if (!progressBar) return;
    const rect = progressBar.getBoundingClientRect();
    const isOverBar = (
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top - 8 && e.clientY <= rect.bottom + 10
    );

    // Update hover tooltip
    if (scrubTooltip && (isOverBar || isScrubbing) && currentDuration > 0) {
      const ratio = calculateRatio(e);
      const hoverSec = ratio * currentDuration;
      scrubTooltip.textContent = formatTime(hoverSec);
      const tooltipX = Math.max(8, Math.min(rect.width - 8, e.clientX - rect.left));
      scrubTooltip.style.left = `${tooltipX}px`;
      scrubTooltip.classList.add('visible');
    } else if (scrubTooltip && !isScrubbing) {
      scrubTooltip.classList.remove('visible');
    }

    // Active drag scrub
    if (isScrubbing) {
      scrubRatio = calculateRatio(e);
      updateScrubDisplay(scrubRatio);
    }
  });

  window.addEventListener('mouseup', () => {
    if (isScrubbing) {
      isScrubbing = false;
      if (scrubTooltip) scrubTooltip.classList.remove('visible');
      commitSeek(scrubRatio);
    }
  });

  // Mouse Wheel Volume Adjustment
  islandContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 5 : -5;
    simulatedVol = Math.max(0, Math.min(100, simulatedVol + delta));
    showVolumeToast(`VOL: ${simulatedVol}%`);
  }, { passive: false });

  // Carrot button handler
  if (btnCarrot) {
    btnCarrot.addEventListener('click', () => {
      btnCarrot.style.transform = 'scale(0.82)';
      setTimeout(() => { btnCarrot.style.transform = ''; }, 150);
      if (window.orphy && window.orphy.feedCarrot) {
        window.orphy.feedCarrot();
      }
      showTrackToast('🥕 CRUNCH TIME!');
    });
  }

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
  if (miniBtnToggle) miniBtnToggle.addEventListener('click', () => window.orphy?.mediaControl('toggle'));
  if (btnNext) btnNext.addEventListener('click', () => window.orphy?.mediaControl('next'));
  if (btnShuffle) btnShuffle.addEventListener('click', () => {
    btnShuffle.classList.toggle('active');
    showTrackToast(btnShuffle.classList.contains('active') ? 'SHUFFLE: ON' : 'SHUFFLE: OFF');
  });
  if (btnRepeat) btnRepeat.addEventListener('click', () => {
    btnRepeat.classList.toggle('active');
    showTrackToast(btnRepeat.classList.contains('active') ? 'REPEAT: ALL' : 'REPEAT: OFF');
  });

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

  function updateGenreDisplay(info) {
    if (!window.GenreDetector || !vibeBadge) return;
    currentGenre = window.GenreDetector.detect(info);
    const genreLabels = {
      rock: '⚡ ROCK',
      chill: '☕ LO-FI',
      groove: '🎧 GROOVE',
      energetic: '✦ DANCE',
      standard: '♪ STEREO'
    };
    vibeBadge.textContent = genreLabels[currentGenre] || '♪ STEREO';
  }

  function handleMediaUpdate(info) {
    if (!info || !info.title) {
      songTitle.textContent = 'WAITING FOR MUSIC...';
      songArtist.textContent = 'PLAY SOMETHING!';
      if (miniSongTitle) miniSongTitle.textContent = 'WAITING...';
      if (vibeBadge) vibeBadge.textContent = '♪ HI-FI';
      if (noArt) noArt.classList.remove('hidden');
      if (albumCtx) albumCtx.clearRect(0, 0, albumCanvas.width, albumCanvas.height);
      if (miniArtCtx) miniArtCtx.clearRect(0, 0, miniArtCanvas.width, miniArtCanvas.height);
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
    if (miniSongTitle) miniSongTitle.textContent = (info.title || 'UNKNOWN').toUpperCase();

    updateGenreDisplay(info);

    if (songChanged) {
      showTrackToast(info.title.toUpperCase());
    }

    // Physical Cassette Art thumbnail
    if (info.thumbnailDataUrl) {
      if (songChanged || !hasRenderedThumbnail || lastThumbnailUrl !== info.thumbnailDataUrl) {
        lastThumbnailUrl = info.thumbnailDataUrl;
        hasRenderedThumbnail = true;
        renderPixelAlbumArt(info.thumbnailDataUrl);
        extractThemeFromThumb(info.thumbnailDataUrl);
      }
    } else {
      if (noArt) noArt.classList.remove('hidden');
      if (albumCtx) albumCtx.clearRect(0, 0, albumCanvas.width, albumCanvas.height);
      if (miniArtCtx) miniArtCtx.clearRect(0, 0, miniArtCanvas.width, miniArtCanvas.height);
      hasRenderedThumbnail = false;
      lastThumbnailUrl = null;
    }

    // Only update progress bar from media provider if user is NOT actively dragging
    if (!isScrubbing) {
      const pos = info.position || 0;
      const dur = info.duration || 0;
      const progress = dur > 0 ? (pos / dur) * 100 : 0;
      progressFill.style.width = `${Math.min(progress, 100).toFixed(1)}%`;
      timeCurrent.textContent = formatTime(pos);
      timeTotal.textContent = formatTime(dur);
    }

    setPlayPauseState(info.isPlaying);
  }

  // ========================================================
  // 16-BAND SPECTRUM ANALYZER ENGINE (60FPS, Zero Layout Reads)
  // Heartbeat between song -> UI -> mascot!
  // ========================================================
  function updateSpectrumPeaks(time) {
    const dt = Math.min(0.05, (time - lastPeakTime) / 1000);
    lastPeakTime = time;

    const maxH = 15; // Max height in pixels

    if (isMusicPlaying) {
      const phaseSpeed = (currentGenre === 'energetic') ? 14 : (currentGenre === 'rock' ? 12 : (currentGenre === 'chill' ? 5 : 8));
      spectrumPhase += dt * phaseSpeed;

      const bassBoost = (currentGenre === 'rock' || currentGenre === 'groove') ? 1.4 : 1.0;
      const midBoost = (currentGenre === 'groove' || currentGenre === 'energetic') ? 1.3 : 1.0;
      const trebleBoost = (currentGenre === 'energetic' || currentGenre === 'rock') ? 1.3 : 0.8;

      for (let i = 0; i < numBands; i++) {
        const norm = i / (numBands - 1);
        let target = 3;
        if (norm < 0.25) {
          target = 4 + (Math.sin(spectrumPhase * 1.5 + i * 0.8) * 5 + Math.cos(spectrumPhase * 2.8) * 4) * bassBoost;
        } else if (norm < 0.65) {
          target = 3.5 + (Math.sin(spectrumPhase * 2.2 + i * 0.6) * 4.5 + Math.cos(spectrumPhase * 3.7 + i) * 3.5) * midBoost;
        } else {
          target = 2.5 + (Math.sin(spectrumPhase * 3.4 + i * 1.1) * 3.5 + Math.cos(spectrumPhase * 5.1) * 3.0) * trebleBoost;
        }

        // Periodic rhythmic kick
        const kickPulse = Math.pow(Math.max(0, Math.sin(spectrumPhase * 1.8)), 3) * (5 * (1 - norm * 0.5));
        target += kickPulse;
        targetHeights[i] = target;
      }
    } else {
      for (let i = 0; i < numBands; i++) {
        targetHeights[i] = 2;
      }
    }

    // Smooth lerp & peak decay
    let sumHeight = 0;
    for (let i = 0; i < numBands; i++) {
      const clampedTarget = Math.max(2, Math.min(maxH, targetHeights[i]));
      barHeights[i] += (clampedTarget - barHeights[i]) * 0.32;
      sumHeight += barHeights[i];

      const curH = barHeights[i];
      const bar = eqBars[i];
      if (bar) bar.style.height = `${Math.round(curH)}px`;

      // Floating Peak Hold
      if (curH >= peakPositions[i]) {
        peakPositions[i] = curH;
        peakHoldTimers[i] = 0.26;
      } else {
        if (peakHoldTimers[i] > 0) {
          peakHoldTimers[i] -= dt;
        } else {
          peakPositions[i] = Math.max(0, peakPositions[i] - 18 * dt);
        }
      }

      const peakEl = eqPeaks[i];
      if (peakEl) {
        const topPx = Math.max(0, maxH - Math.round(peakPositions[i]));
        peakEl.style.top = `${topPx}px`;
      }
    }

    // Heartbeat: Calculate EQ energy & detect beat drops for Mascot & Island pulse!
    const bassEnergy = (barHeights[0] + barHeights[1] + barHeights[2] + barHeights[3]) / 4;
    const isBeatDrop = isMusicPlaying && (barHeights[0] > 12.5 || (barHeights[1] > 12.5 && barHeights[0] > 10));

    // Tactile bump on beat drop
    if (isBeatDrop && !islandContainer.classList.contains('beat-pulse')) {
      islandContainer.classList.add('beat-pulse');
      setTimeout(() => islandContainer.classList.remove('beat-pulse'), 140);
    }

    // Send EQ energy heartbeat packet to Mascot (~50ms throttled)
    if (time - lastEqSendTime > 50) {
      lastEqSendTime = time;
      if (window.orphy && window.orphy.sendEqEnergy) {
        window.orphy.sendEqEnergy({
          energy: sumHeight / (numBands * maxH), // normalized 0.0 - 1.0
          bass: bassEnergy / maxH,
          isBeatDrop,
          genre: currentGenre,
          isPlaying: isMusicPlaying
        });
      }
    }

    requestAnimationFrame(updateSpectrumPeaks);
  }
  requestAnimationFrame(updateSpectrumPeaks);

  // ========================================================
  // PHYSICAL CASSETTE PIXEL QUANTIZATION
  // ========================================================
  function renderPixelAlbumArt(dataUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 1. Render to main cassette window (32x32 chunky nearest-neighbor)
      if (albumCanvas && albumCtx) {
        albumCtx.imageSmoothingEnabled = false;
        const offscreen = document.createElement('canvas');
        offscreen.width = 32;
        offscreen.height = 32;
        const offCtx = offscreen.getContext('2d');
        offCtx.imageSmoothingEnabled = true;
        offCtx.drawImage(img, 0, 0, 32, 32);

        albumCtx.clearRect(0, 0, albumCanvas.width, albumCanvas.height);
        albumCtx.drawImage(offscreen, 0, 0, 32, 32, 0, 0, albumCanvas.width, albumCanvas.height);
      }

      // 2. Render to mini collapsed capsule icon (16x16)
      if (miniArtCanvas && miniArtCtx) {
        miniArtCtx.imageSmoothingEnabled = false;
        miniArtCtx.drawImage(img, 0, 0, miniArtCanvas.width, miniArtCanvas.height);
      }

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
        if (miniBtnToggle) miniBtnToggle.textContent = '⏸';
      } else {
        iconPause.style.display = 'none';
        iconPlay.style.display = 'block';
        if (miniBtnToggle) miniBtnToggle.textContent = '⏵';
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
    root.style.setProperty('--theme-primary-glow', `rgba(${r}, ${g}, ${b}, 0.45)`);
  }

  // Subscribe to media events
  if (window.orphy) {
    window.orphy.onMediaUpdate(handleMediaUpdate);
    window.orphy.getMediaInfo().then(handleMediaUpdate);
  }
});
