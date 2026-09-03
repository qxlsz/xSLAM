import { describe, expect, it } from 'vitest'
import {
  cameraFollowAlpha,
  fovLerpAlpha,
  orbitCameraPosition,
  targetFov,
} from './cinematic'

describe('orbitCameraPosition', () => {
  it('sits on the +Z orbit at time 0', () => {
    expect(orbitCameraPosition(0, 30)).toEqual({ x: 0, y: 15, z: 30 })
  })

  it('stays on a circle of the requested radius in XZ', () => {
    const p = orbitCameraPosition(1.1, 15)
    expect(Math.hypot(p.x, p.z)).toBeCloseTo(15)
    expect(p.y).toBeGreaterThan(10)
    expect(p.y).toBeLessThan(20)
  })
})

describe('cinematic easing', () => {
  it('slows the follow, tightens FOV, and eases harder in slow motion', () => {
    expect(cameraFollowAlpha(true)).toBe(0.02)
    expect(cameraFollowAlpha(false)).toBe(0.05)
    expect(targetFov(true)).toBe(40)
    expect(targetFov(false)).toBe(60)
    expect(fovLerpAlpha(true)).toBe(0.05)
    expect(fovLerpAlpha(false)).toBe(0.02)
  })
})
