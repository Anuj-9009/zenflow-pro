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
