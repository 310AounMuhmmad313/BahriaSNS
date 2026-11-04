import { useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { reducedMotion } from '../../lib/utils'

/* ============================================================
   Cinematic navy ocean — a custom-shader wave plane under a
   field of stars, with a slowly drifting ceremonial gold ring.
   Rendered only on desktop pointers with motion allowed; every
   other device gets the CSS gradient fallback behind it.
   ============================================================ */

const vert = /* glsl */ `
uniform float uTime;
varying float vElev;
varying float vDist;
void main() {
  vec3 p = position;
  float e = 0.0;
  e += sin(p.x * 0.30 + uTime * 0.85) * 0.55;
  e += sin(p.z * 0.22 + uTime * 0.60) * 0.45;
  e += sin((p.x + p.z) * 0.10 - uTime * 0.38) * 0.85;
  e += sin(p.x * 0.85 + uTime * 1.35) * 0.10;
  p.y += e;
  vElev = e;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`

const frag = /* glsl */ `
uniform vec3 uDeep;
uniform vec3 uCrest;
uniform vec3 uGold;
uniform vec3 uFog;
varying float vElev;
varying float vDist;
void main() {
  float t = smoothstep(-1.2, 1.35, vElev);
  vec3 col = mix(uDeep, uCrest, t * 0.6);
  col = mix(col, uGold, smoothstep(1.05, 1.45, vElev) * 0.42);
  col = mix(col, uFog, smoothstep(16.0, 52.0, vDist));
  gl_FragColor = vec4(col, 1.0);
}
`

function Waves() {
  const mat = useRef()
  const geo = useMemo(() => new THREE.PlaneGeometry(90, 46, 150, 90), [])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uTime: { value: 0 },
          uDeep: { value: new THREE.Color('#071c38') },
          uCrest: { value: new THREE.Color('#1b4a7e') },
          uGold: { value: new THREE.Color('#caa63a') },
          uFog: { value: new THREE.Color('#071a30') },
        },
      }),
    []
  )
  useFrame((state) => {
    if (mat.current) mat.current.uniforms.uTime.value = state.clock.elapsedTime
  })
  return <mesh geometry={geo} material={material} ref={mat} rotation-x={-Math.PI / 2} position={[0, -1.35, 0]} />
}

function Stars({ count = 420 }) {
  const geo = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 34 + Math.random() * 46
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(THREE.MathUtils.lerp(0.55, 1, Math.random()))
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th)
      pos[i * 3 + 1] = Math.abs(r * Math.cos(ph)) * 0.6 + 2
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [count])
  return (
    <points geometry={geo}>
      <pointsMaterial size={0.09} color="#9db8d9" transparent opacity={0.75} sizeAttenuation depthWrite={false} />
    </points>
  )
}

function GoldRing() {
  const g = useRef()
  const g2 = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (g.current) {
      g.current.rotation.z = t * 0.14
      g.current.position.y = 1.9 + Math.sin(t * 0.5) * 0.18
    }
    if (g2.current) {
      g2.current.rotation.z = -t * 0.2
      g2.current.rotation.x = Math.PI / 2.4
    }
  })
  return (
    <group position={[3.4, 1.9, -9]}>
      <mesh ref={g}>
        <torusGeometry args={[1.35, 0.02, 16, 130]} />
        <meshBasicMaterial color="#d9b64a" transparent opacity={0.85} />
      </mesh>
      <mesh ref={g2}>
        <torusGeometry args={[1.0, 0.012, 16, 110]} />
        <meshBasicMaterial color="#e6cd7d" transparent opacity={0.55} />
      </mesh>
    </group>
  )
}

function Rig() {
  useFrame((state) => {
    const { camera, pointer } = state
    camera.position.x += (pointer.x * 0.8 - camera.position.x) * 0.035
    camera.position.y += (1.55 + pointer.y * 0.35 - camera.position.y) * 0.035
    camera.lookAt(0, 0.4, -10)
  })
  return null
}

export default function OceanScene({ className = '' }) {
  const [allowed, setAllowed] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setAllowed(mq.matches && !reducedMotion())
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  if (!allowed) return null
  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 1.6, 7.5], fov: 55, near: 0.1, far: 160 }}
        dpr={[1, 1.7]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <fog attach="fog" args={['#071a30', 18, 60]} />
        <Waves />
        <Stars />
        <GoldRing />
        <Rig />
      </Canvas>
    </div>
  )
}
