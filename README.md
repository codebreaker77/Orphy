# Orphy: Desktop Music Widget and Companion Pet

Orphy is a lightweight desktop music controller and animated companion pet built with Electron. It features a retro-themed dynamic music deck paired with an interactive pixel companion that moves across the desktop, responds to music playback and tempo, and tracks active media across supported media players.

---

## Overview

Orphy operates using a multi-window architecture designed for low overhead and smooth desktop integration:

1. **Music Deck (Dynamic Island)**: A frameless, transparent interface showing track title, artist, playback controls, an interactive scrub bar, and a real-time spectrum visualizer.
2. **Companion Mascot (Bunny)**: An independent, hardware-accelerated mascot window that dances in sync with detected music tempo, rests when playback pauses, and navigates across the screen using curved flight paths.

---

## Core Features

### Audio Playback and Visualizer
* **16-Band Spectrum Visualizer**: Dynamic frequency bars simulate acoustic movement with peak-hold physics at 60 frames per second without layout reflows.
* **Interactive Timeline**: Click or drag along the progress bar to seek track position directly through system media controls.
* **Volume Control**: Scroll the mouse wheel over the music deck to adjust volume levels with transient feedback indicators.
* **Pixel Art Quantization**: Downsamples high-resolution album artwork into crisp 32x32 retro tiles, extracting dominant colors to dynamically theme the deck and mascot accents.
* **Compact and Expanded Modes**: Toggle between a full-featured retro hi-fi layout and a space-saving collapsed capsule pill.

### Companion Mascot
* **Harmonic Dance Synchronization**: The mascot analyzes track tempo and beat intensity, executing smooth parabolic dance cycles mapped to low-frequency energy.
* **Adaptive Emotes by Genre**: Recognizes track metadata and shifts dance animations across styles including rock, chill, groove, energetic, and standard pop.
* **Curved Jetpack Flight**: When summoned or recalled, the mascot deploys thrusters and travels along a cubic Bezier path with dynamic banking tilt.
* **Cursor Tracking**: Mascot pupils shift to follow mouse cursor movement across the monitor.
* **State Machine for Inactive Playback**:
  * 0 to 12 seconds: Idle breathing, ear twitches, and blinking.
  * 12 to 30 seconds: Lounging pose with an animated handheld console.
  * Over 30 seconds: Sleeping pose with drifting sleep indicators.
  * Resumption: Startle animation on track playback before transitioning into dance routines.
* **Interactive Feeding**: Dispatch carrot treats from the deck or context menu to trigger eating animations and heart particles.
* **Adaptive Screen Docking**: Automatically docks beside the music deck. If placed close to the right edge of a display, the mascot adjusts position to the left side to prevent clipping.

### Media Provider Integration
* **Windows (GSMTC)**: Queries the Windows.Media.Control WinRT runtime API via a background daemon, extracting session state, timeline, and album art thumbnails.
* **Linux (MPRIS2)**: Communicates via D-Bus and playerctl for track metadata and transport controls.
* Compatible with Spotify, YouTube Music, Apple Music, web browsers (Chrome, Edge, Firefox), and local media players.

---

## System Requirements

* **Operating System**: Windows 10/11 (64-bit) or Linux with MPRIS2 support
* **Node.js**: Version 18.0.0 or higher
* **Package Manager**: npm 9.0.0 or higher

---

## Installation and Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/codebreaker77/Orphy.git
   cd Orphy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

---

## User Controls and Shortcuts

| Action | Input | Scope |
| :--- | :--- | :--- |
| Move Music Deck / Mascot | Left click and drag (when unlocked) | Per Window |
| Summon Mascot to Cursor | Ctrl + Shift + B | Global Shortcut |
| Recall Mascot to Deck | Click Return icon on deck, or via tray menu | Global |
| Feed Snack | Click Carrot icon on deck, or via context menu | Global |
| Play / Pause | Click Play/Pause toggle button | Music Deck |
| Previous / Next Track | Click Previous or Next buttons | Music Deck |
| Seek Playback Position | Left click on timeline bar | Music Deck |
| Adjust Volume | Mouse wheel scroll over deck | Music Deck |
| Toggle Compact Pill View | Click Collapse button or double-click deck | Music Deck |
| Wake Mascot / Pet Mascot | Left click mascot canvas | Mascot |
| Lock / Unlock Coordinates | Right click context menu -> Lock Position | Global |
| Context Menu | Right click on deck or mascot | Per Window |

---

## System Architecture

```
+-------------------------------------------------------------------+
|                        Electron Main Process                       |
|                          (main.js)                                |
+-------------------------------------------------------------------+
        |                                           |
        | IPC (eq-energy, hover, recall, lock)      | Windows Media API
        v                                           v
+-------------------------------+   +-------------------------------+
|     Music Deck Window         |   |    Windows Media Provider     |
|    (src/island.html)          |   |  (WinRT GSMTC Daemon / PS)    |
| - Audio spectrum engine       |   +-------------------------------+
| - Album art color extractor   |
| - Transport controls          |
+-------------------------------+
        |
        | Coordinates & State
        v
+-------------------------------+
|    Companion Mascot Window    |
|    (src/bunny.html)           |
| - Chibi pixel sprite system   |
| - 60FPS physics loop          |
| - Cubic Bezier flight engine  |
+-------------------------------+
```

### Process Isolation and Performance
* Frameless, transparent browser windows use hardware acceleration with GPU sandboxing configurations suited for Windows Desktop Window Manager (DWM).
* The media monitoring subsystem uses a persistent background reader rather than polling ad-hoc processes, keeping CPU and memory overhead low during continuous playback.
* Canvas rendering utilizes single-pass pixel manipulation with cached offscreen buffers for quantization.

---

## Configuration

Application configuration is stored in the local application data directory (config.json):

* `islandX`, `islandY`: Screen coordinates of the primary deck.
* `bunnyX`, `bunnyY`: Screen coordinates of the mascot when detached.
* `isDocked`: Boolean flag determining whether the mascot moves in tandem with the deck.
* `isLocked`: Prevents dragging windows when set to true.
* `alwaysOnTop`: Retains window priority above standard desktop applications.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for complete terms.
