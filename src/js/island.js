document.addEventListener('DOMContentLoaded', () => {
  const albumCanvas = document.getElementById('album-canvas');
  const albumCtx = albumCanvas ? albumCanvas.getContext('2d') : null;
  const noArt = document.getElementById('no-art');
  const songTitle = document.getElementById('song-title');
  const songArtist = document.getElementById('song-artist');
  const timeCurrent = document.getElementById('time-current');
  const timeTotal = document.getElementById('time-total');
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

  let currentTitle = '';
  let themeApplied = false;

  // Recall button handler
  if (btnRecall) {
    btnRecall.addEventListener('click', () => {
      console.log('[Orphy Island] Whistle blown! Recalling bunny...');
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
      eqBars.forEach(b => b.classList.remove('active'));
      currentTitle = '';
      themeApplied = false;
      return;
    }

    const songChanged = currentTitle !== info.title;
    currentTitle = info.title;

    songTitle.textContent = (info.title || 'UNKNOWN').toUpperCase();
    songArtist.textContent = (info.artist || 'UNKNOWN ARTIST').toUpperCase();

    // Render Pixelated Album Cover
    if (info.thumbnailDataUrl) {
      renderPixelAlbumArt(info.thumbnailDataUrl);
      if (!themeApplied || songChanged) {
        extractThemeFromThumb(info.thumbnailDataUrl);
      }
    } else {
      if (noArt) noArt.classList.remove('hidden');
      if (albumCtx) albumCtx.clearRect(0, 0, albumCanvas.width, albumCanvas.height);
    }

    // Progress
    const pos = info.position || 0;
    const dur = info.duration || 0;
    const progress = dur > 0 ? (pos / dur) * 100 : 0;
    progressFill.style.width = `${Math.min(progress, 100)}%`;
    timeCurrent.textContent = formatTime(pos);
    timeTotal.textContent = formatTime(dur);

    // Play/Pause & Equalizer State
    setPlayPauseState(info.isPlaying);
    eqBars.forEach(b => {
      if (info.isPlaying) b.classList.add('active');
      else b.classList.remove('active');
    });
  }

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
        themeApplied = true;
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
