import { useState, useEffect } from 'react'
import {
  INITIAL_SLAM_STATS,
  formatAteCm,
  formatGaussianCount,
  formatParticleCount,
  tickHudStats,
} from '../lib/hud'
import './HUD.css'

export function HUD() {
  const [stats, setStats] = useState(INITIAL_SLAM_STATS)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => tickHudStats(prev))
    }, 500)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="hud">
      <div className="hud-title">SLAM VISUALIZATION</div>
      <div className="hud-stats">
        <div className="stat">
          <span className="stat-label">Gaussians:</span>
          <span className="stat-value">{formatGaussianCount(stats.gaussians)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Particles:</span>
          <span className="stat-value">{formatParticleCount(stats.particles)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Loop Closures:</span>
          <span className="stat-value">{stats.loopClosures}</span>
        </div>
        <div className="stat">
          <span className="stat-label">ATE:</span>
          <span className="stat-value">{formatAteCm(stats.ate)}</span>
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
