import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { initializeGaussians } from '../lib/gaussians'

// Custom shader for gaussian splats
const GaussianShaderMaterial = {
  uniforms: {
    time: { value: 0 },
    scale: { value: 1 },
  },
  vertexShader: `
    attribute vec4 instanceColor;
    uniform float time;
    uniform float scale;
    varying vec4 vColor;
    varying float vAlpha;
    
    void main() {
      vColor = instanceColor;
      
      // Extract instance position from the matrix (column 3)
      vec3 instancePos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
      
      // Shimmering effect
      float shimmer = 1.0 + sin(time * 2.0 + instancePos.x) * 0.1;
      
      // Apply scale and shimmer to local position
      vec3 transformed = position * scale * shimmer;
      
      // Calculate world position
      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);
      
      gl_Position = projectionMatrix * mvPosition;
      
      // Distance-based alpha
      float dist = length(mvPosition.xyz);
      vAlpha = 1.0 - smoothstep(10.0, 50.0, dist);
    }
  `,
  fragmentShader: `
    varying vec4 vColor;
    varying float vAlpha;
    
    void main() {
      gl_FragColor = vec4(vColor.rgb, vColor.a * vAlpha);
    }
  `
}

interface GaussianSplattingProps {
  scale: number
  count: number
}

export function GaussianSplatting({ scale, count }: GaussianSplattingProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const burstTimeRef = useRef(0)
  const pruneTimeRef = useRef(0)

  const { positions, colors, scales } = useMemo(() => initializeGaussians(count), [count])

  // Update instances
  useEffect(() => {
    if (!meshRef.current) return
    
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      )
      dummy.scale.set(
        scales[i * 3],
        scales[i * 3 + 1],
        scales[i * 3 + 2]
      )
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
      
      const color = new THREE.Color(
        colors[i * 4],
        colors[i * 4 + 1],
        colors[i * 4 + 2]
      )
      meshRef.current.setColorAt(i, color)
    }
    
    if (meshRef.current.instanceMatrix) {
      meshRef.current.instanceMatrix.needsUpdate = true
    }
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  }, [count, positions, colors, scales, dummy])

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return
    
    // Update shader time
    materialRef.current.uniforms.time.value = state.clock.elapsedTime
    materialRef.current.uniforms.scale.value = scale
    
    // Clone burst effect (white flash)
    if (Math.random() < 0.002) {
      burstTimeRef.current = state.clock.elapsedTime
      const burstIndex = Math.floor(Math.random() * count)
      const whiteColor = new THREE.Color(10, 10, 10) // Overexposed white
      meshRef.current.setColorAt(burstIndex, whiteColor)
      if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true
      }
    }
    
    // Prune flash effect (red flash)
    if (Math.random() < 0.001) {
      pruneTimeRef.current = state.clock.elapsedTime
      const pruneIndex = Math.floor(Math.random() * count)
      const redColor = new THREE.Color(10, 0, 0) // Bright red
      meshRef.current.setColorAt(pruneIndex, redColor)
      if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true
      }
    }
    
    // Reset colors after flash
    if (state.clock.elapsedTime - burstTimeRef.current > 0.1) {
      for (let i = 0; i < Math.min(10, count); i++) {
        const index = Math.floor(Math.random() * count)
        const originalColor = new THREE.Color(
          colors[index * 4],
          colors[index * 4 + 1],
          colors[index * 4 + 2]
        )
        meshRef.current.setColorAt(index, originalColor)
      }
      if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true
      }
    }
    
    // Adaptive density animation
    for (let i = 0; i < Math.min(100, count); i++) {
      const index = Math.floor(Math.random() * count)
      dummy.position.set(
        positions[index * 3],
        positions[index * 3 + 1] + Math.sin(state.clock.elapsedTime * 2 + index) * 0.1,
        positions[index * 3 + 2]
      )
      dummy.scale.set(
        scales[index * 3] * (1 + Math.sin(state.clock.elapsedTime * 3 + index) * 0.2),
        scales[index * 3 + 1] * (1 + Math.cos(state.clock.elapsedTime * 3 + index) * 0.2),
        scales[index * 3 + 2]
      )
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(index, dummy.matrix)
    }
    
    if (meshRef.current.instanceMatrix) {
      meshRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <shaderMaterial
        ref={materialRef}
        {...GaussianShaderMaterial}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  )
}
