import { useRef, useEffect, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Line, Sphere } from '@react-three/drei'

interface GraphSLAMProps {
  loopClosureEvent: boolean
}

export function GraphSLAM({ loopClosureEvent }: GraphSLAMProps) {
  const poseGraphRef = useRef<THREE.Group>(null)
  const [shockwaveProgress, setShockwaveProgress] = useState(0)
  const [loopClosureEdges, setLoopClosureEdges] = useState<[THREE.Vector3, THREE.Vector3][]>([])
  
  // Generate pose graph nodes
  const poseNodes = useMemo(() => {
    const nodes: THREE.Vector3[] = []
    const numNodes = 50
    
    for (let i = 0; i < numNodes; i++) {
      const t = (i / numNodes) * Math.PI * 4
      const x = Math.sin(t) * 15
      const y = Math.sin(t * 2) * 5 + 10
      const z = Math.cos(t) * 15
      nodes.push(new THREE.Vector3(x, y, z))
    }
    
    return nodes
  }, [])

  // Generate edges between consecutive poses
  const edges = useMemo(() => {
    const edgeList: [THREE.Vector3, THREE.Vector3][] = []
    for (let i = 0; i < poseNodes.length - 1; i++) {
      edgeList.push([poseNodes[i], poseNodes[i + 1]])
    }
    return edgeList
  }, [poseNodes])

  // Handle loop closure event
  useEffect(() => {
    if (loopClosureEvent) {
      // Create loop closure edges
      const newEdges: [THREE.Vector3, THREE.Vector3][] = []
      
      // Add loop closure connections
      for (let i = 0; i < 3; i++) {
        const start = Math.floor(Math.random() * poseNodes.length)
        const end = Math.floor(Math.random() * poseNodes.length)
        if (Math.abs(start - end) > 10) {
          newEdges.push([poseNodes[start], poseNodes[end]])
        }
      }
      
      setLoopClosureEdges(newEdges)
      setShockwaveProgress(0)
      
      // Clear loop closure edges after animation
      setTimeout(() => {
        setLoopClosureEdges([])
      }, 3000)
    }
  }, [loopClosureEvent, poseNodes])

  useFrame((state) => {
    if (!poseGraphRef.current) return
    
    // Animate shockwave
    if (loopClosureEvent && shockwaveProgress < 1) {
      setShockwaveProgress(prev => Math.min(prev + 0.02, 1))
    }
    
    // Snap effect during loop closure
    if (loopClosureEvent) {
      const snapIntensity = Math.sin(state.clock.elapsedTime * 20) * 0.2
      poseGraphRef.current.position.x = snapIntensity
      poseGraphRef.current.position.z = snapIntensity
    } else {
      poseGraphRef.current.position.x = 0
      poseGraphRef.current.position.z = 0
    }
  })

  return (
    <group ref={poseGraphRef}>
      {/* Pose nodes */}
      {poseNodes.map((node, i) => (
        <Sphere
          key={i}
          position={node}
          args={[0.2]}
        >
          <meshStandardMaterial
            color={loopClosureEvent && shockwaveProgress > i / poseNodes.length ? "#00ff00" : "#FFD700"}
            emissive={loopClosureEvent ? "#00ff00" : "#FFD700"}
            emissiveIntensity={loopClosureEvent ? 1 : 0.3}
          />
        </Sphere>
      ))}
      
      {/* Sequential edges */}
      {edges.map((edge, i) => (
        <Line
          key={`edge-${i}`}
          points={edge}
          color={loopClosureEvent ? "#00ff00" : "#FFD700"}
          lineWidth={loopClosureEvent ? 3 : 1}
          opacity={0.6}
          transparent
        />
      ))}
      
      {/* Loop closure edges */}
      {loopClosureEdges.map((edge, i) => (
        <group key={`loop-${i}`}>
          <Line
            points={edge}
            color="#00ff00"
            lineWidth={5}
            opacity={0.9}
            transparent
          />
          {/* Electric effect particles along edge */}
          {Array.from({ length: 10 }).map((_, j) => {
            const t = j / 10
            const pos = new THREE.Vector3().lerpVectors(edge[0], edge[1], t)
            return (
              <mesh key={`spark-${i}-${j}`} position={pos}>
                <sphereGeometry args={[0.1]} />
                <meshBasicMaterial
                  color="#00ffff"
                  transparent
                  opacity={Math.sin((shockwaveProgress - t) * Math.PI) * (shockwaveProgress > t ? 1 : 0)}
                />
              </mesh>
            )
          })}
        </group>
      ))}
      
      {/* Shockwave ring */}
      {loopClosureEvent && shockwaveProgress > 0 && (
        <mesh position={[0, 10, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[shockwaveProgress * 30, shockwaveProgress * 30 + 2, 64]} />
          <meshBasicMaterial
            color="#00ff00"
            transparent
            opacity={1 - shockwaveProgress}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  )
}
