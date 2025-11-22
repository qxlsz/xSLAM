import { useState, useEffect } from 'react'
import './HUD.css'

export function HUD() {
  const [stats, setStats] = useState({
    gaussians: 10000,
    particles: 8000,
    loopClosures: 0,
    ate: 0.012,
    fps: 60
  })
  
  useEffect(() => {
    // Animate stats
    const interval = setInterval(() => {
      setStats(prev => ({
        gaussians: Math.min(prev.gaussians + Math.floor(Math.random() * 50000), 3000000),
        particles: Math.max(312, prev.particles - Math.floor(Math.random() * 100)),
        loopClosures: prev.loopClosures + (Math.random() < 0.02 ? 1 : 0),
        ate: Math.max(0.001, prev.ate + (Math.random() - 0.5) * 0.002),
        fps: 55 + Math.floor(Math.random() * 10)
      }))
    }, 500)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="hud">
      <div className="hud-title">SLAM VISUALIZATION</div>
      <div className="hud-stats">
        <div className="stat">
          <span className="stat-label">Gaussians:</span>
          <span className="stat-value">{(stats.gaussians / 1000000).toFixed(1)}M ▲</span>
        </div>
        <div className="stat">
          <span className="stat-label">Particles:</span>
          <span className="stat-value">{stats.particles.toLocaleString()} → 312</span>
        </div>
        <div className="stat">
          <span className="stat-label">Loop Closures:</span>
          <span className="stat-value">{stats.loopClosures}</span>
        </div>
        <div className="stat">
          <span className="stat-label">ATE:</span>
          <span className="stat-value">{(stats.ate * 100).toFixed(1)} cm</span>
        </div>
        <div className="stat">
          <span className="stat-label">FPS:</span>
          <span className="stat-value fps">{stats.fps}</span>
        </div>
      </div>
      
      <div className="hud-grid">
        <div className="grid-line"></div>
        <div className="grid-line"></div>
        <div className="grid-line"></div>
      </div>
    </div>
  )
}
