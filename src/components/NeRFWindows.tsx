import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, MeshTransmissionMaterial, Text } from '@react-three/drei'
import * as THREE from 'three'

export function NeRFWindows() {
  const windowRefs = useRef<(THREE.Mesh | null)[]>([null, null, null, null])
  const timeRef = useRef(0)
  
  // Window positions
  const windowPositions = useMemo(() => [
    [-15, 18, 0],
    [15, 18, 0],
    [-15, 2, 0],
    [15, 2, 0]
  ] as [number, number, number][], [])
  
  const windowLabels = ['Front View', 'Side View', 'Top View', 'Novel View']
  
  useFrame((state) => {
    const elapsedTime = state.clock.elapsedTime
    timeRef.current = elapsedTime
    
    // Animate windows floating
    windowRefs.current.forEach((ref, i) => {
      if (ref) {
        ref.position.y = windowPositions[i][1] + Math.sin(elapsedTime + i) * 0.5
        ref.rotation.y = Math.sin(elapsedTime * 0.5 + i) * 0.1
      }
    })
  })
  
  return (
    <>
      {windowPositions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Window frame */}
          <RoundedBox
            ref={(el) => {
              windowRefs.current[i] = el
            }}
            args={[5, 3, 0.1]}
            radius={0.1}
            smoothness={4}
          >
            <MeshTransmissionMaterial
              color="#00ffff"
              transmission={0.9}
              thickness={0.5}
              roughness={0.1}
              chromaticAberration={0.2}
              anisotropicBlur={0.3}
              distortion={0.1}
              temporalDistortion={0.1}
              clearcoat={1}
              clearcoatRoughness={0}
            />
          </RoundedBox>
          
          {/* NeRF content - animated spheres transitioning from noise to photoreal */}
          <group position={[0, 0, 0.2]}>
            {Array.from({ length: 20 }).map((_, j) => {
              const angle = (j / 20) * Math.PI * 2
              const radius = 1.5
              const x = Math.cos(angle) * radius
              const y = Math.sin(angle) * radius
              
              return (
                <mesh key={j} position={[x, y, 0]}>
                  <sphereGeometry args={[0.15, 16, 16]} />
                  <meshStandardMaterial
                    color={new THREE.Color().setHSL(
                      (timeRef.current * 0.1 + i * 0.25 + j * 0.05) % 1,
                      0.8,
                      0.5
                    )}
                    metalness={0.8}
                    roughness={Math.sin(timeRef.current + j) * 0.5 + 0.5}
                    emissive={new THREE.Color().setHSL(
                      (timeRef.current * 0.1 + i * 0.25 + j * 0.05) % 1,
                      0.8,
                      0.3
                    )}
                    emissiveIntensity={0.5}
                  />
                </mesh>
              )
            })}
            
            {/* Center sphere - main NeRF reconstruction */}
            <mesh>
              <sphereGeometry args={[0.8, 32, 32]} />
              <meshStandardMaterial
                color="#ffffff"
                metalness={0.9}
                roughness={0.1}
                envMapIntensity={2}
                emissive="#00ffff"
                emissiveIntensity={Math.sin(timeRef.current) * 0.2 + 0.1}
              />
            </mesh>
          </group>
          
          {/* Window label */}
          <Text
            position={[0, -2, 0.1]}
            fontSize={0.3}
            color="#00ffff"
            anchorX="center"
            anchorY="middle"
          >
            {windowLabels[i]}
          </Text>
        </group>
      ))}
    </>
  )
}
