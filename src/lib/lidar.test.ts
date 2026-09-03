import { describe, expect, it } from 'vitest'
import { lengthVec3, mulberry32 } from './math'
import {
  LIDAR_MISS_TIMESTAMP,
  LIDAR_MISS_Y,
  LIDAR_ORIGIN_Y,
  LidarColorMode,
  clearLidarTimestamps,
  initializeLidarBuffers,
  intersectGround,
  lidarAlpha,
  lidarColor,
  lidarDecayFromPersistence,
  lidarRayDirection,
  lidarScanAngles,
  shouldDiscardLidarPoint,
  simulateLidarHit,
  writeLidarSample,
} from './lidar'

describe('lidarRayDirection', () => {
  it('is a unit vector', () => {
    const dir = lidarRayDirection(0.4, -0.2)
    expect(lengthVec3(dir)).toBeCloseTo(1)
  })

  it('points along +X when azimuth and elevation are zero', () => {
    expect(lidarRayDirection(0, 0)).toEqual({ x: 1, y: 0, z: 0 })
  })
})

describe('intersectGround', () => {
  it('hits the y=0 plane when the ray is aimed downward', () => {
    const hit = intersectGround({ x: 0, y: -1, z: 0 }, LIDAR_ORIGIN_Y, 0, 30)
    expect(hit).toEqual({ x: 0, y: 0, z: 0 })
  })

  it('misses when the ray aims up or the ground is beyond max range', () => {
    expect(intersectGround({ x: 0, y: 1, z: 0 }, LIDAR_ORIGIN_Y, 0, 30)).toBeNull()
    expect(intersectGround({ x: 0, y: -0.01, z: 0 }, LIDAR_ORIGIN_Y, 0, 5)).toBeNull()
  })
})

describe('lidar color and decay', () => {
  it('fades alpha linearly and discards at zero', () => {
    expect(lidarDecayFromPersistence(0.95)).toBeCloseTo(0.025)
    expect(lidarAlpha(10, 0.05)).toBeCloseTo(0.5)
    expect(shouldDiscardLidarPoint(20, 0.05)).toBe(true)
    expect(shouldDiscardLidarPoint(0, 0.05)).toBe(false)
  })

  it('maps distance from cyan to red', () => {
    expect(lidarColor(LidarColorMode.Distance, 0, 0, 30)).toEqual([0, 1, 1])
    expect(lidarColor(LidarColorMode.Distance, 30, 0, 30)).toEqual([1, 0, 0])
    expect(lidarColor(LidarColorMode.Distance, 15, 0, 30)).toEqual([0.5, 0.5, 0.5])
  })

  it('maps height from blue to yellow and intensity to green', () => {
    expect(lidarColor(LidarColorMode.Height, 0, -5, 30)).toEqual([0, 0, 1])
    expect(lidarColor(LidarColorMode.Height, 0, 15, 30)).toEqual([1, 1, 0])
    expect(lidarColor(LidarColorMode.Intensity, 8, 4, 30)).toEqual([0, 1, 0])
  })
})

describe('scan simulation', () => {
  it('spreads azimuth across a full turn within one frame', () => {
    const first = lidarScanAngles(0, 1, 0, 8)
    const last = lidarScanAngles(0, 1, 4, 8)
    expect(first.azimuth).toBe(0)
    expect(last.azimuth).toBeCloseTo(Math.PI)
  })

  it('returns a ground hit for a downward ray before sampling walls', () => {
    const result = simulateLidarHit(0, -Math.PI / 2, 30, () => 0)
    expect(result.hit).toBe(true)
    expect(result.point.y).toBeCloseTo(0)
  })

  it('can miss when the ray is upward and the wall draw fails', () => {
    const result = simulateLidarHit(0, Math.PI / 4, 30, () => 0.1)
    expect(result.hit).toBe(false)
    expect(result.point.y).toBe(LIDAR_MISS_Y)
  })
})

describe('lidar buffers', () => {
  it('initializes every point as an off-screen miss', () => {
    const { positions, timestamps } = initializeLidarBuffers(3)
    expect(positions).toHaveLength(9)
    expect(Array.from(timestamps)).toEqual([
      LIDAR_MISS_TIMESTAMP,
      LIDAR_MISS_TIMESTAMP,
      LIDAR_MISS_TIMESTAMP,
    ])
    expect(positions[1]).toBe(LIDAR_MISS_Y)
  })

  it('writes hits into a ring buffer and can age the cloud out', () => {
    const { positions, timestamps } = initializeLidarBuffers(2)
    writeLidarSample(positions, timestamps, 0, 0, -Math.PI / 2, 30, 4, mulberry32(1))
    expect(timestamps[0]).toBe(4)
    expect(positions[1]).toBeCloseTo(0)

    clearLidarTimestamps(timestamps)
    expect(Array.from(timestamps)).toEqual([LIDAR_MISS_TIMESTAMP, LIDAR_MISS_TIMESTAMP])
  })
})
