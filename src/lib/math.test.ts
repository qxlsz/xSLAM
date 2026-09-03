import { describe, expect, it } from 'vitest'
import { addVec3, clamp, lengthVec3, lerp, mixRgb, mulberry32 } from './math'

describe('clamp', () => {
  it('returns the value when it is inside the range', () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5)
  })

  it('clamps to the lower and upper bounds', () => {
    expect(clamp(-2, 0, 1)).toBe(0)
    expect(clamp(4, 0, 1)).toBe(1)
  })
})

describe('lerp / mixRgb', () => {
  it('returns the start value at t=0 and the end value at t=1', () => {
    expect(lerp(10, 20, 0)).toBe(10)
    expect(lerp(10, 20, 1)).toBe(20)
  })

  it('interpolates RGB channels independently', () => {
    expect(mixRgb([0, 1, 1], [1, 0, 0], 0.5)).toEqual([0.5, 0.5, 0.5])
  })
})

describe('vec3 helpers', () => {
  it('adds component-wise and reports Euclidean length', () => {
    expect(addVec3({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 })).toEqual({ x: 5, y: 7, z: 9 })
    expect(lengthVec3({ x: 3, y: 4, z: 0 })).toBe(5)
  })
})

describe('mulberry32', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    const seqA = [a(), a(), a()]
    const seqB = [b(), b(), b()]
    expect(seqA).toEqual(seqB)
  })

  it('emits values in [0, 1)', () => {
    const rng = mulberry32(7)
    for (let i = 0; i < 200; i++) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('diverges across seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)())
  })
})
