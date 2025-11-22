import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function LidarPointCloud() {
  const pointsRef = useRef<THREE.Points>(null)
  const timeRef = useRef(0)
  const maxPoints = 50000
  const currentPointIndex = useRef(0)
  
  // Initialize point cloud
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(maxPoints * 3)
    const colors = new Float32Array(maxPoints * 3)
    
    // Initialize with zeros
    for (let i = 0; i < maxPoints * 3; i++) {
      positions[i] = 0
      colors[i] = 0
    }
    
    return { positions, colors }
  }, [])

  useFrame(() => {
    if (!pointsRef.current) return
    
    const positionsArray = pointsRef.current.geometry.attributes.position.array as Float32Array
    const colorsArray = pointsRef.current.geometry.attributes.color.array as Float32Array
    
    timeRef.current += 0.01
    
    // Simulate LiDAR scanning - add new points progressively
    const pointsPerFrame = 100
    for (let i = 0; i < pointsPerFrame; i++) {
      const index = currentPointIndex.current % maxPoints
      
      // Generate LiDAR-style scanning pattern
      const angle = timeRef.current * 2 + (i / pointsPerFrame) * Math.PI * 2
      const verticalAngle = Math.sin(timeRef.current * 0.5 + i * 0.1) * Math.PI / 4
      const distance = 10 + Math.random() * 20
      
      // Check for "hits" - create point cloud of environment
      const hitProbability = Math.random()
      if (hitProbability < 0.7) {
        // Hit a surface
        const x = Math.cos(angle) * Math.cos(verticalAngle) * distance
        const y = Math.sin(verticalAngle) * distance + 10
        const z = Math.sin(angle) * Math.cos(verticalAngle) * distance
        
        positionsArray[index * 3] = x
        positionsArray[index * 3 + 1] = y
        positionsArray[index * 3 + 2] = z
        
        // Color based on distance (depth map effect)
        const normalizedDistance = distance / 30
        colorsArray[index * 3] = 0 // Red
        colorsArray[index * 3 + 1] = 1 - normalizedDistance // Green
        colorsArray[index * 3 + 2] = normalizedDistance // Blue
      } else {
        // No hit - place far away or at origin
        positionsArray[index * 3] = 0
        positionsArray[index * 3 + 1] = -1000
        positionsArray[index * 3 + 2] = 0
        
        colorsArray[index * 3] = 0
        colorsArray[index * 3 + 1] = 0
        colorsArray[index * 3 + 2] = 0
      }
      
      currentPointIndex.current++
    }
    
    // Fade old points
    for (let i = 0; i < maxPoints; i++) {
      const age = (currentPointIndex.current - i + maxPoints) % maxPoints
      const fadeFactor = Math.max(0, 1 - age / 10000)
      
      colorsArray[i * 3] *= fadeFactor
      colorsArray[i * 3 + 1] *= fadeFactor
      colorsArray[i * 3 + 2] *= fadeFactor
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    pointsRef.current.geometry.attributes.color.needsUpdate = true
  })

  return (
    <points ref={pointsRef} frustumCulled={false}>
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
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={true}
      />
    </points>
  )
}
