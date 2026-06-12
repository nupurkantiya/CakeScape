import * as THREE from "three"

const CHERRY_COUNT = 20
const SPRINKLE_COUNT = 180

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

function quadraticBezier(p0, p1, p2, t, out) {
  const oneMinusT = 1 - t
  out.set(0, 0, 0)
  out.addScaledVector(p0, oneMinusT * oneMinusT)
  out.addScaledVector(p1, 2 * oneMinusT * t)
  out.addScaledVector(p2, t * t)
  return out
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
  context.shadowColor = "rgba(255, 174, 145, 0.45)"
  context.shadowBlur = 36

  const gradient = context.createLinearGradient(0, 0, canvas.width, 0)
  gradient.addColorStop(0, "rgba(250, 242, 232, 0.92)")
  gradient.addColorStop(0.55, "rgba(255, 214, 186, 0.98)")
  gradient.addColorStop(1, "rgba(255, 186, 166, 0.9)")

  context.fillStyle = gradient
  context.font = "600 108px 'Georgia', 'Times New Roman', serif"
  context.fillText("Dressed to perfection...", canvas.width / 2, canvas.height / 2)

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
  sprite.position.set(0, 2.1, -8.5)
  sprite.scale.set(7.8, 2.1, 1)

  return { sprite, texture }
}

export function createFrostingMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uPour: { value: 0 },
      uVisibility: { value: 0 },
      uColorShift: { value: 0 },
      uColorA: { value: new THREE.Color(0xff93c0) },
      uColorB: { value: new THREE.Color(0xffc1a3) },
    },
    vertexShader: `
      precision highp float;

      uniform float uTime;
      uniform float uPour;

      varying vec3 vWorldPos;
      varying vec3 vNormalW;
      varying float vReveal;
      varying float vDrip;
      varying float vHeight;
      varying float vIsTopCap;

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

      float fbm(vec3 p) {
        float sum = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 4; i++) {
          sum += amp * snoise(p);
          p *= 2.0;
          amp *= 0.5;
        }
        return sum;
      }

      void main() {
        vec3 p = position;
        vIsTopCap = step(0.9, normal.y);

        float reveal = smoothstep(-0.06, 0.06, uPour - (1.0 - uv.y));
        float sideMask = smoothstep(0.08, 0.98, 1.0 - uv.y);

        float dripNoise = fbm(vec3(uv.x * 8.0, uv.y * 4.0, uTime * 0.35 + uv.x * 2.0));
        float dripGate = smoothstep(-0.05, 0.55, dripNoise + uPour * 0.8);
        float drip = reveal * sideMask * dripGate;

        float dripLength = (0.28 + (1.0 - uv.y) * 1.1) * drip * (0.25 + uPour * 1.05);
        p.y -= dripLength * (1.0 - vIsTopCap);
        p.xz *= 1.0 + drip * 0.08 * (1.0 - vIsTopCap);

        float wobble = fbm(vec3(p.x * 1.9, p.z * 1.9, uTime * 0.2)) * 0.1;
        p.y += wobble * reveal;

        vec4 worldPos = modelMatrix * vec4(p, 1.0);
        vWorldPos = worldPos.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vReveal = reveal;
        vDrip = drip;
        vHeight = uv.y;

        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform float uVisibility;
      uniform float uPour;
      uniform float uColorShift;
      uniform vec3 uColorA;
      uniform vec3 uColorB;

      varying vec3 vWorldPos;
      varying vec3 vNormalW;
      varying float vReveal;
      varying float vDrip;
      varying float vHeight;
      varying float vIsTopCap;

      void main() {
        vec3 normal = normalize(vNormalW);
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        vec3 lightDir = normalize(vec3(0.45, 0.9, 0.28));

        float diffuse = max(dot(normal, lightDir), 0.0);
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);

        float verticalGradient = smoothstep(0.0, 1.0, vHeight);
        vec3 shiftedA = mix(uColorA, vec3(1.0, 0.78, 0.72), uColorShift * 0.45);
        vec3 shiftedB = mix(uColorB, vec3(1.0, 0.9, 0.78), uColorShift * 0.55);
        vec3 color = mix(shiftedA, shiftedB, verticalGradient + uColorShift * 0.18);

        color *= 0.82 + diffuse * 0.45;
        color += vec3(0.28, 0.22, 0.16) * fresnel;
        color += vec3(0.2, 0.12, 0.08) * vDrip * 0.35;

        float revealAlpha = max(vIsTopCap * smoothstep(0.0, 0.1, uPour), vReveal);
        float alpha = uVisibility * revealAlpha * smoothstep(0.03, 0.14, uPour);
        
        if (alpha < 0.01) {
          discard;
        }

        gl_FragColor = vec4(color, alpha);
      }
    `,
  })
}

function createPourStreamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uPour: { value: 0 },
      uVisibility: { value: 0 },
    },
    vertexShader: `
      precision highp float;

      uniform float uTime;
      uniform float uPour;

      varying float vFade;

      void main() {
        vec3 p = position;
        float wave = sin(p.y * 8.0 + uTime * 4.2) * 0.04;
        p.x += wave;
        p.z += cos(p.y * 7.0 - uTime * 3.6) * 0.03;

        float streamLife = 1.0 - smoothstep(0.62, 1.0, uPour);
        p.y += (1.0 - uPour) * 0.8;

        vFade = streamLife * smoothstep(0.0, 0.1, uPour);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform float uVisibility;
      varying float vFade;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float alpha = (1.0 - abs(uv.x) * 2.0) * (1.0 - abs(uv.y) * 2.0);
        alpha = clamp(alpha, 0.0, 1.0) * vFade * uVisibility;

        if (alpha < 0.01) {
          discard;
        }

        gl_FragColor = vec4(1.0, 0.78, 0.7, alpha);
      }
    `,
  })
}

function createCakeBase() {
  const group = new THREE.Group()

  const layerGeometries = [
    new THREE.CylinderGeometry(1.62, 1.66, 0.62, 96),
    new THREE.CylinderGeometry(1.58, 1.61, 0.62, 96),
    new THREE.CylinderGeometry(1.54, 1.58, 0.62, 96),
  ]

  const layerMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xcd9a75, roughness: 0.78, metalness: 0.06 }),
    new THREE.MeshStandardMaterial({ color: 0xbc8664, roughness: 0.76, metalness: 0.06 }),
    new THREE.MeshStandardMaterial({ color: 0xe4b58f, roughness: 0.74, metalness: 0.05 }),
  ]

  const layers = layerGeometries.map((geometry, index) => {
    const mesh = new THREE.Mesh(geometry, layerMaterials[index])
    mesh.position.y = -0.9 + index * 0.65
    group.add(mesh)
    return mesh
  })

  return {
    group,
    layers,
    geometries: layerGeometries,
    materials: layerMaterials,
  }
}

