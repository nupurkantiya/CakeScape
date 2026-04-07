import * as THREE from "three"

// ================================
// createLogoScene.js
// ================================
// Creates the opening logo animation:
// 1. Particles start scattered randomly
// 2. They animate to form "CakeScape" text
// 3. On scroll, they shatter apart
//
// KEY CONCEPT: We're using a 2D canvas to get text pixel positions,
// then creating 3D particles at those positions

export function createLogoScene(container) {
  // ================================
  // 1. BASIC THREE.JS SETUP
  // ================================
  
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000) // Pure black
  
  // Camera - looking at the scene from front
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  )
  camera.position.z = 100
  
  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)
  
  // ================================
  // 2. GET TEXT PARTICLE POSITIONS
  // ================================
  // We draw text on a hidden 2D canvas, then read which pixels are filled
  
  const textPositions = getTextPositions("CakeScape", 512, 128)
  const particleCount = textPositions.length
  
  console.log(`Creating ${particleCount} particles for logo`)
  
  // ================================
  // 3. CREATE PARTICLE GEOMETRY
  // ================================
  // BufferGeometry stores data efficiently for the GPU
  // We need THREE sets of positions:
  // - startPositions: Random scattered positions (where particles begin)
  // - textPositions: Where particles form the logo
  // - currentPositions: Where particles ARE right now (animated)
  
  const geometry = new THREE.BufferGeometry()
  
  // Arrays to hold our position data
  // Each particle has x, y, z → so array length = particleCount * 3
  const startPositions = new Float32Array(particleCount * 3)
  const targetPositions = new Float32Array(particleCount * 3)
  const currentPositions = new Float32Array(particleCount * 3)
  const randomOffsets = new Float32Array(particleCount) // For varied animation
  
  // Fill the arrays
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3 // Index for x,y,z triplet
    
    // START: Random positions in a sphere
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    const radius = 150 + Math.random() * 100
    
    startPositions[i3] = radius * Math.sin(phi) * Math.cos(theta)     // x
    startPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta) // y
    startPositions[i3 + 2] = radius * Math.cos(phi)                    // z
    
    // TARGET: The text positions (centered)
    targetPositions[i3] = textPositions[i].x
    targetPositions[i3 + 1] = textPositions[i].y
    targetPositions[i3 + 2] = 0 // Flat on z-plane
    
    // CURRENT: Start at the random positions
    currentPositions[i3] = startPositions[i3]
    currentPositions[i3 + 1] = startPositions[i3 + 1]
    currentPositions[i3 + 2] = startPositions[i3 + 2]
    
    // Random offset for staggered animation
    randomOffsets[i] = Math.random()
  }
  
  // Add positions to geometry
  geometry.setAttribute("position", new THREE.BufferAttribute(currentPositions, 3))
  geometry.setAttribute("startPosition", new THREE.BufferAttribute(startPositions, 3))
  geometry.setAttribute("targetPosition", new THREE.BufferAttribute(targetPositions, 3))
  geometry.setAttribute("randomOffset", new THREE.BufferAttribute(randomOffsets, 1))
  
  // ================================
  // 4. CREATE PARTICLE MATERIAL (SHADER)
  // ================================
  // We use ShaderMaterial for full control over particle appearance and animation
  
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },         // 0 = scattered, 1 = formed logo
      uScrollProgress: { value: 0 },   // 0 = no scroll, 1 = scrolled away
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uColor1: { value: new THREE.Color(0xff2e88) }, // Neon pink
      uColor2: { value: new THREE.Color(0x00ffff) }, // Cyan
    },
    vertexShader: `
      // Attributes (per-particle data)
      attribute vec3 startPosition;
      attribute vec3 targetPosition;
      attribute float randomOffset;
      
      // Uniforms (global data from JS)
      uniform float uTime;
      uniform float uProgress;
      uniform float uScrollProgress;
      uniform float uPixelRatio;
      
      // Varying (passed to fragment shader)
      varying float vRandomOffset;
      
      void main() {
        vRandomOffset = randomOffset;
        
        // ---- PHASE 1: Form the logo (uProgress 0 → 1) ----
        // Lerp from start position to target position
        // Each particle has slightly different timing (randomOffset)
        float formProgress = smoothstep(
          randomOffset * 0.5,           // Start time (staggered)
          randomOffset * 0.5 + 0.5,     // End time
          uProgress
        );
        
        vec3 formedPosition = mix(startPosition, targetPosition, formProgress);
        
        // ---- PHASE 2: Shatter on scroll (uScrollProgress 0 → 1) ----
        // Explode particles outward
        float shatterProgress = uScrollProgress;
        
        // Direction: away from center, with some randomness
        vec3 shatterDirection = normalize(startPosition) * (1.0 + randomOffset);
        
        // Move particles outward as user scrolls
        vec3 finalPosition = formedPosition + shatterDirection * shatterProgress * 200.0;
        
        // Add some swirl during shatter
        float swirl = shatterProgress * 3.14159 * 2.0 * randomOffset;
        finalPosition.x += sin(swirl) * shatterProgress * 20.0;
        finalPosition.y += cos(swirl) * shatterProgress * 20.0;
        
        // ---- Calculate final position ----
        vec4 mvPosition = modelViewMatrix * vec4(finalPosition, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // ---- Particle size ----
        // Bigger when formed, smaller when scattered
        float size = mix(2.0, 4.0, formProgress);
        size *= (1.0 - shatterProgress * 0.5); // Shrink during shatter
        gl_PointSize = size * uPixelRatio * (100.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform float uTime;
      uniform float uScrollProgress;
      
      varying float vRandomOffset;
      
      void main() {
        // ---- Circular particle shape ----
        // gl_PointCoord goes from 0,0 (top-left) to 1,1 (bottom-right)
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);
        
        // Discard pixels outside circle (soft edge)
        if (dist > 0.5) discard;
        
        // Soft glow effect
        float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
        
        // ---- Color: mix between pink and cyan ----
        vec3 color = mix(uColor1, uColor2, vRandomOffset);
        
        // Add shimmer over time
        float shimmer = sin(uTime * 3.0 + vRandomOffset * 6.28) * 0.2 + 0.8;
        color *= shimmer;
        
        // Fade out during shatter
        alpha *= (1.0 - uScrollProgress * 0.8);
        
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending, // Makes particles glow!
  })
  
  // ================================
  // 5. CREATE POINTS MESH
  // ================================
  
  const particles = new THREE.Points(geometry, material)
  scene.add(particles)
  
  // ================================
  // 6. ANIMATION STATE
  // ================================
  
  let animationProgress = 0     // 0-1: forming the logo
  let isFormed = false          // Has logo fully formed?
  let scrollProgress = 0        // 0-1: scroll-based shatter
  const clock = new THREE.Clock()
  
  // ================================
  // 7. ANIMATION LOOP
  // ================================
  
  function animate() {
    const elapsedTime = clock.getElapsedTime()
    
    // Update time uniform for shimmer effect
    material.uniforms.uTime.value = elapsedTime
    
    // ---- Phase 1: Auto-form the logo ----
    // Takes about 2 seconds to form
    if (!isFormed && animationProgress < 1) {
      animationProgress += 0.008 // Speed of formation
      material.uniforms.uProgress.value = animationProgress
      
      if (animationProgress >= 1) {
        isFormed = true
        console.log("Logo formed!")
      }
    }
    
    // ---- Phase 2: React to scroll ----
    material.uniforms.uScrollProgress.value = scrollProgress
    
    // Render
    renderer.render(scene, camera)
    
    // Continue loop
    requestAnimationFrame(animate)
  }
  
  animate()
  
  // ================================
  // 8. HANDLE RESIZE
  // ================================
  
  function handleResize() {
    const width = container.clientWidth
    const height = container.clientHeight
    
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    
    material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
  }
  
  window.addEventListener("resize", handleResize)
  
  // ================================
  // 9. RETURN CONTROLS
  // ================================
  
  return {
    // Update scroll progress (called from React component)
    setScrollProgress: (progress) => {
      scrollProgress = progress
    },
    
    // Check if logo has formed (to enable scrolling)
    isFormed: () => isFormed,
    
    // Cleanup
    dispose: () => {
      window.removeEventListener("resize", handleResize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }
}

// ================================
// HELPER: Get text pixel positions
// ================================
// Draws text on a 2D canvas, then reads which pixels are filled
// Returns array of {x, y} positions for particles

function getTextPositions(text, canvasWidth, canvasHeight) {
  // Create offscreen canvas
  const canvas = document.createElement("canvas")
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  
  const ctx = canvas.getContext("2d")
  
  // Fill background black
  ctx.fillStyle = "black"
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  
  // Draw white text
  ctx.fillStyle = "white"
  ctx.font = "bold 64px Arial"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, canvasWidth / 2, canvasHeight / 2)
  
  // Read pixel data
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
  const pixels = imageData.data // [r,g,b,a, r,g,b,a, ...]
  
  const positions = []
  const sampling = 2 // Sample every 2nd pixel (reduce particle count)
  
  for (let y = 0; y < canvasHeight; y += sampling) {
    for (let x = 0; x < canvasWidth; x += sampling) {
      // Get pixel index (each pixel has 4 values: r,g,b,a)
      const index = (y * canvasWidth + x) * 4
      
      // Check if pixel is "on" (white text)
      const brightness = pixels[index] // Red channel (white = 255)
      
      if (brightness > 128) {
        // Convert canvas coords to 3D coords (centered at origin)
        positions.push({
          x: (x - canvasWidth / 2) * 0.3,  // Scale down and center
          y: -(y - canvasHeight / 2) * 0.3, // Flip Y (canvas Y is inverted)
        })
      }
    }
  }
  
  return positions
}
