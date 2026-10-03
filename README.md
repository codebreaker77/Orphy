# 🐰 Orphy — Pixel Music Widget & Desktop Companion

A floating retro pixel-art music widget paired with an adorable, animated pixel bunny companion that lives on your desktop, dances to your music, and follows you everywhere.

![Orphy Preview](https://raw.githubusercontent.com/codebreaker77/Orphy/main/preview.png)

## ✨ Features

### 🎵 Stepped Pixel Island Player
- **Authentic 8-Bit Pixel Shell**: Stepped polygon pixel border, retro disc play/pause control, and pixel progress bar with time stamps.
- **5-Band Pixel Spectrum Analyzer**: Live dynamic frequency visualizer with simulated audio physics and falling peak-hold dots.
- **Click-to-Seek & Volume Wheel**: Click anywhere along the progress bar to seek playback. Scroll mouse wheel over the Island for snappy volume control toasts.
- **Track Change Toast**: Retro marquee banner notifies you whenever a new song begins playing.
- **Retro Pixel Downsampler**: Transforms high-res album covers into crisp 36×36 retro pixel-art cover tiles with dynamic theme color adaptation.

### 🐰 Free-Roaming Desktop Companion
- **Dual-Window Freedom**: Bunny is an independent hardware-accelerated companion! Drag it **anywhere** across all your monitors — sit it on your taskbar, atop windows, or anywhere on your desktop.
- **🚀 Smooth Bézier Jetpack Flight**: When recalled or summoned, the bunny dons blue flight goggles, equips twin steel thrusters, and swoops across the desktop in a randomized Cubic Bézier curve with dynamic banking tilt and smoke particles.
- **🎯 Summon to Cursor (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd>)**: Press the global shortcut anytime from any app, and the bunny will immediately fly to hover beside your mouse cursor!
- **🥕 Snack Time (Feed Carrot)**: Right-click or select "Feed Carrot" to drop a crunchy pixel carrot. The bunny catches it with both paws, crunches it with scattering crumbs, and erupts into a double heart burst (`♡ ♡ ♡`)!
- **👀 Reactive Cursor Eye Tracking**: In idle, lounging, and dancing states, the bunny's pupils organically track your mouse cursor across the screen.
- **💤 Music Pause Life Cycle**:
  - `0 – 12s (Idle)`: Gentle breathing, ear twitches, and blinking.
  - `12 – 30s (Lounging)`: Sits down and plays on a mini retro handheld Game Boy console, tapping its thumbs.
  - `> 30s (Sleeping)`: Curls up peacefully, eyes closed, with animated `z Z Z` bubbles drifting into the air.
  - `Wake-Up Exclamation (!)`: When you hit play, the bunny startles awake with wide eyes and an exclamation mark before jumping into dance mode!
- **⚡ Docked Drag Lag Physics**: Dragging the player island causes the docked bunny to lean and lag into the movement with spring recovery.
- **🔒 Position Lock & Persistence**: Lock positions to prevent accidental clicks, and restart anytime with saved window positions across reboots.

### 🖥️ Global Media Integration
- Seamlessly detects music from **Spotify, YouTube, SoundCloud, Apple Music, and browser players** on **Windows** (GSMTC WinRT) & **Linux** (MPRIS2) without requiring any logins or API tokens.

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/codebreaker77/Orphy.git
cd Orphy

# Install dependencies
npm install

# Run the widget
npm start
```

---

## 🎮 Controls & Shortcuts

| Action | Control |
|---|---|
| **Drag Island / Bunny** | Click & drag window (when unlocked) |
| **Summon Bunny to Cursor** | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd> (Global) |
| **Recall Bunny to Island** | Click 🐰 icon on Island or right-click tray |
| **Feed Carrot 🥕** | Right-click Island / Bunny → "Feed Carrot 🥕" |
| **Seek Song Position** | Click anywhere on the progress bar |
| **Adjust Volume** | Mouse scroll wheel over the Island |
| **Right-Click Menus** | Context menu on Island or Bunny (Lock, Always on Top, etc.) |
| **Wake Up / Pet Bunny** | Click on the bunny |

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **App Framework** | Electron 33, Node.js |
| **Rendering** | Dual-Window Canvas 2D, Pixel CSS, Stepped Polygon Pathing |
| **Windows Media API** | WinRT GSMTC via PowerShell reflection stream extraction |
| **Linux Media API** | `playerctl` (MPRIS2 D-Bus) |

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
