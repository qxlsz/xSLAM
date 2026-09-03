import { describe, expect, it } from 'vitest'
import { lengthVec3, mulberry32 } from './math'
import {
  CONVERGE_SPEED,
  CONVERGE_SPEED_LOOP,
  convergenceSpeed,
  effectiveSampleSize,
  initializeParticles,
  normalizeWeights,
  particleTarget,
  stepParticles,
  systematicResample,
  weightToColor,
} from './particles'
import { figure8Point } from './trajectory'

describe('weightToColor', () => {
  it('maps weight 0 to cyan and weight 1 toward magenta-red', () => {
    expect(weightToColor(0)).toEqual([0, 1, 1])
    expect(weightToColor(1)).toEqual([1, 0, 1])
    expect(weightToColor(0.25)).toEqual([0.25, 0.75, 1])
  })
})

describe('initializeParticles', () => {
  it('allocates tightly packed buffers for the requested count', () => {
    const cloud = initializeParticles(16, mulberry32(3))
    expect(cloud.positions).toHaveLength(48)
    expect(cloud.colors).toHaveLength(48)
    expect(cloud.velocities).toHaveLength(48)
    expect(cloud.weights).toHaveLength(16)
  })

  it('keeps spawn positions inside the initialization sphere', () => {
    const { positions } = initializeParticles(64, mulberry32(11))
    for (let i = 0; i < 64; i++) {
      const dx = positions[i * 3]
      const dy = positions[i * 3 + 1] - 10
      const dz = positions[i * 3 + 2]
      expect(lengthVec3({ x: dx, y: dy, z: dz })).toBeLessThanOrEqual(30 + 1e-9)
    }
  })

  it('colors each particle from its importance weight', () => {
    const { colors, weights } = initializeParticles(8, mulberry32(5))
    for (let i = 0; i < 8; i++) {
      const [r, g, b] = weightToColor(weights[i])
      expect(colors[i * 3]).toBeCloseTo(r)
      expect(colors[i * 3 + 1]).toBeCloseTo(g)
      expect(colors[i * 3 + 2]).toBeCloseTo(b)
    }
  })

  it('is deterministic for a seeded RNG', () => {
    const a = initializeParticles(12, mulberry32(99))
    const b = initializeParticles(12, mulberry32(99))
    expect(Array.from(a.positions)).toEqual(Array.from(b.positions))
    expect(Array.from(a.weights)).toEqual(Array.from(b.weights))
  })
})

describe('normalizeWeights / ESS / systematicResample', () => {
  it('normalizes positive weights to a unit simplex', () => {
    const normalized = normalizeWeights([1, 3, 4])
    expect(Array.from(normalized)).toEqual([0.125, 0.375, 0.5])
    expect(normalized.reduce((sum, w) => sum + w, 0)).toBeCloseTo(1)
  })

  it('falls back to a uniform distribution when the mass is zero', () => {
    expect(Array.from(normalizeWeights([0, 0, 0, 0]))).toEqual([0.25, 0.25, 0.25, 0.25])
    expect(Array.from(normalizeWeights([]))).toEqual([])
  })

  it('reports ESS = N for uniform weights and ESS ≈ 1 for a delta', () => {
    expect(effectiveSampleSize([1, 1, 1, 1])).toBeCloseTo(4)
    expect(effectiveSampleSize([1, 0, 0, 0])).toBeCloseTo(1)
  })

  it('resamples almost exclusively from the dominant particle', () => {
    const indices = systematicResample([0.01, 0.01, 0.97, 0.01], () => 0.25)
    expect(indices.every((index) => index === 2)).toBe(true)
  })

  it('returns one index per input weight', () => {
    const indices = systematicResample([0.2, 0.3, 0.5], () => 0.1)
    expect(indices).toHaveLength(3)
    for (const index of indices) {
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(3)
    }
  })
})

describe('particleTarget / convergenceSpeed', () => {
  it('tracks the figure-8 at half the clock rate', () => {
    expect(particleTarget(2)).toEqual(figure8Point(1))
  })

  it('snaps faster during loop closure', () => {
    expect(convergenceSpeed(false)).toBe(CONVERGE_SPEED)
    expect(convergenceSpeed(true)).toBe(CONVERGE_SPEED_LOOP)
  })
})

describe('stepParticles', () => {
  it('integrates explosion velocities by half a unit per step', () => {
    const positions = new Float32Array([0, 0, 0])
    const colors = new Float32Array([0.2, 0.8, 1])
    const velocities = new Float32Array([2, 4, -6])
    const weights = new Float32Array([0.2])

    stepParticles(positions, colors, velocities, weights, {
      count: 1,
      time: 0,
      exploded: true,
      converging: false,
      loopClosureEvent: false,
      resampleTime: 0,
      resampleTriggered: false,
      rng: () => 0,
    })

    expect(positions[0]).toBeCloseTo(1 + Math.sin(0) * 0.01)
    expect(positions[1]).toBeCloseTo(2 + Math.cos(0) * 0.01)
    expect(positions[2]).toBeCloseTo(-3 + Math.sin(0) * 0.01)
  })

  it('lerps toward the drone target while converging', () => {
    const positions = new Float32Array([0, 0, 0])
    const colors = new Float32Array([0, 1, 1])
    const velocities = new Float32Array([0, 0, 0])
    const weights = new Float32Array([0])
    const time = 0
    const target = particleTarget(time)

    stepParticles(positions, colors, velocities, weights, {
      count: 1,
      time,
      exploded: false,
      converging: true,
      loopClosureEvent: false,
      resampleTime: 0,
      resampleTriggered: false,
      rng: () => 0,
    })

    expect(positions[0]).toBeCloseTo(target.x * CONVERGE_SPEED + Math.sin(time) * 0.01)
    expect(positions[1]).toBeCloseTo(target.y * CONVERGE_SPEED + Math.cos(time) * 0.01)
    expect(positions[2]).toBeCloseTo(target.z * CONVERGE_SPEED + Math.sin(time * 3) * 0.01)
  })

  it('flashes cyan on a resample draw below 0.3', () => {
    const positions = new Float32Array([0, 0, 0])
    const colors = new Float32Array([0.4, 0.6, 1])
    const velocities = new Float32Array([0, 0, 0])
    const weights = new Float32Array([0.4])

    stepParticles(positions, colors, velocities, weights, {
      count: 1,
      time: 0,
      exploded: false,
      converging: false,
      loopClosureEvent: false,
      resampleTime: 0,
      resampleTriggered: true,
      rng: () => 0.1,
    })

    expect(Array.from(colors)).toEqual([0, 10, 10])
  })

  it('restores colors toward the weight tint after the flash window', () => {
    const positions = new Float32Array([0, 0, 0])
    const colors = new Float32Array([10, 0, 0])
    const velocities = new Float32Array([0, 0, 0])
    const weights = new Float32Array([0.2])

    stepParticles(positions, colors, velocities, weights, {
      count: 1,
      time: 1,
      exploded: false,
      converging: false,
      loopClosureEvent: false,
      resampleTime: 0,
      resampleTriggered: false,
      rng: () => 0,
    })

    expect(colors[0]).toBeCloseTo(10 * 0.95 + 0.2 * 0.05)
    expect(colors[1]).toBeCloseTo(0 * 0.95 + 0.8 * 0.05)
    expect(colors[2]).toBeCloseTo(0 * 0.95 + 0.05)
  })
})
