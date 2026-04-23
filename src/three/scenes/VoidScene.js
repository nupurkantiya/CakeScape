import * as THREE from "three"

const VOID_PARTICLE_COUNT = 26000

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

function createRadialTexture(size, innerColor, outerColor) {
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext("2d")
  if (!context) {
    return null
  }

  const gradient = context.createRadialGradient(
    size * 0.5,
    size * 0.5,
    size * 0.03,
    size * 0.5,
    size * 0.5,
    size * 0.5
  )
  gradient.addColorStop(0, innerColor)
  gradient.addColorStop(1, outerColor)

  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function createTextSprite() {
  const canvas = document.createElement("canvas")
  canvas.width = 2048
  canvas.height = 512
  const context = canvas.getContext("2d")

  if (!context) {
    return null
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.textAlign = "center"
  context.textBaseline = "middle"

  context.shadowColor = "rgba(255, 184, 128, 0.35)"
  context.shadowBlur = 36

  const gradient = context.createLinearGradient(0, 0, canvas.width, 0)
  gradient.addColorStop(0, "rgba(235, 240, 255, 0.92)")
  gradient.addColorStop(0.55, "rgba(255, 223, 188, 0.97)")
  gradient.addColorStop(1, "rgba(255, 208, 150, 0.9)")

  context.fillStyle = gradient
  context.font = "600 118px 'Georgia', 'Times New Roman', serif"
  context.fillText("Close your eyes... imagine...", canvas.width / 2, canvas.height / 2)

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
  sprite.position.set(0, 1.15, -8.5)
  sprite.scale.set(9.2, 2.3, 1)

  return { sprite, texture }
}

function createParticleMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uTravel: { value: 0 },
      uVisibility: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMouseStrength: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
    },
    vertexShader: `
      precision highp float;

      attribute vec3 aBasePosition;
      attribute float aLayer;
      attribute float aSize;
      attribute float aAlpha;
      attribute float aTwinkle;

      uniform float uTime;
      uniform float uTravel;
      uniform float uVisibility;
      uniform vec2 uMouse;
      uniform float uMouseStrength;
      uniform float uPixelRatio;

      varying float vAlpha;
      varying float vWarm;

      void main() {
        vec3 pos = aBasePosition;

        float travelSpeed = mix(0.35, 2.4, 1.0 - aLayer);
        float travel = uTravel * travelSpeed;
        float zRange = 132.0;
        pos.z = mod(pos.z + travel + 140.0, zRange) - 140.0;

        float swirl = sin(aTwinkle * 6.2831 + uTime * 0.7 + pos.z * 0.065);
        float swirlStrength = mix(0.22, 0.06, aLayer);
        pos.x += cos(swirl + uTime * 0.15) * swirlStrength;
        pos.y += sin(swirl * 1.2 + uTime * 0.12) * swirlStrength;

        vec2 mouseField = uMouse * (6.2 - aLayer * 3.9);
        vec2 delta = pos.xy - mouseField;
        float dist = length(delta) + 0.0001;
        vec2 direction = delta / dist;
        float ripple = sin(dist * 8.7 - uTime * 4.2) * exp(-dist * 1.55);
        float rippleAmount = ripple * uMouseStrength * (1.1 - aLayer * 0.75);
        pos.xy += direction * rippleAmount;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        float perspective = 95.0 / max(1.0, -mvPosition.z);
        float size = aSize * uPixelRatio * perspective;
        gl_PointSize = max(size, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        float twinkle = 0.66 + 0.34 * sin(uTime * 2.1 + aTwinkle * 12.0);
        float layerFade = mix(1.0, 0.55, aLayer);
        vAlpha = aAlpha * twinkle * layerFade * uVisibility;
        vWarm = smoothstep(0.3, 0.95, aLayer);
      }
    `,
    fragmentShader: `
      precision highp float;

      varying float vAlpha;
      varying float vWarm;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);

        if (d > 0.5) {
          discard;
        }

        float core = smoothstep(0.28, 0.0, d);
        float halo = smoothstep(0.62, 0.0, d) * 0.8;
        float alpha = (core + halo * 0.55) * vAlpha;

        if (alpha < 0.01) {
          discard;
        }

        vec3 deepBlue = vec3(0.56, 0.71, 0.95);
        vec3 warmGold = vec3(1.0, 0.86, 0.62);
        vec3 color = mix(deepBlue, warmGold, vWarm);
        color *= 1.05 + halo * 1.2;

        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
}

function createVoidVolumeMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    transparent: false,
    uniforms: {
      uTime: { value: 0 },
      uVisibility: { value: 0 },
    },
    vertexShader: `
      varying vec3 vWorldDirection;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldDirection = normalize(worldPosition.xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      varying vec3 vWorldDirection;
      uniform float uTime;
      uniform float uVisibility;

      void main() {
        float vertical = smoothstep(-0.9, 0.8, vWorldDirection.y);
        vec3 deep = vec3(0.01, 0.012, 0.03);
        vec3 upper = vec3(0.03, 0.03, 0.08);
        vec3 color = mix(deep, upper, vertical);

        vec3 glowDirection = normalize(vec3(0.5, 0.24, -1.0));
        float warmGlow = pow(max(dot(vWorldDirection, glowDirection), 0.0), 8.0);
        color += vec3(0.65, 0.42, 0.18) * warmGlow * 0.55;

        float shimmer = sin((vWorldDirection.x + vWorldDirection.y + uTime * 0.05) * 24.0) * 0.02;
        color += vec3(0.03, 0.025, 0.045) * shimmer;

        gl_FragColor = vec4(color * uVisibility, 1.0);
      }
    `,
  })
}

export function createVoidScene() {
  let ctx = null
  let group = null
  let particleGeometry = null
  let particleMaterial = null
  let particlePoints = null
  let volumeSphere = null
  let volumeMaterial = null
  let glowSprite = null
  let glowTexture = null
  let textSprite = null
  let textTexture = null
  let previousFog = null
  let defaultCameraBase = null
  let defaultCameraTarget = null

  const mouseTarget = new THREE.Vector2(0, 0)
  const mouseCurrent = new THREE.Vector2(0, 0)
  let mouseImpulse = 0
  let previousMouseX = 0
  let previousMouseY = 0

  const cameraTargetTemp = new THREE.Vector3()

  function onPointerMove(event) {
    const x = (event.clientX / window.innerWidth) * 2 - 1
    const y = -((event.clientY / window.innerHeight) * 2 - 1)

    mouseTarget.set(x, y)
    const velocity = Math.hypot(x - previousMouseX, y - previousMouseY)
    mouseImpulse = Math.max(mouseImpulse, velocity * 2.6)
    previousMouseX = x
    previousMouseY = y
  }

  function onPointerLeave() {
    mouseTarget.set(0, 0)
  }

  return {
    init(context) {
      ctx = context
      group = new THREE.Group()
      ctx.scene.add(group)

      previousFog = ctx.scene.fog
      ctx.scene.fog = new THREE.FogExp2(0x05060d, 0.017)

      volumeMaterial = createVoidVolumeMaterial()
      volumeSphere = new THREE.Mesh(new THREE.SphereGeometry(135, 40, 40), volumeMaterial)
      group.add(volumeSphere)

      const basePositions = new Float32Array(VOID_PARTICLE_COUNT * 3)
      const layers = new Float32Array(VOID_PARTICLE_COUNT)
      const sizes = new Float32Array(VOID_PARTICLE_COUNT)
      const alpha = new Float32Array(VOID_PARTICLE_COUNT)
      const twinkle = new Float32Array(VOID_PARTICLE_COUNT)

      for (let i = 0; i < VOID_PARTICLE_COUNT; i += 1) {
        const i3 = i * 3
        const layer = Math.random()

        layers[i] = layer
        sizes[i] = THREE.MathUtils.lerp(0.8, 3.2, 1 - layer) * (0.75 + Math.random() * 0.75)
        alpha[i] = THREE.MathUtils.lerp(0.2, 0.95, 1 - layer)
        twinkle[i] = Math.random()

        basePositions[i3] = THREE.MathUtils.randFloatSpread(28)
        basePositions[i3 + 1] = THREE.MathUtils.randFloatSpread(18)
        basePositions[i3 + 2] = THREE.MathUtils.randFloat(-140, -8)
      }

      particleGeometry = new THREE.BufferGeometry()
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(basePositions, 3))
      particleGeometry.setAttribute("aBasePosition", new THREE.BufferAttribute(basePositions, 3))
      particleGeometry.setAttribute("aLayer", new THREE.BufferAttribute(layers, 1))
      particleGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1))
      particleGeometry.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1))
      particleGeometry.setAttribute("aTwinkle", new THREE.BufferAttribute(twinkle, 1))

      particleMaterial = createParticleMaterial()
      particlePoints = new THREE.Points(particleGeometry, particleMaterial)
      particlePoints.frustumCulled = false
      group.add(particlePoints)

      glowTexture = createRadialTexture(1024, "rgba(255, 206, 136, 0.9)", "rgba(255, 180, 98, 0)")
      if (glowTexture) {
        const glowMaterial = new THREE.SpriteMaterial({
          map: glowTexture,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          color: 0xffd6a8,
        })
        glowSprite = new THREE.Sprite(glowMaterial)
        glowSprite.position.set(6.4, 3.4, -44)
        glowSprite.scale.set(40, 40, 1)
        group.add(glowSprite)
      }

      const text = createTextSprite()
      if (text) {
        textSprite = text.sprite
        textTexture = text.texture
        group.add(textSprite)
      }

      if (ctx.engine) {
        defaultCameraBase = ctx.engine.baseCameraPosition.clone()
        defaultCameraTarget = ctx.engine.cameraTarget.clone()
      }

      window.addEventListener("pointermove", onPointerMove, { passive: true })
      window.addEventListener("pointerleave", onPointerLeave)
    },

    update(progress, frame = {}) {
      if (!group || !particleMaterial || !volumeMaterial) return

      const elapsed = frame.elapsed ?? 0
      const globalProgress = frame.globalProgress ?? progress
      const rangeStart = frame.rangeStart ?? 0.1
      const rangeEnd = frame.rangeEnd ?? 0.25

      const enter = easeOutCubic(remap(globalProgress, rangeStart, rangeStart + 0.03))
      const exit = 1 - easeInOutCubic(remap(globalProgress, rangeEnd, rangeEnd + 0.05))
      const visibility = clamp01(enter * exit)

      const local = clamp01(progress)
      const drift = easeInOutCubic(local)

      mouseCurrent.lerp(mouseTarget, 0.08)
      mouseImpulse = THREE.MathUtils.lerp(mouseImpulse, 0, 0.08)
      const mouseStrength = clamp01(0.32 + mouseImpulse * 0.55) * visibility

      particleMaterial.uniforms.uTime.value = elapsed
      particleMaterial.uniforms.uTravel.value = elapsed * 4.2 + drift * 14.0
      particleMaterial.uniforms.uVisibility.value = visibility
      particleMaterial.uniforms.uMouse.value.copy(mouseCurrent)
      particleMaterial.uniforms.uMouseStrength.value = mouseStrength
      particleMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2)

      volumeMaterial.uniforms.uTime.value = elapsed
      volumeMaterial.uniforms.uVisibility.value = visibility

      if (glowSprite && glowSprite.material) {
        glowSprite.material.opacity = 0.1 + visibility * 0.35
        glowSprite.position.x = 6.2 + Math.sin(elapsed * 0.1) * 0.8
        glowSprite.position.y = 3.3 + Math.cos(elapsed * 0.12) * 0.5
      }

      if (textSprite && textSprite.material) {
        const textIn = easeOutCubic(remap(local, 0.22, 0.5))
        const textOut = 1 - easeInOutCubic(remap(local, 0.82, 1))
        const textOpacity = clamp01(textIn * textOut) * visibility

        textSprite.material.opacity = textOpacity
        textSprite.position.y = 1.18 + Math.sin(elapsed * 0.5) * 0.06
      }

      if (ctx.engine && defaultCameraBase && defaultCameraTarget) {
        const forward = drift * 1.35
        const floatX = Math.sin(elapsed * 0.23) * 0.09 + mouseCurrent.x * 0.1
        const floatY = Math.cos(elapsed * 0.27) * 0.06 + mouseCurrent.y * 0.07

        ctx.engine.baseCameraPosition.x = THREE.MathUtils.lerp(defaultCameraBase.x, defaultCameraBase.x + floatX, visibility)
        ctx.engine.baseCameraPosition.y = THREE.MathUtils.lerp(defaultCameraBase.y, defaultCameraBase.y + floatY, visibility)
        ctx.engine.baseCameraPosition.z = THREE.MathUtils.lerp(defaultCameraBase.z, defaultCameraBase.z - forward, visibility)

        cameraTargetTemp.set(mouseCurrent.x * 0.42, mouseCurrent.y * 0.24, -7.2)
        ctx.engine.cameraTarget.lerpVectors(defaultCameraTarget, cameraTargetTemp, visibility * 0.55)
      }

      group.visible = visibility > 0.01
    },

    dispose() {
      if (!ctx || !group) return

      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerleave", onPointerLeave)

      if (ctx.engine && defaultCameraBase && defaultCameraTarget) {
        ctx.engine.baseCameraPosition.copy(defaultCameraBase)
        ctx.engine.cameraTarget.copy(defaultCameraTarget)
      }

      ctx.scene.fog = previousFog
      ctx.scene.remove(group)

      if (particleGeometry) {
        particleGeometry.dispose()
      }
      if (particleMaterial) {
        particleMaterial.dispose()
      }
      if (volumeSphere) {
        volumeSphere.geometry.dispose()
      }
      if (volumeMaterial) {
        volumeMaterial.dispose()
      }
      if (glowSprite && glowSprite.material) {
        glowSprite.material.dispose()
      }
      if (glowTexture) {
        glowTexture.dispose()
      }
      if (textSprite && textSprite.material) {
        textSprite.material.dispose()
      }
      if (textTexture) {
        textTexture.dispose()
      }

      ctx = null
      group = null
      particleGeometry = null
      particleMaterial = null
      particlePoints = null
      volumeSphere = null
      volumeMaterial = null
      glowSprite = null
      glowTexture = null
      textSprite = null
      textTexture = null
      previousFog = null
      defaultCameraBase = null
      defaultCameraTarget = null
    },
  }
}
