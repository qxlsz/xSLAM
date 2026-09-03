import type { Rng, Vec3 } from './math'
import { figure8Point } from './trajectory'

export function generatePoseNodes(numNodes: number): Vec3[] {
  const nodes: Vec3[] = []
  for (let i = 0; i < numNodes; i++) {
    const t = (i / numNodes) * Math.PI * 4
    nodes.push(figure8Point(t))
  }
  return nodes
}

export function sequentialEdges(count: number): Array<[number, number]> {
  const edges: Array<[number, number]> = []
  for (let i = 0; i < count - 1; i++) {
    edges.push([i, i + 1])
  }
  return edges
}

export function spatialLoopClosurePairs(
  nodes: Vec3[],
  minIndexSeparation: number,
  maxDistance: number,
): Array<[number, number]> {
  const pairs: Array<[number, number]> = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (j - i <= minIndexSeparation) continue
      const dx = nodes[i].x - nodes[j].x
      const dy = nodes[i].y - nodes[j].y
      const dz = nodes[i].z - nodes[j].z
      if (Math.hypot(dx, dy, dz) <= maxDistance) {
        pairs.push([i, j])
      }
    }
  }
  return pairs
}

export function selectLoopClosurePairs(
  nodeCount: number,
  attempts: number,
  minSeparation: number,
  rng: Rng = Math.random,
): Array<[number, number]> {
  const pairs: Array<[number, number]> = []
  for (let i = 0; i < attempts; i++) {
    const start = Math.floor(rng() * nodeCount)
    const end = Math.floor(rng() * nodeCount)
    if (Math.abs(start - end) > minSeparation) {
      pairs.push([start, end])
    }
  }
  return pairs
}

export function advanceShockwave(progress: number, step = 0.02): number {
  return Math.min(progress + step, 1)
}

export function loopClosureSparkOpacity(progress: number, t: number): number {
  return Math.sin((progress - t) * Math.PI) * (progress > t ? 1 : 0)
}

export function nodeShockwaveLit(progress: number, index: number, count: number): boolean {
  return progress > index / count
}
