import type { Rgb, Rng } from './math'

export function gaussianSplatColor(hue: number): Rgb {
  if (hue < 0.3) return [0, 1, 1]
  if (hue < 0.6) return [1, 0, 0.5]
  return [1, 1, 0]
}

export function initializeGaussians(count: number, rng: Rng = Math.random) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 4)
  const scales = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rng() - 0.5) * 40
    positions[i * 3 + 1] = rng() * 20
    positions[i * 3 + 2] = (rng() - 0.5) * 40

    const hue = rng()
    const [r, g, b] = gaussianSplatColor(hue)
    colors[i * 4] = r
    colors[i * 4 + 1] = g
    colors[i * 4 + 2] = b
    colors[i * 4 + 3] = 0.6 + rng() * 0.4

    scales[i * 3] = 0.5 + rng() * 1.5
    scales[i * 3 + 1] = 0.5 + rng() * 1.5
    scales[i * 3 + 2] = 0.5 + rng() * 1.5
  }

  return { positions, colors, scales }
}
