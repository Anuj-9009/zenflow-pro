# ZenFlow

**Premium Audio Visualizer with Spotify/Apple Music Integration**

A beautiful desktop app featuring an Aurora Borealis visualizer, glassmorphic UI, and hand gesture controls.

![ZenFlow](https://i.imgur.com/placeholder.png)

## Features

- 🌌 **Aurora Visualizer** - Shader-based fluid animation reactive to audio
- 🎵 **Spotify/Apple Music** - Real-time track info, album art, and controls
- 🎚️ **Seek Control** - Click or drag progress bar to seek
- ✋ **Hand Gestures** - MediaPipe powered gesture control
- 🎨 **Dynamic Colors** - UI recolors based on current track
- 💎 **Glassmorphic Design** - Premium frosted glass UI

## Hand Gestures

| Gesture | Action |
|---------|--------|
| ✋ Open Palm | Pause |
| ✊ Closed Fist | Play |
| 👋 Swipe Left/Right | Prev/Next |
| ☝️ Hand Up | Volume Up |
| 👇 Hand Down | Volume Down |

## Quick Start

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build
```

## Tech Stack

- **Frontend**: React, Three.js (React Three Fiber), Zustand
- **Desktop**: Electron
- **Shaders**: GLSL (Simplex Noise, FBM)
- **Gestures**: MediaPipe Hands
- **Build**: Vite, TypeScript

## Requirements

- Node.js 18+
- macOS (for Spotify/Apple Music integration via AppleScript)
- Spotify or Apple Music running

## License

MIT
