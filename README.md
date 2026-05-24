<!-- Header Block -->
<div align="center">
  <br />
  <img src="assets/header-v2.svg" width="100%" alt="banner">
  <p>
    <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="typescript %23007ACC.svg" /> <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="react %2320232a.svg" /> <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="tailwindcss %2338B2AC.svg" />
  </p>
  <p>
    ZenFlow Pro is a next-generation DJ mixing application that allows you to control music filters, EQ, and crossfading entirely through <b>webcam hand gestures<b>.
  </p>
</div>

<hr style="border: 0; height: 1px; background-image: linear-gradient(to right, rgba(56, 178, 172, 0), rgba(56, 178, 172, 0.4), rgba(56, 178, 172, 0));" />

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

<div align="center" style="margin-top: 40px;">
  <img src="assets/footer-v2.svg" width="100%" alt="footer">
</div>
<p style="font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600; color: #38B2AC; margin: 0; text-align: center;">
  built by ANUJ with ❤️ to the hypnotic synths of the 1975's 'Somebody Else'
</p>
