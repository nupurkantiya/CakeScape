import { useEffect, useRef } from 'react'
import { createCakeScene } from '../components/three/createCakeScene'

/**
 * Custom hook to initialize and manage the Three.js cake scene
 * 
 * @param {number} scrollProgress - Value from 0 to 1 representing scroll position
 * @returns {React.RefObject} containerRef - Attach this to your container div
 * 
 * Usage:
 *   const containerRef = useCakeScene(scrollProgress)
 *   return <div ref={containerRef} className="hero-3d" />
 */
export function useCakeScene(scrollProgress = 0) {
  // Reference to the DOM container element
  const containerRef = useRef(null)
  
  // Store scene objects so we can access them later (for scroll updates, etc.)
  const sceneRef = useRef(null)

  // INITIALIZE THREE.JS (runs once on mount)
  useEffect(() => {
    // 1. GET THE CONTAINER
    const container = containerRef.current
    
    // Safety check: make sure container exists
    if (!container) {
      console.error('useCakeScene: container ref is null')
      return
    }

    // 2. CREATE THE THREE.JS SCENE
    const sceneObjects = createCakeScene(container)
    sceneRef.current = sceneObjects

    // 3. HANDLE WINDOW RESIZE
    function handleResize() {
      const { camera, renderer } = sceneRef.current
      
      // Update camera aspect ratio
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()  // Apply the changes
      
      // Update renderer size
      renderer.setSize(container.clientWidth, container.clientHeight)
    }

    window.addEventListener('resize', handleResize)

    // 4. CLEANUP FUNCTION (runs when component unmounts)
    return () => {
      window.removeEventListener('resize', handleResize)
      sceneObjects.dispose()
    }
  }, [])  // Empty dependency array = run once on mount

  // UPDATE MELT UNIFORM (runs whenever scrollProgress changes)
  useEffect(() => {
    if (!sceneRef.current) return
    
    const { frostingMaterial } = sceneRef.current
    
    // Map scroll progress to melt range
    // Melt starts at 10% scroll, fully melted at 60% scroll
    const meltStart = 0.1
    const meltEnd = 0.6
    
    const raw = (scrollProgress - meltStart) / (meltEnd - meltStart)
    const clamped = Math.min(Math.max(raw, 0), 1)
    
    // Update the shader uniform
    frostingMaterial.uniforms.melt.value = clamped
    
  }, [scrollProgress])  // Re-run whenever scrollProgress changes

  return containerRef
}
