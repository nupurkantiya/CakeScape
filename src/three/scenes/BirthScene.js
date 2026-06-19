import * as THREE from "three"

const INGREDIENT_PARTICLE_COUNT = 18000

function clamp01(value) {
  return THREE.MathUtils.clamp(value, 0, 1)
}

function remap(value, inMin, inMax) {
  if (inMax === inMin) return 0
  return clamp01((value - inMin) / (inMax - inMin))
}

function easeInOutCubic(t) {
  const k = clamp01(t)
  return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2
}

function easeOutCubic(t) {
  const k = clamp01(t)
  return 1 - (1 - k) ** 3
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
  context.shadowColor = "rgba(0, 0, 0, 0.5)"
  context.shadowBlur = 10

  context.fillStyle = "rgba(255, 255, 255, 0.65)"
  context.font = "300 96px 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  context.fillText("From the purest ingredients...", canvas.width / 2, canvas.height / 2)

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
  sprite.position.set(0, 1.85, -8.7)
  sprite.scale.set(8.9, 2.2, 1)

  return { sprite, texture }
}

function createShellMaterial(halfSign) {
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uCrack: { value: 0 },
      uVisibility: { value: 0 },
      uHalfSign: { value: halfSign },
      uGlow: { value: 0 },
    },
    vertexShader: `
      precision highp float;

      uniform float uTime;
      uniform float uCrack;
      uniform float uHalfSign;

      varying vec3 vNormalW;
      varying vec3 vPositionW;
      varying float vCrackMask;

      void main() {
        vec3 p = position;

        float seam = 1.0 - smoothstep(0.0, 0.26, abs(p.y));
        float fracture = sin(p.x * 18.0 + uTime * 6.0) * cos(p.z * 16.0 - uTime * 5.0);
        float crackJitter = fracture * seam * uCrack * 0.06;
        p += normalize(position) * crackJitter;

        float open = smoothstep(0.2, 1.0, uCrack);
        vec3 outDir = normalize(vec3(p.x, 0.18 * uHalfSign, p.z));
        p += outDir * open * (0.2 + seam * 0.52);
        p.y += uHalfSign * open * 0.34;

        vec4 worldPos = modelMatrix * vec4(p, 1.0);
        vPositionW = worldPos.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vCrackMask = seam * open;

        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform float uVisibility;
      uniform float uGlow;

      varying vec3 vNormalW;
      varying vec3 vPositionW;
      varying float vCrackMask;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vPositionW);
        float fresnel = pow(1.0 - max(dot(normalize(vNormalW), viewDir), 0.0), 2.2);

        vec3 base = vec3(0.94, 0.91, 0.86);
        vec3 warmTint = vec3(0.99, 0.9, 0.76);
        vec3 color = mix(base, warmTint, fresnel * 0.55 + uGlow * 0.25);

        float crackDarkening = smoothstep(0.0, 1.0, vCrackMask) * 0.26;
        color -= crackDarkening;

        float alpha = uVisibility;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
}

function createInnerGlowMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uCrack: { value: 0 },
      uVisibility: { value: 0 },
    },
    vertexShader: `
      varying vec3 vLocalPosition;

      void main() {
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      varying vec3 vLocalPosition;
      uniform float uTime;
      uniform float uCrack;
      uniform float uVisibility;

      void main() {
        float radial = 1.0 - clamp(length(vLocalPosition.xy) / 1.1, 0.0, 1.0);
        float pulse = 0.75 + 0.25 * sin(uTime * 5.0);
        float crackBoost = smoothstep(0.25, 1.0, uCrack);
        float alpha = radial * pulse * crackBoost * uVisibility;

        vec3 color = mix(vec3(1.0, 0.78, 0.42), vec3(1.0, 0.92, 0.64), radial);
        gl_FragColor = vec4(color * (1.0 + crackBoost), alpha);
      }
    `,
  })
}

function createIngredientMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uVisibility: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
    },
    vertexShader: `
      precision highp float;

      attribute vec3 aEggPos;
      attribute vec3 aFlourPos;
      attribute vec3 aSugarPos;
      attribute float aState;
      attribute float aSize;
      attribute float aSeed;

      uniform float uTime;
      uniform float uProgress;
      uniform float uVisibility;
      uniform float uPixelRatio;

      varying float vAlpha;
      varying float vSugarMix;
      varying float vCloudMix;

      vec4 mod289(vec4 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }

      float mod289(float x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }

      vec4 permute(vec4 x) {
        return mod289(((x * 34.0) + 1.0) * x);
      }

      vec4 taylorInvSqrt(vec4 r) {
        return 1.79284291400159 - 0.85373472095314 * r;
      }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        i = vec3(mod289(i.x), mod289(i.y), mod289(i.z));
        vec4 p = permute(
          permute(
            permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)
          ) + i.x + vec4(0.0, i1.x, i2.x, 1.0)
        );

        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
      }

      vec3 curlNoise(vec3 p) {
        float e = 0.18;
        vec3 dx = vec3(e, 0.0, 0.0);
        vec3 dy = vec3(0.0, e, 0.0);
        vec3 dz = vec3(0.0, 0.0, e);

        float p_x0 = snoise(p - dx);
        float p_x1 = snoise(p + dx);
        float p_y0 = snoise(p - dy);
        float p_y1 = snoise(p + dy);
        float p_z0 = snoise(p - dz);
        float p_z1 = snoise(p + dz);

        float x = p_y1 - p_y0 - p_z1 + p_z0;
        float y = p_z1 - p_z0 - p_x1 + p_x0;
        float z = p_x1 - p_x0 - p_y1 + p_y0;

        return normalize(vec3(x, y, z) + 0.0001);
      }

      void main() {
        float crack = smoothstep(0.22, 0.62, uProgress);
        float flourMix = smoothstep(0.38, 0.78, uProgress);
        float sugarMix = smoothstep(0.58, 1.0, uProgress) * aState;

        vec3 position = mix(aEggPos, aFlourPos, flourMix);
        position = mix(position, aSugarPos, sugarMix);

        vec3 flow = curlNoise(position * 0.62 + vec3(aSeed * 7.0, uTime * 0.28, aSeed * 3.5));
        float vortex = smoothstep(0.42, 1.0, uProgress);
        position += flow * vortex * (0.45 + aState * 0.9);

        float orbital = uTime * (0.45 + aState * 1.25) + aSeed * 6.2831;
        float c = cos(orbital);
        float s = sin(orbital);
        mat2 rotation = mat2(c, -s, s, c);
        position.xz = mix(position.xz, rotation * position.xz, vortex * 0.44);

        vec3 burstDir = normalize(aFlourPos + vec3(0.01, 0.02, 0.01));
        position += burstDir * crack * (0.65 + aState * 1.45);
        position.y += vortex * (0.2 + aState * 0.45);

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float perspective = 110.0 / max(1.0, -mvPosition.z);
        float size = aSize * uPixelRatio * perspective;
        size *= mix(1.8, 1.05, sugarMix);
        gl_PointSize = max(size, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        float activity = smoothstep(0.24, 0.95, uProgress);
        float twinkle = 0.72 + 0.28 * sin(uTime * 2.3 + aSeed * 11.0);
        vAlpha = activity * twinkle * uVisibility;
        vSugarMix = sugarMix;
        vCloudMix = flourMix * (1.0 - sugarMix * 0.85);
      }
    `,
    fragmentShader: `
      precision highp float;

      varying float vAlpha;
      varying float vSugarMix;
      varying float vCloudMix;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float dist = length(uv);

        if (dist > 0.5) {
          discard;
        }

        float cloud = smoothstep(0.62, 0.0, dist);
        float sparkle = smoothstep(0.32, 0.0, dist);

        vec3 flourColor = vec3(0.94, 0.92, 0.88);
        vec3 sugarColor = vec3(1.0, 0.92, 0.7);
        vec3 color = mix(flourColor, sugarColor, vSugarMix);

        float alpha = mix(cloud * 0.65, sparkle, vSugarMix);
        alpha *= mix(1.0, 1.25, vCloudMix);
        alpha *= vAlpha;

        if (alpha < 0.01) {
          discard;
        }

        gl_FragColor = vec4(color * (1.05 + vSugarMix * 0.35), alpha);
      }
    `,
  })
}

function createIngredientGeometry(count) {
  const eggPos = new Float32Array(count * 3)
  const flourPos = new Float32Array(count * 3)
  const sugarPos = new Float32Array(count * 3)
  const state = new Float32Array(count)
  const size = new Float32Array(count)
  const seed = new Float32Array(count)

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3

    const u = Math.random()
    const v = Math.random()
    const theta = u * Math.PI * 2
    const phi = Math.acos(2 * v - 1)
    const radius = THREE.MathUtils.randFloat(0.02, 0.8)

    eggPos[i3] = radius * Math.sin(phi) * Math.cos(theta)
    eggPos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    eggPos[i3 + 2] = radius * Math.cos(phi)

    const flourTheta = Math.random() * Math.PI * 2
    const flourR = THREE.MathUtils.randFloat(0.4, 2.5)
    const flourY = THREE.MathUtils.randFloat(-0.35, 1.9)
    flourPos[i3] = Math.cos(flourTheta) * flourR
    flourPos[i3 + 1] = flourY
    flourPos[i3 + 2] = Math.sin(flourTheta) * flourR * 0.9 - THREE.MathUtils.randFloat(0.0, 1.7)

    const sugarTheta = Math.random() * Math.PI * 2
    const sugarRadius = THREE.MathUtils.randFloat(0.9, 3.4)
    const sugarHeight = THREE.MathUtils.randFloat(0.0, 3.2)
    sugarPos[i3] = Math.cos(sugarTheta) * sugarRadius
    sugarPos[i3 + 1] = sugarHeight
    sugarPos[i3 + 2] = Math.sin(sugarTheta) * sugarRadius - THREE.MathUtils.randFloat(0.6, 2.8)

    state[i] = Math.random()
    size[i] = THREE.MathUtils.randFloat(1.1, 4.2)
    seed[i] = Math.random()
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(eggPos, 3))
  geometry.setAttribute("aEggPos", new THREE.BufferAttribute(eggPos, 3))
  geometry.setAttribute("aFlourPos", new THREE.BufferAttribute(flourPos, 3))
  geometry.setAttribute("aSugarPos", new THREE.BufferAttribute(sugarPos, 3))
  geometry.setAttribute("aState", new THREE.BufferAttribute(state, 1))
  geometry.setAttribute("aSize", new THREE.BufferAttribute(size, 1))
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1))

  return geometry
}

export function createBirthScene() {
  let ctx = null
  let group = null
  let topShell = null
  let bottomShell = null
  let topMaterial = null
  let bottomMaterial = null
  let shellTopGeometry = null
  let shellBottomGeometry = null
  let innerGlow = null
  let innerGlowGeometry = null
  let innerGlowMaterial = null
  let coreLight = null
  let ingredientPoints = null
  let ingredientGeometry = null
  let ingredientMaterial = null
  let textSprite = null
  let textTexture = null

  let defaultCameraBase = null
  let defaultCameraTarget = null

  const cameraTargetTemp = new THREE.Vector3(0, 0.05, -8.8)

  return {
    init(context) {
      ctx = context
      group = new THREE.Group()
      group.position.set(0, -0.25, -8.8)
      ctx.scene.add(group)

      shellTopGeometry = new THREE.SphereGeometry(1.08, 96, 96, 0, Math.PI * 2, 0, Math.PI / 2 + 0.08)
      shellBottomGeometry = new THREE.SphereGeometry(
        1.08,
        96,
        96,
        0,
        Math.PI * 2,
        Math.PI / 2 - 0.08,
        Math.PI / 2 + 0.08
      )

      topMaterial = createShellMaterial(1)
      bottomMaterial = createShellMaterial(-1)

      topShell = new THREE.Mesh(shellTopGeometry, topMaterial)
      bottomShell = new THREE.Mesh(shellBottomGeometry, bottomMaterial)
      group.add(topShell)
      group.add(bottomShell)

      innerGlowGeometry = new THREE.SphereGeometry(0.86, 64, 64)
      innerGlowMaterial = createInnerGlowMaterial()
      innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial)
      innerGlow.position.z = -0.08
      group.add(innerGlow)

      coreLight = new THREE.PointLight(0xffc175, 0, 24, 2)
      coreLight.position.set(0, 0.12, -0.1)
      group.add(coreLight)

      ingredientGeometry = createIngredientGeometry(INGREDIENT_PARTICLE_COUNT)
      ingredientMaterial = createIngredientMaterial()
      ingredientPoints = new THREE.Points(ingredientGeometry, ingredientMaterial)
      ingredientPoints.frustumCulled = false
      group.add(ingredientPoints)

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
      if (!group || !topMaterial || !bottomMaterial || !innerGlowMaterial || !ingredientMaterial) return

      const localProgress = clamp01(progress)
      const globalProgress = frame.globalProgress ?? localProgress
      const rangeStart = frame.rangeStart ?? 0.25
      const rangeEnd = frame.rangeEnd ?? 0.45
      const elapsed = frame.elapsed ?? 0

      const enter = easeOutCubic(remap(globalProgress, rangeStart, rangeStart + 0.04))
      const exit = 1 - easeInOutCubic(remap(globalProgress, rangeEnd, rangeEnd + 0.06))
      const visibility = clamp01(enter * exit)

      const crack = easeInOutCubic(remap(localProgress, 0.22, 0.66))
      const ingredientPhase = easeInOutCubic(remap(localProgress, 0.44, 1.0))

      topMaterial.uniforms.uTime.value = elapsed
      topMaterial.uniforms.uCrack.value = crack
      topMaterial.uniforms.uVisibility.value = visibility
      topMaterial.uniforms.uGlow.value = ingredientPhase

      bottomMaterial.uniforms.uTime.value = elapsed
      bottomMaterial.uniforms.uCrack.value = crack
      bottomMaterial.uniforms.uVisibility.value = visibility
      bottomMaterial.uniforms.uGlow.value = ingredientPhase

      innerGlowMaterial.uniforms.uTime.value = elapsed
      innerGlowMaterial.uniforms.uCrack.value = crack
      innerGlowMaterial.uniforms.uVisibility.value = visibility

      ingredientMaterial.uniforms.uTime.value = elapsed
      ingredientMaterial.uniforms.uProgress.value = localProgress
      ingredientMaterial.uniforms.uVisibility.value = visibility
      ingredientMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2)

      const openAmount = crack
      topShell.rotation.x = -openAmount * 0.28
      topShell.rotation.z = openAmount * 0.16
      bottomShell.rotation.x = openAmount * 0.08
      bottomShell.rotation.z = -openAmount * 0.05

      const lightPower = easeOutCubic(remap(localProgress, 0.25, 0.72)) * visibility
      coreLight.intensity = 4 + lightPower * 20
      coreLight.distance = 24 + lightPower * 12

      group.position.y = -0.25 + Math.sin(elapsed * 0.8) * 0.04
      group.rotation.y = Math.sin(elapsed * 0.3) * 0.1
      group.visible = visibility > 0.01

      if (textSprite && textSprite.material) {
        const textIn = easeOutCubic(remap(localProgress, 0.45, 0.7))
        const textOut = 1 - easeInOutCubic(remap(localProgress, 0.9, 1))
        textSprite.material.opacity = clamp01(textIn * textOut) * visibility
        textSprite.position.y = 1.82 + Math.sin(elapsed * 0.42) * 0.06
      }

      if (ctx.engine && defaultCameraBase && defaultCameraTarget) {
        const approach = easeOutCubic(remap(localProgress, 0.0, 0.62))
        const acceleration = easeOutCubic(remap(localProgress, 0.45, 0.9))
        const forwardDrift = approach * 0.9 + acceleration * 1.8

        ctx.engine.baseCameraPosition.x = THREE.MathUtils.lerp(
          defaultCameraBase.x,
          defaultCameraBase.x + Math.sin(elapsed * 0.3) * 0.04,
          visibility
        )
        ctx.engine.baseCameraPosition.y = THREE.MathUtils.lerp(
          defaultCameraBase.y,
          defaultCameraBase.y + Math.cos(elapsed * 0.34) * 0.05,
          visibility
        )
        ctx.engine.baseCameraPosition.z = THREE.MathUtils.lerp(
          defaultCameraBase.z,
          defaultCameraBase.z - forwardDrift,
          visibility
        )

        ctx.engine.cameraTarget.lerpVectors(defaultCameraTarget, cameraTargetTemp, visibility * 0.7)
      }
    },

    dispose() {
      if (!ctx || !group) return

      if (ctx.engine && defaultCameraBase && defaultCameraTarget) {
        ctx.engine.baseCameraPosition.copy(defaultCameraBase)
        ctx.engine.cameraTarget.copy(defaultCameraTarget)
      }

      ctx.scene.remove(group)
      if (textSprite) {
        ctx.scene.remove(textSprite)
      }

      if (shellTopGeometry) shellTopGeometry.dispose()
      if (shellBottomGeometry) shellBottomGeometry.dispose()
      if (topMaterial) topMaterial.dispose()
      if (bottomMaterial) bottomMaterial.dispose()
      if (innerGlowGeometry) innerGlowGeometry.dispose()
      if (innerGlowMaterial) innerGlowMaterial.dispose()
      if (ingredientGeometry) ingredientGeometry.dispose()
      if (ingredientMaterial) ingredientMaterial.dispose()
      if (textSprite && textSprite.material) textSprite.material.dispose()
      if (textTexture) textTexture.dispose()

      ctx = null
      group = null
      topShell = null
      bottomShell = null
      topMaterial = null
      bottomMaterial = null
      shellTopGeometry = null
      shellBottomGeometry = null
      innerGlow = null
      innerGlowGeometry = null
      innerGlowMaterial = null
      coreLight = null
      ingredientPoints = null
      ingredientGeometry = null
      ingredientMaterial = null
      textSprite = null
      textTexture = null
      defaultCameraBase = null
      defaultCameraTarget = null
    },
  }
}