function createToppings() {
  const cherryGeometry = new THREE.SphereGeometry(0.09, 16, 16)
  const cherryMaterial = new THREE.MeshStandardMaterial({
    color: 0xc01c3b,
    roughness: 0.28,
    metalness: 0.12,
    emissive: 0x2a0812,
    emissiveIntensity: 0.2,
  })
  const cherries = new THREE.InstancedMesh(cherryGeometry, cherryMaterial, CHERRY_COUNT)

  const sprinkleGeometry = new THREE.CapsuleGeometry(0.026, 0.14, 4, 8)
  const sprinkleMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.34,
    metalness: 0.08,
    vertexColors: true,
  })
  const sprinkles = new THREE.InstancedMesh(sprinkleGeometry, sprinkleMaterial, SPRINKLE_COUNT)

  const sprinklePalette = [0xff7ba3, 0xffd56c, 0x7ef5ff, 0xffb27d, 0xb2ff95, 0xff8ae2]

  const cherryMotions = []
  const sprinkleMotions = []

  const dummy = new THREE.Object3D()
  const identityQuat = new THREE.Quaternion()

  for (let i = 0; i < CHERRY_COUNT; i += 1) {
    const angle = Math.random() * Math.PI * 2
    const radius = THREE.MathUtils.randFloat(0.2, 1.25)

    const target = new THREE.Vector3(Math.cos(angle) * radius, 1.22, Math.sin(angle) * radius)
    const start = new THREE.Vector3(
      target.x + THREE.MathUtils.randFloat(-0.6, 0.6),
      THREE.MathUtils.randFloat(2.4, 3.8),
      target.z + THREE.MathUtils.randFloat(-0.6, 0.6)
    )
    const control = new THREE.Vector3(
      (start.x + target.x) * 0.5,
      Math.max(start.y, target.y) + THREE.MathUtils.randFloat(0.5, 1.2),
      (start.z + target.z) * 0.5
    )

    cherryMotions.push({
      start,
      control,
      target,
      delay: Math.random() * 0.22,
      duration: THREE.MathUtils.randFloat(0.48, 0.82),
      spin: THREE.MathUtils.randFloat(2.2, 5.2),
    })

    dummy.position.copy(start)
    dummy.scale.setScalar(0.01)
    dummy.quaternion.copy(identityQuat)
    dummy.updateMatrix()
    cherries.setMatrixAt(i, dummy.matrix)
  }

  for (let i = 0; i < SPRINKLE_COUNT; i += 1) {
    const onTop = Math.random() > 0.45
    const angle = Math.random() * Math.PI * 2

    let target
    if (onTop) {
      const radius = THREE.MathUtils.randFloat(0.22, 1.36)
      target = new THREE.Vector3(Math.cos(angle) * radius, 1.3 + Math.random() * 0.16, Math.sin(angle) * radius)
    } else {
      const radius = THREE.MathUtils.randFloat(1.42, 1.58)
      const y = THREE.MathUtils.randFloat(0.1, 1.2)
      target = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
    }

    const start = new THREE.Vector3(
      target.x + THREE.MathUtils.randFloat(-1.4, 1.4),
      THREE.MathUtils.randFloat(2.3, 4.0),
      target.z + THREE.MathUtils.randFloat(-1.4, 1.4)
    )

    const control = new THREE.Vector3(
      (start.x + target.x) * 0.5,
      Math.max(start.y, target.y) + THREE.MathUtils.randFloat(0.25, 1.1),
      (start.z + target.z) * 0.5
    )

    const targetEuler = new THREE.Euler(
      THREE.MathUtils.randFloat(-Math.PI, Math.PI),
      THREE.MathUtils.randFloat(-Math.PI, Math.PI),
      THREE.MathUtils.randFloat(-Math.PI, Math.PI)
    )
    const targetQuat = new THREE.Quaternion().setFromEuler(targetEuler)

    sprinkleMotions.push({
      start,
      control,
      target,
      delay: Math.random() * 0.35,
      duration: THREE.MathUtils.randFloat(0.42, 0.86),
      spin: THREE.MathUtils.randFloat(1.4, 6.8),
      targetQuat,
    })

    const colorHex = sprinklePalette[Math.floor(Math.random() * sprinklePalette.length)]
    sprinkles.setColorAt(i, new THREE.Color(colorHex))

    dummy.position.copy(start)
    dummy.scale.setScalar(0.01)
    dummy.quaternion.copy(targetQuat)
    dummy.updateMatrix()
    sprinkles.setMatrixAt(i, dummy.matrix)
  }

  cherries.instanceMatrix.needsUpdate = true
  sprinkles.instanceMatrix.needsUpdate = true
  if (sprinkles.instanceColor) {
    sprinkles.instanceColor.needsUpdate = true
  }

  return {
    cherries,
    sprinkles,
    cherryGeometry,
    cherryMaterial,
    sprinkleGeometry,
    sprinkleMaterial,
    cherryMotions,
    sprinkleMotions,
  }
}

