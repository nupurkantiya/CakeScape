import { useMemo } from "react"
import { useScrollProgress } from "../../hooks/useScrollProgress"
import CanvasRoot from "./CanvasRoot"

function LandingExperience() {
  const scrollProgress = useScrollProgress()

  const hintStyle = useMemo(
    () => ({
      opacity: scrollProgress < 0.05 ? 1 : 0,
      transition: "opacity 0.5s ease",
    }),
    [scrollProgress]
  )

  const scene2TextStyle = {
    opacity:
      scrollProgress > 0.15 && scrollProgress < 0.35
        ? Math.min((scrollProgress - 0.15) / 0.08, 1)
        : 0,
    transition: "opacity 0.3s ease",
  }

  return (
    <>
      <CanvasRoot scrollProgress={scrollProgress} />

      <div className="landing-scroll-spacer" />

      <div className="landing-scroll-hint" style={hintStyle}>
        <span>Scroll to begin</span>
        <div className="scroll-arrow">↓</div>
      </div>

      <div className="scene2-text" style={scene2TextStyle}>
        <p>Close your eyes...</p>
        <p>imagine.</p>
      </div>
    </>
  )
}

export default LandingExperience
