import { useState, useEffect } from "react"

// ================================
// useScrollProgress Hook
// ================================
// Tracks how far user has scrolled through the ENTIRE page
// Returns a value from 0 (top) to 1 (bottom)
//
// WHY: All our scenes are driven by scroll position
// This hook gives us ONE source of truth for scroll progress

export function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Calculate scroll progress
    const handleScroll = () => {
      // Total scrollable height = document height - viewport height
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
      
      // Current scroll position
      const scrolled = window.scrollY
      
      // Progress = how far we've scrolled (0 to 1)
      // Clamp between 0 and 1 to be safe
      const newProgress = Math.min(Math.max(scrolled / scrollableHeight, 0), 1)
      
      setProgress(newProgress)
    }

    // Listen for scroll events
    window.addEventListener("scroll", handleScroll, { passive: true })
    
    // Calculate initial progress
    handleScroll()

    // Cleanup
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return progress
}

// ================================
// Helper: Map progress to scene range
// ================================
// Example: Scene 2 runs from 15% to 35% scroll
// sceneProgress(0.25, 0.15, 0.35) → 0.5 (halfway through scene)
//
// WHY: Each scene needs its OWN 0-1 progress value

export function getSceneProgress(globalProgress, sceneStart, sceneEnd) {
  // If we haven't reached this scene yet
  if (globalProgress < sceneStart) return 0
  
  // If we've passed this scene
  if (globalProgress > sceneEnd) return 1
  
  // We're IN this scene - calculate local progress
  return (globalProgress - sceneStart) / (sceneEnd - sceneStart)
}
