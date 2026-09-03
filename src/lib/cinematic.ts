import type { Vec3 } from './math'

export function orbitCameraPosition(time: number, radius: number): Vec3 {
  return {
    x: Math.sin(time) * radius,
    y: 15 + Math.sin(time * 0.5) * 5,
    z: Math.cos(time) * radius,
  }
}

export function cameraFollowAlpha(slowMotion: boolean): number {
  return slowMotion ? 0.02 : 0.05
}

export function targetFov(slowMotion: boolean): number {
  return slowMotion ? 40 : 60
}

export function fovLerpAlpha(slowMotion: boolean): number {
  return slowMotion ? 0.05 : 0.02
}
