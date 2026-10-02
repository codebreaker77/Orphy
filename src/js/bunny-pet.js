class BunnyPet {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pixelSize = 3;
    
    // Position inside the canvas
    this.x = 35;
    this.y = 40;
    
    // States: 'idle', 'dancing', 'happy', 'sleeping', 'dangling', 'hopping', 'climb_ladder', 'jetpack', 'pocket_ladder', 'pocket_jetpack'
    this.state = 'idle';
    this.frame = 0;
    this.frameTimer = 0;
    this.facing = 1; // 1 = right, -1 = left
    
    this.themeColor = '#e64c65';
    this.particles = [];
    this.isDragging = false;
    
    // Ladder extension animation properties
    this.ladderActive = false;
    this.ladderHeight = 0;
    this.targetLadderHeight = 0;
    this.ladderX = 15;
    
    // Jetpack flame pulse
    this.jetpackActive = false;
    this.jetpackTimer = 0;

    // Recall State Machine
    this.recallActive = false;
    this.screenBounds = { x: 0, y: 0, width: 1920, height: 1080 };
    
    // Lifelike timers
    this.blinkTimer = 2500 + Math.random() * 2000;
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
    // 24w x 26h Chibi Pixel Character
    // Palette:
    // . = trans, 1 = outline (#0e111a), 2 = skin (#fbf3ea), 3 = ear pink (#ff7997), 4 = eye (#0f121d)
    // 5 = blush (#ff96af), 6 = hoodie (#1e2434), 7 = accent, 8 = mouth (#e04268), 9 = white, H = earcup (#2b3449)
    // J = jetpack steel (#64748b), K = jetpack nozzle (#334155), V = visor blue (#38bdf8)
    // L = ladder rail (#92400e), R = ladder rung (#d97706)

    // IDLE Frame 0
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

    // IDLE Frame 1 (Blink)
    const IDLE_1 = [
      "........................",
      "........11......11......",
      ".......1231....1321.....",
      ".......1231....1321.....",
      "......11231....13211....",
      ".....1HH1211111121HH1...",
      "....1H77H12222221H77H1..",
      "....1H77H22222222H77H1..",
      ".....1HH1211221121HH1...",
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

    // DANCING / HOPPING Frames
    const DANCING_0 = [
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

    // DANGLING Frame (Picked up by mouse drag)
    const DANGLING = [
      "........11......11......",
      ".......1231....1321.....",
      ".......1231....1321.....",
      "......11231....13211....",
      ".....1HH1211111121HH1...",
      "....1H77H12222221H77H1..",
      "....1H77H22222222H77H1..",
      ".....1HH1244224421HH1...",
      "......11252222225211....",
      ".......122228822221.....",
      ".......112222222211.....",
      "....12211111111111221...",
      "....11166666666666111...",
      ".....166666666666661....",
      ".....166666666666661....",
      "......1666666666661.....",
      "......1666666666661.....",
      ".......16666666661......",
      "........166666661.......",
      "........166666661.......",
      ".........16611661.......",
      "........1991..1991......",
      "........1111..1111......",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    // PULLING OUT ITEM FROM HOODIE POCKET
    const POCKET_ACTION = [
      "........11......11......",
      ".......1231....1321.....",
      ".......1231....1321.....",
      "......11231....13211....",
      ".....1HH1211111121HH1...",
      "....1H77H12222221H77H1..",
      "....1H77H22222222H77H1..",
      ".....1HH1242222421HH1...",
      "......11252222225211....",
      ".......122228822221.....",
      ".......112222222211.....",
      "......16611111111661....",
      ".....1666666666666661...",
      "....166666666666666661..",
      "....166662222226666661..", // paw inside front kangaroo pocket!
      "....122162222226661221..",
      ".....1116666666666111...",
      "......16666666666661....",
      ".......166661166661.....",
      ".......16661..16661.....",
      "......19991....19991....",
      "......11111....11111....",
      "........................",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    // CLIMBING LADDER (Turned toward ladder, paws gripping rungs)
    const CLIMB_0 = [
      "........................",
      ".........11......11.....",
      "........1231....1321....",
      ".......11231....13211...",
      "......1HH1211111121HH1..",
      ".....1H77H12222221H77H1.",
      "....12217H22222222H71221", // arms reaching up!
      "....11111124222242111111",
      "......11252222225211....",
      ".......122228822221.....",
      "......16611111111661....",
      ".....1666666666666661...",
      ".....1666666666666661...",
      "......16666666666661....",
      "......16666666666661....",
      ".......166661166661.....",
      ".......16661..16661.....",
      "......19991....1661.....", // left foot stepped up!
      "......11111....1661.....",
      "................19991...",
      "................11111...",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    const CLIMB_1 = [
      "........................",
      ".........11......11.....",
      "........1231....1321....",
      ".......11231....13211...",
      "......1HH1211111121HH1..",
      ".....1H77H12222221H77H1.",
      "....12217H22222222H71221",
      "....11111124222242111111",
      "......11252222225211....",
      ".......122228822221.....",
      "......16611111111661....",
      ".....1666666666666661...",
      ".....1666666666666661...",
      "......16666666666661....",
      "......16666666666661....",
      ".......166661166661.....",
      ".......16661..16661.....",
      ".......1661....19991....", // right foot stepped up!
      ".......1661....11111....",
      "......19991.............",
      "......11111.............",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    // JETPACK HOVER FLIGHT (Cool goggles, thruster tanks firing!)
    const JETPACK_0 = [
      "........11......11......",
      ".......1231....1321.....",
      "......11231....13211....",
      ".....1HH1211111121HH1...",
      "....1H77H12222221H77H1..",
      "...1J177H1VVVVVV1H771J1.", // cool blue flight goggles!
      "..1JJJ1112VVVVVV2111JJJ1", // twin steel jetpack tanks!
      "..1JJJ12522222225211JJJ1",
      "..1JJJ11222288222211JJJ1",
      "...1K1.112222222211.1K1.", // jet thruster nozzles!
      "...1K1166111111116611K1.",
      "....166666666666666661..",
      "....122166666666661221..",
      ".....1116666666666111...",
      "......16666666666661....",
      ".......166661166661.....",
      "........1661..1661......",
      "........1991..1991......",
      "........1111..1111......",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    // HAPPY victory pose
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
      ".......122888888221.....",
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
      hopping: [DANCING_0, DANCING_1, DANCING_2, DANCING_3],
      dangling: [DANGLING],
      pocket_ladder: [POCKET_ACTION],
      pocket_jetpack: [POCKET_ACTION],
      climb_ladder: [CLIMB_0, CLIMB_1],
      jetpack: [JETPACK_0],
      happy: [HAPPY_0, DANCING_1]
    };
  }

  setupMouseEvents() {
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
      this.recallActive = false; // Cancel any active recall
      this.ladderActive = false;
      this.jetpackActive = false;
      this.state = 'dangling';
      this.canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown || !this.isDragging) return;
      const dx = e.screenX - initialMouse.x;
      const dy = e.screenY - initialMouse.y;
      
      if (window.orphy && window.orphy.setBunnyPosition) {
        window.orphy.setBunnyPosition(initialWin.x + dx, initialWin.y + dy);
      }
    });

    window.addEventListener('mouseup', () => {
      if (isMouseDown) {
        isMouseDown = false;
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
        this.triggerHappy();
        this.spawnHeartBurst();
      }
    });

    // Poke / Click
    this.canvas.addEventListener('click', () => {
      if (!this.isDragging && !this.recallActive) {
        this.triggerHappy();
        this.spawnHeartBurst();
      }
    });
  }

  setupIPC() {
    if (!window.orphy) return;

    window.orphy.onMediaUpdate((info) => {
      if (this.recallActive || this.isDragging) return;
      
      if (info && info.title && info.isPlaying) {
        if (this.state !== 'happy') this.state = 'dancing';
      } else {
        if (this.state !== 'happy') this.state = 'idle';
      }
    });

    window.orphy.onStartRecall((data) => {
      console.log('[Orphy Bunny] Recall signal received! Starting animated journey...');
      this.startRecallSequence(data);
    });
  }

  // ========================================================
  // RECALL PATHFINDING ORCHESTRATION
  // ========================================================
  async startRecallSequence(data) {
    if (this.isDragging) return;
    this.recallActive = true;
    this.ladderActive = false;
    this.jetpackActive = false;

    const currentPos = await window.orphy.getBunnyPosition();
    const targetPos = { x: data.targetX, y: data.targetY };
    const bounds = data.screenBounds || { x: 0, y: 0, width: 1920, height: 1080 };
    this.screenBounds = bounds;

    // RULE 1: ALWAYS travel to the side wall first!
    // Pick the screen side closest to the island
    const isIslandOnLeft = (targetPos.x < bounds.x + bounds.width / 2);
    const wallX = isIslandOnLeft ? bounds.x + 8 : bounds.x + bounds.width - 138;

    console.log(`[Recall Stage 1] Hopping to screen edge at X=${wallX}...`);
    await this.hopHorizontallyTo(currentPos.x, wallX, currentPos.y);
    if (!this.recallActive) return;

    // RULE 2: At screen edge, check height difference:
    // If island is ABOVE: Ladder
    // If island is BELOW: Jetpack
    const deltaY = targetPos.y - currentPos.y;
    console.log(`[Recall Stage 2] At screen edge. deltaY = ${deltaY}`);

    if (deltaY < -25) {
      // ISLAND IS ABOVE -> LADDER CLIMB!
      console.log('[Recall Stage 2A] Island is UP! Deploying ladder...');
      await this.climbLadderSequence(wallX, currentPos.y, targetPos.y);
    } else if (deltaY > 25) {
      // ISLAND IS BELOW -> JETPACK DESCENT!
      console.log('[Recall Stage 2B] Island is DOWN! Igniting jetpack...');
      await this.jetpackDescentSequence(wallX, currentPos.y, targetPos.y);
    } else {
      // Same level: brief prep pause
      await this.sleep(300);
    }
    if (!this.recallActive) return;

    // RULE 3: Hop horizontally from edge to island
    console.log(`[Recall Stage 3] Hopping from edge X=${wallX} to island dock X=${targetPos.x}...`);
    await this.hopHorizontallyTo(wallX, targetPos.x, targetPos.y);
    if (!this.recallActive) return;

    // DOCK CELEBRATION!
    console.log('[Recall Stage 4] Docked at island! Celebrating...');
    this.recallActive = false;
    this.ladderActive = false;
    this.jetpackActive = false;
    this.state = 'happy';
    this.triggerHappy();
    this.spawnHeartBurst();
    
    if (window.orphy && window.orphy.bunnyDocked) {
      window.orphy.bunnyDocked();
    }
  }

  // ========================================================
  // RHYTHMIC HORIZONTAL HOPPING (Paced, bouncy, characterful)
  // ========================================================
  async hopHorizontallyTo(startX, targetX, fixedY) {
    const totalDist = Math.abs(targetX - startX);
    if (totalDist < 5) return;

    this.facing = targetX > startX ? 1 : -1;
    this.state = 'hopping';

    // Paced hops: Each hop covers ~40px and takes 380ms
    const hopDistance = 40;
    const numHops = Math.max(1, Math.ceil(totalDist / hopDistance));
    const stepSize = (targetX - startX) / numHops;

    for (let i = 0; i < numHops; i++) {
      if (!this.recallActive || this.isDragging) return;
      
      const hopStart = startX + stepSize * i;
      const hopEnd = startX + stepSize * (i + 1);
      await this.performSingleHop(hopStart, hopEnd, fixedY, 360);
      
      // Little puff of dust on landing
      this.spawnDust(this.facing === 1 ? -6 : 6);
    }

    if (window.orphy && window.orphy.setBunnyPosition) {
      window.orphy.setBunnyPosition(targetX, fixedY);
    }
  }

  performSingleHop(fromX, toX, y, durationMs) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      
      const hopStep = (now) => {
        if (!this.recallActive || this.isDragging) {
          resolve();
          return;
        }

        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / durationMs);

        // Parabolic arc for hop: 0 -> peak -> 0
        const arcY = -16 * Math.sin(t * Math.PI);
        const curX = Math.round(fromX + (toX - fromX) * t);
        const curY = Math.round(y + arcY);

        window.orphy.setBunnyPosition(curX, curY);

        if (t < 1) {
          requestAnimationFrame(hopStep);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(hopStep);
    });
  }

  // ========================================================
  // LADDER SEQUENCE: Pull from pocket -> Extend -> Climb -> Fold
  // ========================================================
  async climbLadderSequence(x, startY, endY) {
    // 1. Pull out ladder from hoodie pocket
    this.state = 'pocket_ladder';
    this.facing = (x < this.screenBounds.width / 2) ? 1 : -1;
    await this.sleep(400);
    if (!this.recallActive) return;

    // 2. Extend ladder up to target height
    this.ladderActive = true;
    this.ladderHeight = 10;
    this.targetLadderHeight = 110;
    
    // Animate ladder extending rungs upward
    const extendStart = performance.now();
    const extendDuration = 550;
    await new Promise((res) => {
      const ext = (now) => {
        const t = Math.min(1, (now - extendStart) / extendDuration);
        this.ladderHeight = 10 + (this.targetLadderHeight - 10) * t;
        if (t < 1 && this.recallActive) requestAnimationFrame(ext);
        else res();
      };
      requestAnimationFrame(ext);
    });
    if (!this.recallActive) return;

    // 3. Climb the ladder up
    this.state = 'climb_ladder';
    const climbDist = Math.abs(startY - endY);
    // Natural climb speed: ~70px per second
    const climbDuration = Math.max(800, (climbDist / 70) * 1000);
    const climbStart = performance.now();

    await new Promise((res) => {
      const stepClimb = (now) => {
        if (!this.recallActive || this.isDragging) { res(); return; }
        const elapsed = now - climbStart;
        const t = Math.min(1, elapsed / climbDuration);

        const curY = Math.round(startY + (endY - startY) * t);
        window.orphy.setBunnyPosition(x, curY);

        if (t < 1) {
          requestAnimationFrame(stepClimb);
        } else {
          res();
        }
      };
      requestAnimationFrame(stepClimb);
    });
    if (!this.recallActive) return;

    // 4. At top: fold ladder back into pocket
    this.state = 'pocket_ladder';
    this.ladderActive = false;
    this.spawnSparkle();
    await this.sleep(350);
  }

  // ========================================================
  // JETPACK SEQUENCE: Equip -> Ignite -> Float Down -> Touchdown
  // ========================================================
  async jetpackDescentSequence(x, startY, endY) {
    // 1. Pull out jetpack from hoodie pocket & snap on!
    this.state = 'pocket_jetpack';
    await this.sleep(400);
    if (!this.recallActive) return;

    // 2. Thrusters Ignite!
    this.state = 'jetpack';
    this.jetpackActive = true;
    this.spawnJetpackFlames();
    await this.sleep(250);
    if (!this.recallActive) return;

    // 3. Float down smoothly with thrusters roaring
    const descentDist = Math.abs(endY - startY);
    // Smooth descent: ~95px per second
    const descentDuration = Math.max(900, (descentDist / 95) * 1000);
    const descentStart = performance.now();

    await new Promise((res) => {
      const stepJet = (now) => {
        if (!this.recallActive || this.isDragging) { res(); return; }
        const elapsed = now - descentStart;
        const t = Math.min(1, elapsed / descentDuration);

        // Smooth glide with gentle hovering sine wave
        const hoverWiggle = Math.sin(elapsed * 0.015) * 2;
        const curY = Math.round(startY + (endY - startY) * t + hoverWiggle);
        window.orphy.setBunnyPosition(x, curY);

        if (t < 1) {
          requestAnimationFrame(stepJet);
        } else {
          res();
        }
      };
      requestAnimationFrame(stepJet);
    });
    if (!this.recallActive) return;

    // 4. Touchdown & cut engines
    this.jetpackActive = false;
    this.state = 'pocket_jetpack';
    this.spawnDust(0);
    await this.sleep(350);
  }

  sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  triggerHappy() {
    this.state = 'happy';
    this.happyTimer = 1600;
  }

  // ========================================================
  // PARTICLES: Dust, Smoke, Flames, Hearts, Sparkles
  // ========================================================
  spawnDust(offsetDx) {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        type: 'dust',
        x: this.x + 12 * this.pixelSize + offsetDx + (Math.random() * 8 - 4),
        y: this.y + 26 * this.pixelSize - 2,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -0.4 - Math.random() * 0.4,
        alpha: 0.8,
        lifetime: 400 + Math.random() * 200,
        size: 3 + Math.floor(Math.random() * 2),
        color: '#64748b'
      });
    }
  }

  spawnJetpackFlames() {
    // Twin thruster exhaust
    const leftNozzleX = this.x + 4 * this.pixelSize;
    const rightNozzleX = this.x + 20 * this.pixelSize;
    const nozzleY = this.y + 16 * this.pixelSize;

    [leftNozzleX, rightNozzleX].forEach(nx => {
      // Flame particle
      this.particles.push({
        type: 'flame',
        x: nx + (Math.random() * 4 - 2),
        y: nozzleY,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 1.5 + Math.random() * 1.5,
        alpha: 1,
        lifetime: 300,
        size: 4 + Math.floor(Math.random() * 3),
        color: Math.random() > 0.5 ? '#ff4500' : '#ffea00'
      });

      // Smoke puff
      this.particles.push({
        type: 'smoke',
        x: nx + (Math.random() * 4 - 2),
        y: nozzleY + 6,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 0.6 + Math.random() * 0.8,
        alpha: 0.6,
        lifetime: 500,
        size: 5 + Math.floor(Math.random() * 4),
        color: '#94a3b8'
      });
    });
  }

  spawnHeartBurst() {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        type: 'char',
        x: this.x + 12 * this.pixelSize + (Math.random() * 16 - 8),
        y: this.y + (Math.random() * 10),
        vy: 1.2 + Math.random() * 1.2,
        alpha: 1,
        lifetime: 1400 + Math.random() * 400,
        char: '♡',
        phase: Math.random() * Math.PI * 2,
        size: 14 + Math.floor(Math.random() * 4),
        color: '#ff4a6e'
      });
    }
  }

  spawnSparkle() {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        type: 'char',
        x: this.x + 12 * this.pixelSize + (Math.random() * 20 - 10),
        y: this.y + 10 + (Math.random() * 10),
        vy: 0.8 + Math.random() * 0.8,
        alpha: 1,
        lifetime: 800,
        char: '✦',
        phase: Math.random() * Math.PI * 2,
        size: 12,
        color: '#fbbf24'
      });
    }
  }

  spawnMusicNote() {
    const notes = ['♪', '♫', '♩'];
    this.particles.push({
      type: 'char',
      x: this.x + 12 * this.pixelSize + (Math.random() * 24 - 12),
      y: this.y + 4,
      vy: 0.7 + Math.random() * 0.8,
      alpha: 1,
      lifetime: 1800 + Math.random() * 500,
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
    const duration = this.state === 'climb_ladder' ? 150 : (this.state === 'dancing' ? 170 : 450);
    
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

    // Music note particles when dancing
    if (this.state === 'dancing') {
      this.particleTimer += dt;
      if (this.particleTimer >= 400 && this.particles.length < 8) {
        this.particleTimer = 0;
        this.spawnMusicNote();
      }
    }

    // Jetpack flame emission
    if (this.jetpackActive) {
      this.jetpackTimer += dt;
      if (this.jetpackTimer >= 60) {
        this.jetpackTimer = 0;
        this.spawnJetpackFlames();
      }
    }

    // Update particles
    this.particles = this.particles.filter(p => {
      p.alpha -= dt / p.lifetime;
      if (p.type === 'flame' || p.type === 'smoke') {
        p.y += p.vy * (dt / 16);
        p.x += (p.vx || 0) * (dt / 16);
      } else if (p.type === 'dust') {
        p.y += p.vy * (dt / 16);
        p.x += (p.vx || 0) * (dt / 16);
      } else {
        p.y -= p.vy * (dt / 16);
        p.x += Math.sin(p.phase + p.y * 0.04) * 0.5;
        p.phase += dt * 0.006;
      }
      return p.alpha > 0;
    });
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Render Ladder (if ladder is deployed on screen edge)
    if (this.ladderActive) {
      this.renderLadder();
    }

    // 2. Render Bunny Sprite
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

    // Shadow (only when on ground, not flying or climbing)
    if (this.state !== 'dangling' && this.state !== 'climb_ladder' && !this.jetpackActive) {
      const shadowScale = 1 - Math.abs(hopOffset) / 35;
      this.ctx.save();
      this.ctx.globalAlpha = 0.28 * shadowScale;
      this.ctx.fillStyle = '#06080e';
      this.ctx.beginPath();
      const shadowCx = this.x + (24 * this.pixelSize) / 2;
      const shadowCy = this.y + 26 * this.pixelSize - 2;
      this.ctx.ellipse(shadowCx, shadowCy, 26 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // Render Chibi Character with Facing Direction
    this.ctx.save();
    if (this.facing === -1) {
      this.ctx.translate(this.canvas.width, 0);
      this.ctx.scale(-1, 1);
    }
    this.renderSprite(sprite, this.x, renderY);
    this.ctx.restore();

    // 3. Render Particles (flames, smoke, hearts, music notes)
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      
      if (p.type === 'flame' || p.type === 'smoke' || p.type === 'dust') {
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      } else {
        this.ctx.fillStyle = p.color || '#ffffff';
        this.ctx.shadowColor = this.themeColor;
        this.ctx.shadowBlur = 6;
        this.ctx.font = `bold ${p.size}px monospace`;
        this.ctx.fillText(p.char, p.x, p.y);
      }
      this.ctx.restore();
    });
  }

  // Draw authentic pixel ladder rungs along the side of the canvas
  renderLadder() {
    this.ctx.save();
    const lx = (this.facing === 1) ? this.x + 24 * this.pixelSize + 2 : this.x - 14;
    const topY = Math.max(10, this.y + 26 * this.pixelSize - this.ladderHeight);
    const botY = this.y + 26 * this.pixelSize + 10;
    
    // Ladder Side Rails
    this.ctx.fillStyle = '#78350f'; // Dark wood
    this.ctx.fillRect(lx, topY, 3, botY - topY);
    this.ctx.fillRect(lx + 12, topY, 3, botY - topY);

    // Ladder Rungs every 8 pixels
    this.ctx.fillStyle = '#b45309'; // Warm wood rung
    for (let ry = botY; ry >= topY; ry -= 8) {
      this.ctx.fillRect(lx + 2, ry, 10, 2);
    }
    this.ctx.restore();
  }

  renderSprite(spriteStr, x, y) {
    const colorMap = {
      '.': null,
      '1': '#0e111a', // Outline
      '2': '#fbf3ea', // Skin cream
      '3': '#ff7997', // Ear pink
      '4': '#0f121d', // Eyes
      '5': '#ff96af', // Blush
      '6': '#1e2434', // Hoodie
      '7': this.themeColor, // Headphone ring
      '8': '#e04268', // Mouth
      '9': '#ffffff', // White
      'H': '#2b3449', // Earcup
      'J': '#64748b', // Jetpack steel
      'K': '#334155', // Nozzle
      'V': '#38bdf8', // Goggles / Visor
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
