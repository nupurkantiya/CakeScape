import { useEffect, useRef } from "react"
import * as THREE from "three"

function createLogoTargets(count) {
  const canvas = document.createElement("canvas")
  canvas.width = 1400
  canvas.height = 420
  const ctx = canvas.getContext("2d")

  const targets = new Float32Array(count * 3)
  if (!ctx) return targets

  ctx.fillStyle = "black"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "white"
  ctx.font = "900 210px sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("CakeScape", canvas.width * 0.5, canvas.height * 0.52)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const samples = []

  for (let y = 0; y < canvas.height; y += 2) {
    for (let x = 0; x < canvas.width; x += 2) {
      const brightness = imageData[(y * canvas.width + x) * 4]
      if (brightness > 40) {
        samples.push({ x, y })
      }
    }
  }

  if (samples.length === 0) {
    return targets
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (let i = 0; i < samples.length; i += 1) {
    const { x, y } = samples[i]
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }

  const textWidth = Math.max(maxX - minX, 1)
  const textHeight = Math.max(maxY - minY, 1)
  const targetWidth = 6.2
  const targetHeight = 1.8
  const scaleX = targetWidth / textWidth
  const scaleY = targetHeight / textHeight
  const centerX = (minX + maxX) * 0.5
  const centerY = (minY + maxY) * 0.5

  for (let i = 0; i < count; i += 1) {
    const stride = i * 3
    const point = samples[Math.floor(Math.random() * samples.length)]
    const jitterX = (Math.random() - 0.5) * 0.02
    const jitterY = (Math.random() - 0.5) * 0.02

    targets[stride] = (point.x - centerX) * scaleX + jitterX
    targets[stride + 1] = (centerY - point.y) * scaleY + jitterY
    targets[stride + 2] = (Math.random() - 0.5) * 0.03
  }

  return targets
}

function CanvasRoot({ scrollProgress = 0 }) {
  const mountRef = useRef(null)
  const scrollProgressRef = useRef(scrollProgress)

  useEffect(() => {
    scrollProgressRef.current = scrollProgress
  }, [scrollProgress])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 200)
    camera.position.set(0, 0.35, 8)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(Math.max(mount.clientWidth, 1), Math.max(mount.clientHeight, 1), false)
    mount.appendChild(renderer.domElement)

    const handleResize = () => {
      const width = Math.max(mount.clientWidth, 1)
      const height = Math.max(mount.clientHeight, 1)

      camera.aspect = width / height
      camera.updateProjectionMatrix()

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(width, height, false)
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    const particleCount = 4500
    const positions = new Float32Array(particleCount * 3)
    const logoTargets = createLogoTargets(particleCount)
    const radii = new Float32Array(particleCount)
    const angles = new Float32Array(particleCount)
    const heights = new Float32Array(particleCount)
    const speeds = new Float32Array(particleCount)
    const shatterDirections = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i += 1) {
      const stride = i * 3

      radii[i] = i === 0 ? 0.08 : 0.45 + Math.random() * 2.8
      angles[i] = Math.random() * Math.PI * 2
      heights[i] = i === 0 ? 0 : (Math.random() - 0.5) * 2.6
      speeds[i] = i === 0 ? 0.12 : 0.45 + Math.random() * 0.8

      positions[stride] = Math.cos(angles[i]) * radii[i]
      positions[stride + 1] = heights[i]
      positions[stride + 2] = Math.sin(angles[i]) * radii[i]

      const direction = new THREE.Vector3(
        logoTargets[stride],
        logoTargets[stride + 1],
        logoTargets[stride + 2]
      )
      if (direction.lengthSq() < 0.0001) {
        direction.set((Math.random() - 0.5) * 0.1, Math.random() * 0.12, (Math.random() - 0.5) * 0.1)
      }

      direction.normalize()
      direction.x += (Math.random() - 0.5) * 0.4
      direction.y += (Math.random() - 0.15) * 0.35
      direction.z += (Math.random() - 0.5) * 0.4
      direction.normalize()

      shatterDirections[stride] = direction.x
      shatterDirections[stride + 1] = direction.y
      shatterDirections[stride + 2] = direction.z
    }

    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    particleGeometry.setDrawRange(0, 1)

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xf8d47a,
      size: 0.04,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)

    const clock = new THREE.Clock()
    let rafId = null

    const animate = () => {
      const elapsed = clock.getElapsedTime()
      const introProgress = THREE.MathUtils.clamp(scrollProgressRef.current / 0.15, 0, 1)
      const appearanceProgress = THREE.MathUtils.smoothstep(introProgress, 0.02, 0.24)
      const formationProgress = THREE.MathUtils.smoothstep(introProgress, 0.22, 0.74)
      const readableFormation = THREE.MathUtils.smoothstep(introProgress, 0.4, 0.68)
      const finalFormation = Math.max(formationProgress, readableFormation)
      const shatterProgress = THREE.MathUtils.smoothstep(introProgress, 0.8, 0.98)
      const visibleCount = Math.max(1, Math.floor(1 + (particleCount - 1) * appearanceProgress))

      particleGeometry.setDrawRange(0, visibleCount)
      particleMaterial.opacity = THREE.MathUtils.lerp(0.9, 0.25, shatterProgress)

      for (let i = 0; i < particleCount; i += 1) {
        const stride = i * 3
        const angle = angles[i] + elapsed * speeds[i]
        const radius = radii[i] + Math.sin(elapsed * 1.1 + i * 0.02) * 0.08

        const swirlX = Math.cos(angle) * radius
        const swirlY = heights[i] + Math.sin(elapsed * 1.6 + i * 0.015) * 0.1
        const swirlZ = Math.sin(angle) * radius

        const targetX = logoTargets[stride]
        const targetY = logoTargets[stride + 1]
        const targetZ = logoTargets[stride + 2]

        const formedX = THREE.MathUtils.lerp(swirlX, targetX, finalFormation)
        const formedY = THREE.MathUtils.lerp(swirlY, targetY, finalFormation)
        const formedZ = THREE.MathUtils.lerp(swirlZ, targetZ, finalFormation)

        const shatterDistance = 4.5 * shatterProgress
        const shatteredX = formedX + shatterDirections[stride] * shatterDistance
        const shatteredY = formedY + shatterDirections[stride + 1] * shatterDistance
        const shatteredZ = formedZ + shatterDirections[stride + 2] * shatterDistance

        positions[stride] = THREE.MathUtils.lerp(formedX, shatteredX, shatterProgress)
        positions[stride + 1] = THREE.MathUtils.lerp(formedY, shatteredY, shatterProgress)
        positions[stride + 2] = THREE.MathUtils.lerp(formedZ, shatteredZ, shatterProgress)
      }

      particleGeometry.attributes.position.needsUpdate = true
      const swirlSpin = (1 - finalFormation) * elapsed * 0.08
      const shatterSpin = shatterProgress * elapsed * 0.12
      particles.rotation.y = swirlSpin + shatterSpin

      renderer.render(scene, camera)
      rafId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      window.removeEventListener("resize", handleResize)
      scene.remove(particles)
      particleGeometry.dispose()
      particleMaterial.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={mountRef} className="landing-canvas" aria-hidden="true" />
}

export default CanvasRoot
