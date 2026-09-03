import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Line, Sphere } from '@react-three/drei'
import { loopClosureSnapOffset } from '../lib/trajectory'
import {
  advanceShockwave,
  generatePoseNodes,
  loopClosureSparkOpacity,
  nodeShockwaveLit,
  selectLoopClosurePairs,
  sequentialEdges,
} from '../lib/poseGraph'

interface GraphSLAMProps {
  loopClosureEvent: boolean
}

export function GraphSLAM({ loopClosureEvent }: GraphSLAMProps) {
  const poseGraphRef = useRef<THREE.Group>(null)
  const [shockwaveProgress, setShockwaveProgress] = useState(0)
  const [loopClosureEdges, setLoopClosureEdges] = useState<[THREE.Vector3, THREE.Vector3][]>([])
  const wasLoopClosure = useRef(false)
  const clearAtMs = useRef<number | null>(null)
  
  const poseNodes = useMemo(
    () => generatePoseNodes(50).map((node) => new THREE.Vector3(node.x, node.y, node.z)),
    [],
  )

  const edges = useMemo(
    () => sequentialEdges(poseNodes.length).map(([a, b]) => [poseNodes[a], poseNodes[b]] as [THREE.Vector3, THREE.Vector3]),
    [poseNodes],
  )

  useFrame((state) => {
    if (!poseGraphRef.current) return

    if (loopClosureEvent && !wasLoopClosure.current) {
      setLoopClosureEdges(
        selectLoopClosurePairs(poseNodes.length, 3, 10).map(
          ([start, end]) => [poseNodes[start], poseNodes[end]] as [THREE.Vector3, THREE.Vector3],
        ),
      )
      setShockwaveProgress(0)
      clearAtMs.current = performance.now() + 3000
    }
    if (clearAtMs.current !== null && performance.now() >= clearAtMs.current) {
      setLoopClosureEdges([])
      clearAtMs.current = null
    }
    wasLoopClosure.current = loopClosureEvent
    
    if (loopClosureEvent) {
      if (shockwaveProgress < 1) {
        setShockwaveProgress((prev) => advanceShockwave(prev))
      }
      const snapIntensity = loopClosureSnapOffset(state.clock.elapsedTime, 0.2)
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
            color={loopClosureEvent && nodeShockwaveLit(shockwaveProgress, i, poseNodes.length) ? "#00ff00" : "#FFD700"}
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
                  opacity={loopClosureSparkOpacity(shockwaveProgress, t)}
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
