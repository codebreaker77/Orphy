class BunnyPet {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pixelSize = 3;
    
    // Position inside the canvas
    this.x = 35;
    this.y = 36;
    
    // States: 'idle', 'dancing', 'lounging', 'sleeping', 'wake_up', 'munching', 'happy', 'dangling', 'pocket_jetpack', 'jetpack'
    this.state = 'idle';
    this.genreVibe = 'standard'; // 'standard', 'rock', 'chill', 'groove', 'energetic'
    this.frame = 0;
    this.frameTimer = 0;
    this.facing = 1; // 1 = right, -1 = left
    this.tiltAngle = 0; // Flight banking angle
    this.dockedLagAngle = 0;
    this.targetLagAngle = 0;
    
    this.themeColor = '#e64c65';
    this.hasExtractedTheme = false;
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
    // 24w x 28h High-Definition Chibi Character
    // Palette:
    // . = trans, 1 = outline (#111422), 2 = fur cream (#fbf7f0), W = white highlight (#ffffff), S = fur shadow (#ded6cb)
    // 3 = ear pink (#ff7997), P = ear shadow (#d94c70), 4 = eye black (#0f111a), 5 = blush (#ff96af), N = nose (#ff7096)
    // 6 = hoodie navy (#1e2436), D = hoodie shadow (#131724), L = hoodie seam/pocket (#2e3852), 7 = theme accent (dynamic)
    // 8 = mouth cavity (#d9385d), T = tongue (#ff85a1), 9 = white paws/sneakers (#ffffff), H = ear cushion (#2b3449)
    // Z = headband steel (#475569), K = sole tread (#0a0d16), J = jetpack steel (#64748b), V = visor (#38bdf8)
    // G = Gameboy (#94a3b8), Q = Gameboy screen (#84cc16), R = red button (#ef4444)
    // C = carrot (#ea580c), O = carrot highlight (#fb923c), Y = carrot leaves (#16a34a), E = star/lightning yellow (#facc15)

    // IDLE Frame 0 (Standing, breathing)
    const IDLE_0 = [
      ".......111......111.....",
      "......12W11....11W21....",
      "......123W1....1W321....",
      "......123W1....1W321....",
      ".....1123P1....1P3211...",
      ".....1S23P1....1P32S1...",
      "....11ZZZZZZZZZZZZZZ11..",
      "...11Z2WWWWWWWWWW2Z11...",
      "..1HH12WWWWWWWWWW21HH1..",
      ".1H77H122222222221H77H1.",
      ".1H77H244222222442H77H1.",
      "..1HH129422NN229421HH1..",
      "...112522222222225211...",
      "....122222888822221.....",
      "....112222T88T222211....",
      ".....111SSSSSSSS111.....",
      "....1166611111166611....",
      "...166LL66666666LL661...",
      "..166L666666666666L661..",
      ".19916666LLLL6666661991.",
      ".1991666L6666L666661991.",
      "..111666LLLLLL66666111..",
      "...1DD666666666666DD1...",
      "....1DDDDDDDDDDDDDD1....",
      "....1666611..1166661....",
      "...166661991199166661...",
      "...199991KK11KK199991...",
      "...111111......111111..."
    ].join('\n');

    // IDLE Frame 1 (Blink)
    const IDLE_1 = [
      "........................",
      ".......111......111.....",
      "......12W11....11W21....",
      "......123W1....1W321....",
      "......123W1....1W321....",
      ".....1123P1....1P3211...",
      ".....1S23P1....1P32S1...",
      "....11ZZZZZZZZZZZZZZ11..",
      "...11Z2WWWWWWWWWW2Z11...",
      "..1HH12WWWWWWWWWW21HH1..",
      ".1H77H122222222221H77H1.",
      ".1H77H21122NN22112H77H1.",
      "..1HH12522222222521HH1..",
      "...11222228888222211....",
      "....112222T88T222211....",
      ".....111SSSSSSSS111.....",
      "....1166611111166611....",
      "...166LL66666666LL661...",
      "..166L666666666666L661..",
      ".19916666LLLL6666661991.",
      ".1991666L6666L666661991.",
      "..111666LLLLLL66666111..",
      "...1DD666666666666DD1...",
      "....1DDDDDDDDDDDDDD1....",
      "....1666611..1166661....",
      "...166661991199166661...",
      "...199991KK11KK199991...",
      "...111111......111111..."
    ].join('\n');

    // 1. DANCING STANDARD (Upbeat Pop Bounce)
    const DANCE_STD_0 = IDLE_0;
    const DANCE_STD_1 = [
      "......111........111....",
      ".....12W11......11W21...",
      ".....123W1......1W321...",
      ".....123W1......1W321...",
      "....1123P1......1P3211..",
      "....1S23P1......1P32S1..",
      "...11ZZZZZZZZZZZZZZ11...",
      "..11Z2WWWWWWWWWW2Z11....",
      ".1HH12WWWWWWWWWW21HH1...",
      "1H77H122222222221H77H1..",
      "1H77H244222222442H77H1..",
      ".1HH129422NN229421HH1...",
      "..112522228822225211....",
      "...122222T88T222221.....",
      "...1122222222222211.....",
      "....111SSSSSSSS111......",
      "..19916661111116661.....",
      "..19916LL666666LL661....",
      "...11166666666666L661991",
      "....16666LLLL6666661991.",
      "....1666L6666L666661111.",
      "....1666LLLLLL666661....",
      ".....1DD666666666DD1....",
      ".....1DDDDDDDDDDDD1.....",
      ".....1666611.116661.....",
      "....166661991.1991......",
      "...199991KK1..1KK1......",
      "...111111......111......"
    ].join('\n');

    const DANCE_STD_2 = IDLE_0;
    const DANCE_STD_3 = [
      "....111........111......",
      "...12W11......11W21.....",
      "...123W1......1W321.....",
      "...123W1......1W321.....",
      "..1123P1......1P3211....",
      "..1S23P1......1P32S1....",
      "...11ZZZZZZZZZZZZZZ11...",
      "....11Z2WWWWWWWWWW2Z11..",
      "...1HH12WWWWWWWWWW21HH1.",
      "..1H77H122222222221H77H1",
      "..1H77H244222222442H77H1",
      "...1HH129422NN229421HH1.",
      "....112522228822225211..",
      ".....122222T88T222221...",
      ".....1122222222222211...",
      "......111SSSSSSSS111....",
      ".....16661111116661991..",
      "....166LL666666LL61991..",
      ".199166L66666666666111..",
      ".1991666666LLLL66661....",
      ".111166666L6666L6661....",
      "....166666LLLLLL6661....",
      "....1DD666666666DD1.....",
      ".....1DDDDDDDDDDDD1.....",
      ".....166611.1166661.....",
      "......1991.199166661....",
      "......1KK1..1KK199991...",
      "......111......111111..."
    ].join('\n');

    // 2. DANCING ROCK (Metal / Headbanging / Devil Horns 🤘)
    const ROCK_0 = [
      ".......111......111.....",
      "......12W11....11W21....",
      "......123W1....1W321....",
      "......123W1....1W321....",
      ".....1123P1....1P3211...",
      ".....1S23P1....1P32S1...",
      "....11ZZZZZZZZZZZZZZ11..",
      "...11Z2WWWWWWWWWW2Z11...",
      "..1HH12WWWWWWWWWW21HH1..",
      ".1H77H122222222221H77H1.",
      ".1H77H244222222442H77H1.",
      "..1HH129422NN229421HH1..",
      "...112522228822225211...",
      "....122222888822221.....",
      "....112222T88T222211....",
      ".....111SSSSSSSS111.....",
      "..19166661111116666191..",
      ".199916LL666666LL619991.",
      ".1919166666666666619191.",
      "..1116666LLLL666666111..",
      "....1666L6666L666661....",
      "....1666LLLLLL666661....",
      "...1DD666666666666DD1...",
      "....1DDDDDDDDDDDDDD1....",
      "....1666611..1166661....",
      "...166661991199166661...",
      "...199991KK11KK199991...",
      "...111111......111111..."
    ].join('\n');

    // Head bang DOWN hard!
    const ROCK_1 = [
      "........................",
      "........................",
      ".......111......111.....",
      "......12W11....11W21....",
      ".....1123P1....1P3211...",
      "....11ZZZZZZZZZZZZZZ11..",
      "...11Z2WWWWWWWWWW2Z11...",
      "..1HH12WWWWWWWWWW21HH1..",
      ".1H77H122222222221H77H1.",
      ".1H77H21122NN22112H77H1.",
      "..1HH12522888822521HH1..",
      "...11222228888222211....",
      "....111SSSSSSSS1111.....",
      "..19116661111116661191..",
      ".199916LL666666LL619991.",
      ".1919166666666666619191.",
      "..1116666LLLL666666111..",
      "....1666L6666L666661....",
      "....1666LLLLLL666661....",
      "...1DD666666666666DD1...",
      "....1DDDDDDDDDDDDDD1....",
      "....1666611..1166661....",
      "...166661991199166661...",
      "...199991KK11KK199991...",
      "...111111......111111...",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    // 3. DANCING CHILL (Gentle Sway / Coffee Vibe / Lofi)
    const CHILL_0 = [
      ".......111......111.....",
      "......12W11....11W21....",
      "......123W1....1W321....",
      "......123W1....1W321....",
      ".....1123P1....1P3211...",
      ".....1S23P1....1P32S1...",
      "....11ZZZZZZZZZZZZZZ11..",
      "...11Z2WWWWWWWWWW2Z11...",
      "..1HH12WWWWWWWWWW21HH1..",
      ".1H77H122222222221H77H1.",
      ".1H77H211222222112H77H1.",
      "..1HH125522NN225521HH1..",
      "...112222228822222211...",
      "....1222228WW822221.....",
      "....1122222222222211....",
      ".....111SSSSSSSS111.....",
      "....1166611111166611....",
      "...166LL66666666LL661...",
      "..166L666666666666L661..",
      ".19916666LLLL6666661991.",
      ".1991666L6666L666661991.",
      "..111666LLLLLL66666111..",
      "...1DD666666666666DD1...",
      "....1DDDDDDDDDDDDDD1....",
      "....1666611..1166661....",
      "...166661991199166661...",
      "...199991KK11KK199991...",
      "...111111......111111..."
    ].join('\n');

    const CHILL_1 = [
      "........111......111....",
      ".......12W11....11W21...",
      ".......123W1....1W321...",
      ".......123W1....1W321...",
      "......1123P1....1P3211..",
      "......1S23P1....1P32S1..",
      ".....11ZZZZZZZZZZZZZZ11.",
      "....11Z2WWWWWWWWWW2Z11..",
      "...1HH12WWWWWWWWWW21HH1.",
      "..1H77H122222222221H77H1",
      "..1H77H211222222112H77H1",
      "...1HH125522NN225521HH1.",
      "....112222228822222211..",
      ".....1222228WW822221....",
      ".....1122222222222211...",
      "......111SSSSSSSS111....",
      ".....1166611111166611...",
      "....166LL66666666LL661..",
      "...166L666666666666L661.",
      "..19916666LLLL6666661991",
      "..1991666L6666L666661991",
      "...111666LLLLLL66666111.",
      "....1DD666666666666DD1..",
      ".....1DDDDDDDDDDDDDD1...",
      ".....1666611..1166661...",
      "....166661991199166661..",
      "....199991KK11KK199991..",
      "....111111......111111.."
    ].join('\n');

    // 4. DANCING GROOVE (Hip-Hop Swagger / Bop)
    const GROOVE_0 = [
      ".......111......111.....",
      "......12W11....11W21....",
      "......123W1....1W321....",
      "......123W1....1W321....",
      ".....1123P1....1P3211...",
      ".....1S23P1....1P32S1...",
      "....11ZZZZZZZZZZZZZZ11..",
      "...11Z2WWWWWWWWWW2Z11...",
      "..1HH12WWWWWWWWWW21HH1..",
      ".1H77H122222222221H77H1.",
      ".1H77H244222222442H77H1.",
      "..1HH129422NN229421HH1..",
      "...112522222222885211...",
      "....12222288888T2221....",
      "....1122222222222211....",
      ".....111SSSSSSSS111.....",
      "....1166611111166611....",
      "...166LL66666666LL661...",
      "..166L666666666666L661..",
      "..16616666LLLL66661661..",
      "..1661666L9999L6661661..",
      "..1111666L9999L6661111..",
      "...1DD666LLLLLL666DD1...",
      "....1DDDDDDDDDDDDDD1....",
      "....1666611..1166661....",
      "...166661991199166661...",
      "...199991KK11KK199991...",
      "...111111......111111..."
    ].join('\n');

    // 5. LOUNGING (Mini Retro Game Boy)
    const LOUNGE_0 = [
      "........................",
      ".......111......111.....",
      "......12W11....11W21....",
      "......123W1....1W321....",
      ".....1123P1....1P3211...",
      ".....1S23P1....1P32S1...",
      "....11ZZZZZZZZZZZZZZ11..",
      "...11Z2WWWWWWWWWW2Z11...",
      "..1HH12WWWWWWWWWW21HH1..",
      ".1H77H122222222221H77H1.",
      ".1H77H244222222442H77H1.",
      "..1HH129422NN229421HH1..",
      "...112522228822225211...",
      "....122222T88T22221.....",
      ".....111SSSSSSSS111.....",
      "....1166611111166611....",
      "...166661GGGGGG166661...",
      "...16661GQQQQQQG16661...",
      "..199161GQQQQQQG161991..",
      "..199161G111111G161991..",
      "...11116GR11111G161111..",
      "....1666GGGGGG66661.....",
      "...1DD666666666666DD1...",
      "....1DDDDDDDDDDDDDD1....",
      "...1999911661199991.....",
      "...19999199119919991....",
      "...1KKKK1KK11KK1KKK1....",
      "...111111......111111..."
    ].join('\n');

    // 6. SLEEPING (Curled up, eyes closed, z Z Z)
    const SLEEP_0 = [
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      ".......111......111.....",
      "......12W11....11W21....",
      "......123W1....1W321....",
      ".....1123P1....1P3211...",
      "....11ZZZZZZZZZZZZZZ11..",
      "...11Z2WWWWWWWWWW2Z11...",
      "..1HH12WWWWWWWWWW21HH1..",
      ".1H77H122222222221H77H1.",
      ".1H77H21122NN22112H77H1.",
      "..1HH12552222225521HH1..",
      "...11222228888222211....",
      "....111SSSSSSSS1111.....",
      "...1166611111166611.....",
      "..166LL66666666LL661....",
      ".166L666666666666L661...",
      ".19916666LLLL6666661991.",
      ".1991666L6666L666661991.",
      "..111666LLLLLL66666111..",
      "...1DD666666666666DD1...",
      "....1DDDDDDDDDDDDDD1....",
      "...1999911661199991.....",
      "...1KKKK1KK11KK1KKK1....",
      "...111111......111111..."
    ].join('\n');

    // 7. WAKE UP (Surprised Exclamation !)
    const WAKE_0 = [
      "...........1E1..........",
      "...........1E1..........",
      "...........1E1..........",
      "........................",
      "...........1E1..........",
      ".......111......111.....",
      "......12W11....11W21....",
      "......123W1....1W321....",
      ".....1123P1....1P3211...",
      "....11ZZZZZZZZZZZZZZ11..",
      "...11Z2WWWWWWWWWW2Z11...",
      "..1HH12WWWWWWWWWW21HH1..",
      ".1H77H122222222221H77H1.",
      ".1H77H244222222442H77H1.",
      "..1HH129422NN229421HH1..",
      "...112522228822225211...",
      "....122222888822221.....",
      "....112222T88T222211....",
      ".....111SSSSSSSS111.....",
      "..19116661111116661191..",
      ".199166LL666666LL661991.",
      "..1116666LLLL666666111..",
      "....1666L6666L666661....",
      "...1DD66LLLLLL6666DD1...",
      "....1DDDDDDDDDDDDDD1....",
      "...166661991199166661...",
      "...199991KK11KK199991...",
      "...111111......111111..."
    ].join('\n');

    // 8. MUNCHING (Crunching Carrot)
    const MUNCH_0 = [
      ".......111......111.....",
      "......12W11....11W21....",
      "......123W1....1W321....",
      "......123W1....1W321....",
      ".....1123P1....1P3211...",
      ".....1S23P1....1P32S1...",
      "....11ZZZZZZZZZZZZZZ11..",
      "...11Z2WWWWWWWWWW2Z11...",
      "..1HH12WWWWWWWWWW21HH1..",
      ".1H77H122222222221H77H1.",
      ".1H77H244222222442H77H1.",
      "..1HH129422NN229421HH1..",
      "...112522228822225211...",
      "....122222888822221.....",
      "....112222T88T222211....",
      ".....111SSSSSSSS111.....",
      "....1166611YY1166611....",
      "...166LL66YYYY66LL661...",
      "..166L666COOOOC666L661..",
      ".19916666COOOOC66661991.",
      ".199166666CCCC666661991.",
      "..111666666CC666666111..",
      "...1DD666666666666DD1...",
      "....1DDDDDDDDDDDDDD1....",
      "....1666611..1166661....",
      "...166661991199166661...",
      "...199991KK11KK199991...",
      "...111111......111111..."
    ].join('\n');

    // 9. DANGLING (Mouse Drag)
    const DANGLING = [
      ".......111......111.....",
      "......12W11....11W21....",
      "......123W1....1W321....",
      "......123W1....1W321....",
      ".....1123P1....1P3211...",
      ".....1S23P1....1P32S1...",
      "....11ZZZZZZZZZZZZZZ11..",
      "...11Z2WWWWWWWWWW2Z11...",
      "..1HH12WWWWWWWWWW21HH1..",
      ".1H77H122222222221H77H1.",
      ".1H77H244222222442H77H1.",
      "..1HH129422NN229421HH1..",
      "...112522228822225211...",
      "....122222888822221.....",
      "....112222T88T222211....",
      ".....111SSSSSSSS111.....",
      "..19116661111116661191..",
      ".199166LL666666LL661991.",
      "..1116666LLLL666666111..",
      "....1666L6666L666661....",
      "....1666LLLLLL666661....",
      ".....1DD66666666DD1.....",
      "......1DDDDDDDDDD1......",
      ".......1666116661.......",
      "......16661..16661......",
      ".....19991....19991.....",
      ".....1KKK1....1KKK1.....",
      ".....1111......1111....."
    ].join('\n');

    // 10. JETPACK FLIGHT
    const JETPACK_0 = [
      ".......111......111.....",
      "......12W11....11W21....",
      "......123W1....1W321....",
      ".....1123P1....1P3211...",
      "....11ZZZZZZZZZZZZZZ11..",
      "...11Z2WWWWWWWWWW2Z11...",
      "..1HH12WWWWWWWWWW21HH1..",
      ".1H77H122222222221H77H1.",
      "1J177H1VVVVVVVVVV1H771J1",
      "1JJ1HH2VVVVVVVVVV2HH1JJ1",
      "1JJ11252222NN22225211JJ1",
      ".1K1.12222888822221.1K1.",
      ".1K1.111SSSSSSSS111.1K1.",
      "....1166611111166611....",
      "...166LL66666666LL661...",
      "..166L666666666666L661..",
      ".19916666LLLL6666661991.",
      ".1991666L6666L666661991.",
      "..111666LLLLLL66666111..",
      "...1DD666666666666DD1...",
      "....1DDDDDDDDDDDDDD1....",
      "....1666611..1166661....",
      "...166661991199166661...",
      "...199991KK11KK199991...",
      "...111111......111111...",
      "........................",
      "........................",
      "........................"
    ].join('\n');

    this.sprites = {
      idle: [IDLE_0, IDLE_1],
      dancing_standard: [DANCE_STD_0, DANCE_STD_1, DANCE_STD_2, DANCE_STD_3],
      dancing_rock: [ROCK_0, ROCK_1, ROCK_0, DANCE_STD_1],
      dancing_chill: [CHILL_0, CHILL_1],
      dancing_groove: [GROOVE_0, DANCE_STD_1, GROOVE_0, DANCE_STD_3],
      dancing_energetic: [DANCE_STD_1, DANCE_STD_3, ROCK_0, DANCE_STD_1],
      lounging: [LOUNGE_0],
      sleeping: [SLEEP_0],
      wake_up: [WAKE_0],
      munching: [MUNCH_0, IDLE_0],
      dangling: [DANGLING],
      pocket_jetpack: [IDLE_0],
      jetpack: [JETPACK_0],
      happy: [WAKE_0, DANCE_STD_1]
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

      const headCenterX = this.x + 12 * this.pixelSize;
      const headCenterY = this.y + 11 * this.pixelSize;
      const dx = this.mouseCanvasX - headCenterX;
      const dy = this.mouseCanvasY - headCenterY;

      this.eyeOffsetX = dx > 16 ? 1 : (dx < -16 ? -1 : 0);
      this.eyeOffsetY = dy > 16 ? 1 : (dy < -16 ? -1 : 0);

      // Selective click-through for transparent bounds
      const bx = this.x;
      const by = this.y;
      const bw = 24 * this.pixelSize;
      const bh = 28 * this.pixelSize;
      const isOverBunny = (this.mouseCanvasX >= bx - 6 && this.mouseCanvasX <= bx + bw + 6 &&
                           this.mouseCanvasY >= by - 6 && this.mouseCanvasY <= by + bh + 6);

      if (window.orphy && window.orphy.setBunnyIgnoreMouse) {
        window.orphy.setBunnyIgnoreMouse(!isOverBunny && !this.isDragging);
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouseCanvasX = null;
      this.mouseCanvasY = null;
      this.eyeOffsetX = 0;
      this.eyeOffsetY = 0;
      if (!this.isDragging && window.orphy && window.orphy.setBunnyIgnoreMouse) {
        window.orphy.setBunnyIgnoreMouse(true);
      }
    });

    // Right Click Context Menu
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (window.orphy && window.orphy.openBunnyContextMenu) {
        window.orphy.openBunnyContextMenu();
      }
    });

    this.canvas.addEventListener('mousedown', async (e) => {
      if (e.button !== 0) return;
      if (this.isLocked) return;

      isMouseDown = true;
      initialMouse = { x: e.screenX, y: e.screenY };
      
      if (window.orphy && window.orphy.getBunnyPosition) {
        initialWin = await window.orphy.getBunnyPosition();
      }

      this.isDragging = true;
      this.recallActive = false;
      this.jetpackActive = false;
      this.tiltAngle = 0;
      this.state = 'dangling';
      this.canvas.style.cursor = 'grabbing';
      if (window.orphy && window.orphy.setBunnyIgnoreMouse) {
        window.orphy.setBunnyIgnoreMouse(false);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      if (e.buttons === 0) {
        isMouseDown = false;
        this.endDrag();
        return;
      }

      if (!isMouseDown || this.isLocked) return;
      const dx = e.screenX - initialMouse.x;
      const dy = e.screenY - initialMouse.y;
      
      if (window.orphy && window.orphy.setBunnyPosition) {
        window.orphy.setBunnyPosition(initialWin.x + dx, initialWin.y + dy);
      }
    });

    window.addEventListener('mouseup', () => {
      if (isMouseDown || this.isDragging) {
        isMouseDown = false;
        this.endDrag();
      }
    });

    this.canvas.addEventListener('click', (e) => {
      if (e.button !== 0) return;
      if (!this.isDragging && !this.recallActive) {
        if (this.state === 'sleeping' || this.state === 'lounging') {
          this.triggerWakeUp();
        } else {
          this.triggerHappy();
          this.spawnHeartBurst();
        }
      }
    });
  }

  endDrag() {
    this.isDragging = false;
    this.canvas.style.cursor = 'grab';
    this.triggerHappy();
    this.spawnHeartBurst();
    if (window.orphy && window.orphy.setBunnyIgnoreMouse) {
      window.orphy.setBunnyIgnoreMouse(false);
    }
  }

  setupIPC() {
    if (!window.orphy) return;

    window.orphy.onMediaUpdate((info) => {
      if (this.recallActive || this.isDragging) return;
      
      const wasPlaying = this.isMediaPlaying;
      this.isMediaPlaying = !!(info && info.title && info.isPlaying);

      // Detect Genre / Vibe dynamically
      if (window.GenreDetector) {
        this.genreVibe = window.GenreDetector.detect(info);
      }

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
      if (info && info.thumbnailDataUrl && window.ThemeEngine && (info.songChanged || !this.hasExtractedTheme)) {
        this.hasExtractedTheme = true;
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
      this.startCurvyJetpackFlight(data);
    });

    window.orphy.onFeedCarrot(() => {
      this.feedCarrot();
    });

    window.orphy.onIslandDragLag((data) => {
      if (this.recallActive || this.isDragging) return;
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

    this.state = 'pocket_jetpack';
    this.tiltAngle = 0;
    await this.sleep(300);
    if (!this.recallActive) return;

    this.state = 'jetpack';
    this.jetpackActive = true;
    this.spawnJetpackBurst();
    await this.sleep(180);
    if (!this.recallActive) return;

    const dx = targetPos.x - currentPos.x;
    const dy = targetPos.y - currentPos.y;
    const nx = -dy / totalDist;
    const ny = dx / totalDist;

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

    const pad = 30;
    P1.x = Math.max(bounds.x + pad, Math.min(bounds.x + bounds.width - 150, P1.x));
    P1.y = Math.max(bounds.y + pad, Math.min(bounds.y + bounds.height - 180, P1.y));
    P2.x = Math.max(bounds.x + pad, Math.min(bounds.x + bounds.width - 150, P2.x));
    P2.y = Math.max(bounds.y + pad, Math.min(bounds.y + bounds.height - 180, P2.y));

    const flightDuration = Math.max(2200, Math.min(3600, totalDist * 2.5));
    const flightStart = performance.now();

    await new Promise((resolve) => {
      const flyStep = (now) => {
        if (!this.recallActive || this.isDragging) {
          resolve();
          return;
        }

        const elapsed = now - flightStart;
        const rawT = Math.min(1, elapsed / flightDuration);
        const t = rawT < 0.5 ? 2 * rawT * rawT : -1 + (4 - 2 * rawT) * rawT;

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

    this.tiltAngle = 0;
    this.jetpackActive = false;
    this.state = 'pocket_jetpack';
    this.spawnDustPuff();
    await this.sleep(250);

    this.recallActive = false;
    this.triggerHappy();
    this.spawnHeartBurst();

    if (data.dockOnArrival !== false && window.orphy && window.orphy.bunnyDocked) {
      window.orphy.bunnyDocked();
    }
  }

  feedCarrot() {
    if (this.recallActive || this.isDragging) return;
    this.fallingCarrot = {
      x: this.x + 8 * this.pixelSize,
      y: -15,
      vy: 2.4,
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
  // PARTICLES (Genre-Specific Emotes)
  // ========================================================
  spawnJetpackBurst() {
    for (let i = 0; i < 8; i++) {
      this.spawnJetpackFlames();
    }
  }

  spawnJetpackFlames() {
    const leftNozzleX = this.x + 3 * this.pixelSize;
    const rightNozzleX = this.x + 21 * this.pixelSize;
    const nozzleY = this.y + 18 * this.pixelSize;

    [leftNozzleX, rightNozzleX].forEach(nx => {
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
        y: this.y + 28 * this.pixelSize - 2,
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

  spawnGenreParticle() {
    if (this.genreVibe === 'rock') {
      // Electric sparks & lightning ⚡
      this.particles.push({
        type: 'char',
        x: this.x + 12 * this.pixelSize + (Math.random() * 26 - 13),
        y: this.y + (Math.random() * 10),
        vy: 1.4 + Math.random() * 1.2,
        alpha: 1,
        lifetime: 900,
        char: '⚡',
        phase: Math.random() * Math.PI * 2,
        size: 15,
        color: '#facc15'
      });
    } else if (this.genreVibe === 'chill') {
      // Soft sparkle stars ✨
      this.particles.push({
        type: 'char',
        x: this.x + 12 * this.pixelSize + (Math.random() * 24 - 12),
        y: this.y + 4,
        vy: 0.5 + Math.random() * 0.4,
        alpha: 0.9,
        lifetime: 2200,
        char: Math.random() > 0.5 ? '✨' : '☕',
        phase: Math.random() * Math.PI * 2,
        size: 13,
        color: '#fef08a'
      });
    } else if (this.genreVibe === 'energetic') {
      // Rave stars ★
      const stars = ['★', '✦', '♬'];
      this.particles.push({
        type: 'char',
        x: this.x + 12 * this.pixelSize + (Math.random() * 28 - 14),
        y: this.y + 2,
        vy: 1.1 + Math.random() * 0.8,
        alpha: 1,
        lifetime: 1500,
        char: stars[Math.floor(Math.random() * stars.length)],
        phase: Math.random() * Math.PI * 2,
        size: 14,
        color: this.themeColor
      });
    } else {
      // Standard / Groove notes
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

  getCurrentSpriteFrames() {
    if (this.state === 'dancing') {
      if (this.genreVibe === 'rock') return this.sprites.dancing_rock;
      if (this.genreVibe === 'chill') return this.sprites.dancing_chill;
      if (this.genreVibe === 'groove') return this.sprites.dancing_groove;
      if (this.genreVibe === 'energetic') return this.sprites.dancing_energetic;
      return this.sprites.dancing_standard;
    }
    return this.sprites[this.state] || this.sprites.idle;
  }

  update(dt) {
    this.frameTimer += dt;
    
    // Genre-dependent frame pace!
    let duration = 400;
    if (this.state === 'jetpack') {
      duration = 120;
    } else if (this.state === 'dancing') {
      if (this.genreVibe === 'rock') duration = 150;
      else if (this.genreVibe === 'chill') duration = 420; // slow sway
      else if (this.genreVibe === 'energetic') duration = 140; // fast rave
      else duration = 190;
    } else if (this.state === 'sleeping') {
      duration = 1100;
    }
    
    if (this.frameTimer >= duration) {
      this.frameTimer = 0;
      const frames = this.getCurrentSpriteFrames();
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

    this.bouncePhase += dt * (this.genreVibe === 'rock' ? 0.012 : (this.genreVibe === 'chill' ? 0.003 : 0.006));

    // Musical emission when dancing
    if (this.state === 'dancing') {
      this.particleTimer += dt;
      const spawnInterval = this.genreVibe === 'rock' ? 300 : (this.genreVibe === 'chill' ? 650 : 420);
      if (this.particleTimer >= spawnInterval && this.particles.length < 8) {
        this.particleTimer = 0;
        this.spawnGenreParticle();
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
        if (p.type === 'crumb') p.vy += 0.1;
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

    const frames = this.getCurrentSpriteFrames();
    const sprite = frames[this.frame % frames.length];

    let renderY = this.y;
    let hopOffset = 0;

    if (this.state === 'idle') {
      renderY += Math.sin(this.bouncePhase) * 2;
    } else if (this.state === 'dancing') {
      if (this.genreVibe === 'rock' && (this.frame === 1 || this.frame === 3)) {
        hopOffset = 4; // Headbang dip down!
      } else if (this.genreVibe === 'chill') {
        renderY += Math.sin(this.bouncePhase) * 2; // Soft sway
      } else if (this.frame === 1 || this.frame === 3) {
        hopOffset = -7;
      }
    } else if (this.state === 'happy') {
      hopOffset = -10;
    } else if (this.state === 'wake_up') {
      hopOffset = -8;
    }
    renderY += hopOffset;

    // Shadow (only on ground)
    if (this.state !== 'dangling' && !this.jetpackActive) {
      const shadowScale = 1 - Math.abs(hopOffset) / 35;
      this.ctx.save();
      this.ctx.globalAlpha = 0.28 * shadowScale;
      this.ctx.fillStyle = '#06080e';
      this.ctx.beginPath();
      const shadowCx = this.x + (24 * this.pixelSize) / 2;
      const shadowCy = this.y + 28 * this.pixelSize - 2;
      this.ctx.ellipse(shadowCx, shadowCy, 26 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // Render Chibi Character
    this.ctx.save();
    const activeTilt = this.jetpackActive ? (this.tiltAngle * this.facing) : this.dockedLagAngle;
    if (activeTilt !== 0) {
      const cx = this.x + (24 * this.pixelSize) / 2;
      const cy = this.y + (28 * this.pixelSize) / 2;
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
    // Leaves
    this.ctx.fillStyle = '#16a34a';
    this.ctx.fillRect(cx + 2 * ps, cy, 3 * ps, 2 * ps);
    // Body
    this.ctx.fillStyle = '#ea580c';
    this.ctx.fillRect(cx + 1 * ps, cy + 2 * ps, 5 * ps, 3 * ps);
    this.ctx.fillRect(cx + 2 * ps, cy + 5 * ps, 3 * ps, 3 * ps);
    this.ctx.fillRect(cx + 3 * ps, cy + 8 * ps, 1 * ps, 2 * ps);
    this.ctx.restore();
  }

  renderSprite(spriteStr, x, y) {
    const colorMap = {
      '.': null,              // Transparent
      '1': '#111422',         // Outline
      '2': '#fbf7f0',         // Fur cream
      'W': '#ffffff',         // Fur white highlight
      'S': '#ded6cb',         // Fur soft shadow
      '3': '#ff7997',         // Inner ear pink
      'P': '#d94c70',         // Inner ear deep pink shadow
      '4': '#0f111a',         // Pupil black
      '5': '#ff96af',         // Cheek blush
      'N': '#ff7096',         // Nose
      '6': '#1e2436',         // Hoodie navy
      'D': '#131724',         // Hoodie deep shadow
      'L': '#2e3852',         // Hoodie highlight / pocket seams
      '7': this.themeColor,   // Dynamic glowing headphone ring
      '8': '#d9385d',         // Mouth cavity
      'T': '#ff85a1',         // Tongue
      '9': '#ffffff',         // Specular highlight / White paws / Sneaker rubber
      'H': '#2b3449',         // Headphone cushion
      'Z': '#475569',         // Headband steel
      'K': '#0a0d16',         // Sneaker sole
      'J': '#64748b',         // Jetpack steel
      'V': '#38bdf8',         // Goggles visor
      'G': '#94a3b8',         // Game Boy shell
      'Q': '#84cc16',         // Game Boy screen
      'R': '#ef4444',         // Red button
      'C': '#ea580c',         // Carrot body
      'O': '#fb923c',         // Carrot highlight
      'Y': '#16a34a',         // Carrot leaves
      'E': '#facc15',         // Star / spark yellow
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

          // Reactive eye pupil shift
          if ((c === '4' || c === '9') && ry >= 9 && ry <= 12 && isTrackingEyes) {
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
