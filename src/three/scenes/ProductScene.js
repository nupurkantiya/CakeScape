import * as THREE from "three"

function makePedestalMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x31204f,
    metalness: 0.4,
    roughness: 0.42,
    emissive: 0x09060f,
    emissiveIntensity: 0.2,
  })
}

function makeCakeMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xd67a5f,
    metalness: 0.08,
    roughness: 0.68,
  })
}

function makeFrostingMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xff8ac2,
    metalness: 0.14,
    roughness: 0.38,
    emissive: 0x230a1a,
    emissiveIntensity: 0.12,
  })
}

export function createProductScene() {
  let ctx = null
  let group = null
  let pedestal = null
  let cakeBody = null
  let frosting = null
  let rimLight = null

  return {
    init(context) {
      ctx = context

      group = new THREE.Group()
      group.position.set(0, -0.35, -1.8)
      ctx.scene.add(group)

      const pedestalGeo = new THREE.CylinderGeometry(2.7, 2.95, 0.5, 96)
      pedestal = new THREE.Mesh(pedestalGeo, makePedestalMaterial())
      pedestal.position.y = -1.1
      group.add(pedestal)

      const cakeGeo = new THREE.CylinderGeometry(1.35, 1.42, 1.2, 96)
      cakeBody = new THREE.Mesh(cakeGeo, makeCakeMaterial())
      cakeBody.position.y = -0.2
      group.add(cakeBody)

      const frostingGeo = new THREE.CylinderGeometry(1.45, 1.52, 0.72, 96)
      frosting = new THREE.Mesh(frostingGeo, makeFrostingMaterial())
      frosting.position.y = 0.72
      group.add(frosting)

      rimLight = new THREE.PointLight(0xff7fb8, 8, 35, 2)
      rimLight.position.set(2.3, 1.8, 3.6)
      group.add(rimLight)

      group.visible = false
    },

    update(progress, frame = {}) {
      if (!group || !pedestal || !cakeBody || !frosting) return

      const elapsed = frame.elapsed ?? 0
      const reveal = THREE.MathUtils.smoothstep(progress, 0.08, 0.32)
      const hold = 1 - THREE.MathUtils.smoothstep(progress, 0.86, 1)
      const visibility = THREE.MathUtils.clamp(reveal * hold, 0, 1)

      group.visible = visibility > 0.02
      if (!group.visible) return

      const rotateY = elapsed * 0.18 + progress * 0.8
      pedestal.rotation.y = rotateY * 0.25
      cakeBody.rotation.y = rotateY * 0.75
      frosting.rotation.y = rotateY

      const floatOffset = Math.sin(elapsed * 1.4) * 0.05
      group.position.y = -0.45 + floatOffset + (1 - visibility) * 0.25
      group.position.z = -1.8 + (1 - visibility) * 1.25

      const introScale = 0.78 + visibility * 0.24
      group.scale.setScalar(introScale)

      frosting.scale.y = 0.96 + Math.sin(elapsed * 2.1) * 0.02
      frosting.material.emissiveIntensity = 0.11 + Math.sin(elapsed * 2.8) * 0.02

      if (rimLight) {
        rimLight.intensity = 5 + visibility * 4
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
      pedestal = null
      cakeBody = null
      frosting = null
      rimLight = null
    },
  }
}
