# 🐰 Orphy — Pixel Music Widget

A beautifully styled, floating pixel art music widget desktop app featuring a dancing bunny to keep you company while listening to music!

## Features

- **Global Media Integration**: Interacts seamlessly with your desktop's current media player.
- **Cross-Platform Support**: Works on both Windows and Linux out-of-the-box.
- **Always-on-Top & Transparent**: The widget floats on your screen seamlessly, taking minimal space.
- **Interactive Controls**: Play, pause, or skip tracks with simple commands.

## Getting Started

To run the widget locally:

```bash
git clone https://github.com/yourusername/orphy.git
cd orphy
npm install
npm start
```

## How it Works

Orphy interfaces with your operating system's native media control components to extract playing song metadata and track status:

- **Windows**: Communicates directly with the GlobalSystemMediaTransportControlsSessionManager (GSMTC) API using PowerShell to fetch real-time session information (Title, Album, Playback, and Album Art).
- **Linux**: Interacts with the MPRIS2 specification via `playerctl` for similar real-time media metadata and control capabilities.

## Tech Stack

| Component | Technology |
|---|---|
| **App Framework** | Electron, Node.js |
| **Windows API** | Windows Runtime (WinRT) / GSMTC via PowerShell |
| **Linux API** | `playerctl` (MPRIS D-Bus interface) |

## License

MIT License. See `LICENSE` for details.
