import * as THREE from "three"

const SPOTLIGHT_PARTICLE_COUNT = 2600

function clamp01(value) {
  return THREE.MathUtils.clamp(value, 0, 1)
}

function remap(value, inMin, inMax) {
  if (inMax === inMin) return 0
  return clamp01((value - inMin) / (inMax - inMin))
}

function easeOutCubic(t) {
  const k = clamp01(t)
  return 1 - (1 - k) ** 3
}

function easeInOutCubic(t) {
  const k = clamp01(t)
  return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2
}

function createTextSprite() {
  const canvas = document.createElement("canvas")
  canvas.width = 2048
  canvas.height = 512
  const context = canvas.getContext("2d")

  if (!context) return null

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.shadowColor = "rgba(255, 208, 154, 0.5)"
  context.shadowBlur = 42

  const gradient = context.createLinearGradient(0, 0, canvas.width, 0)
  gradient.addColorStop(0, "rgba(255, 244, 224, 0.92)")
  gradient.addColorStop(0.5, "rgba(255, 224, 176, 0.98)")
  gradient.addColorStop(1, "rgba(255, 196, 136, 0.92)")

  context.fillStyle = gradient
  context.font = "600 128px 'Georgia', 'Times New Roman', serif"
  context.fillText("Your masterpiece", canvas.width / 2, canvas.height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    color: 0xffffff,
  })

  const sprite = new THREE.Sprite(material)
  sprite.position.set(0, 2.45, -9.6)
  sprite.scale.set(6.2, 1.9, 1)

  return { sprite, texture }
}

function createBackdropMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uVisibility: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      varying vec2 vUv;
      uniform float uTime;
      uniform float uVisibility;

      void main() {
        float vertical = smoothstep(0.0, 1.0, vUv.y);
        vec3 base = mix(vec3(0.08, 0.045, 0.025), vec3(0.3, 0.17, 0.08), vertical);

        float warmBand = smoothstep(0.15, 0.88, vUv.y) * (1.0 - smoothstep(0.75, 1.0, vUv.y));
        base += vec3(0.36, 0.2, 0.09) * warmBand * 0.35;

        float vignette = smoothstep(0.95, 0.22, length(vUv - 0.5));
        base *= vignette;

        float grain = sin((vUv.x + vUv.y + uTime * 0.03) * 220.0) * 0.015;
        base += grain;

        gl_FragColor = vec4(base * uVisibility, 1.0);
      }
    `,
  })
}

function createSpotlightMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uVisibility: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
    },
    vertexShader: `
      precision highp float;

      attribute float aAngle;
      attribute float aRadius;
      attribute float aHeight;
      attribute float aSeed;
      attribute float aSize;

      uniform float uTime;
      uniform float uVisibility;
      uniform float uPixelRatio;

      varying float vAlpha;

      void main() {
        float cycle = fract(aSeed + uTime * 0.08 + aHeight * 0.02);
        float y = mix(-1.2, 3.1, cycle);
        float coneRadius = mix(1.9, 0.08, cycle);
        float angle = aAngle + uTime * (0.1 + aSeed * 0.35);

        vec3 pos = vec3(cos(angle) * coneRadius, y, sin(angle) * coneRadius);
        pos.x += sin(uTime * 0.45 + aSeed * 12.0) * 0.05;
        pos.z += cos(uTime * 0.5 + aSeed * 14.0) * 0.05;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        float perspective = 90.0 / max(1.0, -mvPosition.z);
        float pointSize = aSize * uPixelRatio * perspective;
        gl_PointSize = max(pointSize, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        float life = smoothstep(0.0, 0.2, cycle) * (1.0 - smoothstep(0.75, 1.0, cycle));
        vAlpha = life * uVisibility;
      }
    `,
    fragmentShader: `
      precision highp float;

      varying float vAlpha;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float dist = length(uv);

        if (dist > 0.5) {
          discard;
        }

        float alpha = smoothstep(0.55, 0.0, dist) * vAlpha;
        vec3 color = vec3(1.0, 0.84, 0.6);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
}

function createCakeDisplay() {
  const group = new THREE.Group()

  const pedestalGeo = new THREE.CylinderGeometry(2.1, 2.4, 0.72, 96)
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x4a3a2d,
    roughness: 0.62,
    metalness: 0.14,
    emissive: 0x1a110b,
    emissiveIntensity: 0.26,
  })
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat)
  pedestal.position.y = -1.35
  group.add(pedestal)

  const cakeBodyGeo = new THREE.CylinderGeometry(1.38, 1.44, 1.65, 128)
  const cakeBodyMat = new THREE.MeshStandardMaterial({
    color: 0xd8a079,
    roughness: 0.68,
    metalness: 0.08,
  })
  const cakeBody = new THREE.Mesh(cakeBodyGeo, cakeBodyMat)
  cakeBody.position.y = -0.18
  group.add(cakeBody)

  const frostingGeo = new THREE.CylinderGeometry(1.52, 1.62, 0.86, 128, 1, false)
  const frostingMat = new THREE.MeshStandardMaterial({
    color: 0xffb7c8,
    roughness: 0.38,
    metalness: 0.15,
    emissive: 0x2c0f18,
    emissiveIntensity: 0.2,
  })
  const frosting = new THREE.Mesh(frostingGeo, frostingMat)
  frosting.position.y = 1.05
  group.add(frosting)

  return {
    group,
    pedestal,
    cakeBody,
    frosting,
    geometries: [pedestalGeo, cakeBodyGeo, frostingGeo],
    materials: [pedestalMat, cakeBodyMat, frostingMat],
  }
}

