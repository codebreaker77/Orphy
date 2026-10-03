class BunnyPet {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pixelSize = 3;
    
    // Position inside the canvas
    this.x = 35;
    this.y = 40;
    
    // States: 'idle', 'dancing', 'lounging', 'sleeping', 'wake_up', 'munching', 'happy', 'dangling', 'pocket_jetpack', 'jetpack'
    this.state = 'idle';
    this.frame = 0;
    this.frameTimer = 0;
    this.facing = 1; // 1 = right, -1 = left
    this.tiltAngle = 0; // Flight banking angle
    this.dockedLagAngle = 0;
    this.targetLagAngle = 0;
    
    this.themeColor = '#e64c65';
    this.particles = [];
    this.isDragging = false;
    this.isLocked = false;
    
    // Jetpack Flight Properties
    this.jetpackActive = false;
    this.jetpackTimer = 0;
    this.recallActive = false;
    this.screenBounds = { x: 0, y: 0, width: 1920, height: 1080 };
    
    // Music Lifecycle & Timers
    this.isMediaPlaying = false;
    this.pausedDuration = 0;
    this.bouncePhase = 0;
    this.particleTimer = 0;
    this.happyTimer = 0;
    this.wakeUpTimer = 0;
    this.munchTimer = 0;
    this.sleepParticleTimer = 0;
    this.lastTime = performance.now();
    
    // Interactive Snack Feeding (Carrot)
    this.fallingCarrot = null;

    // Reactive Eye Tracking
    this.mouseCanvasX = null;
    this.mouseCanvasY = null;
    this.eyeOffsetX = 0;
    this.eyeOffsetY = 0;
    
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
    // J = jetpack steel (#64748b), K = jetpack nozzle (#334155), V = visor blue (#38bdf8), F = flame (#ffea00)
    // G = Gameboy gray (#94a3b8), P = Gameboy screen (#84cc16), R = red button (#ef4444)
    // C = carrot orange (#ea580c), L = carrot leaf (#16a34a), E = exclamation (#ffea00)

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

    // DANCING Frames
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

    // LOUNGING (Holding mini Game Boy)
    const LOUNGING_0 = [
      "........................",
      ".......11........11.....",
      "......1231......1321....",
      "......1231......1321....",
      ".....11231.....11231....",
      "....1HH1211111121HH1....",
      "...1H77H12222221H77H1...",
      "...1H77H22222222H77H1...",
      "....1HH1242222421HH1....",
      ".....11252222225211.....",
      "......122288882221......",
      "......112222222211......",
      ".....16611111111661.....",
      "....1666666666666661....",
      "...16661GGGGGG166661....",
      "...1661GPPPPPPG16661....",
      "...1221GPPPPPPG12261....",
      "...1111G111111G11161....",
      ".....16GR11111G6661.....",
      "....1666GGGGGG66661.....",
      "...1999911661199991.....",
      "...111111....111111.....",
      "........................",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    const LOUNGING_1 = [
      "........................",
      ".......11........11.....",
      "......1231......1321....",
      "......1231......1321....",
      ".....11231.....11231....",
      "....1HH1211111121HH1....",
      "...1H77H12222221H77H1...",
      "...1H77H22222222H77H1...",
      "....1HH1242222421HH1....",
      ".....11252222225211.....",
      "......122288882221......",
      "......112222222211......",
      ".....16611111111661.....",
      "....1666666666666661....",
      "...16661GGGGGG166661....",
      "...1661GPPPPPPG16661....",
      "...1221GPP11PPG12261....",
      "...1111G111111G11161....",
      ".....16G11111RG6661.....",
      "....1666GGGGGG66661.....",
      "...1999911661199991.....",
      "...111111....111111.....",
      "........................",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    // SLEEPING (Curled up, eyes closed)
    const SLEEPING_0 = [
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........11......11......",
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
      "...16666666666666666661.",
      "...12216666666666661221.",
      "...11116666666666661111.",
      "....1999911661199991....",
      "....111111....111111....",
      "........................",
      "........................"
    ].join('\n');

    const SLEEPING_1 = [
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........11......11......",
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
      "...16666666666666666661.",
      "...12216666666666661221.",
      "...11116666666666661111.",
      "....1999911661199991....",
      "....111111....111111....",
      "........................"
    ].join('\n');

    // WAKE_UP (Startled jump, exclamation mark)
    const WAKE_UP = [
      "...........1E1..........",
      "...........1E1..........",
      "...........1E1..........",
      "........................",
      "...........1E1..........",
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
      "....12211111111111221...",
      "....11166666666666111...",
      ".....166666666666661....",
      ".....166666666666661....",
      "......1666666666661.....",
      ".......166661166661.....",
      ".......16661..16661.....",
      "......19991....19991....",
      "......11111....11111....",
      "........................"
    ].join('\n');

    // MUNCHING (Holding and crunching carrot)
    const MUNCH_0 = [
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
      "....166661LL1666666661..",
      "....16661LLLL166666661..",
      "....1221CCCCCCCC1221....",
      ".....111CCCCCCC1111.....",
      "......166CCCCC66661.....",
      "......1666611666661.....",
      ".......16661..16661.....",
      "......19991....19991....",
      "......11111....11111....",
      "........................",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    const MUNCH_1 = [
      "........11......11......",
      ".......1231....1321.....",
      ".......1231....1321.....",
      "......11231....13211....",
      ".....1HH1211111121HH1...",
      "....1H77H12222221H77H1..",
      "....1H77H22222222H77H1..",
      ".....1HH12112221121HH1..",
      "......11255222255211....",
      ".......122288882221.....",
      ".......112222222211.....",
      "......16611111111661....",
      ".....1666666666666661...",
      "....166661LL1666666661..",
      "....16661LLLL166666661..",
      "....12211CCCCCC11221....",
      ".....1111CCCCC11111.....",
      "......1661CCC166661.....",
      "......1666611666661.....",
      ".......16661..16661.....",
      "......19991....19991....",
      "......11111....11111....",
      "........................",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    // DANGLING (Mouse Drag)
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

    // POCKET ACTION (Equipping jetpack)
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
      "....166662222226666661..",
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

    // JETPACK FLIGHT Frames
    const JETPACK_0 = [
      "........11......11......",
      ".......1231....1321.....",
      "......11231....13211....",
      ".....1HH1211111121HH1...",
      "....1H77H12222221H77H1..",
      "...1J177H1VVVVVV1H771J1.",
      "..1JJJ1112VVVVVV2111JJJ1",
      "..1JJJ12522222225211JJJ1",
      "..1JJJ11222288222211JJJ1",
      "...1K1.112222222211.1K1.",
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

    const JETPACK_1 = [
      "........11......11......",
      ".......1231....1321.....",
      "......11231....13211....",
      ".....1HH1211111121HH1...",
      "....1H77H12222221H77H1..",
      "...1J177H1VVVVVV1H771J1.",
      "..1JJJ1112VVVVVV2111JJJ1",
      "..1JJJ12522222225211JJJ1",
      "..1JJJ11222288222211JJJ1",
      "...1K1.112222222211.1K1.",
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

    // HAPPY victory
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
      lounging: [LOUNGING_0, LOUNGING_1],
      sleeping: [SLEEPING_0, SLEEPING_1],
      wake_up: [WAKE_UP],
      munching: [MUNCH_0, MUNCH_1],
      dangling: [DANGLING],
      pocket_jetpack: [POCKET_ACTION],
      jetpack: [JETPACK_0, JETPACK_1],
      happy: [HAPPY_0, DANCING_1]
    };
  }

  setupMouseEvents() {
    let isMouseDown = false;
    let initialMouse = { x: 0, y: 0 };
    let initialWin = { x: 0, y: 0 };

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseCanvasX = e.clientX - rect.left;
      this.mouseCanvasY = e.clientY - rect.top;

      // Calculate pupil gaze offset (-1, 0, or 1 pixel)
      const headCenterX = this.x + 12 * this.pixelSize;
      const headCenterY = this.y + 8 * this.pixelSize;
      const dx = this.mouseCanvasX - headCenterX;
      const dy = this.mouseCanvasY - headCenterY;

      this.eyeOffsetX = dx > 18 ? 1 : (dx < -18 ? -1 : 0);
      this.eyeOffsetY = dy > 18 ? 1 : (dy < -18 ? -1 : 0);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouseCanvasX = null;
      this.mouseCanvasY = null;
      this.eyeOffsetX = 0;
      this.eyeOffsetY = 0;
    });

    // Right Click Context Menu
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (window.orphy && window.orphy.openBunnyContextMenu) {
        window.orphy.openBunnyContextMenu();
      }
    });

    this.canvas.addEventListener('mousedown', async (e) => {
      if (e.button !== 0) return; // Only left click for dragging
      if (this.isLocked) return;

      isMouseDown = true;
      initialMouse = { x: e.screenX, y: e.screenY };
      
      if (window.orphy && window.orphy.getBunnyPosition) {
        initialWin = await window.orphy.getBunnyPosition();
      }

      this.isDragging = true;
      this.recallActive = false; // Cancel active recall
      this.jetpackActive = false;
      this.tiltAngle = 0;
      this.state = 'dangling';
      this.canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown || !this.isDragging || this.isLocked) return;
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

    this.canvas.addEventListener('click', (e) => {
      if (e.button !== 0) return;
      if (!this.isDragging && !this.recallActive) {
        // If asleep or lounging, tap wakes bunny up
        if (this.state === 'sleeping' || this.state === 'lounging') {
          this.triggerWakeUp();
        } else {
          this.triggerHappy();
          this.spawnHeartBurst();
        }
      }
    });
  }

  setupIPC() {
    if (!window.orphy) return;

    window.orphy.onMediaUpdate((info) => {
      if (this.recallActive || this.isDragging) return;
      
      const wasPlaying = this.isMediaPlaying;
      this.isMediaPlaying = !!(info && info.title && info.isPlaying);

      // Music resumption trigger: wake up if was asleep or lounging
      if (!wasPlaying && this.isMediaPlaying) {
        if (this.pausedDuration >= 12 || this.state === 'sleeping' || this.state === 'lounging') {
          this.pausedDuration = 0;
          this.triggerWakeUp();
        } else {
          this.pausedDuration = 0;
          this.state = 'dancing';
        }
      }

      // Dynamic theme color update matching Island
      if (info && info.thumbnailDataUrl && window.ThemeEngine) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const color = window.ThemeEngine.extractDominantColor(img);
          this.themeColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
        };
        img.src = info.thumbnailDataUrl;
      }
    });

    window.orphy.onStartRecall((data) => {
      console.log('[Orphy Bunny] Flight signal received! Starting Curvy Jetpack Flight...');
      this.startCurvyJetpackFlight(data);
    });

    window.orphy.onFeedCarrot(() => {
      this.feedCarrot();
    });

    window.orphy.onIslandDragLag((data) => {
      if (this.recallActive || this.isDragging) return;
      // Inertial lag tilt
      this.targetLagAngle = Math.max(-0.25, Math.min(0.25, -(data.vx || 0) * 0.04));
    });

    window.orphy.onLockChanged((locked) => {
      this.isLocked = locked;
    });

    if (window.orphy.getLockState) {
      window.orphy.getLockState().then(locked => {
        this.isLocked = locked;
      });
    }
  }

  // ========================================================
  // SMOOTH CURVY JETPACK FLIGHT PATH
  // ========================================================
  async startCurvyJetpackFlight(data) {
    if (this.isDragging) return;
    this.recallActive = true;

    const currentPos = await window.orphy.getBunnyPosition();
    const targetPos = { x: data.targetX, y: data.targetY };
    const bounds = data.screenBounds || { x: 0, y: 0, width: 1920, height: 1080 };
    this.screenBounds = bounds;

    // Check if already practically at destination
    const totalDist = Math.hypot(targetPos.x - currentPos.x, targetPos.y - currentPos.y);
    if (totalDist < 30) {
      this.triggerHappy();
      this.spawnHeartBurst();
      this.recallActive = false;
      if (data.dockOnArrival !== false && window.orphy && window.orphy.bunnyDocked) {
        window.orphy.bunnyDocked();
      }
      return;
    }

    // Step 1: Pull out jetpack from hoodie pocket & equip goggles
    this.state = 'pocket_jetpack';
    this.tiltAngle = 0;
    await this.sleep(350);
    if (!this.recallActive) return;

    // Step 2: Ignite Jetpack!
    this.state = 'jetpack';
    this.jetpackActive = true;
    this.spawnJetpackBurst();
    await this.sleep(200);
    if (!this.recallActive) return;

    // Step 3: Generate a random, smooth organic Bezier flight curve
    const dx = targetPos.x - currentPos.x;
    const dy = targetPos.y - currentPos.y;
    
    // Perpendicular normal vector for swooping arc
    const nx = -dy / totalDist;
    const ny = dx / totalDist;

    // Randomize curvature: graceful swoop
    const arcDirection = (Math.random() > 0.5 ? 1 : -1);
    const curvatureMagnitude1 = totalDist * (0.25 + Math.random() * 0.25);
    const curvatureMagnitude2 = totalDist * (0.15 + Math.random() * 0.25) * (Math.random() > 0.4 ? 1 : -0.6);

    const P0 = { x: currentPos.x, y: currentPos.y };
    const P1 = {
      x: Math.round(currentPos.x + dx * 0.28 + nx * (arcDirection * curvatureMagnitude1)),
      y: Math.round(currentPos.y + dy * 0.28 + ny * (arcDirection * curvatureMagnitude1))
    };
    const P2 = {
      x: Math.round(currentPos.x + dx * 0.72 + nx * (arcDirection * curvatureMagnitude2)),
      y: Math.round(currentPos.y + dy * 0.72 + ny * (arcDirection * curvatureMagnitude2))
    };
    const P3 = { x: targetPos.x, y: targetPos.y };

    // Clamp control points inside screen bounds
    const pad = 30;
    P1.x = Math.max(bounds.x + pad, Math.min(bounds.x + bounds.width - 150, P1.x));
    P1.y = Math.max(bounds.y + pad, Math.min(bounds.y + bounds.height - 180, P1.y));
    P2.x = Math.max(bounds.x + pad, Math.min(bounds.x + bounds.width - 150, P2.x));
    P2.y = Math.max(bounds.y + pad, Math.min(bounds.y + bounds.height - 180, P2.y));

    // Flight duration based on distance
    const flightDuration = Math.max(2200, Math.min(3800, totalDist * 2.6));
    const flightStart = performance.now();

    await new Promise((resolve) => {
      const flyStep = (now) => {
        if (!this.recallActive || this.isDragging) {
          resolve();
          return;
        }

        const elapsed = now - flightStart;
        const rawT = Math.min(1, elapsed / flightDuration);
        
        // Ease-in-out curve
        const t = rawT < 0.5 ? 2 * rawT * rawT : -1 + (4 - 2 * rawT) * rawT;

        // Cubic Bezier interpolation
        const u = 1 - t;
        const curX = Math.round(
          u * u * u * P0.x +
          3 * u * u * t * P1.x +
          3 * u * t * t * P2.x +
          t * t * t * P3.x
        );
        const curY = Math.round(
          u * u * u * P0.y +
          3 * u * u * t * P1.y +
          3 * u * t * t * P2.y +
          t * t * t * P3.y
        );

        // Velocity tangent for banking angle and facing
        const dXdt = 3 * u * u * (P1.x - P0.x) + 6 * u * t * (P2.x - P1.x) + 3 * t * t * (P3.x - P2.x);
        const dYdt = 3 * u * u * (P1.y - P0.y) + 6 * u * t * (P2.y - P1.y) + 3 * t * t * (P3.y - P2.y);
        
        this.facing = dXdt >= 0 ? 1 : -1;
        const angle = Math.atan2(dYdt, Math.abs(dXdt));
        this.tiltAngle = Math.max(-0.25, Math.min(0.25, angle * 0.4));

        window.orphy.setBunnyPosition(curX, curY);

        if (rawT < 1) {
          requestAnimationFrame(flyStep);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(flyStep);
    });

    if (!this.recallActive) return;

    // Step 4: Touchdown, Stow Jetpack & Celebrate!
    this.tiltAngle = 0;
    this.jetpackActive = false;
    this.state = 'pocket_jetpack';
    this.spawnDustPuff();
    await this.sleep(300);

    // Final celebration
    this.recallActive = false;
    this.triggerHappy();
    this.spawnHeartBurst();

    if (data.dockOnArrival !== false && window.orphy && window.orphy.bunnyDocked) {
      window.orphy.bunnyDocked();
    }
  }

  // ========================================================
  // SNACK FEEDING (Carrot Munching)
  // ========================================================
  feedCarrot() {
    if (this.recallActive || this.isDragging) return;
    this.fallingCarrot = {
      x: this.x + 8 * this.pixelSize,
      y: -15,
      vy: 2.2,
      active: true
    };
  }

  spawnCarrotCrumbs() {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        type: 'crumb',
        x: this.x + 12 * this.pixelSize + (Math.random() * 12 - 6),
        y: this.y + 14 * this.pixelSize,
        vx: (Math.random() - 0.5) * 2.2,
        vy: -1.0 - Math.random() * 1.5,
        alpha: 1,
        lifetime: 450,
        size: 2 + Math.floor(Math.random() * 2),
        color: Math.random() > 0.3 ? '#ea580c' : '#16a34a'
      });
    }
  }

  sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  triggerHappy() {
    this.state = 'happy';
    this.happyTimer = 1600;
  }

  triggerWakeUp() {
    this.state = 'wake_up';
    this.wakeUpTimer = 750;
    this.frame = 0;
  }

  // ========================================================
  // PARTICLES (Theme-Tinted Flames, Smoke, Hearts, Notes, Zzz)
  // ========================================================
  spawnJetpackBurst() {
    for (let i = 0; i < 8; i++) {
      this.spawnJetpackFlames();
    }
  }

  spawnJetpackFlames() {
    const leftNozzleX = this.x + 3 * this.pixelSize;
    const rightNozzleX = this.x + 21 * this.pixelSize;
    const nozzleY = this.y + 17 * this.pixelSize;

    [leftNozzleX, rightNozzleX].forEach(nx => {
      // Hot spark - core white/yellow with theme color aura
      const sparkColor = Math.random() > 0.4 ? this.themeColor : (Math.random() > 0.5 ? '#ffffff' : '#ffea00');
      this.particles.push({
        type: 'flame',
        x: nx + (Math.random() * 4 - 2),
        y: nozzleY,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 1.8 + Math.random() * 2.0,
        alpha: 1,
        lifetime: 300,
        size: 3 + Math.floor(Math.random() * 3),
        color: sparkColor
      });

      // Billowing smoke puff
      this.particles.push({
        type: 'smoke',
        x: nx + (Math.random() * 6 - 3),
        y: nozzleY + 6,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 0.8 + Math.random() * 1.2,
        alpha: 0.65,
        lifetime: 550,
        size: 4 + Math.floor(Math.random() * 4),
        color: '#64748b'
      });
    });
  }

  spawnDustPuff() {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        type: 'dust',
        x: this.x + 12 * this.pixelSize + (Math.random() * 16 - 8),
        y: this.y + 26 * this.pixelSize - 2,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -0.6 - Math.random() * 0.6,
        alpha: 0.8,
        lifetime: 450,
        size: 3 + Math.floor(Math.random() * 3),
        color: '#94a3b8'
      });
    }
  }

  spawnHeartBurst() {
    for (let i = 0; i < 6; i++) {
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

  spawnSleepZ() {
    this.particles.push({
      type: 'sleep_z',
      x: this.x + 16 * this.pixelSize,
      y: this.y + 8 * this.pixelSize,
      vx: 0.3 + Math.random() * 0.3,
      vy: 0.6 + Math.random() * 0.4,
      alpha: 0.9,
      lifetime: 2400,
      char: 'z',
      phase: Math.random() * Math.PI,
      size: 10,
      color: '#93c5fd'
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
    const duration = this.state === 'jetpack' ? 120 : (this.state === 'dancing' ? 170 : (this.state === 'sleeping' ? 1100 : 450));
    
    if (this.frameTimer >= duration) {
      this.frameTimer = 0;
      const frames = this.sprites[this.state] || this.sprites.idle;
      this.frame = (this.frame + 1) % frames.length;
    }

    // Music Pause Life Cycle State Machine
    if (!this.isMediaPlaying && !this.recallActive && !this.isDragging) {
      if (this.state !== 'happy' && this.state !== 'munching' && this.state !== 'wake_up') {
        this.pausedDuration += dt / 1000;
        if (this.pausedDuration >= 30) {
          if (this.state !== 'sleeping') {
            this.state = 'sleeping';
            this.frame = 0;
          }
        } else if (this.pausedDuration >= 12) {
          if (this.state !== 'lounging') {
            this.state = 'lounging';
            this.frame = 0;
          }
        } else {
          if (this.state !== 'idle') {
            this.state = 'idle';
            this.frame = 0;
          }
        }
      }
    }

    // Temporary States Countdowns
    if (this.state === 'happy') {
      this.happyTimer -= dt;
      if (this.happyTimer <= 0) {
        this.state = this.isMediaPlaying ? 'dancing' : 'idle';
        this.frame = 0;
      }
    }

    if (this.state === 'wake_up') {
      this.wakeUpTimer -= dt;
      if (this.wakeUpTimer <= 0) {
        this.state = this.isMediaPlaying ? 'dancing' : 'idle';
        this.frame = 0;
      }
    }

    if (this.state === 'munching') {
      this.munchTimer -= dt;
      if (Math.random() > 0.7) this.spawnCarrotCrumbs();
      if (this.munchTimer <= 0) {
        this.triggerHappy();
        this.spawnHeartBurst();
        this.spawnHeartBurst();
      }
    }

    // Falling Carrot Physics
    if (this.fallingCarrot && this.fallingCarrot.active) {
      this.fallingCarrot.y += this.fallingCarrot.vy * (dt / 16);
      const catchY = this.y + 11 * this.pixelSize;
      if (this.fallingCarrot.y >= catchY) {
        this.fallingCarrot.active = false;
        this.state = 'munching';
        this.munchTimer = 1800;
        this.frame = 0;
      }
    }

    // Smooth Docked Lag Angle Recovery
    this.dockedLagAngle += (this.targetLagAngle - this.dockedLagAngle) * 0.18;

    this.bouncePhase += dt * 0.005;

    // Music note emission when dancing
    if (this.state === 'dancing') {
      this.particleTimer += dt;
      if (this.particleTimer >= 400 && this.particles.length < 8) {
        this.particleTimer = 0;
        this.spawnMusicNote();
      }
    }

    // Sleep Z particles when sleeping
    if (this.state === 'sleeping') {
      this.sleepParticleTimer += dt;
      if (this.sleepParticleTimer >= 1300 && this.particles.length < 8) {
        this.sleepParticleTimer = 0;
        this.spawnSleepZ();
      }
    }

    // Jetpack flame continuous emissions
    if (this.jetpackActive) {
      this.jetpackTimer += dt;
      if (this.jetpackTimer >= 50) {
        this.jetpackTimer = 0;
        this.spawnJetpackFlames();
      }
    }

    // Update active particles
    this.particles = this.particles.filter(p => {
      p.alpha -= dt / p.lifetime;
      if (p.type === 'flame' || p.type === 'smoke' || p.type === 'dust' || p.type === 'crumb') {
        p.y += p.vy * (dt / 16);
        p.x += (p.vx || 0) * (dt / 16);
        if (p.type === 'crumb') p.vy += 0.1; // crumb gravity
      } else if (p.type === 'sleep_z') {
        p.y -= p.vy * (dt / 16);
        p.x += Math.sin(p.phase + p.y * 0.03) * 0.4;
        p.size += dt * 0.003;
        if (p.size > 14) p.char = 'Z';
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
    } else if (this.state === 'wake_up') {
      hopOffset = -8;
    }
    renderY += hopOffset;

    // Shadow (only on ground, never while flying with jetpack or dangling)
    if (this.state !== 'dangling' && !this.jetpackActive) {
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

    // Render Chibi Character with Facing & Tilt
    this.ctx.save();
    
    // Determine active rotation: jetpack banking angle OR docked inertia lag
    const activeTilt = this.jetpackActive ? (this.tiltAngle * this.facing) : this.dockedLagAngle;
    if (activeTilt !== 0) {
      const cx = this.x + (24 * this.pixelSize) / 2;
      const cy = this.y + (26 * this.pixelSize) / 2;
      this.ctx.translate(cx, cy);
      this.ctx.rotate(activeTilt);
      this.ctx.translate(-cx, -cy);
    }

    if (this.facing === -1) {
      this.ctx.translate(this.canvas.width, 0);
      this.ctx.scale(-1, 1);
    }
    this.renderSprite(sprite, this.x, renderY);
    this.ctx.restore();

    // Render Falling Snack Carrot if active
    if (this.fallingCarrot && this.fallingCarrot.active) {
      this.renderCarrot(this.fallingCarrot.x, this.fallingCarrot.y);
    }

    // Render Particles
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      
      if (p.type === 'flame' || p.type === 'smoke' || p.type === 'dust' || p.type === 'crumb') {
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      } else {
        this.ctx.fillStyle = p.color || '#ffffff';
        this.ctx.shadowColor = this.themeColor;
        this.ctx.shadowBlur = 6;
        this.ctx.font = `bold ${Math.round(p.size)}px monospace`;
        this.ctx.fillText(p.char, p.x, p.y);
      }
      this.ctx.restore();
    });
  }

  renderCarrot(cx, cy) {
    const ps = this.pixelSize;
    this.ctx.save();
    // Green leaves
    this.ctx.fillStyle = '#16a34a';
    this.ctx.fillRect(cx + 2 * ps, cy, 3 * ps, 2 * ps);
    // Orange body
    this.ctx.fillStyle = '#ea580c';
    this.ctx.fillRect(cx + 1 * ps, cy + 2 * ps, 5 * ps, 3 * ps);
    this.ctx.fillRect(cx + 2 * ps, cy + 5 * ps, 3 * ps, 3 * ps);
    this.ctx.fillRect(cx + 3 * ps, cy + 8 * ps, 1 * ps, 2 * ps);
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
      'G': '#94a3b8', // Game Boy casing
      'P': '#84cc16', // Game Boy screen
      'R': '#ef4444', // Red button
      'C': '#ea580c', // Carrot orange
      'L': '#16a34a', // Carrot leaf green
      'E': '#ffea00', // Exclamation yellow
    };

    const isTrackingEyes = (this.state === 'idle' || this.state === 'dancing' || this.state === 'lounging');

    const rows = spriteStr.trim().split('\n');
    rows.forEach((row, ry) => {
      const chars = row.trim();
      for (let rx = 0; rx < chars.length; rx++) {
        const c = chars[rx];
        const color = colorMap[c];
        if (color) {
          this.ctx.fillStyle = color;
          
          let drawX = x + rx * this.pixelSize;
          let drawY = y + ry * this.pixelSize;

          // Reactive Eye Gaze Shift
          if (c === '4' && isTrackingEyes) {
            drawX += this.eyeOffsetX * this.pixelSize;
            drawY += this.eyeOffsetY * this.pixelSize;
          }

          this.ctx.fillRect(
            Math.round(drawX),
            Math.round(drawY),
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
