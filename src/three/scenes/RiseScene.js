import * as THREE from "three"

const MIXTURE_PARTICLE_COUNT = 6500
const LAYER_BURST_COUNT = 900

const LAYER_CONFIGS = [
  { color: 0xc9936f, start: 0.28, targetY: -0.9 },
  { color: 0xb27757, start: 0.48, targetY: -0.25 },
  { color: 0xe0b089, start: 0.68, targetY: 0.4 },
]

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
  context.shadowColor = "rgba(255, 190, 140, 0.38)"
  context.shadowBlur = 34

  const gradient = context.createLinearGradient(0, 0, canvas.width, 0)
  gradient.addColorStop(0, "rgba(245, 238, 228, 0.9)")
  gradient.addColorStop(0.6, "rgba(255, 214, 170, 0.96)")
  gradient.addColorStop(1, "rgba(255, 198, 144, 0.86)")

  context.fillStyle = gradient
  context.font = "600 112px 'Georgia', 'Times New Roman', serif"
  context.fillText("Layer by layer...", canvas.width / 2, canvas.height / 2)

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
  sprite.position.set(0, 2.0, -8.6)
  sprite.scale.set(6.8, 2.0, 1)

  return { sprite, texture }
}

function createDoughLayerMaterial(colorHex) {
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uRise: { value: 0 },
      uPulse: { value: 0 },
      uVisibility: { value: 0 },
      uBaseColor: { value: new THREE.Color(colorHex) },
    },
    vertexShader: `
      precision highp float;

      uniform float uTime;
      uniform float uRise;
      uniform float uPulse;

      varying vec3 vNormalW;
      varying vec3 vPositionW;
      varying float vRise;

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

      void main() {
        vec3 p = position;

        float rise = smoothstep(0.0, 1.0, uRise);
        float noise = snoise(vec3(p.x * 1.9, p.y * 2.7 + uTime * 0.5 + rise * 1.8, p.z * 1.9));

        float verticalGrowth = mix(0.34, 1.08, rise);
        float radialGrowth = 1.0 + rise * 0.18 + noise * 0.04 * rise;

        float stretch = 1.0 + uPulse * 0.2;
        float squash = 1.0 - uPulse * 0.08;

        p.y *= verticalGrowth * stretch;
        p.xz *= radialGrowth * squash;
        p.y += noise * 0.1 * rise;

        vec4 worldPos = modelMatrix * vec4(p, 1.0);
        vPositionW = worldPos.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vRise = rise;

        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform vec3 uBaseColor;
      uniform float uVisibility;

      varying vec3 vNormalW;
      varying vec3 vPositionW;
      varying float vRise;

      void main() {
        vec3 lightDir = normalize(vec3(0.42, 0.9, 0.35));
        vec3 normal = normalize(vNormalW);
        float diffuse = max(dot(normal, lightDir), 0.0);

        vec3 viewDir = normalize(cameraPosition - vPositionW);
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.2);

        vec3 color = uBaseColor;
        color *= 0.72 + diffuse * 0.45;
        color += vec3(0.22, 0.16, 0.1) * fresnel;
        color += vec3(0.09, 0.07, 0.04) * vRise;

        float alpha = uVisibility * smoothstep(0.02, 0.16, vRise);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
}

function createMixtureMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uForm: { value: 0 },
      uVisibility: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
    },
    vertexShader: `
      precision highp float;

      attribute vec3 aStartPos;
      attribute vec3 aTargetPos;
      attribute float aSize;
      attribute float aSeed;

      uniform float uTime;
      uniform float uForm;
      uniform float uVisibility;
      uniform float uPixelRatio;

      varying float vAlpha;

      void main() {
        float form = smoothstep(0.0, 1.0, uForm);
        vec3 p = mix(aStartPos, aTargetPos, form);

        float swirl = (1.0 - form) * 0.95;
        p.x += cos(uTime * 2.0 + aSeed * 18.0 + p.y * 2.0) * swirl;
        p.z += sin(uTime * 1.7 + aSeed * 16.0 + p.x * 2.1) * swirl;
        p.y += sin(uTime * 1.4 + aSeed * 10.0) * swirl * 0.4;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float size = aSize * uPixelRatio * (90.0 / max(1.0, -mv.z));
        gl_PointSize = max(size, 1.0);
        gl_Position = projectionMatrix * mv;

        vAlpha = (1.0 - form * 0.8) * uVisibility;
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

        float alpha = smoothstep(0.6, 0.0, dist) * vAlpha;
        vec3 color = vec3(0.98, 0.92, 0.82);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
}

