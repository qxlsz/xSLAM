import { useRef, useMemo, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Trail, Box, Cone } from '@react-three/drei'
import * as THREE from 'three'
import {
  figure8Point,
  figure8Velocity,
  generateFigure8Path,
  loopClosureSnapOffset,
  wrapTrajectoryTime,
} from '../lib/trajectory'

interface DroneSystemProps {
  enableTrail: boolean
  speed: number
  loopClosureEvent: boolean
}

export function DroneSystem({ enableTrail, speed, loopClosureEvent }: DroneSystemProps) {
  const droneRef = useRef<THREE.Group>(null)
  const rotorsRef = useRef<THREE.Group>(null)
  const trajectoryPoints = useRef<THREE.Vector3[]>([])
  const time = useRef(0)

  const trajectory = useMemo(
    () => generateFigure8Path(200).map((p) => new THREE.Vector3(p.x, p.y, p.z)),
    [],
  )

  useFrame((state, delta) => {
    if (!droneRef.current) return

    time.current += delta * speed * 0.5
    const t = wrapTrajectoryTime(time.current)
    const { x, y, z } = figure8Point(t)
    
    if (loopClosureEvent) {
      const snapOffset = loopClosureSnapOffset(state.clock.elapsedTime, 0.5)
      droneRef.current.position.set(x + snapOffset, y, z + snapOffset)
    } else {
      droneRef.current.position.set(x, y, z)
    }
    
    const { x: dx, y: dy, z: dz } = figure8Velocity(t)
    const direction = new THREE.Vector3(dx, dy, dz).normalize()
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      direction
    )
    droneRef.current.quaternion.slerp(quaternion, 0.1)

    if (rotorsRef.current) {
      const spin = time.current * 40
      for (const rotor of rotorsRef.current.children) {
        rotor.rotation.y = spin
      }
    }
    
    if (trajectoryPoints.current.length < 1000) {
      trajectoryPoints.current.push(droneRef.current.position.clone())
    }
  })

  return (
    <>
      <group ref={droneRef}>
        {/* Drone body - cyberpunk design */}
        <mesh>
          <Box args={[1, 0.3, 1]}>
            <meshStandardMaterial 
              color="#00ffff" 
              emissive="#00ffff" 
              emissiveIntensity={0.5}
              metalness={0.8}
              roughness={0.2}
            />
          </Box>
        </mesh>
        
        {/* Drone rotors */}
        <group ref={rotorsRef}>
          {[[-0.7, 0.3, -0.7], [0.7, 0.3, -0.7], [-0.7, 0.3, 0.7], [0.7, 0.3, 0.7]].map((pos, i) => (
            <group key={i} position={pos as [number, number, number]}>
              <mesh>
                <cylinderGeometry args={[0.3, 0.3, 0.05]} />
                <meshStandardMaterial 
                  color="#ffffff" 
                  emissive="#00ffff"
                  emissiveIntensity={0.3}
                  transparent
                  opacity={0.6}
                />
              </mesh>
            </group>
          ))}
        </group>
        
        {/* Drone camera/sensor */}
        <Cone args={[0.2, 0.4]} position={[0, -0.3, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial 
            color="#ff0080" 
            emissive="#ff0080"
            emissiveIntensity={0.8}
          />
        </Cone>
        
        {/* Drone lights */}
        <pointLight color="#00ffff" intensity={2} distance={10} />
        <pointLight color="#ff0080" intensity={1} distance={5} position={[0, -0.3, 0.5]} />
      </group>
      
      {/* Neon trail */}
      {enableTrail && (
        <Trail
          width={2}
          length={50}
          color="#0088ff"
          attenuation={(t) => t * t}
          target={droneRef as RefObject<THREE.Object3D>}
        />
      )}
      
      {/* Trajectory path visualization */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(trajectory.flatMap(p => [p.x, p.y, p.z])), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial 
          color="#FFD700" 
          opacity={0.3} 
          transparent 
          linewidth={1}
        />
      </line>
      
      {/* Covariance ribbon */}
      <mesh>
        <tubeGeometry args={[
          new THREE.CatmullRomCurve3(trajectory.slice(0, 50)),
          50,
          0.2,
          8,
          false
        ]} />
        <meshStandardMaterial 
          color="#8800ff"
          transparent
          opacity={0.3}
          emissive="#8800ff"
          emissiveIntensity={0.2}
        />
      </mesh>
    </>
  )
}
