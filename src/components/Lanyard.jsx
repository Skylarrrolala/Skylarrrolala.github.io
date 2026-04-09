/* eslint-disable react/no-unknown-property */
import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
} from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
import * as THREE from 'three'

extend({ MeshLineGeometry, MeshLineMaterial })

// ── Canvas-drawn card texture (matches portfolio design system) ──
function makeCardTexture() {
  const cc = document.createElement('canvas')
  cc.width = 520; cc.height = 740
  const c = cc.getContext('2d')

  function rr(x, y, w, h, r) {
    c.beginPath()
    c.moveTo(x + r, y); c.lineTo(x + w - r, y)
    c.arcTo(x + w, y, x + w, y + r, r); c.lineTo(x + w, y + h - r)
    c.arcTo(x + w, y + h, x + w - r, y + h, r); c.lineTo(x + r, y + h)
    c.arcTo(x, y + h, x, y + h - r, r); c.lineTo(x, y + r)
    c.arcTo(x, y, x + r, y, r); c.closePath()
  }

  // Background
  c.fillStyle = '#0D0F12'; rr(0, 0, 520, 740, 28); c.fill()

  // Grid lines
  c.strokeStyle = 'rgba(108,99,255,0.07)'; c.lineWidth = 1
  for (let y = 0; y < 740; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(520, y); c.stroke() }
  for (let x = 0; x < 520; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 740); c.stroke() }

  // Top accent bar
  const grad = c.createLinearGradient(0, 0, 520, 0)
  grad.addColorStop(0, '#6C63FF'); grad.addColorStop(1, '#00D9A3')
  c.fillStyle = grad; rr(0, 0, 520, 10, 0); c.fill()

  // Border
  c.strokeStyle = 'rgba(108,99,255,0.2)'; c.lineWidth = 1.5
  rr(1, 1, 518, 738, 27); c.stroke()

  // ORG chip
  c.fillStyle = 'rgba(108,99,255,0.12)'; c.fillRect(24, 26, 136, 22)
  c.fillStyle = '#6C63FF'; c.font = '500 11px monospace'; c.textAlign = 'left'
  c.fillText('CS · AI · PRODUCT', 30, 41)

  // Avatar circle
  c.fillStyle = '#151720'; c.beginPath(); c.arc(260, 215, 115, 0, Math.PI * 2); c.fill()
  const ringG = c.createRadialGradient(260, 215, 100, 260, 215, 118)
  ringG.addColorStop(0, 'rgba(108,99,255,0.5)'); ringG.addColorStop(1, 'rgba(108,99,255,0)')
  c.fillStyle = ringG; c.beginPath(); c.arc(260, 215, 118, 0, Math.PI * 2); c.fill()
  c.fillStyle = '#1E2230'
  c.beginPath(); c.arc(260, 195, 52, 0, Math.PI * 2); c.fill()
  c.beginPath(); c.arc(260, 330, 88, Math.PI, 0); c.fill()
  c.fillStyle = 'rgba(108,99,255,0.7)'; c.font = 'bold 52px Arial'; c.textAlign = 'center'
  c.fillText('S', 260, 212)

  // Name
  c.fillStyle = '#FFFFFF'; c.font = 'bold 46px Arial'; c.fillText('SKYLAR', 260, 372)
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.font = '22px Arial'
  c.fillText('Dararithy Heng', 260, 406)

  // Divider
  const divG = c.createLinearGradient(120, 0, 400, 0)
  divG.addColorStop(0, 'transparent'); divG.addColorStop(0.5, '#6C63FF'); divG.addColorStop(1, 'transparent')
  c.strokeStyle = divG; c.lineWidth = 1
  c.beginPath(); c.moveTo(120, 424); c.lineTo(400, 424); c.stroke()

  // Role
  c.fillStyle = '#6C63FF'; c.font = '500 18px monospace'
  c.fillText('AI Builder · Aspiring PM', 260, 453)

  // Info rows
  const rows = [['🎓', 'AUPP + FHSU · Dual Degree'], ['🤖', 'AI Associate · TGI'], ['🌐', 'skylar-thedev.me']]
  c.font = '14px monospace'
  rows.forEach(([icon, text], i) => {
    const ry = 498 + i * 34
    c.fillStyle = 'rgba(255,255,255,0.3)'; c.textAlign = 'left'; c.fillText(icon, 80, ry)
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillText(text, 116, ry)
  })

  // Separator + barcode
  c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 1
  c.beginPath(); c.moveTo(40, 614); c.lineTo(480, 614); c.stroke()
  c.fillStyle = 'rgba(255,255,255,0.08)'; c.textAlign = 'center'
  for (let i = 0; i < 28; i++) {
    const bx = 80 + i * 13; const bh = i % 3 === 0 ? 38 : i % 2 === 0 ? 28 : 20
    c.fillRect(bx, 622, i % 4 < 2 ? 7 : 4, bh)
  }
  c.fillStyle = 'rgba(255,255,255,0.2)'; c.font = '10px monospace'
  c.fillText('PHNOM PENH · CAMBODIA · 2025', 260, 678)

  // Corner pips
  c.fillStyle = '#6C63FF'; c.beginPath(); c.arc(28, 716, 5, 0, Math.PI * 2); c.fill()
  c.fillStyle = '#00D9A3'; c.beginPath(); c.arc(492, 716, 5, 0, Math.PI * 2); c.fill()

  return new THREE.CanvasTexture(cc)
}

