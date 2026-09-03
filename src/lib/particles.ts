import type { Rgb, Rng, Vec3 } from './math'
import { figure8Point } from './trajectory'

export const PARTICLE_SPHERE_RADIUS = 30
export const PARTICLE_HEIGHT = 10
export const CONVERGE_SPEED = 0.05
export const CONVERGE_SPEED_LOOP = 0.2

export function weightToColor(weight: number): Rgb {
  return [weight, 1 - weight, 1]
}

export function initializeParticles(count: number, rng: Rng = Math.random) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const velocities = new Float32Array(count * 3)
  const weights = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const theta = rng() * Math.PI * 2
    const phi = rng() * Math.PI
    const radius = rng() * PARTICLE_SPHERE_RADIUS

    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius
    positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius + PARTICLE_HEIGHT
    positions[i * 3 + 2] = Math.cos(phi) * radius

    velocities[i * 3] = (rng() - 0.5) * 2
    velocities[i * 3 + 1] = rng() * 2
    velocities[i * 3 + 2] = (rng() - 0.5) * 2

    weights[i] = rng()
    const [r, g, b] = weightToColor(weights[i])
    colors[i * 3] = r
    colors[i * 3 + 1] = g
    colors[i * 3 + 2] = b
  }

  return { positions, colors, velocities, weights }
}

export function normalizeWeights(weights: ArrayLike<number>): Float32Array {
  const out = new Float32Array(weights.length)
  let sum = 0
  for (let i = 0; i < weights.length; i++) sum += weights[i]
  if (sum <= 0) {
    const uniform = weights.length === 0 ? 0 : 1 / weights.length
    out.fill(uniform)
    return out
  }
  for (let i = 0; i < weights.length; i++) out[i] = weights[i] / sum
  return out
}

export function effectiveSampleSize(weights: ArrayLike<number>): number {
  const normalized = normalizeWeights(weights)
  let sumSq = 0
  for (let i = 0; i < normalized.length; i++) sumSq += normalized[i] * normalized[i]
  return sumSq > 0 ? 1 / sumSq : 0
}

export function systematicResample(
  weights: ArrayLike<number>,
  rng: Rng = Math.random,
): Int32Array {
  const n = weights.length
  const normalized = normalizeWeights(weights)
  const cdf = new Float32Array(n)
  if (n > 0) cdf[0] = normalized[0]
  for (let i = 1; i < n; i++) cdf[i] = cdf[i - 1] + normalized[i]

  const indices = new Int32Array(n)
  const start = n === 0 ? 0 : rng() / n
  let j = 0
  for (let i = 0; i < n; i++) {
    const u = start + i / n
    while (j < n - 1 && cdf[j] < u) j++
    indices[i] = j
  }
  return indices
}

export function convergenceSpeed(loopClosureEvent: boolean): number {
  return loopClosureEvent ? CONVERGE_SPEED_LOOP : CONVERGE_SPEED
}

export function particleTarget(time: number): Vec3 {
  return figure8Point(time * 0.5)
}

export function stepParticles(
  positions: Float32Array,
  colors: Float32Array,
  velocities: Float32Array,
  weights: Float32Array,
  opts: {
    count: number
    time: number
    exploded: boolean
    converging: boolean
    loopClosureEvent: boolean
    resampleTime: number
    resampleTriggered: boolean
    rng?: Rng
  },
): void {
  const rng = opts.rng ?? Math.random
  const { count, time } = opts

  if (opts.resampleTriggered) {
    const indices = systematicResample(weights, rng)
    const nextPositions = new Float32Array(positions.length)
    const nextVelocities = new Float32Array(velocities.length)
    for (let i = 0; i < count; i++) {
      const src = indices[i]
      nextPositions[i * 3] = positions[src * 3]
      nextPositions[i * 3 + 1] = positions[src * 3 + 1]
      nextPositions[i * 3 + 2] = positions[src * 3 + 2]
      nextVelocities[i * 3] = velocities[src * 3]
      nextVelocities[i * 3 + 1] = velocities[src * 3 + 1]
      nextVelocities[i * 3 + 2] = velocities[src * 3 + 2]
    }
    positions.set(nextPositions)
    velocities.set(nextVelocities)

    for (let i = 0; i < count; i++) {
      if (rng() < 0.3) {
        colors[i * 3] = 0
        colors[i * 3 + 1] = 10
        colors[i * 3 + 2] = 10
      } else if (rng() < 0.1) {
        colors[i * 3] = 10
        colors[i * 3 + 1] = 0
        colors[i * 3 + 2] = 0
      }
    }
  }

  const target = particleTarget(time)
  const speed = convergenceSpeed(opts.loopClosureEvent)

  for (let i = 0; i < count; i++) {
    let x = positions[i * 3]
    let y = positions[i * 3 + 1]
    let z = positions[i * 3 + 2]

    if (opts.exploded) {
      x += velocities[i * 3] * 0.5
      y += velocities[i * 3 + 1] * 0.5
      z += velocities[i * 3 + 2] * 0.5
    } else if (opts.converging) {
      x += (target.x - x) * speed
      y += (target.y - y) * speed
      z += (target.z - z) * speed
      if (opts.loopClosureEvent) {
        x += (rng() - 0.5) * 2
        y += (rng() - 0.5) * 2
        z += (rng() - 0.5) * 2
      }
    }

    x += Math.sin(time * 2 + i) * 0.01
    y += Math.cos(time * 2 + i) * 0.01
    z += Math.sin(time * 3 + i) * 0.01

    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z

    if (time - opts.resampleTime > 0.5) {
      const weight = weights[i]
      colors[i * 3] = colors[i * 3] * 0.95 + weight * 0.05
      colors[i * 3 + 1] = colors[i * 3 + 1] * 0.95 + (1 - weight) * 0.05
      colors[i * 3 + 2] = colors[i * 3 + 2] * 0.95 + 0.05
    }
  }
}
