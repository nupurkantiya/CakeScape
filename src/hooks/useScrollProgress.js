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
    const handleScroll = () => {
      const scrollableHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
      const scrolled = window.scrollY
      const newProgress = Math.min(Math.max(scrolled / scrollableHeight, 0), 1)
      setProgress(newProgress)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
    }
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