export function createPourScene() {
  let ctx = null
  let group = null

  let cakeBase = null
  let frostingMesh = null
  let frostingGeometry = null
  let frostingMaterial = null
  let streamMesh = null
  let streamGeometry = null
  let streamMaterial = null

  let toppings = null
  let textSprite = null
  let textTexture = null

  let mainLight = null

  let defaultCameraBase = null
  let defaultCameraTarget = null

  const tempVecA = new THREE.Vector3()
  const tempVecB = new THREE.Vector3()
  const tempVecC = new THREE.Vector3()
  const tempQuat = new THREE.Quaternion()
  const dummy = new THREE.Object3D()
  const cameraTargetTemp = new THREE.Vector3(0, 0.6, -8.5)

  return {
    init(context) {
      ctx = context

      group = new THREE.Group()
      group.position.set(0, -0.02, -8.5)
      ctx.scene.add(group)

      cakeBase = createCakeBase()
      group.add(cakeBase.group)

      frostingGeometry = new THREE.CylinderGeometry(1.7, 1.72, 2.08, 128, 72, false)
      frostingMaterial = createFrostingMaterial()
      frostingMesh = new THREE.Mesh(frostingGeometry, frostingMaterial)
      frostingMesh.position.y = 0.16
      group.add(frostingMesh)

      streamGeometry = new THREE.PlaneGeometry(0.42, 2.8, 8, 40)
      streamMaterial = createPourStreamMaterial()
      streamMesh = new THREE.Points(streamGeometry, streamMaterial)
      streamMesh.position.set(0, 2.32, 0)
      group.add(streamMesh)

      toppings = createToppings()
      group.add(toppings.cherries)
      group.add(toppings.sprinkles)

      mainLight = new THREE.PointLight(0xffb47f, 6.2, 28, 2)
      mainLight.position.set(1.1, 2.8, 1.4)
      group.add(mainLight)

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
      if (!group || !frostingMaterial || !toppings) return

      const local = clamp01(progress)
      const globalProgress = frame.globalProgress ?? local
      const rangeStart = frame.rangeStart ?? 0.65
      const rangeEnd = frame.rangeEnd ?? 0.8
      const elapsed = frame.elapsed ?? 0

      const enter = easeOutCubic(remap(globalProgress, rangeStart, rangeStart + 0.03))
      const exit = 1 - easeInOutCubic(remap(globalProgress, rangeEnd, rangeEnd + 0.055))
      const visibility = clamp01(enter * exit)

      const pour = easeInOutCubic(remap(local, 0.04, 0.62))
      const toppingPhase = easeOutCubic(remap(local, 0.42, 1.0))
      const colorShift = easeInOutCubic(remap(local, 0.2, 1.0))

      frostingMaterial.uniforms.uTime.value = elapsed
      frostingMaterial.uniforms.uPour.value = pour
      frostingMaterial.uniforms.uVisibility.value = visibility
      frostingMaterial.uniforms.uColorShift.value = colorShift

      streamMaterial.uniforms.uTime.value = elapsed
      streamMaterial.uniforms.uPour.value = pour
      streamMaterial.uniforms.uVisibility.value = visibility
      streamMesh.visible = visibility > 0.01 && pour < 0.92

      cakeBase.layers.forEach((layer, index) => {
        const settle = 1 - easeOutCubic(remap(local, 0.1 + index * 0.12, 0.4 + index * 0.14))
        const wobble = Math.sin(elapsed * 1.8 + index * 0.8) * 0.01 * settle
        layer.scale.set(1 + wobble, 1 - wobble * 0.7, 1 + wobble)
      })

      for (let i = 0; i < toppings.cherryMotions.length; i += 1) {
        const motion = toppings.cherryMotions[i]
        const t = clamp01((toppingPhase - motion.delay) / motion.duration)
        const ease = easeOutCubic(t)

        quadraticBezier(motion.start, motion.control, motion.target, ease, tempVecA)
        const settleBounce = t > 0.83 ? Math.sin((t - 0.83) / 0.17 * Math.PI) * (1 - t) * 0.2 : 0
        tempVecA.y += settleBounce

        dummy.position.copy(tempVecA)
        tempQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), elapsed * motion.spin + i)
        dummy.quaternion.copy(tempQuat)
        const scale = THREE.MathUtils.lerp(0.02, 1, ease)
        dummy.scale.setScalar(scale)
        dummy.updateMatrix()
        toppings.cherries.setMatrixAt(i, dummy.matrix)
      }
      toppings.cherries.instanceMatrix.needsUpdate = true

      for (let i = 0; i < toppings.sprinkleMotions.length; i += 1) {
        const motion = toppings.sprinkleMotions[i]
        const t = clamp01((toppingPhase - motion.delay) / motion.duration)
        const ease = easeOutCubic(t)

        quadraticBezier(motion.start, motion.control, motion.target, ease, tempVecB)
        tempVecB.y -= t * t * 0.18

        dummy.position.copy(tempVecB)
        tempQuat.setFromAxisAngle(new THREE.Vector3(0.5, 1, 0.2).normalize(), elapsed * motion.spin * 0.35)
        dummy.quaternion.copy(tempQuat).slerp(motion.targetQuat, ease)

        const scale = THREE.MathUtils.lerp(0.01, 1, ease)
        dummy.scale.setScalar(scale)
        dummy.updateMatrix()
        toppings.sprinkles.setMatrixAt(i, dummy.matrix)
      }
      toppings.sprinkles.instanceMatrix.needsUpdate = true

      group.rotation.y = Math.sin(elapsed * 0.22) * 0.1 + local * 0.2
      group.position.y = Math.sin(elapsed * 0.4) * 0.04
      group.visible = visibility > 0.01

      mainLight.intensity = 4.8 + visibility * (4.2 + colorShift * 3.2)
      mainLight.color.setHSL(0.07 + colorShift * 0.03, 0.65, 0.68)

      if (textSprite && textSprite.material) {
        const textIn = easeOutCubic(remap(local, 0.58, 0.76))
        const textOut = 1 - easeInOutCubic(remap(local, 0.93, 1))
        textSprite.material.opacity = clamp01(textIn * textOut) * visibility
        textSprite.position.y = 2.1 + Math.sin(elapsed * 0.42) * 0.06
      }

      if (ctx.engine && defaultCameraBase && defaultCameraTarget) {
        const orbitMix = easeInOutCubic(remap(local, 0.1, 0.85)) * visibility
        const angle = elapsed * 0.28 + local * 1.8
        const orbitX = Math.sin(angle) * 1.95
        const orbitY = 0.52 + Math.cos(elapsed * 0.36) * 0.09
        const orbitZ = 5.25 + Math.cos(angle) * 0.55

        ctx.engine.baseCameraPosition.x = THREE.MathUtils.lerp(defaultCameraBase.x, orbitX, orbitMix)
        ctx.engine.baseCameraPosition.y = THREE.MathUtils.lerp(defaultCameraBase.y, orbitY, orbitMix)
        ctx.engine.baseCameraPosition.z = THREE.MathUtils.lerp(defaultCameraBase.z, orbitZ, orbitMix)

        tempVecC.copy(cameraTargetTemp)
        tempVecC.x += Math.sin(elapsed * 0.35) * 0.05
        ctx.engine.cameraTarget.lerpVectors(defaultCameraTarget, tempVecC, orbitMix * 0.92)
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

      if (cakeBase) {
        cakeBase.geometries.forEach((geometry) => geometry.dispose())
        cakeBase.materials.forEach((material) => material.dispose())
      }

      if (frostingGeometry) frostingGeometry.dispose()
      if (frostingMaterial) frostingMaterial.dispose()
      if (streamGeometry) streamGeometry.dispose()
      if (streamMaterial) streamMaterial.dispose()

      if (toppings) {
        toppings.cherryGeometry.dispose()
        toppings.cherryMaterial.dispose()
        toppings.sprinkleGeometry.dispose()
        toppings.sprinkleMaterial.dispose()
      }

      if (textSprite && textSprite.material) textSprite.material.dispose()
      if (textTexture) textTexture.dispose()

      ctx = null
      group = null
      cakeBase = null
      frostingMesh = null
      frostingGeometry = null
      frostingMaterial = null
      streamMesh = null
      streamGeometry = null
      streamMaterial = null
      toppings = null
      textSprite = null
      textTexture = null
      mainLight = null
      defaultCameraBase = null
      defaultCameraTarget = null
    },
  }
}