// ── Lanyard strap texture ──
function makeLanyardTex() {
  const lc = document.createElement('canvas')
  lc.width = 128; lc.height = 512
  const lt = lc.getContext('2d')
  const W = lc.width, H = lc.height

  const g = lt.createLinearGradient(0, 0, W, 0)
  g.addColorStop(0, '#0C0C0C'); g.addColorStop(0.18, '#222')
  g.addColorStop(0.5, '#0A0A0A'); g.addColorStop(0.82, '#1E1E1E'); g.addColorStop(1, '#0C0C0C')
  lt.fillStyle = g; lt.fillRect(0, 0, W, H)

  const streak = lt.createLinearGradient(0, 0, W, 0)
  streak.addColorStop(0.22, 'rgba(255,255,255,0.09)')
  streak.addColorStop(0.28, 'rgba(255,255,255,0.18)')
  streak.addColorStop(0.34, 'rgba(255,255,255,0.09)')
  lt.fillStyle = streak; lt.fillRect(0, 0, W, H)

  lt.fillStyle = 'rgba(255,255,255,0.07)'
  lt.fillRect(7, 0, 1.5, H); lt.fillRect(W - 8.5, 0, 1.5, H)

  for (let sy = 36; sy < H; sy += 72) {
    lt.fillStyle = 'rgba(255,255,255,0.55)'
    lt.beginPath(); lt.arc(W / 2, sy, 2.2, 0, Math.PI * 2); lt.fill()
    lt.strokeStyle = 'rgba(255,255,255,0.28)'; lt.lineWidth = 1
    ;[[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([tx, ty]) => {
      lt.beginPath(); lt.moveTo(W / 2 + tx * 5, sy + ty * 5)
      lt.lineTo(W / 2 + tx * 12, sy + ty * 12); lt.stroke()
    })
  }

  const t = new THREE.CanvasTexture(lc)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1, 1)
  return t
}

// ── Band (rope + card) ──
function Band({ maxSpeed = 50, minSpeed = 0 }) {
  const band = useRef()
  const fixed = useRef(), j1 = useRef(), j2 = useRef(), j3 = useRef(), card = useRef()
  const vec = new THREE.Vector3(), ang = new THREE.Vector3(), rot = new THREE.Vector3(), dir = new THREE.Vector3()

  const segProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 4, linearDamping: 4 }

  const cardTex = useMemo(() => makeCardTexture(), [])
  const lanyardTex = useMemo(() => makeLanyardTex(), [])

  const [curve] = useState(() =>
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(), new THREE.Vector3(),
      new THREE.Vector3(), new THREE.Vector3(),
    ])
  )
  const [dragged, drag] = useState(false)
  const [hovered, hover] = useState(false)

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1])
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]])

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab'
      return () => void (document.body.style.cursor = 'auto')
    }
  }, [hovered, dragged])

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
      ;[card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp())
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z,
      })
    }

    if (fixed.current) {
      ;[j1, j2].forEach(ref => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation())
        const dist = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())))
        ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + dist * (maxSpeed - minSpeed)))
      })
      curve.points[0].copy(j3.current.translation())
      curve.points[1].copy(j2.current.lerped)
      curve.points[2].copy(j1.current.lerped)
      curve.points[3].copy(fixed.current.translation())
      band.current.geometry.setPoints(curve.getPoints(32))
      ang.copy(card.current.angvel())
      rot.copy(card.current.rotation())
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z })
    }
  })

  curve.curveType = 'chordal'
  lanyardTex.wrapS = lanyardTex.wrapT = THREE.RepeatWrapping

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>

        {/* Card rigid body */}
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segProps}
          type={dragged ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[0.72, 1.0, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.15, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={e => { e.target.releasePointerCapture(e.pointerId); drag(false) }}
            onPointerDown={e => {
              e.target.setPointerCapture(e.pointerId)
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
            }}
          >
            {/* Card body */}
            <mesh>
              <boxGeometry args={[0.64, 0.9, 0.025]} />
              <meshPhysicalMaterial
                map={cardTex}
                map-anisotropy={16}
                clearcoat={1}
                clearcoatRoughness={0.08}
                roughness={0.5}
                metalness={0.05}
              />
            </mesh>
            {/* Metallic ring at top */}
            <mesh position={[0, 0.48, 0.01]}>
              <torusGeometry args={[0.075, 0.016, 16, 32]} />
              <meshStandardMaterial color="#C8C2B8" metalness={0.95} roughness={0.1} />
            </mesh>
            {/* Clip hook */}
            <mesh position={[0, 0.42, 0.01]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.055, 0.012, 10, 24, Math.PI]} />
              <meshStandardMaterial color="#B0A898" metalness={0.92} roughness={0.14} />
            </mesh>
          </group>
        </RigidBody>
      </group>

      {/* Lanyard strap */}
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={[window.innerWidth, window.innerHeight]}
          useMap={1}
          map={lanyardTex}
          repeat={[-3, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  )
}

// ── Main export ──
export default function Lanyard({
  position = [0, 0, 20],
  gravity = [0, -40, 0],
  fov = 20,
}) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position, fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: true }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), 0)}
      >
        <ambientLight intensity={Math.PI} />
        <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Canvas>
    </div>
  )
}
