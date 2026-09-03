import { describe, expect, it } from 'vitest'
import {
  FIGURE8_HEIGHT,
  FIGURE8_PERIOD,
  FIGURE8_RADIUS,
  figure8Point,
  figure8Velocity,
  generateFigure8Path,
  loopClosureSnapOffset,
  wrapTrajectoryTime,
} from './trajectory'

describe('figure8Point', () => {
  it('starts on the +Z lobe at the cruise height', () => {
    expect(figure8Point(0)).toEqual({ x: 0, y: FIGURE8_HEIGHT, z: FIGURE8_RADIUS })
  })

  it('reaches the +X lobe at t=π/2', () => {
    const p = figure8Point(Math.PI / 2)
    expect(p.x).toBeCloseTo(FIGURE8_RADIUS)
    expect(p.y).toBeCloseTo(FIGURE8_HEIGHT)
    expect(p.z).toBeCloseTo(0)
  })

  it('is periodic in XZ with 2π and in Y with π', () => {
    const a = figure8Point(0.4)
    const b = figure8Point(0.4 + Math.PI * 2)
    expect(a.x).toBeCloseTo(b.x)
    expect(a.y).toBeCloseTo(b.y)
    expect(a.z).toBeCloseTo(b.z)

    const yA = figure8Point(0.3).y
    const yB = figure8Point(0.3 + Math.PI).y
    expect(yA).toBeCloseTo(yB)
  })
})

describe('figure8Velocity', () => {
  it('matches the analytic derivative of figure8Point', () => {
    const t = 0.75
    const dt = 1e-6
    const a = figure8Point(t)
    const b = figure8Point(t + dt)
    const numeric = {
      x: (b.x - a.x) / dt,
      y: (b.y - a.y) / dt,
      z: (b.z - a.z) / dt,
    }
    const analytic = figure8Velocity(t)
    expect(analytic.x).toBeCloseTo(numeric.x, 4)
    expect(analytic.y).toBeCloseTo(numeric.y, 4)
    expect(analytic.z).toBeCloseTo(numeric.z, 4)
  })

  it('points along +X at t=0', () => {
    const v = figure8Velocity(0)
    expect(v.x).toBeCloseTo(FIGURE8_RADIUS)
    expect(v.y).toBeCloseTo(10)
    expect(v.z).toBeCloseTo(0)
  })
})

describe('generateFigure8Path', () => {
  it('includes both endpoints of a closed two-loop path', () => {
    const path = generateFigure8Path(200)
    expect(path).toHaveLength(201)
    expect(path[0]).toEqual(figure8Point(0))
    expect(path[200].x).toBeCloseTo(path[0].x)
    expect(path[200].y).toBeCloseTo(path[0].y)
    expect(path[200].z).toBeCloseTo(path[0].z)
  })
})

describe('wrapTrajectoryTime', () => {
  it('wraps at the figure-8 period used by the drone', () => {
    expect(wrapTrajectoryTime(FIGURE8_PERIOD + 0.25)).toBeCloseTo(0.25)
    expect(wrapTrajectoryTime(0)).toBe(0)
  })
})

describe('loopClosureSnapOffset', () => {
  it('is a 20 rad/s sine of the requested amplitude', () => {
    expect(loopClosureSnapOffset(0, 0.5)).toBe(0)
    expect(loopClosureSnapOffset(Math.PI / 40, 0.5)).toBeCloseTo(0.5)
    expect(loopClosureSnapOffset(Math.PI / 40, 0.2)).toBeCloseTo(0.2)
  })
})
