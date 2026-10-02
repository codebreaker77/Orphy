# 🐰 Orphy — Pixel Music Widget & Desktop Companion

A floating retro pixel-art music widget paired with an adorable, animated pixel bunny companion that lives on your desktop, dances to your music, and follows you everywhere.

![Orphy Preview](https://raw.githubusercontent.com/codebreaker77/Orphy/main/preview.png)

## ✨ Features

- 🎵 **Stepped Pixel Island Player**: Authentic 8-bit stepped pixel border, retro disc play/pause control, 3-bar animated pixel equalizer, and pixel progress bar with time stamps.
- 🎨 **Retro Pixel Downsampler**: Transforms high-res album covers into crisp 40×40 retro pixel-art cover tiles with dynamic theme color adaptation.
- 🐰 **Free-Roaming Desktop Pet**: The bunny is an independent floating companion! Drag it **anywhere** across all your monitors — sit it on your taskbar, on top of windows, or on your desktop.
- 🪈 **Whistle / Recall Button**: Click the bunny button on the player island to call your bunny back! It calculates an organic desktop path:
  - Hops horizontally across your screen
  - Scrambles and climbs up the screen edge with custom climbing paws animation
  - Leaps through the air to land right beside the island with a happy flip!
- 🎭 **Expressive Animations & Physics**:
  - **Dancing (Music Playing)**: 4-frame rhythm bounce, kicking feet, head bopping, and floating musical notes (`♪`, `♫`, `♩`).
  - **Dangling (While Dragged)**: Funny surprised face `( O _ O )`, kicking feet, and dangling arms as you carry it around.
  - **Poking / Interaction**: Click the bunny to make it giggle, spin, and release heart bursts (`♡`).
  - **Idle / Sleeping**: Natural eye blinking, soft breathing, and sleepy slouch when music is paused.
- 🖥️ **Global Media Integration**: Seamlessly detects music from Spotify, YouTube, SoundCloud, or browser players on Windows (GSMTC) & Linux (MPRIS2) without requiring any logins or API tokens.

## 🚀 Getting Started

```bash
git clone https://github.com/codebreaker77/Orphy.git
cd Orphy
npm install
npm start
```

## 🎮 Controls

- **Drag the Music Island**: Drag the dark card area to reposition the player on your screen.
- **Drag the Bunny**: Click and hold the bunny to pick it up and place it anywhere on your desktop.
- **Call Bunny Back**: Click the 🐰 icon on the island header to trigger the return sequence.
- **Poke the Bunny**: Click the bunny once to pet it and see it react!

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **App Framework** | Electron, Node.js |
| **Rendering** | HTML5 Canvas, Pixel CSS, Stepped Polygon Pathing |
| **Windows Media API** | WinRT GSMTC via PowerShell reflection |
| **Linux Media API** | `playerctl` (MPRIS2 D-Bus) |

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
