import { useEffect, useRef } from "react"
import * as THREE from "three"

function createLogoTargets(count) {
  const canvas = document.createElement("canvas")
  canvas.width = 1024
  canvas.height = 280
  const ctx = canvas.getContext("2d")

  const targets = new Float32Array(count * 3)
  if (!ctx) return targets

  ctx.fillStyle = "black"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "white"
  ctx.font = "900 170px Arial"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("CAKESCAPE", canvas.width * 0.5, canvas.height * 0.53)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const samples = []

  for (let y = 0; y < canvas.height; y += 4) {
    for (let x = 0; x < canvas.width; x += 4) {
      const alpha = imageData[(y * canvas.width + x) * 4 + 3]
      if (alpha > 100) {
        samples.push({ x, y })
      }
    }
  }

  if (samples.length === 0) {
    return targets
  }

  for (let i = 0; i < count; i += 1) {
    const stride = i * 3
    const point = samples[i % samples.length]
    const jitterX = (Math.random() - 0.5) * 0.06
    const jitterY = (Math.random() - 0.5) * 0.06

    targets[stride] = ((point.x / canvas.width) - 0.5) * 8.6 + jitterX
    targets[stride + 1] = (0.5 - (point.y / canvas.height)) * 2.2 + jitterY
    targets[stride + 2] = (Math.random() - 0.5) * 0.18
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

    const particleCount = 2000
    const positions = new Float32Array(particleCount * 3)
    const logoTargets = createLogoTargets(particleCount)
    const radii = new Float32Array(particleCount)
    const angles = new Float32Array(particleCount)
    const heights = new Float32Array(particleCount)
    const speeds = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i += 1) {
      const stride = i * 3

      radii[i] = i === 0 ? 0.08 : 0.45 + Math.random() * 2.8
      angles[i] = Math.random() * Math.PI * 2
      heights[i] = i === 0 ? 0 : (Math.random() - 0.5) * 2.6
      speeds[i] = i === 0 ? 0.12 : 0.45 + Math.random() * 0.8

      positions[stride] = Math.cos(angles[i]) * radii[i]
      positions[stride + 1] = heights[i]
      positions[stride + 2] = Math.sin(angles[i]) * radii[i]
    }

    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    particleGeometry.setDrawRange(0, 1)

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xf8d47a,
      size: 0.03,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    })

    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)

    const clock = new THREE.Clock()
    let rafId = null

    const animate = () => {
      const elapsed = clock.getElapsedTime()
      const introProgress = THREE.MathUtils.clamp(scrollProgressRef.current / 0.1, 0, 1)
      const appearanceProgress = THREE.MathUtils.smoothstep(introProgress, 0.03, 0.3)
      const formationProgress = THREE.MathUtils.smoothstep(introProgress, 0.18, 0.82)
      const visibleCount = Math.max(1, Math.floor(1 + (particleCount - 1) * appearanceProgress))

      particleGeometry.setDrawRange(0, visibleCount)

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

        positions[stride] = THREE.MathUtils.lerp(swirlX, targetX, formationProgress)
        positions[stride + 1] = THREE.MathUtils.lerp(swirlY, targetY, formationProgress)
        positions[stride + 2] = THREE.MathUtils.lerp(swirlZ, targetZ, formationProgress)
      }

      particleGeometry.attributes.position.needsUpdate = true
      particles.rotation.y = elapsed * 0.08

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
