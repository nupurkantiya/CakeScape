import { useEffect, useRef } from "react"
import { createLogoScene } from "./createLogoScene"
import { useScrollProgress } from "../../hooks/useScrollProgress"

// ================================
// LandingExperience Component
// ================================
// The main container for our "Taste The Dream" experience
// This component:
// 1. Mounts the Three.js canvas
// 2. Connects scroll progress to animations
// 3. Will later contain all scene sections

function LandingExperience() {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const scrollProgress = useScrollProgress()

  // ================================
  // Mount Three.js scene
  // ================================
  useEffect(() => {
    if (!containerRef.current) return

    // Create the logo scene
    sceneRef.current = createLogoScene(containerRef.current)

    // Cleanup on unmount
    return () => {
      if (sceneRef.current) {
        sceneRef.current.dispose()
      }
    }
  }, [])

  // ================================
  // Update scroll progress
  // ================================
  useEffect(() => {
    if (sceneRef.current) {
      // Logo shatter happens in first 15% of scroll
      // After that, we transition to Scene 1
      const logoProgress = Math.min(scrollProgress / 0.15, 1)
      sceneRef.current.setScrollProgress(logoProgress)
    }
  }, [scrollProgress])

  return (
    <>
      {/* Three.js Canvas Container */}
      <div 
        ref={containerRef} 
        className="landing-canvas"
      />

      {/* Scroll spacer - creates room to scroll */}
      {/* Total scroll height = 600vh (6x viewport height) */}
      {/* Each scene gets roughly 1 viewport of scroll */}
      <div className="landing-scroll-spacer" />

      {/* Text overlay that appears after logo forms */}
      <div 
        className="landing-scroll-hint"
        style={{
          opacity: scrollProgress < 0.05 ? 1 : 0,
          transition: "opacity 0.5s ease"
        }}
      >
        <span>Scroll to begin</span>
        <div className="scroll-arrow">↓</div>
      </div>
    </>
  )
}

export default LandingExperience
