# 🚁 Web-SLAM: Real-Time SLAM Visualization in Browser

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://yourusername.github.io/web-slam/)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-61dafb)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r181-black)](https://threejs.org/)

> **A stunning, real-time SLAM (Simultaneous Localization and Mapping) visualization running 100% in the browser. Experience cutting-edge robotics visualization with no backend required.**

<p align="center">
  <img src="demo.gif" alt="Web-SLAM Demo" width="100%">
</p>

## ✨ Features

### Core Visualizations
- **🚁 Autonomous Drone**: Sleek quadcopter following a pre-recorded figure-8 trajectory with dynamic loop closures
- **🌟 3D Gaussian Splatting**: 3+ million animated gaussians with adaptive density, white clone bursts, and red prune flashes
- **🎯 Monte Carlo Localization**: 8,000 particles that explode, converge violently, and flash during resampling
- **🔗 Graph SLAM**: Loop closure events trigger massive green electric shockwaves along the pose graph
- **📡 LiDAR Point Cloud**: Real-time dense point cloud generation with depth-based coloring
- **💫 Visual Effects**: Neon trails, covariance ribbons, volumetric fog, and bloom effects
- **🎬 Cinematic Camera**: Auto-orbiting camera with slow-motion zoom on loop closure events
- **🖼️ NeRF Windows**: Four floating inset views showing neural radiance field reconstructions
- **📊 Live HUD**: Real-time statistics display with cyberpunk aesthetics
- **🎮 Leva Controls**: Full control over every visual effect and parameter
- **📹 Video Recording**: One-click WebM recording up to 30 seconds

### Technical Highlights
- **100% Client-Side**: No backend required, runs entirely in the browser
- **< 1MB Bundle**: Optimized for performance and fast loading
- **Mobile-Friendly**: Works on iPhone, Android, and tablets
- **GitHub Pages Ready**: Deploy with a single command
- **TypeScript**: Full type safety and IntelliSense support
- **React Three Fiber**: Declarative 3D scene management
- **Post-Processing**: Bloom, depth of field, chromatic aberration, vignette

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/web-slam.git
cd web-slam

# Install dependencies and run
npm install && npm run dev
```

That's it! Open [http://localhost:5173](http://localhost:5173) to see the visualization.

## 🎮 Controls

### Leva Panel (Top Right)
- **Visual Effects**: Toggle each visualization component
- **Post-processing**: Adjust bloom, vignette, and other effects
- **Simulation**: Control speed, particle count, and camera mode

### Mouse
- **Left Click + Drag**: Rotate camera (manual mode)
- **Right Click + Drag**: Pan camera
- **Scroll**: Zoom in/out

## 📦 Deployment

### GitHub Pages

```bash
# Install gh-pages if not already installed
npm install --save-dev gh-pages

# Build and deploy to GitHub Pages
npm run build
npm run deploy
```

## 🛠️ Tech Stack

- **[Vite](https://vitejs.dev/)** - Lightning fast build tool
- **[React](https://reactjs.org/)** - UI framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Three.js](https://threejs.org/)** - 3D graphics library
- **[React Three Fiber](https://github.com/pmndrs/react-three-fiber)** - React renderer for Three.js
- **[@react-three/drei](https://github.com/pmndrs/drei)** - Useful helpers
- **[@react-three/postprocessing](https://github.com/pmndrs/postprocessing)** - Post-processing effects
- **[Leva](https://github.com/pmndrs/leva)** - GUI controls

## 📁 Project Structure

```
web-slam/
├── src/
│   ├── components/
│   │   ├── DroneSystem.tsx       # Autonomous drone with trajectory
│   │   ├── GaussianSplatting.tsx # 3D Gaussian splat visualization
│   │   ├── MonteCarloParticles.tsx # Particle filter system
│   │   ├── GraphSLAM.tsx         # Pose graph and loop closures
│   │   ├── LidarPointCloud.tsx   # LiDAR sensor simulation
│   │   ├── CinematicCamera.tsx   # Auto-orbiting camera
│   │   ├── NeRFWindows.tsx       # Neural radiance field views
│   │   ├── HUD.tsx               # Statistics overlay
│   │   └── VideoRecorder.tsx     # WebM recording
│   ├── App.tsx                   # Main application
│   └── App.css                   # Cyberpunk styling
├── package.json                  # Dependencies
└── vite.config.ts               # Build configuration
```

## 📈 Performance

- **Target FPS**: 60fps on modern hardware
- **Mobile**: 30fps on iPhone 12 and above
- **Bundle Size**: < 1MB gzipped
- **Load Time**: < 3s on 4G

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

---

<p align="center">
  Made with ❤️ and JavaScript
</p>
