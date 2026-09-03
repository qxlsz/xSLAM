import type { Vec3 } from './math'

export const FIGURE8_RADIUS = 15
export const FIGURE8_HEIGHT_AMP = 5
export const FIGURE8_HEIGHT = 10
export const FIGURE8_PERIOD = Math.PI * 4

export function figure8Point(
  t: number,
  radius = FIGURE8_RADIUS,
  heightAmp = FIGURE8_HEIGHT_AMP,
  height = FIGURE8_HEIGHT,
): Vec3 {
  return {
    x: Math.sin(t) * radius,
    y: Math.sin(t * 2) * heightAmp + height,
    z: Math.cos(t) * radius,
  }
}

export function figure8Velocity(
  t: number,
  radius = FIGURE8_RADIUS,
  heightAmp = FIGURE8_HEIGHT_AMP,
): Vec3 {
  return {
    x: Math.cos(t) * radius,
    y: Math.cos(t * 2) * heightAmp * 2,
    z: -Math.sin(t) * radius,
  }
}

export function generateFigure8Path(segments: number, loops = 2): Vec3[] {
  const points: Vec3[] = []
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2 * loops
    points.push(figure8Point(t))
  }
  return points
}

export function wrapTrajectoryTime(time: number, period = FIGURE8_PERIOD): number {
  return time % period
}

export function loopClosureSnapOffset(elapsedTime: number, amplitude: number): number {
  return Math.sin(elapsedTime * 20) * amplitude
}