function createSpotlightParticles() {
  const angle = new Float32Array(SPOTLIGHT_PARTICLE_COUNT)
  const radius = new Float32Array(SPOTLIGHT_PARTICLE_COUNT)
  const height = new Float32Array(SPOTLIGHT_PARTICLE_COUNT)
  const seed = new Float32Array(SPOTLIGHT_PARTICLE_COUNT)
  const size = new Float32Array(SPOTLIGHT_PARTICLE_COUNT)
  const base = new Float32Array(SPOTLIGHT_PARTICLE_COUNT * 3)

  for (let i = 0; i < SPOTLIGHT_PARTICLE_COUNT; i += 1) {
    angle[i] = Math.random() * Math.PI * 2
    radius[i] = Math.random()
    height[i] = THREE.MathUtils.randFloat(-1.2, 3.2)
    seed[i] = Math.random()
    size[i] = THREE.MathUtils.randFloat(1.2, 4.2)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(base, 3))
  geometry.setAttribute("aAngle", new THREE.BufferAttribute(angle, 1))
  geometry.setAttribute("aRadius", new THREE.BufferAttribute(radius, 1))
  geometry.setAttribute("aHeight", new THREE.BufferAttribute(height, 1))
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1))
  geometry.setAttribute("aSize", new THREE.BufferAttribute(size, 1))

  const material = createSpotlightMaterial()
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false

  return { points, geometry, material }
}

