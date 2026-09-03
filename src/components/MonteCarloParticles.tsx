import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { initializeParticles, stepParticles } from '../lib/particles'

interface MonteCarloParticlesProps {
  count: number
  loopClosureEvent: boolean
}

export function MonteCarloParticles({ count, loopClosureEvent }: MonteCarloParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null)
  const [exploded, setExploded] = useState(true)
  const [converging, setConverging] = useState(false)
  const resampleTime = useRef(0)

  const { positions, colors, velocities, weights } = useMemo(
    () => initializeParticles(count),
    [count],
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setExploded(false)
      setConverging(true)
    }, 2000)
    return () => window.clearTimeout(timeout)
  }, [])

  useFrame((state) => {
    if (!particlesRef.current) return
    
    const positionsArray = particlesRef.current.geometry.attributes.position.array as Float32Array
    const colorsArray = particlesRef.current.geometry.attributes.color.array as Float32Array
    const time = state.clock.elapsedTime
    const resampleTriggered = Math.random() < 0.01 || loopClosureEvent
    if (resampleTriggered) {
      resampleTime.current = time
    }

    stepParticles(
      positionsArray,
      colorsArray,
      velocities,
      weights,
      {
        count,
        time,
        exploded,
        converging,
        loopClosureEvent,
        resampleTime: resampleTime.current,
        resampleTriggered,
      },
    )
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true
    particlesRef.current.geometry.attributes.color.needsUpdate = true
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        transparent
        opacity={0.8}
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={true}
      />
    </points>
  )
}
