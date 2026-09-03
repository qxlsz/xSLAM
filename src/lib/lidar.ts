import { clamp, mixRgb, type Rgb, type Rng, type Vec3 } from './math'

export const LIDAR_ORIGIN_Y = 10
export const LIDAR_MISS_Y = -1000
export const LIDAR_MISS_TIMESTAMP = -1000

export const LidarColorMode = {
  Distance: 0,
  Height: 1,
  Intensity: 2,
} as const

export function lidarRayDirection(azimuth: number, elevation: number): Vec3 {
  return {
    x: Math.cos(azimuth) * Math.cos(elevation),
    y: Math.sin(elevation),
    z: Math.sin(azimuth) * Math.cos(elevation),
  }
}

export function intersectGround(
  dir: Vec3,
  originY = LIDAR_ORIGIN_Y,
  groundY = 0,
  maxRange: number,
): Vec3 | null {
  if (dir.y >= 0) return null
  const t = (groundY - originY) / dir.y
  if (t > 0 && t < maxRange) {
    return { x: dir.x * t, y: dir.y * t + originY, z: dir.z * t }
  }
  return null
}

export function lidarDecayFromPersistence(persistence: number): number {
  return (1 - persistence) * 0.5
}

export function lidarAlpha(age: number, decay: number): number {
  return 1 - age * decay
}

export function shouldDiscardLidarPoint(age: number, decay: number): boolean {
  return lidarAlpha(age, decay) <= 0
}

export function lidarColor(mode: number, dist: number, y: number, maxRange: number): Rgb {
  if (mode === LidarColorMode.Distance) {
    const t = clamp(dist / maxRange, 0, 1)
    return mixRgb([0, 1, 1], [1, 0, 0], t)
  }
  if (mode === LidarColorMode.Height) {
    const t = clamp((y + 5) / 20, 0, 1)
    return mixRgb([0, 0, 1], [1, 1, 0], t)
  }
  return [0, 1, 0]
}

export function lidarScanAngles(
  time: number,
  scanSpeed: number,
  sampleIndex: number,
  pointsPerFrame: number,
): { azimuth: number; elevation: number } {
  return {
    azimuth: time * scanSpeed * 2 + (sampleIndex / pointsPerFrame) * Math.PI * 2,
    elevation: Math.sin(time * scanSpeed * 0.5 + sampleIndex * 0.01) * Math.PI / 3,
  }
}

export function simulateLidarHit(
  azimuth: number,
  elevation: number,
  maxRange: number,
  rng: Rng = Math.random,
): { hit: boolean; point: Vec3 } {
  const dist = 5 + rng() * maxRange
  const dir = lidarRayDirection(azimuth, elevation)
  const ground = intersectGround(dir, LIDAR_ORIGIN_Y, 0, maxRange)
  if (ground) return { hit: true, point: ground }
  if (rng() > 0.3) {
    return {
      hit: true,
      point: {
        x: dir.x * dist,
        y: dir.y * dist + LIDAR_ORIGIN_Y,
        z: dir.z * dist,
      },
    }
  }
  return { hit: false, point: { x: 0, y: LIDAR_MISS_Y, z: 0 } }
}

export function initializeLidarBuffers(maxPoints: number) {
  const positions = new Float32Array(maxPoints * 3)
  const timestamps = new Float32Array(maxPoints)
  for (let i = 0; i < maxPoints; i++) {
    positions[i * 3] = 0
    positions[i * 3 + 1] = LIDAR_MISS_Y
    positions[i * 3 + 2] = 0
    timestamps[i] = LIDAR_MISS_TIMESTAMP
  }
  return { positions, timestamps }
}

export function writeLidarSample(
  positions: Float32Array,
  timestamps: Float32Array,
  index: number,
  azimuth: number,
  elevation: number,
  maxRange: number,
  time: number,
  rng: Rng = Math.random,
): void {
  const maxPoints = timestamps.length
  const slot = ((index % maxPoints) + maxPoints) % maxPoints
  const result = simulateLidarHit(azimuth, elevation, maxRange, rng)
  if (result.hit) {
    positions[slot * 3] = result.point.x
    positions[slot * 3 + 1] = result.point.y
    positions[slot * 3 + 2] = result.point.z
    timestamps[slot] = time
  } else {
    positions[slot * 3] = 0
    positions[slot * 3 + 1] = LIDAR_MISS_Y
    positions[slot * 3 + 2] = 0
    timestamps[slot] = LIDAR_MISS_TIMESTAMP
  }
}

export function clearLidarTimestamps(timestamps: Float32Array): void {
  timestamps.fill(LIDAR_MISS_TIMESTAMP)
}
