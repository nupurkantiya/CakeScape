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

    // --- SCENE 4: MIDDLE CAKE LAYER ---
    const middleCakeRadius = 1.7
    const middleCakeHeight = 1.2
    const middleGeometry = new THREE.CylinderGeometry(middleCakeRadius, middleCakeRadius, middleCakeHeight, 32)
    const middleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf5f5dc, // cream color
      roughness: 0.7
    })
    const middleCakeMesh = new THREE.Mesh(middleGeometry, middleMaterial)
    
    // Initial state: hidden
    middleCakeMesh.scale.y = 0
    middleCakeMesh.position.y = 0
    scene.add(middleCakeMesh)

    // --- SCENE 4: FROSTING LAYER ---
    const frostingRadius = 1.72 // Slightly wider than middle cake (1.7)
    const frostingHeight = 1.25 // Covers the middle cake
    const frostingGeometry = new THREE.CylinderGeometry(frostingRadius, frostingRadius, frostingHeight, 32)
    const frostingMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffb6c1, // Light pink frosting
      roughness: 0.2,  // Slightly shiny
      transparent: true,
      depthWrite: false // Prevents weird transparency sorting issues
    })
    
    // We inject custom GLSL code into the Standard Material before it compiles!
    frostingMaterial.onBeforeCompile = (shader) => {
      // 1. Create a uniform linked to Javascript
      shader.uniforms.uPourProgress = { value: 0 }
      
      // 2. Vertex Shader: Pass the exact world position (X, Y, Z) of every vertex to the Fragment Shader
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>
        varying vec3 vWorldPos;
        `
      )
      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `
        #include <worldpos_vertex>
        vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        `
      )

      // 3. Fragment Shader: The Magic "Discard" Logic
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        #include <common>
        uniform float uPourProgress;
        varying vec3 vWorldPos;
        `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        #include <dithering_fragment>
        
        // Calculate the angle around the cake to create uneven, wavy drips
        float angle = atan(vWorldPos.z, vWorldPos.x);
        float dripOffset = sin(angle * 12.0) * 0.1 + sin(angle * 25.0) * 0.05;
        
        // Start high up (3.0) and move down to the bottom of the cake (1.5) as progress increases
        float currentHeightThreshold = 3.0 - (uPourProgress * 1.5);
        
        // THE MELT RULE: If a pixel is LOWER than our falling threshold, throw it away!
        if (vWorldPos.y < currentHeightThreshold + dripOffset) {
          discard;
        }
        `
      )
      
      // Store the shader reference so we can update the uniform every frame
      frostingMaterial.userData.shader = shader
    }

    const frostingMesh = new THREE.Mesh(frostingGeometry, frostingMaterial)
    // Sits exactly over the fully risen middle layer
    frostingMesh.position.y = 1.5 + (1.2 / 2) 
    frostingMesh.visible = false
    scene.add(frostingMesh)

    // --- SCENE 4: INSTANCED SPRINKLES ---
    const sprinkleCount = 150
    const sprinkleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 8)
    const sprinkleMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.4
    })
    // InstancedMesh allows us to render 150 sprinkles in a SINGLE draw call!
    const sprinkleMesh = new THREE.InstancedMesh(sprinkleGeo, sprinkleMat, sprinkleCount)
    
    // We need a "dummy" object to help calculate the math for each sprinkle
    const dummy = new THREE.Object3D()
    
    // We'll store random target positions and rotations for each sprinkle
    const sprinkleData = []
    
    // A palette of colorful sprinkles!
    const sprinkleColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff]
    const colorObj = new THREE.Color()

    for (let i = 0; i < sprinkleCount; i++) {
      // Random position around the top of the cake
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 1.6 // Within the cake radius
      const targetX = Math.cos(angle) * radius
      const targetZ = Math.sin(angle) * radius
      
      // Top of the frosting is ~2.725, so we sit them safely on top!
      const targetY = 2.78 + Math.random() * 0.15
      
      // Store random starting positions way up high (e.g. y = 10)
      const startY = 8 + Math.random() * 4
      
      // Random rotations
      const rotX = Math.random() * Math.PI
      const rotY = Math.random() * Math.PI
      const rotZ = Math.random() * Math.PI
      
      sprinkleData.push({
        targetX, targetY, targetZ,
        startY,
        rotX, rotY, rotZ,
        delay: Math.random() * 0.5 // staggered falling
      })
      
      // Assign random color to this instance
      colorObj.setHex(sprinkleColors[Math.floor(Math.random() * sprinkleColors.length)])
      sprinkleMesh.setColorAt(i, colorObj)
    }
    
    // Crucial for InstancedMesh colors to show up if initialized before first render!
    sprinkleMesh.instanceColor.needsUpdate = true
    
    // Hidden initially
    sprinkleMesh.visible = false
    scene.add(sprinkleMesh)

    // --- SCENE 5: THE REVEAL (Pedestal & Studio) ---
    const pedestalGeo = new THREE.CylinderGeometry(3.5, 4, 0.5, 64)
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.1, // Gives it a subtle premium sheen
      transparent: true,
      opacity: 0
    })
    const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat)
    pedestalMesh.position.y = -0.25 // Sits perfectly flat on the floor underneath the cake
    pedestalMesh.visible = false
    scene.add(pedestalMesh)

    const studioLight1 = new THREE.DirectionalLight(0xffffff, 0)
    studioLight1.position.set(5, 10, 5)
    scene.add(studioLight1)

    const studioLight2 = new THREE.DirectionalLight(0xffeedd, 0)
    studioLight2.position.set(-5, 5, -5)
    scene.add(studioLight2)
    
    // Background colors for the transition
    const voidColor = new THREE.Color(0x000000)
    const bakeryColor = new THREE.Color(0x1a1a1a) // A warm, dark studio grey instead of pitch black
    scene.background = voidColor.clone()

    // --- SCENE 5: BOKEH PARTICLES (Depth of Field) ---
    const bokehCount = 150
    const bokehGeo = new THREE.BufferGeometry()
    const bokehPos = new Float32Array(bokehCount * 3)
    
    for (let i = 0; i < bokehCount; i++) {
      // Scatter them widely in the background
      bokehPos[i * 3] = (Math.random() - 0.5) * 40 // X range: -20 to 20
      bokehPos[i * 3 + 1] = (Math.random() - 0.5) * 20 // Y range: -10 to 10
      bokehPos[i * 3 + 2] = -5 - Math.random() * 15 // Z range: -5 to -20 (behind everything)
    }
    bokehGeo.setAttribute("position", new THREE.BufferAttribute(bokehPos, 3))
    
    // Create a soft glowing circle texture using an HTML Canvas (so we don't need to load external images!)
    const bokehCanvas = document.createElement("canvas")
    bokehCanvas.width = 64
    bokehCanvas.height = 64
    const bokehCtx = bokehCanvas.getContext("2d")
    const bokehGradient = bokehCtx.createRadialGradient(32, 32, 0, 32, 32, 32)
    bokehGradient.addColorStop(0, "rgba(255, 255, 255, 1)")
    bokehGradient.addColorStop(0.2, "rgba(255, 255, 255, 0.8)")
    bokehGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)")
    bokehGradient.addColorStop(1, "rgba(255, 255, 255, 0)")
    bokehCtx.fillStyle = bokehGradient
    bokehCtx.fillRect(0, 0, 64, 64)
    const bokehTexture = new THREE.CanvasTexture(bokehCanvas)

    const bokehMat = new THREE.PointsMaterial({
      size: 2.0,
      map: bokehTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending, // Makes them glow brighter when they overlap!
      color: 0xffddaa // Warm golden studio color
    })
    
    const bokehParticles = new THREE.Points(bokehGeo, bokehMat)
    bokehParticles.visible = false
    scene.add(bokehParticles)

    // --- SCENE 6: CAKE SHATTER PARTICLES ---
    const shatterCount = 6500 // Added 1500 more particles for the pedestal!
    const shatterGeo = new THREE.BufferGeometry()
    const shatterPos = new Float32Array(shatterCount * 3)
    const shatterTarget = new Float32Array(shatterCount * 3)
    const shatterColors = new Float32Array(shatterCount * 3)
    
    const colorBrown = new THREE.Color(0x3e2723)
    const colorWhite = new THREE.Color(0xf5e6c8)
    const colorPink  = new THREE.Color(0xffb6c1)
    const colorPedestal = new THREE.Color(0xffffff)
    
    for(let i=0; i<shatterCount; i++) {
      const isPedestal = i >= 5000 // The last 1500 particles are the pedestal
      
      let radius, angle, height
      
      if (isPedestal) {
        // Pedestal shape (radius 3.5, height 0.5, y=-0.25 to 0.25)
        radius = Math.random() * 3.5
        angle = Math.random() * Math.PI * 2
        height = (Math.random() - 0.5) * 0.5
      } else {
        // Random position roughly inside the cake shape
        radius = Math.random() * 1.72
        angle = Math.random() * Math.PI * 2
        height = Math.random() * 2.8 // cake height
      }
      
      const x = Math.cos(angle) * radius
      const y = height
      const z = Math.sin(angle) * radius
      
      shatterPos[i*3] = x
      shatterPos[i*3+1] = y
      shatterPos[i*3+2] = z
      
      // Explode outwards!
      const pushOut = radius + (Math.random() * 10 + 5)
      shatterTarget[i*3] = Math.cos(angle) * pushOut
      shatterTarget[i*3+1] = y + (Math.random() - 0.5) * 10
      shatterTarget[i*3+2] = Math.sin(angle) * pushOut
      
      // Color based on height to match the cake layers!
      let c = colorBrown
      if (isPedestal) {
        c = colorPedestal
      } else {
        if (height > 1.5) c = colorWhite
        if (height > 2.5) {
          c = colorPink
          // Sprinkle crumbs!
          if (Math.random() > 0.8) {
            c = new THREE.Color(sprinkleColors[Math.floor(Math.random() * sprinkleColors.length)])
          }
        }
      }
      
      shatterColors[i*3] = c.r
      shatterColors[i*3+1] = c.g
      shatterColors[i*3+2] = c.b
    }
    shatterGeo.setAttribute('position', new THREE.BufferAttribute(shatterPos, 3))
    shatterGeo.setAttribute('targetPos', new THREE.BufferAttribute(shatterTarget, 3))
    shatterGeo.setAttribute('color', new THREE.BufferAttribute(shatterColors, 3))
    
    // Custom ShaderMaterial to animate from position to targetPos
    const shatterMat = new THREE.ShaderMaterial({
      uniforms: {
        uShatterProgress: { value: 0 },
        uPointSize: { value: 6.0 }
      },
      vertexShader: `
        uniform float uShatterProgress;
        uniform float uPointSize;
        attribute vec3 targetPos;
        varying vec3 vColor;
        void main() {
          vColor = color;
          // Interpolate from starting position to exploding target position using an ease-out curve
          float progress = 1.0 - pow(1.0 - uShatterProgress, 3.0); 
          vec3 currentPos = mix(position, targetPos, progress);
          
          vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Make particles shrink as they explode away
          gl_PointSize = uPointSize * (1.0 - uShatterProgress) * (10.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          // Circular particle
          vec2 xy = gl_PointCoord.xy - vec2(0.5);
          if(length(xy) > 0.5) discard;
          gl_FragColor = vec4(vColor, 1.0);
        }
      `,
      transparent: true,
      vertexColors: true
    })
    
    const shatterMesh = new THREE.Points(shatterGeo, shatterMat)
    shatterMesh.visible = false
    scene.add(shatterMesh)

    // --- SCENE 6: PORTALS & RAYCASTING ---
    const portalGeo = new THREE.IcosahedronGeometry(1.2, 1) // Low poly orb
    const portalMatExplore = new THREE.MeshStandardMaterial({ color: 0x4488ff, emissive: 0x112244, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0, wireframe: true })
    const portalMatBuild = new THREE.MeshStandardMaterial({ color: 0xff4488, emissive: 0x441122, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0, wireframe: true })
    const portalMatOrder = new THREE.MeshStandardMaterial({ color: 0x88ff44, emissive: 0x224411, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0, wireframe: true })

    const portalExplore = new THREE.Mesh(portalGeo, portalMatExplore)
    portalExplore.position.set(-4, 3, 0)

    const portalBuild = new THREE.Mesh(portalGeo, portalMatBuild)
    portalBuild.position.set(0, 4.5, -3) // push back a bit so they form an arc

    const portalOrder = new THREE.Mesh(portalGeo, portalMatOrder)
    portalOrder.position.set(4, 3, 0)

    const portals = new THREE.Group()
    portals.add(portalExplore, portalBuild, portalOrder)
    portals.visible = false
    scene.add(portals)
    
    // HTML Labels for Portals
    const labels = {
      explore: { el: document.createElement('div'), html: 'EXPLORE<br><span style="font-size:0.8rem; opacity:0.8; font-weight:normal; letter-spacing:1px; line-height:1.2;">MENU<br>🎂</span>', mesh: portalExplore },
      build: { el: document.createElement('div'), html: 'BUILD<br><span style="font-size:0.8rem; opacity:0.8; font-weight:normal; letter-spacing:1px; line-height:1.2;">YOUR<br>CAKE</span>', mesh: portalBuild },
      order: { el: document.createElement('div'), html: 'ORDER<br><span style="font-size:0.8rem; opacity:0.8; font-weight:normal; letter-spacing:1px; line-height:1.2;">NOW<br>🛒</span>', mesh: portalOrder }
    }
    
    Object.values(labels).forEach(({ el, html }) => {
      el.innerHTML = html
      el.style.position = 'absolute'
      el.style.color = 'white'
      el.style.fontFamily = '"Inter", sans-serif'
      el.style.fontWeight = 'bold'
      el.style.fontSize = '1.2rem'
      el.style.textAlign = 'center'
      el.style.lineHeight = '1.5'
      el.style.pointerEvents = 'none' // Important: ignore mouse so raycaster works!
      el.style.transform = 'translate(-50%, -50%)'
      el.style.opacity = '0'
      el.style.transition = 'opacity 0.3s, transform 0.2s'
      el.style.textShadow = '0 2px 10px rgba(0,0,0,0.8)'
      el.style.letterSpacing = '2px'
      mountRef.current.appendChild(el)
    })

    // Raycaster for Hover detection
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2(-2, -2) // Default off-screen
    let hoveredPortal = null

    const onMouseMove = (event) => {
      // Normalize mouse coordinates (-1 to +1)
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMouseMove)

    // --- CAKE LIGHT ---
    const cakeLight = new THREE.PointLight(0xffdd88, 0, 15)
    cakeLight.position.set(0, 5, 0)
    scene.add(cakeLight)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0)
    scene.add(ambientLight)

    const clock = new THREE.Clock()
    let rafId = null

    const animate = () => {
    const elapsed = clock.getElapsedTime()
    
    // --- PROGRESS VALUES --- all at top
    // Scene 1: The Void (0% - 15%)
    const introProgress = THREE.MathUtils.clamp(
      scrollProgressRef.current / 0.15, 0, 1
    )
    // Scene 2: The Birth (15% - 35%)
    const scene2Progress = THREE.MathUtils.clamp(
      (scrollProgressRef.current - 0.15) / 0.20, 0, 1
    )
    const crackProgress = THREE.MathUtils.clamp(
      (scene2Progress - 0.5) / 0.5, 0, 1
    )
    // Scene 3: The Rise (35% - 55%)
    const scene3Progress = THREE.MathUtils.clamp(
      (scrollProgressRef.current - 0.35) / 0.20, 0, 1
    )
    // Scene 4: The Pour (55% - 70%)
    const scene4Progress = THREE.MathUtils.clamp(
      (scrollProgressRef.current - 0.55) / 0.15, 0, 1
    )
    // Scene 5: The Reveal (70% - 85%)
    const scene5Progress = THREE.MathUtils.clamp(
      (scrollProgressRef.current - 0.70) / 0.15, 0, 1
    )
    // Scene 6: The Invitation Shatter (85% - 100%)
    const scene6Progress = THREE.MathUtils.clamp(
      (scrollProgressRef.current - 0.85) / 0.15, 0, 1
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

    // --- SCENE 2: Egg ---
    camera.position.z = THREE.MathUtils.lerp(8, 3, scene2Progress)

    eggTop.visible = scene2Progress > 0
    eggBottom.visible = scene2Progress > 0 && crackProgress < 0.9

    eggTop.position.y = THREE.MathUtils.lerp(0, 0.8, crackProgress)
    eggBottom.position.y = THREE.MathUtils.lerp(0, -0.4, crackProgress)

    eggMaterial.transparent = true
    eggMaterial.opacity = THREE.MathUtils.lerp(1, 0, crackProgress)

    // Fade out egg light during Scene 3
    eggLight.intensity = THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(2, 12, crackProgress),
      0,
      scene3Progress
    )

    glow.position.z = THREE.MathUtils.lerp(-5, -4, crackProgress)
    glow.scale.setScalar(THREE.MathUtils.lerp(3, 1.2, crackProgress))
    
    // Hide glow completely in Scene 3
    if (scene3Progress > 0) {
      glowMaterial.opacity = THREE.MathUtils.lerp(0.6, 0, scene3Progress)
    }

    // --- SCENE 3: Base & Middle Cake Animation ---
    // Split the scene3 progress into two halves
    const baseProgress = THREE.MathUtils.smoothstep(scene3Progress, 0.0, 0.5)
    const middleProgress = THREE.MathUtils.smoothstep(scene3Progress, 0.5, 1.0)

    // Hide the real cake elements if we are in the shatter scene (Scene 6)
    if (scene6Progress > 0) {
      baseCakeMesh.visible = false
      middleCakeMesh.visible = false
    } else {
      baseCakeMesh.visible = baseProgress > 0
      middleCakeMesh.visible = middleProgress > 0
    }

    baseCakeMesh.scale.y = THREE.MathUtils.lerp(0, 1, baseProgress)
    baseCakeMesh.position.y = (baseCakeHeight * baseCakeMesh.scale.y) / 2

    middleCakeMesh.scale.y = THREE.MathUtils.lerp(0, 1, middleProgress)
    // The middle layer sits exactly on top of the fully risen base layer
    middleCakeMesh.position.y = baseCakeHeight + (middleCakeHeight * middleCakeMesh.scale.y) / 2

    // Fade in the warm cake light and global ambient light
    cakeLight.intensity = THREE.MathUtils.lerp(0, 15, scene3Progress)
    ambientLight.intensity = THREE.MathUtils.lerp(0, 1.5, scene3Progress)

    // Camera Orbit using Trigonometry
    if (scene3Progress > 0) {
      // Start at PI/2 (which means x=0, z=radius) and orbit 180 degrees (PI)
      const orbitAngle = (Math.PI / 2) + (scene3Progress * Math.PI)
      const orbitRadius = THREE.MathUtils.lerp(4.5, 7.5, scene3Progress) // Wider orbit so we don't clip!
      
      camera.position.x = Math.cos(orbitAngle) * orbitRadius
      camera.position.z = Math.sin(orbitAngle) * orbitRadius
      camera.position.y = THREE.MathUtils.lerp(0.5, 3.5, scene3Progress) // Go higher up
      
      // Keep the lens focused on the cake base as we fly around it
      camera.lookAt(0, baseCakeMesh.position.y, 0)
    } else {
      camera.position.x = 0
      camera.position.y = 0.35
      // camera.position.z is handled by scene2Progress above
      camera.lookAt(0, 0, 0)
    }

    // --- SCENE 4: The Pour (Frosting & Sprinkles) ---
    if (scene6Progress > 0) {
      frostingMesh.visible = false
      sprinkleMesh.visible = false
    } else {
      frostingMesh.visible = scene4Progress > 0
      sprinkleMesh.visible = scene4Progress > 0
    }

    if (frostingMaterial.userData.shader) {
      frostingMaterial.userData.shader.uniforms.uPourProgress.value = scene4Progress
    }

    if (scene4Progress > 0) {
      for (let i = 0; i < sprinkleCount; i++) {
        const data = sprinkleData[i]
        
        // Calculate an individual progress for each sprinkle to make them fall at different times
        // We use MathUtils.clamp to ensure it stays between 0 and 1
        const individualProgress = THREE.MathUtils.clamp(
          (scene4Progress - data.delay) / 0.5, 
          0, 1
        )
        
        // Use an easing function so they accelerate as they fall (gravity!)
        // cubic in: individualProgress * individualProgress * individualProgress
        const easeIn = individualProgress * individualProgress * individualProgress
        
        // Animate position from high up in the sky down to the cake
        dummy.position.set(
          data.targetX,
          THREE.MathUtils.lerp(data.startY, data.targetY, easeIn),
          data.targetZ
        )
        
        // Spin wildly as they fall, then settle into final rotation
        dummy.rotation.set(
          THREE.MathUtils.lerp(data.rotX + elapsed * 5, data.rotX, individualProgress),
          THREE.MathUtils.lerp(data.rotY + elapsed * 5, data.rotY, individualProgress),
          THREE.MathUtils.lerp(data.rotZ + elapsed * 5, data.rotZ, individualProgress)
        )
        
        dummy.updateMatrix()
        sprinkleMesh.setMatrixAt(i, dummy.matrix)
      }
      sprinkleMesh.instanceMatrix.needsUpdate = true
    }

    // --- SCENE 5: The Reveal ---
    if (scene6Progress > 0) {
      pedestalMesh.visible = false
    } else {
      pedestalMesh.visible = scene5Progress > 0
    }
    
    bokehParticles.visible = scene5Progress > 0
    
    if (scene5Progress > 0) {
      // Fade in the pedestal
      pedestalMat.opacity = scene5Progress
      
      // Turn on the studio lights
      studioLight1.intensity = THREE.MathUtils.lerp(0, 4, scene5Progress)
      studioLight2.intensity = THREE.MathUtils.lerp(0, 2, scene5Progress)
      
      // Transition the background color
      scene.background.lerpColors(voidColor, bakeryColor, scene5Progress)
      
      // Camera pulls back DRAMATICALLY and cake starts rotating
      // We continue the orbit angle from where Scene 3 left off (which was PI/2 + PI)
      const baseAngle = (Math.PI / 2) + Math.PI
      const rotateAngle = baseAngle + (scene5Progress * Math.PI * 2) // Do a full 360 spin!
      const pullBackRadius = THREE.MathUtils.lerp(7.5, 14, scene5Progress)
      
      camera.position.x = Math.cos(rotateAngle) * pullBackRadius
      camera.position.z = Math.sin(rotateAngle) * pullBackRadius
      camera.position.y = THREE.MathUtils.lerp(3.5, 5, scene5Progress)
      
      camera.lookAt(0, 1.5, 0)
      
      // Animate Bokeh
      bokehMat.opacity = THREE.MathUtils.lerp(0, 0.6, scene5Progress)
      bokehParticles.position.y = elapsed * 0.2 // Slow floating upwards
      bokehParticles.position.x = Math.sin(elapsed * 0.1) * 2 // Gentle swaying
    }

    // --- SCENE 6: The Shatter & Portals ---
    shatterMesh.visible = scene6Progress > 0
    portals.visible = scene6Progress > 0
    
    if (scene6Progress > 0) {
      shatterMat.uniforms.uShatterProgress.value = scene6Progress
      
      const portalOpacity = THREE.MathUtils.smoothstep(scene6Progress, 0.5, 1.0)
      portalMatExplore.opacity = portalOpacity
      portalMatBuild.opacity = portalOpacity
      portalMatOrder.opacity = portalOpacity
      
      // Floating animation
      portalExplore.position.y = 3 + Math.sin(elapsed * 2) * 0.3
      portalBuild.position.y = 4.5 + Math.sin(elapsed * 2.2) * 0.3
      portalOrder.position.y = 3 + Math.sin(elapsed * 1.8) * 0.3
      
      // 3D to 2D Projection for HTML Labels
      Object.values(labels).forEach(({ el, mesh }) => {
        const tempV = new THREE.Vector3()
        mesh.getWorldPosition(tempV)
        tempV.project(camera) // Projects 3D world pos to normalized device coordinates (-1 to 1)
        
        const x = (tempV.x * 0.5 + 0.5) * window.innerWidth
        const y = (tempV.y * -0.5 + 0.5) * window.innerHeight
        
        el.style.left = `${x}px`
        el.style.top = `${y}px`
        el.style.opacity = portalOpacity
        
        if (hoveredPortal === mesh) {
          el.style.transform = 'translate(-50%, -50%) scale(1.3)'
          el.style.color = '#ffdd88'
        } else {
          el.style.transform = 'translate(-50%, -50%) scale(1)'
          el.style.color = 'white'
        }
      })
      
      // Raycasting
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(portals.children)
      
      if (intersects.length > 0) {
        if (hoveredPortal !== intersects[0].object) {
          hoveredPortal = intersects[0].object
          document.body.style.cursor = 'pointer'
        }
        hoveredPortal.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1)
      } else {
        if (hoveredPortal) {
          document.body.style.cursor = 'default'
          hoveredPortal = null
        }
      }
      
      portals.children.forEach(p => {
        if (p !== hoveredPortal) p.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
      })
      
    } else {
      document.body.style.cursor = 'default'
      hoveredPortal = null
      Object.values(labels).forEach(({ el }) => el.style.opacity = '0')
    }

    // --- RENDER ---
    renderer.render(scene, camera)
    rafId = requestAnimationFrame(animate)
  }

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

      scene.remove(middleCakeMesh)
      middleGeometry.dispose()
      middleMaterial.dispose()

      scene.remove(frostingMesh)
      frostingGeometry.dispose()
      frostingMaterial.dispose()

      scene.remove(sprinkleMesh)
      sprinkleGeo.dispose()
      sprinkleMat.dispose()

      scene.remove(pedestalMesh)
      pedestalGeo.dispose()
      pedestalMat.dispose()

      scene.remove(bokehParticles)
      bokehGeo.dispose()
      bokehMat.dispose()
      bokehTexture.dispose()

      scene.remove(shatterMesh)
      shatterGeo.dispose()
      shatterMat.dispose()

      scene.remove(portals)
      portalGeo.dispose()
      portalMatExplore.dispose()
      portalMatBuild.dispose()
      portalMatOrder.dispose()

      Object.values(labels).forEach(({ el }) => {
        if (mountRef.current && mountRef.current.contains(el)) {
          mountRef.current.removeChild(el)
        }
      })
      window.removeEventListener('mousemove', onMouseMove)
      document.body.style.cursor = 'default'

      scene.remove(studioLight1)
      studioLight1.dispose()
      
      scene.remove(studioLight2)
      studioLight2.dispose()

      scene.remove(cakeLight)
      cakeLight.dispose()

      scene.remove(ambientLight)
      ambientLight.dispose()
    }
  }, [])

  return <div ref={mountRef} className="landing-canvas" aria-hidden="true" />
}

export default CanvasRoot
