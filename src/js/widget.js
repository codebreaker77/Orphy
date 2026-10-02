class MusicWidget {
  constructor() {
    this.albumCanvas = document.getElementById('album-canvas');
    this.albumCtx = this.albumCanvas ? this.albumCanvas.getContext('2d') : null;
    this.noArt = document.getElementById('no-art');
    this.songTitle = document.getElementById('song-title');
    this.songArtist = document.getElementById('song-artist');
    this.timeCurrent = document.getElementById('time-current');
    this.timeTotal = document.getElementById('time-total');
    this.progressFill = document.getElementById('progress-fill');
    
    this.btnPrev = document.getElementById('btn-prev');
    this.btnToggle = document.getElementById('btn-toggle');
    this.btnNext = document.getElementById('btn-next');
    this.btnHeart = document.getElementById('btn-heart');
    this.btnShuffle = document.getElementById('btn-shuffle');
    this.btnRepeat = document.getElementById('btn-repeat');

    this.iconPause = document.getElementById('icon-pause');
    this.iconPlay = document.getElementById('icon-play');
    
    this.currentTitle = '';
    this.isPlaying = false;
    this._controlCallback = null;

    if (this.btnHeart) {
      this.btnHeart.addEventListener('click', () => {
        this.btnHeart.classList.toggle('liked');
      });
    }
  }

  update(mediaInfo) {
    if (!mediaInfo || !mediaInfo.title) {
      this.songTitle.textContent = 'Waiting for music...';
      this.songArtist.textContent = 'Play something!';
      if (this.noArt) this.noArt.classList.remove('hidden');
      if (this.albumCtx) this.albumCtx.clearRect(0, 0, this.albumCanvas.width, this.albumCanvas.height);
      this.timeCurrent.textContent = '0:00';
      this.timeTotal.textContent = '0:00';
      this.progressFill.style.width = '0%';
      this.setPlayPauseState(false);
      this.isPlaying = false;
      this.currentTitle = '';
      return false;
    }

    const songChanged = this.currentTitle !== mediaInfo.title;
    this.currentTitle = mediaInfo.title;
    this.isPlaying = mediaInfo.isPlaying;

    this.songTitle.textContent = (mediaInfo.title || 'Unknown').toUpperCase();
    this.songArtist.textContent = (mediaInfo.artist || 'Unknown Artist').toUpperCase();

    // Render Pixelated Album Cover
    if (mediaInfo.thumbnailDataUrl) {
      this.renderPixelAlbumArt(mediaInfo.thumbnailDataUrl);
    } else {
      if (this.noArt) this.noArt.classList.remove('hidden');
      if (this.albumCtx) this.albumCtx.clearRect(0, 0, this.albumCanvas.width, this.albumCanvas.height);
    }

    // Progress Bar & Timestamps
    const position = mediaInfo.position || 0;
    const duration = mediaInfo.duration || 0;
    const progress = duration > 0 ? (position / duration) * 100 : 0;
    this.progressFill.style.width = `${Math.min(progress, 100)}%`;
    this.timeCurrent.textContent = this.formatTime(position);
    this.timeTotal.textContent = this.formatTime(duration);

    // Play/Pause State
    this.setPlayPauseState(mediaInfo.isPlaying);

    return songChanged;
  }

  renderPixelAlbumArt(dataUrl) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!this.albumCanvas || !this.albumCtx) return;
      const w = this.albumCanvas.width;
      const h = this.albumCanvas.height;

      // Disable smoothing for authentic chunky pixels
      this.albumCtx.imageSmoothingEnabled = false;

      // Step 1: Draw downscaled to offscreen canvas (40x40 pixel grid)
      const pixelRes = 40;
      const offscreen = document.createElement('canvas');
      offscreen.width = pixelRes;
      offscreen.height = pixelRes;
      const offCtx = offscreen.getContext('2d');
      offCtx.imageSmoothingEnabled = true;
      offCtx.drawImage(img, 0, 0, pixelRes, pixelRes);

      // Step 2: Blow up the 40x40 pixel art onto the display canvas with crisp nearest-neighbor
      this.albumCtx.clearRect(0, 0, w, h);
      this.albumCtx.drawImage(offscreen, 0, 0, pixelRes, pixelRes, 0, 0, w, h);

      if (this.noArt) this.noArt.classList.add('hidden');
    };
    img.src = dataUrl;
  }

  setPlayPauseState(isPlaying) {
    if (this.iconPause && this.iconPlay) {
      if (isPlaying) {
        this.iconPause.style.display = 'block';
        this.iconPlay.style.display = 'none';
      } else {
        this.iconPause.style.display = 'none';
        this.iconPlay.style.display = 'block';
      }
    }
  }

  formatTime(seconds) {
    if (!seconds || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  setThemeColor(r, g, b) {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', `rgb(${r}, ${g}, ${b})`);
    root.style.setProperty('--theme-primary-glow', `rgba(${r}, ${g}, ${b}, 0.35)`);
  }

  onControl(callback) {
    this._controlCallback = callback;
    if (this.btnPrev) this.btnPrev.addEventListener('click', () => callback('prev'));
    if (this.btnToggle) this.btnToggle.addEventListener('click', () => callback('toggle'));
    if (this.btnNext) this.btnNext.addEventListener('click', () => callback('next'));
  }
}

window.MusicWidget = MusicWidget;
