import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Trail, Box, Cone } from '@react-three/drei'
import * as THREE from 'three'

interface DroneSystemProps {
  enableTrail: boolean
  speed: number
  loopClosureEvent: boolean
}

export function DroneSystem({ enableTrail, speed, loopClosureEvent }: DroneSystemProps) {
  const droneRef = useRef<THREE.Group>(null)
  const trajectoryPoints = useRef<THREE.Vector3[]>([])
  const time = useRef(0)

  // Generate figure-8 trajectory with loop
  const trajectory = useMemo(() => {
    const points: THREE.Vector3[] = []
    const segments = 200
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 4
      const x = Math.sin(t) * 15
      const y = Math.sin(t * 2) * 5 + 10
      const z = Math.cos(t) * 15
      points.push(new THREE.Vector3(x, y, z))
    }
    return points
  }, [])

  useFrame((state, delta) => {
    if (!droneRef.current) return

    time.current += delta * speed * 0.5
    const t = time.current % (Math.PI * 4)
    
    // Calculate position
    const x = Math.sin(t) * 15
    const y = Math.sin(t * 2) * 5 + 10
    const z = Math.cos(t) * 15
    
    // Apply loop closure snap effect
    if (loopClosureEvent) {
      const snapOffset = Math.sin(state.clock.elapsedTime * 20) * 0.5
      droneRef.current.position.set(x + snapOffset, y, z + snapOffset)
    } else {
      droneRef.current.position.set(x, y, z)
    }
    
    // Calculate velocity for rotation
    const dx = Math.cos(t) * 15
    const dy = Math.cos(t * 2) * 10
    const dz = -Math.sin(t) * 15
    
    // Look in direction of movement
    const direction = new THREE.Vector3(dx, dy, dz).normalize()
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      direction
    )
    droneRef.current.quaternion.slerp(quaternion, 0.1)
    
    // Store trajectory points
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
        {[[-0.7, 0.3, -0.7], [0.7, 0.3, -0.7], [-0.7, 0.3, 0.7], [0.7, 0.3, 0.7]].map((pos, i) => (
          <group key={i} position={pos as [number, number, number]}>
            <mesh rotation={[0, Date.now() * 0.01, 0]}>
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
      {enableTrail && droneRef.current && (
        <Trail
          width={2}
          length={50}
          color="#0088ff"
          attenuation={(t) => t * t}
          target={droneRef as any}
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
          0.2 + Math.sin(Date.now() * 0.001) * 0.1,
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
