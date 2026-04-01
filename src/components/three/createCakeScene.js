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
  // 6. RENDER LOOP (runs every frame ~60fps)
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
  // 8. CLEANUP FUNCTION (critical for React!)
  // ===================
  function dispose() {
    cancelAnimationFrame(animationId)           // Stop the animation loop
    
    // Dispose of cake base resources
    baseGeometry.dispose()
    baseMaterial.dispose()
    
    renderer.dispose()                          // Free GPU memory
    container.removeChild(renderer.domElement)  // Remove canvas from DOM
  }

  // ===================
  // 9. RETURN everything
  // ===================
  return { scene, camera, renderer, dispose }
}
