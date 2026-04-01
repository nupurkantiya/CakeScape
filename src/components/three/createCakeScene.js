import * as THREE from 'three'

export function createCakeScene(container) {
  // ===================
  // 1. SCENE (the stage)
  // ===================
  const scene = new THREE.Scene()

  // ===================
  // 2. CAMERA (the viewpoint)
  // ===================
  const camera = new THREE.PerspectiveCamera(
    50,                                              // FOV: field of view in degrees
    container.clientWidth / container.clientHeight,  // Aspect ratio (prevents stretching)
    0.1,                                             // Near clipping plane
    1000                                             // Far clipping plane
  )
  camera.position.set(0, 0, 5)  // Move camera back so we can see objects at origin

  // ===================
  // 3. RENDERER (draws to canvas)
  // ===================
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.appendChild(renderer.domElement)

  // ===================
  // 4. LIGHTS (so we can see objects)
  // ===================
  
  // Ambient light: soft base illumination from all directions
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  // Directional light: like the sun, creates highlights and depth
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
  directionalLight.position.set(5, 5, 5)  // Position: top-right-front
  scene.add(directionalLight)

  // ===================
  // 5. CAKE BASE MESH (brown cylinder)
  // ===================
  
  // Geometry: shape of the cake base
  // Parameters: radiusTop, radiusBottom, height, radialSegments
  const baseGeometry = new THREE.CylinderGeometry(1.2, 1.2, 1, 64)
  
  // Material: dark brown, physically-based (reacts to lights)
  const baseMaterial = new THREE.MeshStandardMaterial({ color: '#5a1b0c' })
  
  // Mesh: combine geometry + material
  const cakeBase = new THREE.Mesh(baseGeometry, baseMaterial)
  
  // Position: slightly below center (y = -0.5) so frosting can sit on top
  cakeBase.position.set(0, -0.5, 0)
  
  // Add to scene (required to be visible!)
  scene.add(cakeBase)

  // ===================
  // 6. FROSTING MESH (pink cylinder with custom shader)
  // ===================
  
  // Geometry: slightly wider than base, sits on top
  const frostingGeometry = new THREE.CylinderGeometry(1.25, 1.25, 1, 128)
  
  // Custom ShaderMaterial with melt effect
  const frostingMaterial = new THREE.ShaderMaterial({
    uniforms: {
      melt: { value: 0 }  // 0 = no melt, 1 = fully melted
    },
    
    // VERTEX SHADER: Manipulates vertex positions to create melt effect
    vertexShader: `
      uniform float melt;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec3 pos = position;

        // Height-based influence (top melts more than bottom)
        float heightFactor = smoothstep(0.0, 1.0, pos.y);

        // Smooth cubic easing for natural feel
        float easedMelt = melt * melt * melt;
        float meltAmount = easedMelt * heightFactor;

        // Downward sag
        pos.y -= meltAmount * 0.4;

        // Outward spread (cake gets wider as it melts)
        pos.x *= 1.0 + meltAmount * 0.15;
        pos.z *= 1.0 + meltAmount * 0.15;

        // Organic uneven drips using simple noise
        float noise = sin(pos.x * 8.0) * sin(pos.z * 8.0);
        pos.y -= meltAmount * noise * 0.08;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    
    // FRAGMENT SHADER: Sets the pixel color (pink frosting)
    fragmentShader: `
      varying vec2 vUv;

      void main() {
        vec3 frostingColor = vec3(1.0, 0.4, 0.7);  // Pink color
        gl_FragColor = vec4(frostingColor, 1.0);
      }
    `
  })
  
  // Create the frosting mesh
  const frosting = new THREE.Mesh(frostingGeometry, frostingMaterial)
  
  // Position: above the cake base
  frosting.position.set(0, 0.5, 0)
  
  // Add to scene
  scene.add(frosting)

  // ===================
  // 7. RENDER LOOP (runs every frame ~60fps)
  // ===================
  let animationId  // Store ID so we can cancel later

  function animate() {
    animationId = requestAnimationFrame(animate)

    // Updates will go here later:
    // - Scroll-based melt effect
    // - Cake rotation
    // - Any other animations

    renderer.render(scene, camera)
  }

  // Start the loop
  animate()

  // ===================
  // 9. CLEANUP FUNCTION (critical for React!)
  // ===================
  function dispose() {
    cancelAnimationFrame(animationId)           // Stop the animation loop
    
    // Dispose of cake base resources
    baseGeometry.dispose()
    baseMaterial.dispose()
    
    // Dispose of frosting resources
    frostingGeometry.dispose()
    frostingMaterial.dispose()
    
    renderer.dispose()                          // Free GPU memory
    container.removeChild(renderer.domElement)  // Remove canvas from DOM
  }

  // ===================
  // 10. RETURN everything
  // ===================
  return { scene, camera, renderer, frostingMaterial, dispose }
}
