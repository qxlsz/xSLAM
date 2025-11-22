import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CinematicCameraProps {
  loopClosureEvent: boolean
}

export function CinematicCamera({ loopClosureEvent }: CinematicCameraProps) {
  const { camera } = useThree()
  const cameraRef = useRef(camera)
  const orbitRadius = useRef(30)
  const orbitSpeed = useRef(0.2)
  const targetPosition = useRef(new THREE.Vector3(0, 10, 0))
  const slowMotionRef = useRef(false)
  
  useEffect(() => {
    if (loopClosureEvent) {
      // Trigger slow-motion zoom
      slowMotionRef.current = true
      orbitRadius.current = 15
      orbitSpeed.current = 0.05
      
      setTimeout(() => {
        slowMotionRef.current = false
        orbitRadius.current = 30
        orbitSpeed.current = 0.2
      }, 3000)
    }
  }, [loopClosureEvent])
  
  useFrame((state) => {
    const time = state.clock.elapsedTime * orbitSpeed.current
    
    // Smooth camera orbit
    const x = Math.sin(time) * orbitRadius.current
    const y = 15 + Math.sin(time * 0.5) * 5
    const z = Math.cos(time) * orbitRadius.current
    
    // Smooth interpolation
    cameraRef.current.position.lerp(
      new THREE.Vector3(x, y, z),
      slowMotionRef.current ? 0.02 : 0.05
    )
    
    // Look at target with smooth interpolation
    const currentQuaternion = cameraRef.current.quaternion.clone()
    cameraRef.current.lookAt(targetPosition.current)
    const targetQuaternion = cameraRef.current.quaternion.clone()
    cameraRef.current.quaternion.copy(currentQuaternion)
    cameraRef.current.quaternion.slerp(targetQuaternion, 0.05)
    
    // Dynamic FOV for dramatic effect
    if ('fov' in camera) {
      const perspCamera = camera as THREE.PerspectiveCamera
      if (slowMotionRef.current) {
        perspCamera.fov = THREE.MathUtils.lerp(perspCamera.fov, 40, 0.05)
      } else {
        perspCamera.fov = THREE.MathUtils.lerp(perspCamera.fov, 60, 0.02)
      }
      perspCamera.updateProjectionMatrix()
    }
  })
  
  return null
}
