import { lengthVec3, type Rng, type Vec3 } from './math'

export type SlamStats = {
  gaussians: number
  particles: number
  loopClosures: number
  ate: number
  fps: number
}

export const HUD_GAUSSIAN_MAX = 3_000_000
export const HUD_PARTICLE_FLOOR = 312
export const HUD_ATE_FLOOR = 0.001
export const HUD_FPS_MAX = 120

export const INITIAL_SLAM_STATS: SlamStats = {
  gaussians: 10_000,
  particles: 8_000,
  loopClosures: 0,
  ate: 0.012,
  fps: 60,
}

export function formatGaussianCount(count: number): string {
  return `${(count / 1_000_000).toFixed(1)}M ▲`
}

export function formatParticleCount(count: number): string {
  return `${count.toLocaleString()} → ${HUD_PARTICLE_FLOOR}`
}

export function formatAteCm(ateMeters: number): string {
  return `${(ateMeters * 100).toFixed(1)} cm`
}

export function growGaussianCount(
  count: number,
  delta: number,
  max = HUD_GAUSSIAN_MAX,
): number {
  return Math.min(count + delta, max)
}

export function decayParticleCount(
  count: number,
  delta: number,
  floor = HUD_PARTICLE_FLOOR,
): number {
  return Math.max(floor, count - delta)
}

export function walkAte(ate: number, delta: number, floor = HUD_ATE_FLOOR): number {
  return Math.max(floor, ate + delta)
}

export function incrementLoopClosures(count: number, triggered: boolean): number {
  return count + (triggered ? 1 : 0)
}

export function capFps(fps: number, max = HUD_FPS_MAX): number {
  return Math.min(fps, max)
}

export function tickHudStats(prev: SlamStats, rng: Rng = Math.random): SlamStats {
  return {
    gaussians: growGaussianCount(prev.gaussians, Math.floor(rng() * 50_000)),
    particles: decayParticleCount(prev.particles, Math.floor(rng() * 100)),
    loopClosures: incrementLoopClosures(prev.loopClosures, rng() < 0.02),
    ate: walkAte(prev.ate, (rng() - 0.5) * 0.002),
    fps: 55 + Math.floor(rng() * 10),
  }
}

export function absoluteTrajectoryError(estimated: Vec3[], truth: Vec3[]): number {
  const n = Math.min(estimated.length, truth.length)
  if (n === 0) return 0
  let sse = 0
  for (let i = 0; i < n; i++) {
    const dx = estimated[i].x - truth[i].x
    const dy = estimated[i].y - truth[i].y
    const dz = estimated[i].z - truth[i].z
    sse += dx * dx + dy * dy + dz * dz
  }
  return Math.sqrt(sse / n)
}

export function poseError(estimated: Vec3, truth: Vec3): number {
  return lengthVec3({
    x: estimated.x - truth.x,
    y: estimated.y - truth.y,
    z: estimated.z - truth.z,
  })
}
