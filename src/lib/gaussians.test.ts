import { describe, expect, it } from 'vitest'
import { mulberry32 } from './math'
import { gaussianSplatColor, initializeGaussians } from './gaussians'

describe('gaussianSplatColor', () => {
  it('buckets hue into cyan, magenta, and yellow', () => {
    expect(gaussianSplatColor(0)).toEqual([0, 1, 1])
    expect(gaussianSplatColor(0.29)).toEqual([0, 1, 1])
    expect(gaussianSplatColor(0.3)).toEqual([1, 0, 0.5])
    expect(gaussianSplatColor(0.59)).toEqual([1, 0, 0.5])
    expect(gaussianSplatColor(0.6)).toEqual([1, 1, 0])
  })
})

describe('initializeGaussians', () => {
  it('allocates position, RGBA, and scale buffers', () => {
    const splats = initializeGaussians(10, mulberry32(4))
    expect(splats.positions).toHaveLength(30)
    expect(splats.colors).toHaveLength(40)
    expect(splats.scales).toHaveLength(30)
  })

  it('keeps spawn positions and scales in the visualization bounds', () => {
    const { positions, colors, scales } = initializeGaussians(40, mulberry32(8))
    for (let i = 0; i < 40; i++) {
      expect(positions[i * 3]).toBeGreaterThanOrEqual(-20)
      expect(positions[i * 3]).toBeLessThanOrEqual(20)
      expect(positions[i * 3 + 1]).toBeGreaterThanOrEqual(0)
      expect(positions[i * 3 + 1]).toBeLessThanOrEqual(20)
      expect(scales[i * 3]).toBeGreaterThanOrEqual(0.5)
      expect(scales[i * 3]).toBeLessThanOrEqual(2)
      expect(colors[i * 4 + 3]).toBeGreaterThanOrEqual(0.6)
      expect(colors[i * 4 + 3]).toBeLessThanOrEqual(1)
    }
  })

  it('is deterministic for a seeded RNG', () => {
    const a = initializeGaussians(5, mulberry32(123))
    const b = initializeGaussians(5, mulberry32(123))
    expect(Array.from(a.positions)).toEqual(Array.from(b.positions))
    expect(Array.from(a.colors)).toEqual(Array.from(b.colors))
  })
})
