import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  cameraFollowAlpha,
  fovLerpAlpha,
  orbitCameraPosition,
  targetFov,
} from '../lib/cinematic'

interface CinematicCameraProps {
  loopClosureEvent: boolean
}

export function CinematicCamera({ loopClosureEvent }: CinematicCameraProps) {
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
    const camera = state.camera
    const time = state.clock.elapsedTime * orbitSpeed.current
    const orbit = orbitCameraPosition(time, orbitRadius.current)

    camera.position.lerp(
      new THREE.Vector3(orbit.x, orbit.y, orbit.z),
      cameraFollowAlpha(slowMotionRef.current)
    )
    
    const currentQuaternion = camera.quaternion.clone()
    camera.lookAt(targetPosition.current)
    const targetQuaternion = camera.quaternion.clone()
    camera.quaternion.copy(currentQuaternion)
    camera.quaternion.slerp(targetQuaternion, 0.05)
    
    if ('fov' in camera) {
      const perspCamera = camera as THREE.PerspectiveCamera
      perspCamera.fov = THREE.MathUtils.lerp(
        perspCamera.fov,
        targetFov(slowMotionRef.current),
        fovLerpAlpha(slowMotionRef.current),
      )
      perspCamera.updateProjectionMatrix()
    }
  })
  
  return null
}
