import { Suspense, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Loader, Stats, Sparkles } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette, ChromaticAberration, DepthOfField } from '@react-three/postprocessing'
import { useControls, folder } from 'leva'
import './App.css'

// Components
import { DroneSystem } from './components/DroneSystem'
import { GaussianSplatting } from './components/GaussianSplatting'
import { MonteCarloParticles } from './components/MonteCarloParticles'
import { GraphSLAM } from './components/GraphSLAM'
import { LidarPointCloud } from './components/LidarPointCloud'
import { HUD } from './components/HUD'
import { CinematicCamera } from './components/CinematicCamera'
import { NeRFWindows } from './components/NeRFWindows'
import { VideoRecorder } from './components/VideoRecorder'

function Scene() {
  const [loopClosureEvent, setLoopClosureEvent] = useState(false)
  const [stats, setStats] = useState({
    gaussians: 10000,
    particles: 8000,
    loopClosures: 0,
    ate: 0.012,
    fps: 60
  })

  const controls = useControls({
    'Visual Effects': folder({
      enableGaussians: { value: true, label: 'Gaussian Splatting' },
      enableParticles: { value: true, label: 'Monte Carlo Particles' },
      enableLidar: { value: true, label: 'LiDAR Point Cloud' },
      enableTrail: { value: true, label: 'Drone Trail' },
      enableNeRF: { value: true, label: 'NeRF Views' },
      enableGraphSLAM: { value: true, label: 'Graph SLAM' },
    }),
    'Post-processing': folder({
      bloomIntensity: { value: 2.0, min: 0, max: 5, step: 0.1 },
      bloomRadius: { value: 0.85, min: 0, max: 1, step: 0.01 },
      vignetteIntensity: { value: 0.3, min: 0, max: 1, step: 0.01 },
      chromaticAberration: { value: 0.02, min: 0, max: 0.1, step: 0.001 },
      depthOfField: { value: true, label: 'Depth of Field' },
    }),
    'Simulation': folder({
      simulationSpeed: { value: 1.0, min: 0.1, max: 3.0, step: 0.1 },
      particleCount: { value: 8000, min: 1000, max: 20000, step: 1000 },
      gaussianScale: { value: 1.0, min: 0.1, max: 3.0, step: 0.1 },
      autoCamera: { value: true, label: 'Cinematic Camera' },
    })
  })

  // Trigger loop closure every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLoopClosureEvent(true)
      setStats(prev => ({ ...prev, loopClosures: prev.loopClosures + 1 }))
      setTimeout(() => setLoopClosureEvent(false), 3000)
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Update FPS
  useFrame((state) => {
    const fps = Math.round(1 / state.clock.getDelta())
    if (Math.random() < 0.1) {
      setStats(prev => ({ ...prev, fps: Math.min(fps, 120) }))
    }
  })

  // Update gaussian count over time
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        gaussians: Math.min(prev.gaussians + Math.floor(Math.random() * 50000), 3000000)
      }))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <fog attach="fog" args={['#000510', 10, 100]} />
      
      {/* Lighting */}
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#00ffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00ff" />
      
      {/* Environment */}
      <Environment preset="night" />
      <Sparkles count={200} scale={50} size={2} speed={0.1} opacity={0.1} color="#00ffff" />
      
      {/* Main Systems */}
      <DroneSystem 
        enableTrail={controls.enableTrail}
        speed={controls.simulationSpeed}
        loopClosureEvent={loopClosureEvent}
      />
      
      {controls.enableGaussians && (
        <GaussianSplatting 
          scale={controls.gaussianScale}
          count={stats.gaussians}
        />
      )}
      
      {controls.enableParticles && (
        <MonteCarloParticles 
          count={controls.particleCount}
          loopClosureEvent={loopClosureEvent}
        />
      )}
      
      {controls.enableGraphSLAM && (
        <GraphSLAM 
          loopClosureEvent={loopClosureEvent}
        />
      )}
      
      {controls.enableLidar && (
        <LidarPointCloud />
      )}
      
      {controls.enableNeRF && (
        <NeRFWindows />
      )}
      
      {/* Camera System */}
      {controls.autoCamera ? (
        <CinematicCamera loopClosureEvent={loopClosureEvent} />
      ) : (
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={100}
        />
      )}
      
      {/* Post-processing */}
      <EffectComposer>
        <Bloom 
          intensity={controls.bloomIntensity}
          radius={controls.bloomRadius}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
        />
        <Vignette eskil={false} offset={0.1} darkness={controls.vignetteIntensity} />
        <ChromaticAberration offset={[controls.chromaticAberration, controls.chromaticAberration]} />
        <DepthOfField 
          focusDistance={0.01}
          focalLength={0.05}
          bokehScale={controls.depthOfField ? 3 : 0}
        />
      </EffectComposer>
    </>
  )
}

function App() {
  return (
    <div className="app-container">
      <Canvas
        camera={{ position: [20, 15, 20], fov: 60 }}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true
        }}
        shadows
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <Stats className="stats" />
      </Canvas>
      
      <HUD />
      <VideoRecorder />
      <Loader />
    </div>
  )
}

export default App
