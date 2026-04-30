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
      scrollProgress > 0.25 && scrollProgress < 0.45
        ? Math.min((scrollProgress - 0.25) / 0.08, 1)
        : 0,
    transition: "opacity 0.3s ease",
  }

  const scene3TextStyle = {
    opacity:
      scrollProgress > 0.45 && scrollProgress < 0.65
        ? Math.min((scrollProgress - 0.45) / 0.08, 1)
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
      <div className="scene3-text" style={scene3TextStyle}>
        <p>From the purest ingredients...</p>
      </div>
    </>
  )
}

export default LandingExperience
