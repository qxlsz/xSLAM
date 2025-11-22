import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface MonteCarloParticlesProps {
  count: number
  loopClosureEvent: boolean
}

export function MonteCarloParticles({ count, loopClosureEvent }: MonteCarloParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null)
  const [exploded, setExploded] = useState(false)
  const [converging, setConverging] = useState(false)
  const velocitiesRef = useRef<Float32Array>(new Float32Array())
  const weightsRef = useRef<Float32Array>(new Float32Array())
  const resampleTime = useRef(0)

  // Initialize particle system
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const weights = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      // Initial explosion positions
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const radius = Math.random() * 30
      
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius
      positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius + 10
      positions[i * 3 + 2] = Math.cos(phi) * radius
      
      // Explosion velocities
      velocities[i * 3] = (Math.random() - 0.5) * 2
      velocities[i * 3 + 1] = Math.random() * 2
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2
      
      // Particle weights (importance)
      weights[i] = Math.random()
      
      // Initial colors (cyan to red gradient based on weight)
      const weight = weights[i]
      colors[i * 3] = weight // Red channel
      colors[i * 3 + 1] = 1 - weight // Green channel
      colors[i * 3 + 2] = 1 // Blue channel
    }
    
    velocitiesRef.current = velocities
    weightsRef.current = weights
    
    return { positions, colors }
  }, [count])

  // Trigger explosion on mount
  useEffect(() => {
    setExploded(true)
    setTimeout(() => {
      setExploded(false)
      setConverging(true)
    }, 2000)
  }, [])

  useFrame((state) => {
    if (!particlesRef.current || !velocitiesRef.current || !weightsRef.current) return
    
    const positionsArray = particlesRef.current.geometry.attributes.position.array as Float32Array
    const colorsArray = particlesRef.current.geometry.attributes.color.array as Float32Array
    const time = state.clock.elapsedTime
    
    // Resampling effect
    if (Math.random() < 0.01 || loopClosureEvent) {
      resampleTime.current = time
      
      // Flash particles during resampling
      for (let i = 0; i < count; i++) {
        if (Math.random() < 0.3) {
          // Flash cyan
          colorsArray[i * 3] = 0
          colorsArray[i * 3 + 1] = 10
          colorsArray[i * 3 + 2] = 10
        } else if (Math.random() < 0.1) {
          // Flash red
          colorsArray[i * 3] = 10
          colorsArray[i * 3 + 1] = 0
          colorsArray[i * 3 + 2] = 0
        }
      }
    }
    
    // Update particles
    for (let i = 0; i < count; i++) {
      let x = positionsArray[i * 3]
      let y = positionsArray[i * 3 + 1]
      let z = positionsArray[i * 3 + 2]
      
      if (exploded) {
        // Explosion phase
        x += velocitiesRef.current[i * 3] * 0.5
        y += velocitiesRef.current[i * 3 + 1] * 0.5
        z += velocitiesRef.current[i * 3 + 2] * 0.5
      } else if (converging) {
        // Convergence phase - violent convergence to drone position
        const targetX = Math.sin(time * 0.5) * 15
        const targetY = Math.sin(time) * 5 + 10
        const targetZ = Math.cos(time * 0.5) * 15
        
        const convergenceSpeed = loopClosureEvent ? 0.2 : 0.05
        x += (targetX - x) * convergenceSpeed
        y += (targetY - y) * convergenceSpeed
        z += (targetZ - z) * convergenceSpeed
        
        // Add jitter for violent effect
        if (loopClosureEvent) {
          x += (Math.random() - 0.5) * 2
          y += (Math.random() - 0.5) * 2
          z += (Math.random() - 0.5) * 2
        }
      }
      
      // Add floating motion
      x += Math.sin(time * 2 + i) * 0.01
      y += Math.cos(time * 2 + i) * 0.01
      z += Math.sin(time * 3 + i) * 0.01
      
      positionsArray[i * 3] = x
      positionsArray[i * 3 + 1] = y
      positionsArray[i * 3 + 2] = z
      
      // Restore colors gradually
      if (time - resampleTime.current > 0.5) {
        const weight = weightsRef.current[i]
        colorsArray[i * 3] = colorsArray[i * 3] * 0.95 + weight * 0.05
        colorsArray[i * 3 + 1] = colorsArray[i * 3 + 1] * 0.95 + (1 - weight) * 0.05
        colorsArray[i * 3 + 2] = colorsArray[i * 3 + 2] * 0.95 + 1 * 0.05
      }
    }
    
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
