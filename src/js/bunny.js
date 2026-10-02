class PixelBunny {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pixelSize = 4;
    this.x = 40;
    this.y = 55;
    this.state = 'idle'; // 'idle', 'dancing', 'happy', 'sleepy'
    this.frame = 0;
    this.frameTimer = 0;
    this.themeColor = '#e64c65';
    this.particles = [];
    this.isDragging = false;
    this.happyTimer = 0;
    this.previousState = 'idle';
    this.lastTime = performance.now();
    this.bouncePhase = 0;
    this.particleTimer = 0;
    
    this.initSprites();
    this.frameDurations = { idle: 500, dancing: 180, happy: 220, sleepy: 900 };
    
    this.setupDragHandlers();
    this.startLoop();
  }
  
  initSprites() {
    // 20 columns x 24 rows
    // Cute chibi character with headphones & cozy dark hoodie (from reference Image 2)
    // Palette:
    // . = transparent, 1 = outline (#121520), 2 = face/skin (#fef5ec), 3 = bunny ear pink (#ff82a0)
    // 4 = eye/expression (#10131d), 5 = blush (#ff9eb5), 6 = dark hoodie (#202636)
    // 7 = theme accent, 8 = smile (#df4666), 9 = white sneaker/accent (#ffffff), H = headphone (#2e374d)

    // IDLE Frame 0 (Standing chill, listening)
    const IDLE_0 = [
      ".......11.....11....",
      "......1231...1321...",
      "......1231...1321...",
      ".....11231...13211..",
      "....1HH121111121HH1.",
      "...1H77H1222221H77H1",
      "...1H77H2222222H77H1",
      "....1HH124222421HH1.",
      ".....1125222225211..",
      "......12228882221...",
      "......11222222211...",
      ".....1661111111661..",
      "....166666666666661.",
      "...16666666666666661",
      "...16666666666666661",
      "...1221666666661221.",
      "....11666666666611..",
      ".....166666666661...",
      ".....166666666661...",
      "......1666116661....",
      "......1661..1661....",
      ".....1991....1991...",
      ".....1111....1111...",
      "...................."
    ].join('\n');

    // IDLE Frame 1 (Subtle breathing bounce)
    const IDLE_1 = [
      "....................",
      ".......11.....11....",
      "......1231...1321...",
      "......1231...1321...",
      ".....11231...13211..",
      "....1HH121111121HH1.",
      "...1H77H1222221H77H1",
      "...1H77H2222222H77H1",
      "....1HH124222421HH1.",
      ".....1125222225211..",
      "......12228882221...",
      ".....11222222211....",
      "....16661111116661..",
      "...1666666666666661.",
      "...1666666666666661.",
      "...1221666666661221.",
      "....11666666666611..",
      ".....166666666661...",
      ".....166666666661...",
      "......1666116661....",
      "......1661..1661....",
      ".....1991....1991...",
      ".....1111....1111...",
      "...................."
    ].join('\n');

    // DANCING Frame 0: Groove step left (head bobbing, smiling eyes)
    const DANCING_0 = [
      "......11.....11.....",
      ".....1231...1321....",
      ".....1231...1321....",
      "....11231...13211...",
      "...1HH121111121HH1..",
      "..1H77H1222221H77H1.",
      "..1H77H2222222H77H1.",
      "...1HH1244224421HH1.",
      "....1125222225211...",
      ".....12228882221....",
      ".....11222222211....",
      "....1661111111661...",
      "...166666666666661..",
      "..12216666666666661.",
      "..111666666666661221",
      "....166666666666111.",
      "....1666666666661...",
      ".....16666666661....",
      ".....1666116661.....",
      "....16661..1661.....",
      "...19991....1661....",
      "...1111......1991...",
      ".............1111...",
      "...................."
    ].join('\n');

    // DANCING Frame 1: Hop peak left (floating step from Image 2!)
    const DANCING_1 = [
      "....................",
      "......11.....11.....",
      ".....1231...1321....",
      ".....1231...1321....",
      "....11231...13211...",
      "...1HH121111121HH1..",
      "..1H77H1222221H77H1.",
      "..1H77H2222222H77H1.",
      "...1HH1244224421HH1.",
      "....1125222225211...",
      ".....12228882221....",
      ".....11222222211....",
      "...12211111111661...",
      "...111666666666661..",
      "....1666666666661221",
      "....166666666666111.",
      ".....16666666661....",
      ".....16661.1661.....",
      "....16661...1661....",
      "...19991.....1991...",
      "...1111.......1111..",
      "....................",
      "....................",
      "...................."
    ].join('\n');

    // DANCING Frame 2: Groove step right
    const DANCING_2 = [
      ".......11.....11....",
      "......1231...1321...",
      "......1231...1321...",
      ".....11231...13211..",
      "....1HH121111121HH1.",
      "...1H77H1222221H77H1",
      "...1H77H2222222H77H1",
      "....1HH1244224421HH1",
      ".....1125222225211..",
      "......12228882221...",
      "......11222222211...",
      ".....1661111111661..",
      "....166666666666661.",
      "...12216666666666661",
      "...11166666666661221",
      "....166666666666111.",
      ".....16666666661....",
      ".....16666666661....",
      "......166116661.....",
      "......1661..16661...",
      ".....1991....19991..",
      ".....1111.....1111..",
      "....................",
      "...................."
    ].join('\n');

    // DANCING Frame 3: Hop peak right (kicking back foot!)
    const DANCING_3 = [
      "....................",
      ".......11.....11....",
      "......1231...1321...",
      "......1231...1321...",
      ".....11231...13211..",
      "....1HH121111121HH1.",
      "...1H77H1222221H77H1",
      "...1H77H2222222H77H1",
      "....1HH1244224421HH1",
      ".....1125222225211..",
      "......12228882221...",
      "......11222222211...",
      ".....16611111111221.",
      "....16666666666111..",
      "...122166666666661..",
      "...111666666666661..",
      ".....16666666661....",
      ".....1661.16661.....",
      "....1661...16661....",
      "...1991.....19991...",
      "...1111......1111...",
      "....................",
      "....................",
      "...................."
    ].join('\n');

    // HAPPY Frame (Hands up celebrating, big smile)
    const HAPPY_0 = [
      ".....1221.....1221..",
      ".....1111.....1111..",
      ".......11.....11....",
      "......1231...1321...",
      ".....11231...13211..",
      "....1HH121111121HH1.",
      "...1H77H1222221H77H1",
      "...1H77H2222222H77H1",
      "....1HH1244224421HH1",
      ".....1125222225211..",
      "......12288888221...",
      "......11222222211...",
      "....12211111111221..",
      "....11166666666111..",
      ".....166666666661...",
      ".....166666666661...",
      "......1666666661....",
      "......1666116661....",
      "......1661..1661....",
      ".....1991....1991...",
      ".....1111....1111...",
      "....................",
      "....................",
      "...................."
    ].join('\n');

    // SLEEPY Frame (Paused, cozy slouch, closed eyes)
    const SLEEPY_0 = [
      "....................",
      ".......11.....11....",
      "......1231...1321...",
      "......1231...1321...",
      ".....11231...13211..",
      "....1HH121111121HH1.",
      "...1H77H1222221H77H1",
      "...1H77H2222222H77H1",
      "....1HH1211221121HH1",
      ".....1125222225211..",
      "......12228882221...",
      "......11222222211...",
      ".....1661111111661..",
      "....166666666666661.",
      "...16666666666666661",
      "...1221666666661221.",
      "....11666666666611..",
      ".....166666666661...",
      "......1666116661....",
      "......1661..1661....",
      ".....1991....1991...",
      ".....1111....1111...",
      "....................",
      "...................."
    ].join('\n');

    this.sprites = {
      idle: [IDLE_0, IDLE_1],
      dancing: [DANCING_0, DANCING_1, DANCING_2, DANCING_3],
      happy: [HAPPY_0, DANCING_1],
      sleepy: [SLEEPY_0, IDLE_1]
    };
  }

  setupDragHandlers() {
    let dragStart = null;
    
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const bw = 20 * this.pixelSize;
      const bh = 24 * this.pixelSize;
      if (mx >= this.x && mx <= this.x + bw && my >= this.y && my <= this.y + bh) {
        this.isDragging = true;
        dragStart = { x: mx - this.x, y: my - this.y };
        this.canvas.style.cursor = 'grabbing';
      }
    });
    
    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging || !dragStart) return;
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      this.x = mx - dragStart.x;
      this.y = my - dragStart.y;
      this.x = Math.max(0, Math.min(this.canvas.width - 20 * this.pixelSize, this.x));
      this.y = Math.max(0, Math.min(this.canvas.height - 24 * this.pixelSize, this.y));
    });
    
    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        dragStart = null;
        this.canvas.style.cursor = 'grab';
        this.setState('happy'); // Quick happy wiggle on drop!
      }
    });
  }

  setState(newState) {
    if (newState === this.state) return;
    if (newState === 'happy') {
      this.previousState = this.state === 'happy' ? this.previousState : this.state;
      this.happyTimer = 1400;
    }
    this.state = newState;
    this.frame = 0;
    this.frameTimer = 0;
  }
  
  setThemeColor(color) {
    this.themeColor = color;
  }
  
  startLoop() {
    const loop = (time) => {
      const dt = time - this.lastTime;
      this.lastTime = time;
      this.update(dt);
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  
  update(dt) {
    this.frameTimer += dt;
    const duration = this.frameDurations[this.state] || 300;
    if (this.frameTimer >= duration) {
      this.frameTimer = 0;
      const frames = this.sprites[this.state] || this.sprites.idle;
      this.frame = (this.frame + 1) % frames.length;
    }
    
    if (this.state === 'happy') {
      this.happyTimer -= dt;
      if (this.happyTimer <= 0) {
        this.state = this.previousState || 'idle';
        this.frame = 0;
      }
    }
    
    this.bouncePhase += dt * 0.004;
    
    // Spawn music notes when dancing or happy
    if (this.state === 'dancing' || this.state === 'happy') {
      this.particleTimer += dt;
      if (this.particleTimer >= 400 && this.particles.length < 8) {
        this.particleTimer = 0;
        this.spawnParticle();
      }
    }
    
    // Update drifting particles
    this.particles = this.particles.filter(p => {
      p.y -= p.vy * (dt / 16);
      p.x += Math.sin(p.phase + p.y * 0.03) * 0.4;
      p.alpha -= dt / p.lifetime;
      p.phase += dt * 0.006;
      return p.alpha > 0;
    });
  }
  
  spawnParticle() {
    const notes = ['♪', '♫', '♩'];
    this.particles.push({
      x: this.x + 8 + (Math.random() * 20 * this.pixelSize),
      y: this.y + 10,
      vy: 0.6 + Math.random() * 0.8,
      alpha: 1,
      lifetime: 1800 + Math.random() * 800,
      char: notes[Math.floor(Math.random() * notes.length)],
      phase: Math.random() * Math.PI * 2,
      size: 14 + Math.floor(Math.random() * 4),
    });
  }
  
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    const frames = this.sprites[this.state] || this.sprites.idle;
    const sprite = frames[this.frame % frames.length];
    
    let renderY = this.y;
    if (this.state === 'idle') {
      renderY += Math.sin(this.bouncePhase) * 2;
    }
    
    let hopOffset = 0;
    if (this.state === 'dancing' && (this.frame === 1 || this.frame === 3)) {
      hopOffset = -6; 
    }
    if (this.state === 'happy') {
      hopOffset = -12;
    }
    renderY += hopOffset;
    
    // Shadow under feet
    const shadowScale = 1 - Math.abs(hopOffset) / 30;
    this.ctx.save();
    this.ctx.globalAlpha = 0.28 * shadowScale;
    this.ctx.fillStyle = '#05070a';
    this.ctx.beginPath();
    const shadowCx = this.x + (20 * this.pixelSize) / 2;
    const shadowCy = this.y + 24 * this.pixelSize + 2;
    this.ctx.ellipse(shadowCx, shadowCy, 24 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
    
    // Render the Pixel Character
    this.renderSprite(sprite, this.x, renderY);
    
    // Render Floating Musical Notes
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowColor = this.themeColor;
      this.ctx.shadowBlur = 6;
      this.ctx.font = `bold ${p.size}px monospace`;
      this.ctx.fillText(p.char, p.x, p.y);
      this.ctx.restore();
    });
  }
  
  renderSprite(spriteStr, x, y) {
    const colorMap = {
      '.': null,
      '1': '#0e111a', // Crisp dark outline
      '2': '#fbf2e9', // Cute cream face
      '3': '#ff7a98', // Inner bunny ear
      '4': '#0f121d', // Dark expressive eyes
      '5': '#ff94ad', // Soft blush
      '6': '#1e2433', // Cozy dark hoodie
      '7': this.themeColor, // Dynamic headphone ring
      '8': '#e04268', // Cute mouth
      '9': '#ffffff', // White sneakers / accents
      'H': '#2d354a', // Headphone earcups
    };
    
    const rows = spriteStr.trim().split('\n');
    rows.forEach((row, ry) => {
      const chars = row.trim();
      for (let rx = 0; rx < chars.length; rx++) {
        const c = chars[rx];
        const color = colorMap[c];
        if (color) {
          this.ctx.fillStyle = color;
          this.ctx.fillRect(
            Math.round(x + rx * this.pixelSize),
            Math.round(y + ry * this.pixelSize),
            this.pixelSize,
            this.pixelSize
          );
        }
      }
    });
  }
}

window.PixelBunny = PixelBunny;
