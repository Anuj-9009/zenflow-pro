# ZenFlow Pro 🎛️👋

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

ZenFlow Pro is a next-generation DJ mixing application that allows you to control music filters, EQ, and crossfading entirely through **webcam hand gestures**. 

![Demo GIF](https://via.placeholder.com/800x400.png?text=Insert+Demo+GIF+Here)

## ✨ Features
* **Computer Vision Mixing:** Uses MediaPipe / TensorFlow.js to track hand landmarks in real-time.
* **Gesture Mapping:** Map physical gestures (e.g., pinching, twisting, swiping) to DJ parameters like Low-Pass Filters, Reverb, and Deck Crossfading.
* **Dual Channel Audio Engine:** Professional dual-deck architecture built with Tone.js/Web Audio API.
* **Bold Zen Design System:** A stunning glassmorphic UI with dynamic audio visualizers built with React and Tailwind CSS v4.

## 🏗️ Architecture
1. **The Vision Engine:** Continuously processes webcam frames, extracting XYZ coordinates of hand landmarks at 60fps.
2. **The Audio Graph:** Audio nodes (Gain, BiquadFilter, Convolver) are dynamically patched together.
3. **The State Bridge:** A reactive state manager takes the normalized `[0.0, 1.0]` coordinates from the Vision Engine and maps them directly to the `AudioParam` values in the Audio Graph.

## 🚀 Getting Started

### Prerequisites
* Node.js 18+

### Installation
```bash
git clone https://github.com/Anuj-9009/zenflow-pro.git
cd zenflow-pro
npm install
npm run dev
```

---

<div align="center" style="background: radial-gradient(circle, rgba(56,178,172,0.08) 0%, transparent 80%); padding: 28px; border-radius: 20px;">
  <!-- Gesture Tracking / DJ Controller (CSS SVG) -->
  <svg width="200" height="60" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
    <style>
      .gesture-ring {
        stroke: #38B2AC;
        stroke-width: 1.5;
        stroke-dasharray: 120;
        stroke-dashoffset: 120;
        animation: trackRing 4s infinite ease-in-out alternate;
        transform-origin: 100px 30px;
      }
      .track-dot {
        fill: #007ACC;
        animation: moveDot 4s infinite ease-in-out alternate;
      }
      .wave-line {
        stroke: #38B2AC;
        stroke-width: 1;
        opacity: 0.25;
      }
      @keyframes trackRing {
        0% { stroke-dashoffset: 120; transform: rotate(0deg); }
        100% { stroke-dashoffset: 0; transform: rotate(180deg); filter: drop-shadow(0 0 5px #38B2AC); }
      }
      @keyframes moveDot {
        0% { transform: translate(-30px, -10px); }
        50% { transform: translate(0px, 15px); }
        100% { transform: translate(30px, -10px); filter: drop-shadow(0 0 4px #007ACC); }
      }
    </style>
    <!-- DJ Crossfader Line in background -->
    <line x1="20" y1="30" x2="180" y2="30" class="wave-line" />
    <path d="M 20,30 Q 60,10 100,30 T 180,30" class="wave-line" stroke-dasharray="2 2" />
    
    <!-- Real-time Hand-Tracking Landmark Ring -->
    <circle cx="100" cy="30" r="16" class="gesture-ring" />
    <circle cx="100" cy="30" r="8" class="gesture-ring" style="animation-delay: -2s; stroke: #007ACC;" />
    
    <!-- Moving Hand Cursor / Landmark coordinate -->
    <circle class="track-dot" cx="100" cy="30" r="4.5" />
  </svg>
  
  <p style="font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600; color: #38B2AC; margin: 0; letter-spacing: 0.05em;">
    built by anuj with ❤️ to the hypnotic synth patterns of the 1975's "somebody else"
  </p>
</div>
