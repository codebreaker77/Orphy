function startOrphy() {
  console.log('[Orphy Renderer] Initializing widget and bunny...');
  const widget = new window.MusicWidget();
  const bunnyCanvas = document.getElementById('bunny-canvas');
  const bunny = new window.PixelBunny(bunnyCanvas);
  
  let lastTitle = '';
  let themeApplied = false;

  function handleMediaUpdate(info) {
    console.log('[Orphy Renderer] Received media update:', info ? info.title : 'null');
    const songChanged = widget.update(info);
    
    if (info && info.title) {
      if (songChanged) {
        bunny.setState('happy');
        themeApplied = false;
      } else if (info.isPlaying) {
        if (bunny.state !== 'happy') {
          bunny.setState('dancing');
        }
      } else {
        if (bunny.state !== 'happy') {
          bunny.setState('sleepy');
        }
      }

      if (info.thumbnailDataUrl && (!themeApplied || songChanged)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const color = window.ThemeEngine.extractDominantColor(img);
          widget.setThemeColor(color.r, color.g, color.b);
          bunny.setThemeColor(`rgb(${color.r}, ${color.g}, ${color.b})`);
          themeApplied = true;
        };
        img.src = info.thumbnailDataUrl;
      }
      
      lastTitle = info.title;
    } else {
      bunny.setState('idle');
      lastTitle = '';
      themeApplied = false;
    }
  }

  widget.onControl((action) => {
    if (window.orphy) {
      window.orphy.mediaControl(action);
    }
  });

  if (window.orphy) {
    window.orphy.onMediaUpdate(handleMediaUpdate);
    window.orphy.getMediaInfo().then(handleMediaUpdate);
  } else {
    handleMediaUpdate({
      title: 'Cry For Me',
      artist: 'The Weeknd',
      album: 'After Hours',
      thumbnailDataUrl: null,
      position: 102,
      duration: 229,
      isPlaying: true
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startOrphy);
} else {
  startOrphy();
}
