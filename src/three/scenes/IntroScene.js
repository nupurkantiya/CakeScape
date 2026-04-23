import * as THREE from "three"

function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

export function createIntroScene() {
  let ctx = null
  let group = null
  let knot = null
  let knotMaterial = null
  let stars = null
  let starsMaterial = null
  let introLight = null

  return {
    init(context) {
      ctx = context

      group = new THREE.Group()
      group.position.set(0, 0.15, 0)
      ctx.scene.add(group)

      const knotGeometry = new THREE.TorusKnotGeometry(1.15, 0.28, 280, 28)
      knotMaterial = new THREE.MeshStandardMaterial({
        color: 0xff5ca7,
        emissive: 0x2a0720,
        metalness: 0.35,
        roughness: 0.28,
        transparent: true,
        opacity: 1,
      })
      knot = new THREE.Mesh(knotGeometry, knotMaterial)
      group.add(knot)

      const starCount = 1200
      const starPositions = new Float32Array(starCount * 3)

      for (let i = 0; i < starCount; i += 1) {
        const i3 = i * 3
        const radius = THREE.MathUtils.randFloat(6.5, 14)
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)

        starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta)
        starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
        starPositions[i3 + 2] = radius * Math.cos(phi)
      }

      const starsGeometry = new THREE.BufferGeometry()
      starsGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3))

      starsMaterial = new THREE.PointsMaterial({
        color: 0x7fe9ff,
        size: 0.05,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })

      stars = new THREE.Points(starsGeometry, starsMaterial)
      group.add(stars)

      introLight = new THREE.PointLight(0x7fe9ff, 7.5, 40, 2)
      introLight.position.set(-1.5, 1.6, 3.2)
      group.add(introLight)
    },

    update(progress, frame = {}) {
      if (!group || !knot || !knotMaterial || !stars || !starsMaterial) return

      const elapsed = frame.elapsed ?? 0
      const reveal = smoothstep(0, 0.28, progress)
      const outro = 1 - smoothstep(0.72, 1, progress)
      const visibility = THREE.MathUtils.clamp(reveal * outro + (progress < 0.06 ? 0.15 : 0), 0, 1)

      group.visible = visibility > 0.01
      if (!group.visible) return

      knot.rotation.x = elapsed * 0.18 + progress * 0.55
      knot.rotation.y = elapsed * 0.31
      knot.rotation.z = Math.sin(elapsed * 0.45) * 0.08

      const scale = 0.75 + reveal * 0.55
      knot.scale.setScalar(scale)
      group.position.y = 0.1 + Math.sin(elapsed * 0.5) * 0.06 - progress * 0.35
      group.position.z = 0.6 - progress * 1.5

      knotMaterial.opacity = visibility
      knotMaterial.emissiveIntensity = 0.65 + Math.sin(elapsed * 2.1) * 0.1

      stars.rotation.y = elapsed * 0.03
      stars.rotation.x = Math.sin(elapsed * 0.07) * 0.15
      starsMaterial.opacity = 0.65 * visibility

      if (introLight) {
        introLight.intensity = 4 + visibility * 5.5
      }
    },

    dispose() {
      if (!ctx || !group) return

      group.traverse((obj) => {
        if (obj.geometry) {
          obj.geometry.dispose()
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => mat.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })

      ctx.scene.remove(group)

      ctx = null
      group = null
      knot = null
      knotMaterial = null
      stars = null
      starsMaterial = null
      introLight = null
    },
  }
}
