import { describe, expect, it } from 'vitest'
import { mulberry32 } from './math'
import {
  advanceShockwave,
  generatePoseNodes,
  loopClosureSparkOpacity,
  nodeShockwaveLit,
  selectLoopClosurePairs,
  sequentialEdges,
  spatialLoopClosurePairs,
} from './poseGraph'
import { figure8Point } from './trajectory'

describe('generatePoseNodes', () => {
  it('places nodes along the same figure-8 the drone flies', () => {
    const nodes = generatePoseNodes(50)
    expect(nodes).toHaveLength(50)
    expect(nodes[0]).toEqual(figure8Point(0))
    expect(nodes[25]).toEqual(figure8Point((25 / 50) * Math.PI * 4))
    expect(nodes[49]).toEqual(figure8Point((49 / 50) * Math.PI * 4))
  })
})

describe('sequentialEdges', () => {
  it('connects consecutive poses and does not wrap the loop', () => {
    expect(sequentialEdges(4)).toEqual([[0, 1], [1, 2], [2, 3]])
    expect(sequentialEdges(1)).toEqual([])
    expect(sequentialEdges(0)).toEqual([])
  })
})

describe('selectLoopClosurePairs', () => {
  it('keeps only pairs farther apart than the minimum index gap', () => {
    const values = [0.0, 0.8, 0.1, 0.12, 0.02, 0.9]
    let i = 0
    const pairs = selectLoopClosurePairs(50, 3, 10, () => values[i++] ?? 0)
    expect(pairs).toEqual([[0, 40], [1, 45]])
  })

  it('can emit no closures when every draw is a nearby pair', () => {
    expect(selectLoopClosurePairs(50, 3, 10, () => 0)).toEqual([])
  })

  it('is deterministic with a seeded RNG', () => {
    const a = selectLoopClosurePairs(50, 8, 10, mulberry32(21))
    const b = selectLoopClosurePairs(50, 8, 10, mulberry32(21))
    expect(a).toEqual(b)
    for (const [start, end] of a) {
      expect(Math.abs(start - end)).toBeGreaterThan(10)
    }
  })
})

describe('spatialLoopClosurePairs', () => {
  it('pairs figure-8 poses that revisit the same place one lap later', () => {
    const nodes = generatePoseNodes(50)
    const pairs = spatialLoopClosurePairs(nodes, 10, 1e-6)
    expect(pairs).toContainEqual([0, 25])
    expect(pairs).toContainEqual([1, 26])
    expect(pairs).toContainEqual([24, 49])
    expect(pairs.every(([start, end]) => end - start > 10)).toBe(true)
  })

  it('does not pair nearby poses even when they sit on the same lobe', () => {
    const nodes = generatePoseNodes(50)
    const pairs = spatialLoopClosurePairs(nodes, 10, 1e-6)
    expect(pairs.some(([start, end]) => end - start <= 10)).toBe(false)
    expect(pairs).not.toContainEqual([0, 1])
  })

  it('returns no pairs when the distance gate is tighter than any revisit', () => {
    expect(spatialLoopClosurePairs(generatePoseNodes(8), 2, -1)).toEqual([])
  })
})

describe('shockwave helpers', () => {
  it('advances and clamps the shockwave to 1', () => {
    expect(advanceShockwave(0.5)).toBeCloseTo(0.52)
    expect(advanceShockwave(0.99)).toBe(1)
    expect(advanceShockwave(1)).toBe(1)
  })

  it('lights nodes once the wave front passes their index', () => {
    expect(nodeShockwaveLit(0.2, 5, 50)).toBe(true)
    expect(nodeShockwaveLit(0.2, 20, 50)).toBe(false)
  })

  it('keeps sparks invisible ahead of the wave and positive just behind it', () => {
    expect(loopClosureSparkOpacity(0.2, 0.4)).toBeCloseTo(0)
    expect(loopClosureSparkOpacity(0.75, 0.25)).toBeCloseTo(1)
    expect(loopClosureSparkOpacity(0.5, 0.5)).toBeCloseTo(0)
  })
})