function createLayerBurst(colorHex, layerY) {
  const directions = new Float32Array(LAYER_BURST_COUNT * 3)
  const speeds = new Float32Array(LAYER_BURST_COUNT)
  const sizes = new Float32Array(LAYER_BURST_COUNT)
  const seeds = new Float32Array(LAYER_BURST_COUNT)

  for (let i = 0; i < LAYER_BURST_COUNT; i += 1) {
    const i3 = i * 3
    const theta = Math.random() * Math.PI * 2
    const y = THREE.MathUtils.randFloat(0.15, 1)
    const radius = Math.sqrt(Math.max(1 - y * y, 0))

    directions[i3] = Math.cos(theta) * radius
    directions[i3 + 1] = y
    directions[i3 + 2] = Math.sin(theta) * radius

    speeds[i] = THREE.MathUtils.randFloat(0.3, 1)
    sizes[i] = THREE.MathUtils.randFloat(1.0, 3.8)
    seeds[i] = Math.random()
  }

  const geometry = new THREE.BufferGeometry()
  const base = new Float32Array(LAYER_BURST_COUNT * 3)
  geometry.setAttribute("position", new THREE.BufferAttribute(base, 3))
  geometry.setAttribute("aDirection", new THREE.BufferAttribute(directions, 3))
  geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1))
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1))

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uBurst: { value: 0 },
      uVisibility: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uOriginY: { value: layerY + 0.24 },
      uColor: { value: new THREE.Color(colorHex) },
    },
    vertexShader: `
      precision highp float;

      attribute vec3 aDirection;
      attribute float aSpeed;
      attribute float aSize;
      attribute float aSeed;

      uniform float uTime;
      uniform float uBurst;
      uniform float uVisibility;
      uniform float uPixelRatio;
      uniform float uOriginY;

      varying float vAlpha;

      void main() {
        float burst = clamp(uBurst, 0.0, 1.0);

        float spin = burst * (1.8 + aSeed * 2.6);
        float c = cos(spin);
        float s = sin(spin);
        mat2 rot = mat2(c, -s, s, c);

        vec3 dir = aDirection;
        dir.xz = rot * dir.xz;

        vec3 pos = vec3(0.0, uOriginY, 0.0);
        pos += dir * burst * (1.2 + aSpeed * 1.8);
        pos.y += burst * burst * 1.6;
        pos.x += sin(uTime * 1.8 + aSeed * 8.0) * 0.05;

        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        float size = aSize * uPixelRatio * (85.0 / max(1.0, -mv.z));
        size *= mix(1.25, 0.2, burst);
        gl_PointSize = max(size, 1.0);
        gl_Position = projectionMatrix * mv;

        float life = pow(1.0 - burst, 1.5);
        vAlpha = life * uVisibility;
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform vec3 uColor;
      varying float vAlpha;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float dist = length(uv);

        if (dist > 0.5) {
          discard;
        }

        float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  })

  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false

  return { points, geometry, material }
}

function createMixtureGeometry() {
  const start = new Float32Array(MIXTURE_PARTICLE_COUNT * 3)
  const target = new Float32Array(MIXTURE_PARTICLE_COUNT * 3)
  const size = new Float32Array(MIXTURE_PARTICLE_COUNT)
  const seed = new Float32Array(MIXTURE_PARTICLE_COUNT)

  for (let i = 0; i < MIXTURE_PARTICLE_COUNT; i += 1) {
    const i3 = i * 3

    const theta = Math.random() * Math.PI * 2
    const radius = THREE.MathUtils.randFloat(0.4, 2.8)
    const y = THREE.MathUtils.randFloat(-0.6, 2.4)

    start[i3] = Math.cos(theta) * radius
    start[i3 + 1] = y
    start[i3 + 2] = Math.sin(theta) * radius - THREE.MathUtils.randFloat(0.4, 2.8)

    const targetTheta = Math.random() * Math.PI * 2
    const targetRadius = Math.sqrt(Math.random()) * 1.52
    const targetY = THREE.MathUtils.randFloat(-1.18, -0.62)

    target[i3] = Math.cos(targetTheta) * targetRadius
    target[i3 + 1] = targetY
    target[i3 + 2] = Math.sin(targetTheta) * targetRadius

    size[i] = THREE.MathUtils.randFloat(1.2, 4.4)
    seed[i] = Math.random()
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(start, 3))
  geometry.setAttribute("aStartPos", new THREE.BufferAttribute(start, 3))
  geometry.setAttribute("aTargetPos", new THREE.BufferAttribute(target, 3))
  geometry.setAttribute("aSize", new THREE.BufferAttribute(size, 1))
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1))

  return geometry
}

function createLayer(layerConfig) {
  const geometry = new THREE.CylinderGeometry(1.56, 1.58, 0.62, 96, 32)
  const material = createDoughLayerMaterial(layerConfig.color)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = -1.4
  mesh.castShadow = false
  mesh.receiveShadow = false

  const burst = createLayerBurst(layerConfig.color, layerConfig.targetY)

  return {
    ...layerConfig,
    mesh,
    geometry,
    material,
    burst,
  }
}

export function createRiseScene() {
  let ctx = null
  let group = null
  let layers = []
  let mixtureGeometry = null
  let mixtureMaterial = null
  let mixturePoints = null
  let textSprite = null
  let textTexture = null

  let defaultCameraBase = null
  let defaultCameraTarget = null
  const orbitTarget = new THREE.Vector3(0, 0, -8.6)

  return {
    init(context) {
      ctx = context
      group = new THREE.Group()
      group.position.set(0, 0.0, -8.6)
      ctx.scene.add(group)

      mixtureGeometry = createMixtureGeometry()
      mixtureMaterial = createMixtureMaterial()
      mixturePoints = new THREE.Points(mixtureGeometry, mixtureMaterial)
      mixturePoints.frustumCulled = false
      group.add(mixturePoints)

      layers = LAYER_CONFIGS.map((config) => createLayer(config))
      layers.forEach((layer) => {
        group.add(layer.mesh)
        group.add(layer.burst.points)
      })

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
      if (!group || !mixtureMaterial) return

      const local = clamp01(progress)
      const globalProgress = frame.globalProgress ?? local
      const rangeStart = frame.rangeStart ?? 0.45
      const rangeEnd = frame.rangeEnd ?? 0.65
      const elapsed = frame.elapsed ?? 0

      const enter = easeOutCubic(remap(globalProgress, rangeStart, rangeStart + 0.035))
      const exit = 1 - easeInOutCubic(remap(globalProgress, rangeEnd, rangeEnd + 0.06))
      const visibility = clamp01(enter * exit)

      const mixtureForm = easeInOutCubic(remap(local, 0.0, 0.36))
      const mixtureFade = 1 - easeOutCubic(remap(local, 0.28, 0.54))
      mixtureMaterial.uniforms.uTime.value = elapsed
      mixtureMaterial.uniforms.uForm.value = mixtureForm
      mixtureMaterial.uniforms.uVisibility.value = visibility * mixtureFade
      mixtureMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2)

      layers.forEach((layer, index) => {
        const appear = easeOutCubic(remap(local, layer.start, layer.start + 0.2))
        const pulseIn = remap(local, layer.start, layer.start + 0.15)
        const pulseOut = 1 - remap(local, layer.start + 0.15, layer.start + 0.32)
        const pulse = clamp01(Math.sin(pulseIn * Math.PI) * pulseOut)

        const meshVisibility = visibility * appear
        layer.mesh.visible = meshVisibility > 0.01
        layer.mesh.position.y = THREE.MathUtils.lerp(-1.35, layer.targetY, appear)

        const widthSettle = THREE.MathUtils.lerp(0.88, 1.0, appear)
        const layerScale = 1 + pulse * 0.07
        layer.mesh.scale.set(widthSettle * layerScale, 1 + pulse * 0.2, widthSettle * layerScale)

        layer.material.uniforms.uTime.value = elapsed + index * 0.18
        layer.material.uniforms.uRise.value = appear
        layer.material.uniforms.uPulse.value = pulse
        layer.material.uniforms.uVisibility.value = meshVisibility

        const burstProgress = remap(local, layer.start, layer.start + 0.2)
        const burstVisibility = visibility * (1 - burstProgress) * (appear > 0.03 ? 1 : 0)
        layer.burst.material.uniforms.uTime.value = elapsed
        layer.burst.material.uniforms.uBurst.value = burstProgress
        layer.burst.material.uniforms.uVisibility.value = burstVisibility
        layer.burst.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2)

        layer.burst.points.visible = burstVisibility > 0.01
      })

      group.rotation.y = Math.sin(elapsed * 0.25) * 0.08
      group.position.y = Math.sin(elapsed * 0.5) * 0.05
      group.visible = visibility > 0.01

      if (textSprite && textSprite.material) {
        const textIn = easeOutCubic(remap(local, 0.56, 0.74))
        const textOut = 1 - easeInOutCubic(remap(local, 0.9, 1))
        textSprite.material.opacity = clamp01(textIn * textOut) * visibility
        textSprite.position.y = 2.0 + Math.sin(elapsed * 0.44) * 0.06
      }

      if (ctx.engine && defaultCameraBase && defaultCameraTarget) {
        const orbitMix = easeInOutCubic(remap(local, 0.22, 0.95)) * visibility
        const angle = elapsed * 0.34 + local * 2.6

        const orbitX = Math.sin(angle) * 2.3
        const orbitY = 0.48 + Math.sin(elapsed * 0.38) * 0.08
        const orbitZ = 5.0 + Math.cos(angle) * 0.8 - easeOutCubic(remap(local, 0.5, 1)) * 0.75

        ctx.engine.baseCameraPosition.x = THREE.MathUtils.lerp(defaultCameraBase.x, orbitX, orbitMix)
        ctx.engine.baseCameraPosition.y = THREE.MathUtils.lerp(defaultCameraBase.y, orbitY, orbitMix)
        ctx.engine.baseCameraPosition.z = THREE.MathUtils.lerp(defaultCameraBase.z, orbitZ, orbitMix)

        ctx.engine.cameraTarget.lerpVectors(defaultCameraTarget, orbitTarget, orbitMix * 0.9)
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

      if (mixtureGeometry) mixtureGeometry.dispose()
      if (mixtureMaterial) mixtureMaterial.dispose()

      layers.forEach((layer) => {
        layer.geometry.dispose()
        layer.material.dispose()
        layer.burst.geometry.dispose()
        layer.burst.material.dispose()
      })

      if (textSprite && textSprite.material) textSprite.material.dispose()
      if (textTexture) textTexture.dispose()

      ctx = null
      group = null
      layers = []
      mixtureGeometry = null
      mixtureMaterial = null
      mixturePoints = null
      textSprite = null
      textTexture = null
      defaultCameraBase = null
      defaultCameraTarget = null
    },
  }
}
