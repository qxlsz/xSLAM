import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Custom shader for gaussian splats
const GaussianShaderMaterial = {
  uniforms: {
    time: { value: 0 },
    scale: { value: 1 },
  },
  vertexShader: `
    attribute vec3 instancePosition;
    attribute vec4 instanceColor;
    attribute vec3 instanceScale;
    uniform float time;
    uniform float scale;
    varying vec4 vColor;
    varying float vAlpha;
    
    void main() {
      vColor = instanceColor;
      vec3 pos = position * instanceScale * scale;
      
      // Shimmering effect
      pos *= 1.0 + sin(time * 2.0 + instancePosition.x) * 0.1;
      
      vec4 worldPos = instanceMatrix * vec4(pos, 1.0);
      worldPos.xyz += instancePosition;
      
      // Distance-based alpha
      float dist = length(cameraPosition - worldPos.xyz);
      vAlpha = 1.0 - smoothstep(10.0, 50.0, dist);
      
      gl_Position = projectionMatrix * modelViewMatrix * worldPos;
      gl_PointSize = (300.0 * scale) / dist;
    }
  `,
  fragmentShader: `
    varying vec4 vColor;
    varying float vAlpha;
    
    void main() {
      // Ellipsoidal shape
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      if (dist > 0.5) discard;
      
      float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
      gl_FragColor = vec4(vColor.rgb, alpha * vAlpha * vColor.a);
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

  // Initialize positions and colors
  const { positions, colors, scales } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 4)
    const scales = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      // Distributed in 3D space
      positions[i * 3] = (Math.random() - 0.5) * 40
      positions[i * 3 + 1] = Math.random() * 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40
      
      // Cyberpunk colors
      const hue = Math.random()
      if (hue < 0.3) {
        colors[i * 4] = 0; colors[i * 4 + 1] = 1; colors[i * 4 + 2] = 1 // Cyan
      } else if (hue < 0.6) {
        colors[i * 4] = 1; colors[i * 4 + 1] = 0; colors[i * 4 + 2] = 0.5 // Magenta
      } else {
        colors[i * 4] = 1; colors[i * 4 + 1] = 1; colors[i * 4 + 2] = 0 // Yellow
      }
      colors[i * 4 + 3] = 0.6 + Math.random() * 0.4
      
      // Ellipsoidal scales
      scales[i * 3] = 0.5 + Math.random() * 1.5
      scales[i * 3 + 1] = 0.5 + Math.random() * 1.5
      scales[i * 3 + 2] = 0.5 + Math.random() * 1.5
    }
    
    return { positions, colors, scales }
  }, [count])

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
