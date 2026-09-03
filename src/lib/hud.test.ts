import { describe, expect, it } from 'vitest'
import { mulberry32 } from './math'
import {
  HUD_ATE_FLOOR,
  HUD_FPS_MAX,
  HUD_GAUSSIAN_MAX,
  HUD_PARTICLE_FLOOR,
  INITIAL_SLAM_STATS,
  absoluteTrajectoryError,
  capFps,
  decayParticleCount,
  formatAteCm,
  formatGaussianCount,
  formatParticleCount,
  growGaussianCount,
  incrementLoopClosures,
  poseError,
  tickHudStats,
  walkAte,
} from './hud'

describe('HUD formatters', () => {
  it('formats gaussian count in millions', () => {
    expect(formatGaussianCount(10_000)).toBe('0.0M ▲')
    expect(formatGaussianCount(1_250_000)).toBe('1.3M ▲')
    expect(formatGaussianCount(HUD_GAUSSIAN_MAX)).toBe('3.0M ▲')
  })

  it('formats particle count against the convergence floor', () => {
    expect(formatParticleCount(8_000)).toBe(`${(8_000).toLocaleString()} → ${HUD_PARTICLE_FLOOR}`)
    expect(formatParticleCount(HUD_PARTICLE_FLOOR)).toBe(
      `${HUD_PARTICLE_FLOOR.toLocaleString()} → ${HUD_PARTICLE_FLOOR}`,
    )
  })

  it('formats ATE from meters into centimeters', () => {
    expect(formatAteCm(0.012)).toBe('1.2 cm')
    expect(formatAteCm(0.001)).toBe('0.1 cm')
    expect(formatAteCm(0)).toBe('0.0 cm')
  })
})

describe('HUD stat ticks', () => {
  it('grows gaussians and clamps at the display cap', () => {
    expect(growGaussianCount(10_000, 40_000)).toBe(50_000)
    expect(growGaussianCount(HUD_GAUSSIAN_MAX - 10, 50)).toBe(HUD_GAUSSIAN_MAX)
  })

  it('decays particles down to 312', () => {
    expect(decayParticleCount(400, 20)).toBe(380)
    expect(decayParticleCount(330, 50)).toBe(HUD_PARTICLE_FLOOR)
  })

  it('walks ATE but never below 1 mm', () => {
    expect(walkAte(0.012, -0.004)).toBeCloseTo(0.008)
    expect(walkAte(0.0012, -0.01)).toBe(HUD_ATE_FLOOR)
  })

  it('increments loop closures only when triggered', () => {
    expect(incrementLoopClosures(3, false)).toBe(3)
    expect(incrementLoopClosures(3, true)).toBe(4)
  })

  it('caps FPS at 120', () => {
    expect(capFps(90)).toBe(90)
    expect(capFps(240)).toBe(HUD_FPS_MAX)
  })

  it('is deterministic for a seeded HUD tick', () => {
    const a = tickHudStats(INITIAL_SLAM_STATS, mulberry32(9))
    const b = tickHudStats(INITIAL_SLAM_STATS, mulberry32(9))
    expect(a).toEqual(b)
    expect(a.gaussians).toBeGreaterThanOrEqual(INITIAL_SLAM_STATS.gaussians)
    expect(a.gaussians).toBeLessThanOrEqual(HUD_GAUSSIAN_MAX)
    expect(a.particles).toBeGreaterThanOrEqual(HUD_PARTICLE_FLOOR)
    expect(a.particles).toBeLessThanOrEqual(INITIAL_SLAM_STATS.particles)
    expect(a.fps).toBeGreaterThanOrEqual(55)
    expect(a.fps).toBeLessThan(65)
  })
})

describe('absolute trajectory error', () => {
  it('is zero for identical trajectories', () => {
    const path = [{ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 }]
    expect(absoluteTrajectoryError(path, path)).toBe(0)
  })

  it('is the RMS of per-pose Euclidean error', () => {
    const truth = [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }]
    const estimated = [{ x: 3, y: 4, z: 0 }, { x: 0, y: 0, z: 0 }]
    expect(poseError(estimated[0], truth[0])).toBe(5)
    expect(absoluteTrajectoryError(estimated, truth)).toBeCloseTo(Math.sqrt((25 + 0) / 2))
  })

  it('uses the overlapping prefix and returns 0 for empty input', () => {
    expect(absoluteTrajectoryError([{ x: 1, y: 0, z: 0 }], [])).toBe(0)
    expect(absoluteTrajectoryError([], [{ x: 1, y: 0, z: 0 }])).toBe(0)
    expect(
      absoluteTrajectoryError(
        [{ x: 2, y: 0, z: 0 }, { x: 99, y: 0, z: 0 }],
        [{ x: 0, y: 0, z: 0 }],
      ),
    ).toBe(2)
  })
})
