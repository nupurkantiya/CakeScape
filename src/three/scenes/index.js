import * as THREE from "three"
import { createIntroScene } from "./IntroScene"
import { createVoidScene } from "./VoidScene"
import { createBirthScene } from "./BirthScene"
import { createRiseScene } from "./RiseScene"
import { createPourScene } from "./PourScene"
import { createRevealScene } from "./RevealScene"
import { createProductScene } from "./ProductScene"

function createEnvironmentScene() {
  let ctx = null
  let ambient = null
  let key = null
  let fill = null
  let haze = null
  let hazeMaterial = null

  return {
    init(context) {
      ctx = context

      ambient = new THREE.AmbientLight(0xffffff, 0.2)
      key = new THREE.DirectionalLight(0xfff2e8, 1.25)
      key.position.set(3.2, 3.4, 4)

      fill = new THREE.DirectionalLight(0x56d9ff, 0.45)
      fill.position.set(-5.5, -1.2, 1.8)

      const hazeGeometry = new THREE.SphereGeometry(35, 40, 40)
      hazeMaterial = new THREE.MeshBasicMaterial({
        color: 0x190f2c,
        transparent: true,
        opacity: 0.18,
        side: THREE.BackSide,
      })
      haze = new THREE.Mesh(hazeGeometry, hazeMaterial)

      ctx.scene.add(ambient)
      ctx.scene.add(key)
      ctx.scene.add(fill)
      ctx.scene.add(haze)
    },

    update(progress, frame = {}) {
      if (!ambient || !key || !fill || !haze || !hazeMaterial) return

      const elapsed = frame.elapsed ?? 0
      const globalProgress = frame.globalProgress ?? progress
      const visibility = THREE.MathUtils.smoothstep(globalProgress, 0.1, 0.16)
      const lightPulse = Math.sin(elapsed * 0.35) * 0.08

      ambient.intensity = (0.24 + lightPulse) * visibility
      key.intensity = (1.2 + lightPulse * 0.8) * visibility
      fill.intensity = (0.38 + Math.cos(elapsed * 0.4) * 0.06) * visibility

      haze.rotation.y = elapsed * 0.01
      hazeMaterial.opacity = (0.14 + (1 - progress) * 0.08) * visibility
    },

    dispose() {
      if (!ctx) return

      if (ambient) ctx.scene.remove(ambient)
      if (key) ctx.scene.remove(key)
      if (fill) ctx.scene.remove(fill)
      if (haze) {
        ctx.scene.remove(haze)
        haze.geometry.dispose()
      }

      if (hazeMaterial) {
        hazeMaterial.dispose()
      }

      ctx = null
      ambient = null
      key = null
      fill = null
      haze = null
      hazeMaterial = null
    },
  }
}

export function createScenes() {
  return [
    {
      scene: createEnvironmentScene(),
      range: { start: 0, end: 1 },
    },
    {
      scene: createIntroScene(),
      range: { start: 0, end: 0.1 },
    },
    {
      scene: createVoidScene(),
      range: { start: 0.1, end: 0.25 },
    },
    {
      scene: createBirthScene(),
      range: { start: 0.25, end: 0.45 },
    },
    {
      scene: createRiseScene(),
      range: { start: 0.45, end: 0.65 },
    },
    {
      scene: createPourScene(),
      range: { start: 0.65, end: 0.8 },
    },
    {
      scene: createRevealScene(),
      range: { start: 0.8, end: 0.92 },
    },
    {
      scene: createProductScene(),
      range: { start: 0.92, end: 1 },
    },
  ]
}