export function createRevealScene() {
  let ctx = null
  let group = null

  let floor = null
  let backWall = null
  let wallMaterial = null
  let sideShelfLeft = null
  let sideShelfRight = null

  let cakeDisplay = null
  let rimLight = null
  let warmFillLight = null
  let spotlightCone = null

  let particles = null

  let textSprite = null
  let textTexture = null

  let defaultCameraBase = null
  let defaultCameraTarget = null
  const revealTarget = new THREE.Vector3(0, 0.2, -9.6)

  return {
    init(context) {
      ctx = context

      group = new THREE.Group()
      group.position.set(0, -0.1, -9.6)
      ctx.scene.add(group)

      const floorGeo = new THREE.PlaneGeometry(18, 18)
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x2f1f16,
        roughness: 0.9,
        metalness: 0.02,
      })
      floor = new THREE.Mesh(floorGeo, floorMat)
      floor.rotation.x = -Math.PI * 0.5
      floor.position.y = -1.72
      floor.position.z = -0.1
      group.add(floor)

      wallMaterial = createBackdropMaterial()
      const wallGeo = new THREE.PlaneGeometry(18, 10)
      backWall = new THREE.Mesh(wallGeo, wallMaterial)
      backWall.position.set(0, 2.35, -9.8)
      group.add(backWall)

      const shelfGeo = new THREE.BoxGeometry(2.4, 1.5, 0.9)
      const shelfMat = new THREE.MeshStandardMaterial({
        color: 0x5a3e2a,
        roughness: 0.7,
        metalness: 0.1,
      })
      sideShelfLeft = new THREE.Mesh(shelfGeo, shelfMat)
      sideShelfLeft.position.set(-4.8, -0.55, -7.4)
      group.add(sideShelfLeft)

      sideShelfRight = new THREE.Mesh(shelfGeo, shelfMat.clone())
      sideShelfRight.position.set(4.8, -0.55, -7.4)
      group.add(sideShelfRight)

      cakeDisplay = createCakeDisplay()
      cakeDisplay.group.position.set(0, 0, 0)
      group.add(cakeDisplay.group)

      rimLight = new THREE.PointLight(0xffb682, 0, 22, 2)
      rimLight.position.set(-2.0, 1.6, 1.8)
      group.add(rimLight)

      warmFillLight = new THREE.PointLight(0xffd9a0, 0, 26, 2)
      warmFillLight.position.set(2.4, 2.6, 1.9)
      group.add(warmFillLight)

      spotlightCone = new THREE.SpotLight(0xffc383, 0, 36, 0.46, 0.5, 0.8)
      spotlightCone.position.set(0, 4.2, 1.0)
      spotlightCone.target = cakeDisplay.group
      group.add(spotlightCone)
      group.add(spotlightCone.target)

      particles = createSpotlightParticles()
      particles.points.position.set(0, 0.2, 0)
      group.add(particles.points)

      const text = createTextSprite()
      if (text) {
        textSprite = text.sprite
        textTexture = text.texture
        ctx.scene.add(textSprite)
      }

      if (ctx.engine) {
        defaultCameraBase = ctx.engine.baseCameraPosition.clone()
        defaultCameraTarget = ctx.engine.cameraTarget.clone()
      }

      group.visible = false
    },

    update(progress, frame = {}) {
      if (!group || !cakeDisplay || !particles || !wallMaterial) return

      const local = clamp01(progress)
      const globalProgress = frame.globalProgress ?? local
      const rangeStart = frame.rangeStart ?? 0.8
      const rangeEnd = frame.rangeEnd ?? 0.92
      const elapsed = frame.elapsed ?? 0

      const enter = easeOutCubic(remap(globalProgress, rangeStart, rangeStart + 0.03))
      const exit = 1 - easeInOutCubic(remap(globalProgress, rangeEnd, rangeEnd + 0.05))
      const visibility = clamp01(enter * exit)

      const pullback = easeOutCubic(remap(local, 0.05, 0.75))
      const warmness = easeInOutCubic(remap(local, 0.2, 1.0))

      const cakeRotation = elapsed * 0.24 + local * 0.6
      cakeDisplay.group.rotation.y = cakeRotation
      cakeDisplay.group.position.y = Math.sin(elapsed * 0.35) * 0.04

      cakeDisplay.frosting.material.emissiveIntensity = 0.18 + warmness * 0.22

      rimLight.intensity = 3 + visibility * 8
      warmFillLight.intensity = 2 + visibility * 6
      spotlightCone.intensity = 2 + visibility * 10

      wallMaterial.uniforms.uTime.value = elapsed
      wallMaterial.uniforms.uVisibility.value = visibility

      particles.material.uniforms.uTime.value = elapsed
      particles.material.uniforms.uVisibility.value = visibility
      particles.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2)

      if (textSprite && textSprite.material) {
        const textIn = easeOutCubic(remap(local, 0.36, 0.62))
        const textOut = 1 - easeInOutCubic(remap(local, 0.9, 1.0))
        textSprite.material.opacity = clamp01(textIn * textOut) * visibility
        textSprite.position.y = 2.45 + Math.sin(elapsed * 0.45) * 0.05
      }

      if (ctx.engine && defaultCameraBase && defaultCameraTarget) {
        const orbit = elapsed * 0.12 + local * 0.85
        const targetX = Math.sin(orbit) * 0.7
        const targetY = 0.62 + Math.sin(elapsed * 0.25) * 0.05
        const targetZ = THREE.MathUtils.lerp(5.9, 10.6, pullback)

        const mix = visibility
        ctx.engine.baseCameraPosition.x = THREE.MathUtils.lerp(defaultCameraBase.x, targetX, mix)
        ctx.engine.baseCameraPosition.y = THREE.MathUtils.lerp(defaultCameraBase.y, targetY, mix)
        ctx.engine.baseCameraPosition.z = THREE.MathUtils.lerp(defaultCameraBase.z, targetZ, mix)

        ctx.engine.cameraTarget.lerpVectors(defaultCameraTarget, revealTarget, mix * 0.95)

        ctx.engine.setBloom({
          strength: THREE.MathUtils.lerp(1.05, 1.45, warmness),
          radius: THREE.MathUtils.lerp(0.34, 0.52, warmness),
          threshold: 0.16,
        })
        ctx.engine.setDepthOfField({
          enabled: visibility > 0.01,
          focus: THREE.MathUtils.lerp(4.0, 6.2, pullback),
          aperture: THREE.MathUtils.lerp(0.00016, 0.00024, warmness),
          maxblur: THREE.MathUtils.lerp(0.008, 0.012, warmness),
        })
      }

      group.visible = visibility > 0.01
    },

    dispose() {
      if (!ctx || !group) return

      if (ctx.engine && defaultCameraBase && defaultCameraTarget) {
        ctx.engine.baseCameraPosition.copy(defaultCameraBase)
        ctx.engine.cameraTarget.copy(defaultCameraTarget)
        ctx.engine.resetPostProcessing()
      }

      ctx.scene.remove(group)
      if (textSprite) {
        ctx.scene.remove(textSprite)
      }

      if (floor) {
        floor.geometry.dispose()
        floor.material.dispose()
      }
      if (backWall) {
        backWall.geometry.dispose()
      }
      if (wallMaterial) wallMaterial.dispose()
      if (sideShelfLeft) {
        sideShelfLeft.geometry.dispose()
        sideShelfLeft.material.dispose()
      }
      if (sideShelfRight) {
        sideShelfRight.material.dispose()
      }

      if (cakeDisplay) {
        cakeDisplay.geometries.forEach((geometry) => geometry.dispose())
        cakeDisplay.materials.forEach((material) => material.dispose())
      }

      if (particles) {
        particles.geometry.dispose()
        particles.material.dispose()
      }

      if (textSprite && textSprite.material) textSprite.material.dispose()
      if (textTexture) textTexture.dispose()

      ctx = null
      group = null
      floor = null
      backWall = null
      wallMaterial = null
      sideShelfLeft = null
      sideShelfRight = null
      cakeDisplay = null
      rimLight = null
      warmFillLight = null
      spotlightCone = null
      particles = null
      textSprite = null
      textTexture = null
      defaultCameraBase = null
      defaultCameraTarget = null
    },
  }
}
