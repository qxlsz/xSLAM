import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, MeshTransmissionMaterial, Text } from '@react-three/drei'
import * as THREE from 'three'

function NeRFWindow({
  position,
  label,
  index,
}: {
  position: [number, number, number]
  label: string
  index: number
}) {
  const frameRef = useRef<THREE.Mesh>(null)
  const contentRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    const elapsedTime = state.clock.elapsedTime
    if (frameRef.current) {
      frameRef.current.position.y = position[1] + Math.sin(elapsedTime + index) * 0.5
      frameRef.current.rotation.y = Math.sin(elapsedTime * 0.5 + index) * 0.1
    }
    if (contentRef.current) {
      contentRef.current.children.forEach((child, j) => {
        const mesh = child as THREE.Mesh
        const material = mesh.material as THREE.MeshStandardMaterial
        if (j < 20) {
          material.color.setHSL((elapsedTime * 0.1 + index * 0.25 + j * 0.05) % 1, 0.8, 0.5)
          material.emissive.setHSL((elapsedTime * 0.1 + index * 0.25 + j * 0.05) % 1, 0.8, 0.3)
          material.roughness = Math.sin(elapsedTime + j) * 0.5 + 0.5
        } else {
          material.emissiveIntensity = Math.sin(elapsedTime) * 0.2 + 0.1
        }
      })
    }
  })

  return (
    <group position={position}>
      <RoundedBox
        ref={frameRef}
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
      
      <group ref={contentRef} position={[0, 0, 0.2]}>
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
                  (index * 0.25 + j * 0.05) % 1,
                  0.8,
                  0.5
                )}
                metalness={0.8}
                roughness={0.5}
                emissive={new THREE.Color().setHSL(
                  (index * 0.25 + j * 0.05) % 1,
                  0.8,
                  0.3
                )}
                emissiveIntensity={0.5}
              />
            </mesh>
          )
        })}
        
        <mesh>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            metalness={0.9}
            roughness={0.1}
            envMapIntensity={2}
            emissive="#00ffff"
            emissiveIntensity={0.1}
          />
        </mesh>
      </group>
      
      <Text
        position={[0, -2, 0.1]}
        fontSize={0.3}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  )
}

export function NeRFWindows() {
  const windowPositions = useMemo(() => [
    [-15, 18, 0],
    [15, 18, 0],
    [-15, 2, 0],
    [15, 2, 0]
  ] as [number, number, number][], [])
  
  const windowLabels = ['Front View', 'Side View', 'Top View', 'Novel View']
  
  return (
    <>
      {windowPositions.map((pos, i) => (
        <NeRFWindow
          key={i}
          position={pos}
          label={windowLabels[i]}
          index={i}
        />
      ))}
    </>
  )
}
