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

  return (
    <>
      <CanvasRoot scrollProgress={scrollProgress} />

      <div className="landing-scroll-spacer" />

      <div className="landing-scroll-hint" style={hintStyle}>
        <span>Scroll to begin</span>
        <div className="scroll-arrow">↓</div>
      </div>
    </>
  )
}

export default LandingExperience
