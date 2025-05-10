"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { PerspectiveCamera, Environment } from "@react-three/drei"
import * as THREE from "three"
import React from "react"

// Componente principal
export default function BoatSimulation() {
  return (
    <div className="w-full h-screen">
      <Canvas shadows>
        <Environment preset="sunset" />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <Scene />
      </Canvas>
      <div className="absolute bottom-4 left-4 bg-black/50 text-white p-2 rounded">
        Mueve el mouse para controlar el barco
      </div>
    </div>
  )
}

// Escena principal
function Scene() {
  const boatRef = useRef(null)
  const cameraRef = useRef(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { size } = useThree()

  // Manejar el movimiento del mouse
  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({
        x: (event.clientX / size.width) * 2 - 1,
        y: -(event.clientY / size.height) * 2 + 1,
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [size])

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 5, 10]} fov={60} />
      <CameraFollower target={boatRef} cameraRef={cameraRef} />
      <Ocean />
      <Boat ref={boatRef} mousePosition={mousePosition} />
    </>
  )
}

// Componente del barco
const Boat = React.forwardRef((props, ref) => {
  const { mousePosition } = props
  const targetRotation = useRef(0)
  const velocity = useRef(new THREE.Vector3(0, 0, 0))
  const position = useRef(new THREE.Vector3(0, 0, 0))
  const maxSpeed = 0.05

  useFrame((state, delta) => {
    if (!ref.current) return

    // Calcular la dirección basada en la posición del mouse
    const targetDirection = new THREE.Vector3(mousePosition.x * 2, 0, -Math.abs(mousePosition.y) * 2).normalize()

    // Calcular la rotación objetivo
    targetRotation.current = Math.atan2(targetDirection.x, targetDirection.z)

    // Suavizar la rotación actual
    ref.current.rotation.y += (targetRotation.current - ref.current.rotation.y) * 0.05

    // Calcular la velocidad basada en la dirección
    const direction = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), ref.current.rotation.y)

    // Ajustar la velocidad basada en la posición vertical del mouse (más abajo = más rápido)
    const speedFactor = Math.abs(mousePosition.y) * 0.5 + 0.5

    // Aplicar la velocidad
    velocity.current.lerp(direction.multiplyScalar(maxSpeed * speedFactor), 0.02)

    // Actualizar la posición
    position.current.add(velocity.current)

    // Limitar el área de navegación
    position.current.x = Math.max(-20, Math.min(20, position.current.x))
    position.current.z = Math.max(-20, Math.min(20, position.current.z))

    // Aplicar un ligero movimiento vertical basado en el oleaje
    position.current.y =
      Math.sin(state.clock.elapsedTime * 2 + position.current.x * 0.5 + position.current.z * 0.5) * 0.1 + 0.1

    // Actualizar la posición del barco
    ref.current.position.copy(position.current)

    // Inclinación del barco basada en la velocidad y el oleaje
    ref.current.rotation.z = -velocity.current.x * 0.5
    ref.current.rotation.x = velocity.current.z * 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.05
  })

  return (
    <group ref={ref} position={[0, 0.1, 0]}>
      {/* Casco del barco */}
      <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[1, 0.4, 2]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Cubierta */}
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[0.9, 0.1, 1.8]} />
        <meshStandardMaterial color="#D2B48C" />
      </mesh>

      {/* Cabina */}
      <mesh castShadow receiveShadow position={[0, 0.8, -0.3]}>
        <boxGeometry args={[0.7, 0.5, 0.8]} />
        <meshStandardMaterial color="#A0522D" />
      </mesh>

      {/* Mástil */}
      <mesh castShadow receiveShadow position={[0, 1.5, 0.2]}>
        <cylinderGeometry args={[0.05, 0.05, 2]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Vela */}
      <mesh castShadow receiveShadow position={[0, 1.2, 0.2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshStandardMaterial color="#F5F5F5" side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
})

Boat.displayName = "Boat"

// Componente para que la cámara siga al barco
function CameraFollower({ target, cameraRef }) {
  useFrame(() => {
    if (!target.current || !cameraRef.current) return

    // Posición objetivo para la cámara
    const targetPosition = target.current.position.clone()
    targetPosition.y += 3 // Altura sobre el barco
    targetPosition.z += 6 // Distancia detrás del barco

    // Suavizar el movimiento de la cámara
    cameraRef.current.position.lerp(targetPosition, 0.05)

    // Hacer que la cámara mire al barco
    cameraRef.current.lookAt(target.current.position)
  })

  return null
}

// Componente del océano con oleaje
function Ocean() {
  const oceanRef = useRef()

  useFrame((state) => {
    if (!oceanRef.current) return

    // Actualizar el material del océano para animar las olas
    oceanRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh ref={oceanRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[100, 100, 100, 100]} />
      <shaderMaterial
        uniforms={{
          uTime: { value: 0 },
          uColor: { value: new THREE.Color("#0077be") },
          uDeepColor: { value: new THREE.Color("#001e38") },
        }}
        vertexShader={`
          uniform float uTime;
          varying vec2 vUv;
          varying float vElevation;
          
          // Simplex 2D noise
          vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
          float snoise(vec2 v){
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
              dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
          }
          
          void main() {
            vUv = uv;
            
            // Crear múltiples capas de olas
            float elevation = 0.0;
            
            // Olas grandes
            elevation += sin(position.x * 0.1 + uTime * 0.5) * 0.5;
            elevation += sin(position.z * 0.1 + uTime * 0.3) * 0.5;
            
            // Olas medianas
            elevation += sin(position.x * 0.2 + uTime * 0.7) * 0.25;
            elevation += sin(position.z * 0.2 + uTime * 0.6) * 0.25;
            
            // Olas pequeñas (ruido)
            float noiseFreq = 0.5;
            float noiseAmp = 0.25;
            elevation += snoise(vec2(position.x * noiseFreq + uTime * 0.2, position.z * noiseFreq + uTime * 0.1)) * noiseAmp;
            
            vElevation = elevation;
            
            vec3 newPosition = position;
            newPosition.y += elevation;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          uniform vec3 uDeepColor;
          uniform float uTime;
          
          varying vec2 vUv;
          varying float vElevation;
          
          void main() {
            // Mezclar colores basados en la elevación
            float mixStrength = (vElevation + 0.5) * 0.5;
            vec3 color = mix(uDeepColor, uColor, mixStrength);
            
            // Añadir brillo en las crestas de las olas
            float highlight = smoothstep(0.3, 0.4, vElevation);
            color = mix(color, vec3(1.0, 1.0, 1.0), highlight * 0.2);
            
            // Añadir efecto de profundidad
            float depth = smoothstep(0.0, 5.0, length(vUv - 0.5) * 10.0);
            color = mix(color, uDeepColor, depth * 0.5);
            
            gl_FragColor = vec4(color, 0.8);
          }
        `}
        transparent={true}
      />
    </mesh>
  )
}
