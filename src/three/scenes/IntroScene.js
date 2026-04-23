import * as THREE from "three"

const PARTICLE_COUNT = 18000
const LOGO_ASSET_URL = "/cakescape-logo.svg"

function clamp01(value) {
  return THREE.MathUtils.clamp(value, 0, 1)
}

function remap(value, inMin, inMax) {
  if (inMax - inMin === 0) return 0
  return clamp01((value - inMin) / (inMax - inMin))
}

function easeOutCubic(t) {
  const k = clamp01(t)
  return 1 - (1 - k) ** 3
}

function easeInCubic(t) {
  const k = clamp01(t)
  return k ** 3
}

function easeInOutCubic(t) {
  const k = clamp01(t)
  return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2
}

function createFallbackTargets(count) {
  const targets = new Float32Array(count * 3)

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3
    const ratio = i / Math.max(count - 1, 1)
    const angle = ratio * Math.PI * 22
    const radius = 0.9 + ratio * 1.8

    targets[i3] = Math.cos(angle) * radius * 1.3
    targets[i3 + 1] = Math.sin(angle) * radius * 0.55
    targets[i3 + 2] = (Math.random() - 0.5) * 0.3
  }

  return targets
}

async function loadLogoTargets(url, particleCount) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Failed to load CakeScape logo asset"))
    img.src = `${url}?v=1`
  })

  const canvas = document.createElement("canvas")
  canvas.width = 1600
  canvas.height = 480
  const context = canvas.getContext("2d", { willReadFrequently: true })

  if (!context) {
    throw new Error("2D context unavailable for logo sampling")
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data
  const sampled = []

  const step = 2
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      const index = (y * canvas.width + x) * 4
      const r = pixels[index]
      const g = pixels[index + 1]
      const b = pixels[index + 2]
      const a = pixels[index + 3]

      if (a < 30) continue

      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
      if (luminance < 140) continue

      sampled.push({
        x: (x - canvas.width / 2) * 0.009,
        y: -(y - canvas.height / 2) * 0.009,
      })
    }
  }

  if (sampled.length === 0) {
    throw new Error("No bright pixels found while sampling logo")
  }

  const targets = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount; i += 1) {
    const i3 = i * 3
    const point = sampled[Math.floor(Math.random() * sampled.length)]

    targets[i3] = point.x + (Math.random() - 0.5) * 0.05
    targets[i3 + 1] = point.y + (Math.random() - 0.5) * 0.05
    targets[i3 + 2] = (Math.random() - 0.5) * 0.45
  }

  targets[0] = 0
  targets[1] = 0
  targets[2] = 0

  return targets
}

function createParticleMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uFormation: { value: 0 },
      uShatter: { value: 0 },
      uVisibility: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uPointSize: { value: 1.35 },
    },
    vertexShader: `
      precision highp float;

      attribute vec3 aStartPosition;
      attribute vec3 aTargetPosition;
      attribute float aMorphOffset;
      attribute float aSeed;
      attribute float aEnergy;
      attribute float aPointScale;

      uniform float uTime;
      uniform float uFormation;
      uniform float uShatter;
      uniform float uVisibility;
      uniform float uPixelRatio;
      uniform float uPointSize;

      varying float vAlpha;
      varying float vColorMix;
      varying float vHeat;

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
        float morph = smoothstep(aMorphOffset, 1.0, uFormation);
        vec3 position = mix(aStartPosition, aTargetPosition, morph);

        vec3 flowField = curlNoise(position * 0.28 + vec3(aSeed * 9.0, aSeed * 3.2, uTime * 0.19));
        float swarmStrength = (1.0 - uFormation) * 3.9 + 0.16;
        position += flowField * swarmStrength;

        float shatterPower = uShatter * uShatter;
        vec3 shatterDirection = normalize(
          aTargetPosition + vec3(sin(aSeed * 39.0), cos(aSeed * 53.0), sin(aSeed * 17.0 + 1.2))
        );

        position += flowField * shatterPower * (2.6 + aEnergy * 1.4);
        position += shatterDirection * shatterPower * (9.5 + aEnergy * 6.5);
        position.y -= shatterPower * (1.0 + aEnergy * 1.25);

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float perspectiveScale = 130.0 / max(1.0, -mvPosition.z);
        float size = (uPointSize + aPointScale * 4.8) * uPixelRatio * perspectiveScale;
        size *= mix(1.9, 0.68, uShatter);

        gl_PointSize = max(size, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        vAlpha = uVisibility * (1.0 - shatterPower * 0.84);
        vColorMix = aSeed;
        vHeat = morph;
      }
    `,
    fragmentShader: `
      precision highp float;

      varying float vAlpha;
      varying float vColorMix;
      varying float vHeat;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float distanceFromCenter = length(uv);

        if (distanceFromCenter > 0.5) {
          discard;
        }

        float core = smoothstep(0.36, 0.0, distanceFromCenter);
        float halo = smoothstep(0.62, 0.0, distanceFromCenter) * 0.8;
        float alpha = (core + halo * 0.65) * vAlpha;

        if (alpha < 0.01) {
          discard;
        }

        vec3 cold = vec3(0.24, 0.82, 1.0);
        vec3 hot = vec3(1.0, 0.34, 0.72);
        vec3 base = mix(cold, hot, vColorMix);
        vec3 logoTint = mix(base, vec3(1.0, 0.94, 0.86), vHeat * 0.28);
        vec3 color = logoTint * (1.12 + halo * 1.45);

        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
}

export function createIntroScene() {
  let ctx = null
  let group = null
  let geometry = null
  let material = null
  let particles = null
  let targetBuffer = null

  return {
    init(context) {
      ctx = context

      group = new THREE.Group()
      ctx.scene.add(group)

      const startPositions = new Float32Array(PARTICLE_COUNT * 3)
      targetBuffer = createFallbackTargets(PARTICLE_COUNT)
      const morphOffset = new Float32Array(PARTICLE_COUNT)
      const seeds = new Float32Array(PARTICLE_COUNT)
      const energy = new Float32Array(PARTICLE_COUNT)
      const pointScale = new Float32Array(PARTICLE_COUNT)

      for (let i = 0; i < PARTICLE_COUNT; i += 1) {
        const i3 = i * 3

        if (i === 0) {
          startPositions[i3] = 0
          startPositions[i3 + 1] = 0
          startPositions[i3 + 2] = 0
          morphOffset[i] = 0
          seeds[i] = 0.5
          energy[i] = 0
          pointScale[i] = 2.8
          continue
        }

        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const radius = THREE.MathUtils.randFloat(6.5, 15)

        startPositions[i3] = radius * Math.sin(phi) * Math.cos(theta)
        startPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
        startPositions[i3 + 2] = radius * Math.cos(phi)

        morphOffset[i] = Math.random() * 0.7
        seeds[i] = Math.random()
        energy[i] = Math.random()
        pointScale[i] = 0.45 + Math.random() * 0.95
      }

      geometry = new THREE.BufferGeometry()
      geometry.setAttribute("position", new THREE.BufferAttribute(startPositions, 3))
      geometry.setAttribute("aStartPosition", new THREE.BufferAttribute(startPositions, 3))
      geometry.setAttribute("aTargetPosition", new THREE.BufferAttribute(targetBuffer, 3))
      geometry.setAttribute("aMorphOffset", new THREE.BufferAttribute(morphOffset, 1))
      geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1))
      geometry.setAttribute("aEnergy", new THREE.BufferAttribute(energy, 1))
      geometry.setAttribute("aPointScale", new THREE.BufferAttribute(pointScale, 1))
      geometry.setDrawRange(0, 1)

      material = createParticleMaterial()

      particles = new THREE.Points(geometry, material)
      particles.frustumCulled = false
      group.add(particles)

      loadLogoTargets(LOGO_ASSET_URL, PARTICLE_COUNT)
        .then((targets) => {
          if (!geometry) return

          targetBuffer = targets
          const targetAttribute = geometry.getAttribute("aTargetPosition")
          targetAttribute.array.set(targetBuffer)
          targetAttribute.needsUpdate = true
        })
        .catch(() => {
          if (!geometry) return

          const fallback = createFallbackTargets(PARTICLE_COUNT)
          const targetAttribute = geometry.getAttribute("aTargetPosition")
          targetAttribute.array.set(fallback)
          targetAttribute.needsUpdate = true
        })
    },

    update(progress, frame = {}) {
      if (!group || !geometry || !material) return

      const p = clamp01(progress)
      const elapsed = frame.elapsed ?? 0

      const multiply = easeOutCubic(remap(p, 0.02, 0.3))
      const drawCount = Math.floor(1 + (PARTICLE_COUNT - 1) * multiply)
      geometry.setDrawRange(0, drawCount)

      const swirl = easeInOutCubic(remap(p, 0.1, 0.5))
      const formation = easeInOutCubic(remap(p, 0.32, 0.66))
      const shatter = easeInCubic(remap(p, 0.8, 1))

      const fadeIn = easeOutCubic(remap(p, 0.0, 0.1))
      const hold = 1 - easeInOutCubic(remap(p, 0.68, 0.82))
      const fadeOut = 1 - easeInCubic(remap(p, 0.9, 1))
      const visibility = clamp01(fadeIn * Math.max(hold, 0.35) * fadeOut)

      material.uniforms.uTime.value = elapsed
      material.uniforms.uFormation.value = clamp01(formation + swirl * 0.22)
      material.uniforms.uShatter.value = shatter
      material.uniforms.uVisibility.value = visibility
      material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2)

      group.position.set(0, 0.04 - p * 0.42, 0.2 - p * 1.6)
      group.rotation.set(
        Math.sin(elapsed * 0.25) * 0.04,
        elapsed * 0.045 + p * 0.2,
        Math.sin(elapsed * 0.32) * 0.03
      )
      group.visible = visibility > 0.01
    },

    dispose() {
      if (!ctx || !group) return

      ctx.scene.remove(group)

      if (geometry) {
        geometry.dispose()
      }

      if (material) {
        material.dispose()
      }

      ctx = null
      group = null
      geometry = null
      material = null
      particles = null
      targetBuffer = null
    },
  }
}
