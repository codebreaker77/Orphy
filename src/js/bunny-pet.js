class BunnyPet {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pixelSize = 3; // 3px pixels for higher detail & cute chibi proportions
    
    // Position inside the canvas (centered)
    this.x = 28;
    this.y = 35;
    
    // States: 'idle', 'dancing', 'happy', 'sleeping', 'dangling', 'hopping', 'climbing'
    this.state = 'idle';
    this.frame = 0;
    this.frameTimer = 0;
    this.facing = 1; // 1 = right, -1 = left
    
    this.themeColor = '#e64c65';
    this.particles = [];
    this.isDragging = false;
    this.dragStart = null;
    
    // Pathfinding / Recall State Machine
    this.recallActive = false;
    this.recallStage = 'idle';
    this.recallProgress = 0;
    this.recallStartPos = { x: 0, y: 0 };
    this.recallTargetPos = { x: 0, y: 0 };
    this.recallWaypoints = [];
    this.currentWaypointIndex = 0;
    this.screenBounds = { x: 0, y: 0, width: 1920, height: 1080 };
    
    // Lifelike timers
    this.blinkTimer = 2000 + Math.random() * 2000;
    this.isBlinking = false;
    this.bouncePhase = 0;
    this.particleTimer = 0;
    this.happyTimer = 0;
    this.lastTime = performance.now();
    
    this.initSprites();
    this.setupMouseEvents();
    this.setupIPC();
    this.startLoop();
  }

  initSprites() {
    // 24 width x 26 height chibi pixel character with hoodie, headphones, and ears
    // Palette:
    // . = transparent, 1 = outline (#10131d), 2 = skin cream (#fef6ee), 3 = ear pink (#ff7d99)
    // 4 = eye navy (#0e111a), 5 = blush pink (#ff9cb3), 6 = dark hoodie (#1f2536), 7 = theme accent
    // 8 = smile pink (#e04368), 9 = white sneaker/cuff (#ffffff), H = headphone earcups (#2c354a)

    // IDLE Frame 0 (Standing, headphones on, happy)
    const IDLE_0 = [
      "........11......11......",
      ".......1231....1321.....",
      ".......1231....1321.....",
      "......11231....13211....",
      ".....1HH1211111121HH1...",
      "....1H77H12222221H77H1..",
      "....1H77H22222222H77H1..",
      ".....1HH1242222421HH1...",
      "......11252222225211....",
      ".......122288882221.....",
      ".......112222222211.....",
      "......16611111111661....",
      ".....1666666666666661...",
      "....166666666666666661..",
      "....166666666666666661..",
      "....122166666666661221..",
      ".....1116666666666111...",
      "......16666666666661....",
      "......16666666666661....",
      ".......166661166661.....",
      ".......16661..16661.....",
      "......19991....19991....",
      "......11111....11111....",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    // IDLE Frame 1 (Blink / breathing)
    const IDLE_1 = [
      "........................",
      "........11......11......",
      ".......1231....1321.....",
      ".......1231....1321.....",
      "......11231....13211....",
      ".....1HH1211111121HH1...",
      "....1H77H12222221H77H1..",
      "....1H77H22222222H77H1..",
      ".....1HH1211221121HH1...", // blinking eyes
      "......11252222225211....",
      ".......122288882221.....",
      ".......112222222211.....",
      "......16611111111661....",
      ".....1666666666666661...",
      "....166666666666666661..",
      "....166666666666666661..",
      "....122166666666661221..",
      ".....1116666666666111...",
      "......16666666666661....",
      ".......166661166661.....",
      ".......16661..16661.....",
      "......19991....19991....",
      "......11111....11111....",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    // DANCING Frame 0: Left groove & ear sway
    const DANCING_0 = [
      ".......11......11.......",
      "......1231....1321......",
      "......1231....1321......",
      ".....11231....13211.....",
      "....1HH1211111121HH1....",
      "...1H77H12222221H77H1...",
      "...1H77H22222222H77H1...",
      "....1HH12442224421HH1...", // happy smiling eyes ^ ^
      ".....11252222225211.....",
      "......122288882221......",
      "......112222222211......",
      ".....16611111111661.....",
      "....1666666666666661....",
      "...122166666666666661...",
      "...1111666666666661221..",
      ".....16666666666661111..",
      ".....16666666666661.....",
      "......166666666661......",
      "......16666116661.......",
      ".....166661..1661.......",
      "....199991....1991......",
      "....11111......1111.....",
      "........................",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    // DANCING Frame 1: Peak bounce left (floating jump from Image 2!)
    const DANCING_1 = [
      "........................",
      ".......11......11.......",
      "......1231....1321......",
      "......1231....1321......",
      ".....11231....13211.....",
      "....1HH1211111121HH1....",
      "...1H77H12222221H77H1...",
      "...1H77H22222222H77H1...",
      "....1HH12442224421HH1...",
      ".....11252222225211.....",
      "......122288882221......",
      "......112222222211......",
      "....122111111111661.....",
      "....1116666666666661....",
      ".....16666666666661221..",
      ".....16666666666661111..",
      "......166666666661......",
      "......166661.1661.......",
      ".....166661...1661......",
      "....199991.....1991.....",
      "....11111.......1111....",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    // DANCING Frame 2: Right groove
    const DANCING_2 = [
      "........11......11......",
      ".......1231....1321.....",
      ".......1231....1321.....",
      "......11231....13211....",
      ".....1HH1211111121HH1...",
      "....1H77H12222221H77H1..",
      "....1H77H22222222H77H1..",
      ".....1HH12442224421HH1..",
      "......11252222225211....",
      ".......122288882221.....",
      ".......112222222211.....",
      "......16611111111661....",
      ".....1666666666666661...",
      "....122166666666666661..",
      "....1116666666666661221.",
      ".....166666666666661111.",
      "......1666666666661.....",
      "......1666666666661.....",
      ".......1661166661.......",
      ".......1661..166661.....",
      "......1991....199991....",
      "......1111.....11111....",
      "........................",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    // DANCING Frame 3: Peak bounce right (kicking back foot!)
    const DANCING_3 = [
      "........................",
      "........11......11......",
      ".......1231....1321.....",
      ".......1231....1321.....",
      "......11231....13211....",
      ".....1HH1211111121HH1...",
      "....1H77H12222221H77H1..",
      "....1H77H22222222H77H1..",
      ".....1HH12442224421HH1..",
      "......11252222225211....",
      ".......122288882221.....",
      ".......112222222211.....",
      "......166111111111221...",
      ".....166666666666111....",
      "....122166666666661.....",
      "....111666666666661.....",
      "......166666666661......",
      "......1661.166661.......",
      ".....1661...166661......",
      "....1991.....199991.....",
      "....1111......11111.....",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    // DANGLING Frame (Picked up by mouse drag - funny surprised dangling pose!)
    const DANGLING_0 = [
      "........11......11......",
      ".......1231....1321.....",
      ".......1231....1321.....",
      "......11231....13211....",
      ".....1HH1211111121HH1...",
      "....1H77H12222221H77H1..",
      "....1H77H22222222H77H1..",
      ".....1HH1244224421HH1...", // wide surprised eyes
      "......11252222225211....",
      ".......122228822221.....", // little "o" mouth
      ".......112222222211.....",
      "....12211111111111221...", // arms dangling up
      "....11166666666666111...",
      ".....166666666666661....",
      ".....166666666666661....",
      "......1666666666661.....",
      "......1666666666661.....",
      ".......16666666661......",
      "........166666661.......",
      "........166666661.......",
      ".........16611661.......",
      "........1991..1991......", // feet dangling
      "........1111..1111......",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    // WALL CLIMBING Frame 0 (Turned sideways, paw scrambling up)
    const CLIMBING_0 = [
      "........................",
      ".........111............",
      "........1231............",
      ".......11231............",
      "......1HH121111.........",
      ".....1H77H12221.........",
      "....1H77H222241.........",
      ".....1HH1222821221......",
      "......112522221111......",
      ".....166111111..........",
      "....16666666661.........",
      "...1666666666661221.....",
      "...1666666666666111.....",
      "....166666666661........",
      "....166666666661........",
      ".....1666666661.........",
      ".....1666116661.........",
      "....16661..1661.........",
      "...19991....1991........",
      "...1111......1111.......",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    // WALL CLIMBING Frame 1 (Alternate paw scramble up)
    const CLIMBING_1 = [
      "........................",
      ".........111............",
      "........1231............",
      ".......11231............",
      "......1HH121111221......",
      ".....1H77H12221111......",
      "....1H77H222241.........",
      ".....1HH1222821.........",
      "......112522221221......",
      ".....1661111111111......",
      "....16666666661.........",
      "...1666666666661........",
      "...1666666666661........",
      "....166666666661........",
      "....166666666661........",
      ".....1666666661.........",
      ".....1661..16661........",
      "....1661....16661.......",
      "...1991......19991......",
      "...1111......11111......",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    // HAPPY celebration
    const HAPPY_0 = [
      ".....1221......1221.....",
      ".....1111......1111.....",
      "........11......11......",
      ".......1231....1321.....",
      "......11231....13211....",
      ".....1HH1211111121HH1...",
      "....1H77H12222221H77H1..",
      "....1H77H22222222H77H1..",
      ".....1HH12442224421HH1..",
      "......11252222225211....",
      ".......122888888221.....", // huge smile
      ".......112222222211.....",
      "....12211111111111221...",
      "....11166666666666111...",
      ".....166666666666661....",
      ".....166666666666661....",
      "......1666666666661.....",
      ".......166661166661.....",
      ".......16661..16661.....",
      "......19991....19991....",
      "......11111....11111....",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    this.sprites = {
      idle: [IDLE_0, IDLE_1],
      dancing: [DANCING_0, DANCING_1, DANCING_2, DANCING_3],
      dangling: [DANGLING_0],
      climbing: [CLIMBING_0, CLIMBING_1],
      hopping: [DANCING_1, DANCING_0],
      happy: [HAPPY_0, DANCING_1]
    };
  }

  setupMouseEvents() {
    // Draggable anywhere on the desktop
    let isMouseDown = false;
    let initialMouse = { x: 0, y: 0 };
    let initialWin = { x: 0, y: 0 };

    this.canvas.addEventListener('mousedown', async (e) => {
      isMouseDown = true;
      initialMouse = { x: e.screenX, y: e.screenY };
      
      if (window.orphy && window.orphy.getBunnyPosition) {
        initialWin = await window.orphy.getBunnyPosition();
      }

      this.isDragging = true;
      this.recallActive = false; // Cancel any active pathfinding on drag
      this.state = 'dangling';
      this.canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown || !this.isDragging) return;
      const dx = e.screenX - initialMouse.x;
      const dy = e.screenY - initialMouse.y;
      const newX = initialWin.x + dx;
      const newY = initialWin.y + dy;
      
      if (window.orphy && window.orphy.setBunnyPosition) {
        window.orphy.setBunnyPosition(newX, newY);
      }
    });

    window.addEventListener('mouseup', () => {
      if (isMouseDown) {
        isMouseDown = false;
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
        
        // Happy celebration on release
        this.triggerHappy();
        this.spawnHeartBurst();
      }
    });

    // Poke / Click interaction (squeak, spin, hearts!)
    this.canvas.addEventListener('click', (e) => {
      if (!this.isDragging) {
        this.triggerHappy();
        this.spawnHeartBurst();
      }
    });
  }

  setupIPC() {
    if (!window.orphy) return;

    // Listen to media updates to dance
    window.orphy.onMediaUpdate((info) => {
      if (this.recallActive || this.isDragging) return;
      
      if (info && info.title && info.isPlaying) {
        if (this.state !== 'happy') this.state = 'dancing';
      } else {
        if (this.state !== 'happy') this.state = 'idle';
      }
    });

    // Listen to Recall Request from Island
    window.orphy.onStartRecall(async (data) => {
      console.log('[Orphy Bunny] Recall received! Starting pathfinding...', data);
      await this.startRecallJourney(data);
    });
  }

  async startRecallJourney(data) {
    if (this.isDragging) return;
    
    this.recallActive = true;
    const currentPos = await window.orphy.getBunnyPosition();
    const targetPos = { x: data.targetX, y: data.targetY };
    const bounds = data.screenBounds || { x: 0, y: 0, width: 1920, height: 1080 };
    this.screenBounds = bounds;

    // Calculate distance
    const dist = Math.hypot(targetPos.x - currentPos.x, targetPos.y - currentPos.y);
    if (dist < 40) {
      // Already nearby! Just happy hop
      this.triggerHappy();
      this.recallActive = false;
      window.orphy.bunnyDocked();
      return;
    }

    // BUILD STAGED PATH:
    // Staged organic desktop path:
    // If far away:
    // 1. Hop down to the screen edge or platform
    // 2. Hop horizontally along edge
    // 3. If target is high up, climb edge of screen
    // 4. Leap across and land beside island
    const waypoints = [];
    
    // Determine if we should climb screen edge
    const needEdgeClimb = Math.abs(currentPos.x - targetPos.x) > 200 && (currentPos.y > targetPos.y + 100);

    if (needEdgeClimb) {
      // Pick nearest screen edge (left or right)
      const distToLeft = currentPos.x - bounds.x;
      const distToRight = (bounds.x + bounds.width) - currentPos.x;
      const climbLeft = distToLeft < distToRight;
      const edgeX = climbLeft ? bounds.x + 10 : bounds.x + bounds.width - 140;

      // Waypoint 1: Run to screen side edge
      waypoints.push({ x: edgeX, y: currentPos.y, mode: 'hop', speed: 8 });
      // Waypoint 2: Climb up screen side edge to island altitude
      waypoints.push({ x: edgeX, y: targetPos.y, mode: 'climb', speed: 6 });
      // Waypoint 3: Leap from edge directly to target!
      waypoints.push({ x: targetPos.x, y: targetPos.y, mode: 'hop', speed: 9 });
    } else {
      // Direct horizontal hops + vertical approach
      waypoints.push({ x: targetPos.x, y: currentPos.y, mode: 'hop', speed: 8 });
      waypoints.push({ x: targetPos.x, y: targetPos.y, mode: 'hop', speed: 8 });
    }

    this.recallWaypoints = waypoints;
    this.currentWaypointIndex = 0;
    this.executeCurrentWaypoint(currentPos);
  }

  executeCurrentWaypoint(startPos) {
    if (this.currentWaypointIndex >= this.recallWaypoints.length) {
      // Completed journey!
      this.recallActive = false;
      this.state = 'happy';
      this.triggerHappy();
      this.spawnHeartBurst();
      if (window.orphy && window.orphy.bunnyDocked) {
        window.orphy.bunnyDocked();
      }
      return;
    }

    const wp = this.recallWaypoints[this.currentWaypointIndex];
    const totalDist = Math.hypot(wp.x - startPos.x, wp.y - startPos.y);
    const duration = Math.max(300, (totalDist / (wp.speed || 6)) * 16);
    const startTime = performance.now();

    // Set animation mode
    if (wp.mode === 'climb') {
      this.state = 'climbing';
    } else {
      this.state = 'dancing'; // Bouncy run/hop
      this.facing = wp.x < startPos.x ? -1 : 1;
    }

    const step = (now) => {
      if (!this.recallActive || this.isDragging) return; // Cancelled
      
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Smooth ease
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      const curX = Math.round(startPos.x + (wp.x - startPos.x) * ease);
      const curY = Math.round(startPos.y + (wp.y - startPos.y) * ease);

      window.orphy.setBunnyPosition(curX, curY);

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        this.currentWaypointIndex++;
        this.executeCurrentWaypoint({ x: wp.x, y: wp.y });
      }
    };

    requestAnimationFrame(step);
  }

  triggerHappy() {
    this.state = 'happy';
    this.happyTimer = 1600;
  }

  spawnHeartBurst() {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: this.x + 12 * this.pixelSize + (Math.random() * 20 - 10),
        y: this.y + (Math.random() * 10),
        vy: 1.2 + Math.random() * 1.5,
        alpha: 1,
        lifetime: 1400 + Math.random() * 600,
        char: '♡',
        phase: Math.random() * Math.PI * 2,
        size: 14 + Math.floor(Math.random() * 6),
        color: '#ff4a6e'
      });
    }
  }

  spawnMusicNote() {
    const notes = ['♪', '♫', '♩'];
    this.particles.push({
      x: this.x + 10 * this.pixelSize + (Math.random() * 24 - 12),
      y: this.y + 4,
      vy: 0.8 + Math.random() * 0.9,
      alpha: 1,
      lifetime: 1800 + Math.random() * 600,
      char: notes[Math.floor(Math.random() * notes.length)],
      phase: Math.random() * Math.PI * 2,
      size: 14 + Math.floor(Math.random() * 4),
      color: '#ffffff'
    });
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
    const duration = this.state === 'climbing' ? 140 : (this.state === 'dancing' ? 160 : 450);
    
    if (this.frameTimer >= duration) {
      this.frameTimer = 0;
      const frames = this.sprites[this.state] || this.sprites.idle;
      this.frame = (this.frame + 1) % frames.length;
    }

    if (this.state === 'happy') {
      this.happyTimer -= dt;
      if (this.happyTimer <= 0) {
        this.state = 'idle';
        this.frame = 0;
      }
    }

    this.bouncePhase += dt * 0.005;

    // Music note particles
    if (this.state === 'dancing') {
      this.particleTimer += dt;
      if (this.particleTimer >= 400 && this.particles.length < 8) {
        this.particleTimer = 0;
        this.spawnMusicNote();
      }
    }

    // Update floating particles
    this.particles = this.particles.filter(p => {
      p.y -= p.vy * (dt / 16);
      p.x += Math.sin(p.phase + p.y * 0.04) * 0.5;
      p.alpha -= dt / p.lifetime;
      p.phase += dt * 0.006;
      return p.alpha > 0;
    });
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const frames = this.sprites[this.state] || this.sprites.idle;
    const sprite = frames[this.frame % frames.length];

    let renderY = this.y;
    let hopOffset = 0;

    if (this.state === 'idle') {
      renderY += Math.sin(this.bouncePhase) * 2;
    } else if (this.state === 'dancing' && (this.frame === 1 || this.frame === 3)) {
      hopOffset = -7;
    } else if (this.state === 'happy') {
      hopOffset = -10;
    }
    renderY += hopOffset;

    // Cute Shadow (only when not dangling/climbing)
    if (this.state !== 'dangling' && this.state !== 'climbing') {
      const shadowScale = 1 - Math.abs(hopOffset) / 35;
      this.ctx.save();
      this.ctx.globalAlpha = 0.3 * shadowScale;
      this.ctx.fillStyle = '#06080e';
      this.ctx.beginPath();
      const shadowCx = this.x + (24 * this.pixelSize) / 2;
      const shadowCy = this.y + 26 * this.pixelSize - 2;
      this.ctx.ellipse(shadowCx, shadowCy, 26 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // Render Chibi Character
    this.ctx.save();
    if (this.facing === -1) {
      this.ctx.translate(this.canvas.width, 0);
      this.ctx.scale(-1, 1);
    }
    this.renderSprite(sprite, this.x, renderY);
    this.ctx.restore();

    // Render Particles
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = p.color || '#ffffff';
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
      '1': '#0e111a', // Outline
      '2': '#fbf3ea', // Skin cream
      '3': '#ff7997', // Inner ear pink
      '4': '#0f121d', // Expressive eyes
      '5': '#ff96af', // Blush
      '6': '#1e2434', // Cozy dark hoodie
      '7': this.themeColor, // Dynamic headphone ring
      '8': '#e04268', // Cute mouth
      '9': '#ffffff', // White sneakers / accents
      'H': '#2b3449', // Headphone earcups
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

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('bunny-canvas');
  window.bunnyPet = new BunnyPet(canvas);
});
