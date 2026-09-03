import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useControls, button } from 'leva'
import {
  clearLidarTimestamps,
  initializeLidarBuffers,
  lidarDecayFromPersistence,
  lidarScanAngles,
  writeLidarSample,
} from '../lib/lidar'

let lidarClearHandler = () => {}

const LidarShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uDecay: { value: 0.5 },
    uPointSize: { value: 4.0 },
    uColorMode: { value: 0 }, // 0: Distance, 1: Height, 2: Intensity
    uMaxRange: { value: 30.0 }
  },
  vertexShader: `
    attribute float timestamp;
    varying float vAge;
    varying vec3 vPos;
    varying float vDist;
    uniform float uTime;
    uniform float uPointSize;

    void main() {
      vPos = position;
      vAge = uTime - timestamp;
      vDist = length(position);
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation
      gl_PointSize = uPointSize * (300.0 / -mvPosition.z);
    }
  `,
  fragmentShader: `
    uniform float uDecay;
    uniform int uColorMode;
    uniform float uMaxRange;
    
    varying float vAge;
    varying vec3 vPos;
    varying float vDist;

    void main() {
      // Keep in sync with lidarAlpha / lidarColor in src/lib/lidar.ts
      float alpha = 1.0 - (vAge * uDecay);
      
      if (alpha <= 0.0) discard;
      
      vec3 color = vec3(1.0);
      
      if (uColorMode == 0) {
        // Distance (Cyan -> Red)
        float t = clamp(vDist / uMaxRange, 0.0, 1.0);
        color = mix(vec3(0.0, 1.0, 1.0), vec3(1.0, 0.0, 0.0), t);
      } else if (uColorMode == 1) {
        // Height (Blue -> Yellow)
        float t = clamp((vPos.y + 5.0) / 20.0, 0.0, 1.0);
        color = mix(vec3(0.0, 0.0, 1.0), vec3(1.0, 1.0, 0.0), t);
      } else {
        // Intensity (Green fade)
        color = vec3(0.0, 1.0, 0.0);
      }

      gl_FragColor = vec4(color, alpha);
    }
  `
}

export function LidarPointCloud() {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const timeRef = useRef(0)
  const maxPoints = 100000
  const currentPointIndex = useRef(0)
  
  const { 
    scanSpeed, 
    pointsPerFrame, 
    maxRange, 
    pointSize, 
    persistence, 
    colorMode,
    freeze 
  } = useControls('LiDAR System', {
    scanSpeed: { value: 1.0, min: 0, max: 5, step: 0.1 },
    pointsPerFrame: { value: 200, min: 10, max: 1000, step: 10 },
    maxRange: { value: 30, min: 5, max: 100 },
    pointSize: { value: 0.05, min: 0.01, max: 0.2 },
    persistence: { value: 0.95, min: 0.1, max: 1, label: 'Persistence' },
    colorMode: { options: { 'Distance': 0, 'Height': 1, 'Intensity': 2 } },
    freeze: { value: false, label: 'Freeze Scan' },
    clear: button(() => {
      lidarClearHandler()
    })
  })

  useEffect(() => {
    lidarClearHandler = () => {
      if (!pointsRef.current) return
      const timestampsArray = pointsRef.current.geometry.attributes.timestamp.array as Float32Array
      clearLidarTimestamps(timestampsArray)
      pointsRef.current.geometry.attributes.timestamp.needsUpdate = true
    }
    return () => {
      lidarClearHandler = () => {}
    }
  })
  
  const { positions, timestamps } = useMemo(() => initializeLidarBuffers(maxPoints), [])

  useFrame((state) => {
    if (!pointsRef.current || !materialRef.current) return
    
    const time = state.clock.elapsedTime
    timeRef.current = time
    
    // Update uniforms
    materialRef.current.uniforms.uTime.value = time
    materialRef.current.uniforms.uDecay.value = lidarDecayFromPersistence(persistence)
    materialRef.current.uniforms.uPointSize.value = pointSize
    materialRef.current.uniforms.uColorMode.value = colorMode
    materialRef.current.uniforms.uMaxRange.value = maxRange
    
    if (freeze) return

    const positionsArray = pointsRef.current.geometry.attributes.position.array as Float32Array
    const timestampsArray = pointsRef.current.geometry.attributes.timestamp.array as Float32Array
    
    for (let i = 0; i < pointsPerFrame; i++) {
      const { azimuth, elevation } = lidarScanAngles(time, scanSpeed, i, pointsPerFrame)
      writeLidarSample(
        positionsArray,
        timestampsArray,
        currentPointIndex.current,
        azimuth,
        elevation,
        maxRange,
        time,
      )
      currentPointIndex.current++
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    pointsRef.current.geometry.attributes.timestamp.needsUpdate = true
  })

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-timestamp"
          args={[timestamps, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        {...LidarShaderMaterial}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
