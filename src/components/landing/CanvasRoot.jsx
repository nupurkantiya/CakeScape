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

function createStarField(count) {
  const positions = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const stride = i * 3

    // Spread stars across a wide area in all 3 directions
    positions[stride]     = (Math.random() - 0.5) * 20  // X
    positions[stride + 1] = (Math.random() - 0.5) * 20  // Y
    positions[stride + 2] = (Math.random() - 0.5) * 20  // Z
  }

  return positions
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

    // Create star field
    const starPositions = createStarField(2000)

    const starGeometry = new THREE.BufferGeometry()
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3))

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.04,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
    })

    const stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)

    // ← ADD GLOW CODE HERE
    // Create soft circular glow texture using canvas
    const glowCanvas = document.createElement("canvas")
    glowCanvas.width = 128
    glowCanvas.height = 128
    const glowCtx = glowCanvas.getContext("2d")

    // Draw a radial gradient — bright center, fades to transparent edge
    const gradient = glowCtx.createRadialGradient(64, 64, 0, 64, 64, 64)
    gradient.addColorStop(0, "rgba(248, 192, 96, 1)")
    gradient.addColorStop(0.3, "rgba(248, 192, 96, 0.4)")
    gradient.addColorStop(1, "rgba(248, 192, 96, 0)")

    glowCtx.fillStyle = gradient
    glowCtx.fillRect(0, 0, 128, 128)

    const glowTexture = new THREE.CanvasTexture(glowCanvas)

    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    })

    const glow = new THREE.Sprite(glowMaterial)
    glow.scale.set(3, 3, 1)
    glow.position.set(0, 0, -5)
    scene.add(glow)

    // ← ADD EGG CODE RIGHT HERE
      const eggMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5e6c8,
      roughness: 0.8,
      metalness: 0.0,
    })

    // Top half — upper hemisphere
    const eggTopGeo = new THREE.SphereGeometry(
      0.6, 32, 16,
      0, Math.PI * 2,  // full circle
      0, Math.PI * 0.5 // top half only
    )
    const eggTop = new THREE.Mesh(eggTopGeo, eggMaterial)
    eggTop.scale.set(1, 1.3, 1)
    eggTop.position.set(0, 0, -4)
    eggTop.visible = false
    scene.add(eggTop)

    // Bottom half — lower hemisphere
    const eggBottomGeo = new THREE.SphereGeometry(
      0.6, 32, 16,
      0, Math.PI * 2,   // full circle
      Math.PI * 0.5, Math.PI * 0.5 // bottom half only
    )
    const eggBottom = new THREE.Mesh(eggBottomGeo, eggMaterial)
    eggBottom.scale.set(1, 1.3, 1)
    eggBottom.position.set(0, 0, -4)
    eggBottom.visible = false
    scene.add(eggBottom)

    // Warm light for the egg
    const eggLight = new THREE.PointLight(0xf8c060, 0, 6)
    eggLight.position.set(0, 1, -2)
    scene.add(eggLight)

    // --- SCENE 4: BASE CAKE LAYER ---
    const cakeRadius = 2
    const baseCakeHeight = 1.5
    const baseGeometry = new THREE.CylinderGeometry(cakeRadius, cakeRadius, baseCakeHeight, 32)
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3d2314, // chocolate brown
      roughness: 0.8
    })
    const baseCakeMesh = new THREE.Mesh(baseGeometry, baseMaterial)
    
    // Initial state: hidden (scale 0) and at floor level
    baseCakeMesh.scale.y = 0
    baseCakeMesh.position.y = 0
    scene.add(baseCakeMesh)

    const clock = new THREE.Clock()
    let rafId = null

    const animate = () => {
    const elapsed = clock.getElapsedTime()
    
    // --- PROGRESS VALUES --- all at top
    const introProgress = THREE.MathUtils.clamp(
      scrollProgressRef.current / 0.25, 0, 1
    )
    const scene2Progress = THREE.MathUtils.clamp(
      (scrollProgressRef.current - 0.25) / 0.20, 0, 1
    )
    const scene3Progress = THREE.MathUtils.clamp(
      (scrollProgressRef.current - 0.45) / 0.20, 0, 1
    )
    const crackProgress = THREE.MathUtils.clamp(
      (scene3Progress - 0.5) / 0.5, 0, 1
    )
    const scene4Progress = THREE.MathUtils.clamp(
      (scrollProgressRef.current - 0.65) / 0.20, 0, 1
    )

    // --- SCENE 1: Logo particles ---
    const appearanceProgress = THREE.MathUtils.smoothstep(introProgress, 0.02, 0.24)
    const formationProgress = THREE.MathUtils.smoothstep(introProgress, 0.22, 0.74)
    const readableFormation = THREE.MathUtils.smoothstep(introProgress, 0.4, 0.68)
    const finalFormation = Math.max(formationProgress, readableFormation)
    const shatterProgress = THREE.MathUtils.smoothstep(introProgress, 0.8, 0.98)
    const visibleCount = Math.max(1, Math.floor(1 + (particleCount - 1) * appearanceProgress))

    particleGeometry.setDrawRange(0, visibleCount)
    particleMaterial.opacity = THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(0.9, 0.25, shatterProgress),
      0,
      scene2Progress
    )

    for (let i = 0; i < particleCount; i++) {
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

    // --- SCENE 2: Stars and glow ---
    starMaterial.opacity = THREE.MathUtils.lerp(0, 0.8, scene2Progress)
    glowMaterial.opacity = THREE.MathUtils.lerp(0, 0.6, scene2Progress)

    const starPositionsArray = starGeometry.attributes.position.array
    for (let i = 0; i < 2000; i++) {
      const stride = i * 3
      starPositionsArray[stride + 1] = starPositions[stride + 1] +
        Math.sin(elapsed + i * 0.5) * 0.05
    }
    starGeometry.attributes.position.needsUpdate = true

    // --- SCENE 3: Egg ---
    camera.position.z = THREE.MathUtils.lerp(8, 3, scene3Progress)

    eggTop.visible = scene3Progress > 0
    eggBottom.visible = scene3Progress > 0 && crackProgress < 0.9

    eggTop.position.y = THREE.MathUtils.lerp(0, 0.8, crackProgress)
    eggBottom.position.y = THREE.MathUtils.lerp(0, -0.4, crackProgress)

    eggMaterial.transparent = true
    eggMaterial.opacity = THREE.MathUtils.lerp(1, 0, crackProgress)

    eggLight.intensity = THREE.MathUtils.lerp(2, 12, crackProgress)

    glow.position.z = THREE.MathUtils.lerp(-5, -4, crackProgress)
    glow.scale.setScalar(THREE.MathUtils.lerp(3, 1.2, crackProgress))

    // --- SCENE 4: Base Cake Animation ---
    baseCakeMesh.visible = scene4Progress > 0
    baseCakeMesh.scale.y = THREE.MathUtils.lerp(0, 1, scene4Progress)
    // The scale and shift trick: position.y is exactly half the total height
    baseCakeMesh.position.y = (baseCakeHeight * baseCakeMesh.scale.y) / 2

    // --- RENDER ---
    renderer.render(scene, camera)
    rafId = requestAnimationFrame(animate)
  }

animate()
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
      starGeometry.dispose()
      starMaterial.dispose()

      scene.remove(glow)
      glowMaterial.dispose()
      glowTexture.dispose()

      scene.remove(eggTop)
      scene.remove(eggBottom)
      eggTopGeo.dispose()
      eggBottomGeo.dispose()
      eggMaterial.dispose()
      
      scene.remove(baseCakeMesh)
      baseGeometry.dispose()
      baseMaterial.dispose()
    }
  }, [])

  return <div ref={mountRef} className="landing-canvas" aria-hidden="true" />
}

export default CanvasRoot
