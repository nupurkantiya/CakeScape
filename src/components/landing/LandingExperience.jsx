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

  const scene1TextStyle = {
    opacity:
      scrollProgress > 0.0 && scrollProgress < 0.15
        ? Math.min(scrollProgress / 0.08, 1)
        : 0,
    transition: "opacity 0.3s ease",
  }

  const scene2TextStyle = {
    opacity:
      scrollProgress > 0.15 && scrollProgress < 0.35
        ? Math.min((scrollProgress - 0.15) / 0.08, 1)
        : 0,
    transition: "opacity 0.3s ease",
  }

  const scene3TextStyle = {
    opacity:
      scrollProgress > 0.35 && scrollProgress < 0.55
        ? Math.min((scrollProgress - 0.35) / 0.08, 1)
        : 0,
    transition: "opacity 0.3s ease",
  }

  const scene4TextStyle = {
    opacity:
      scrollProgress > 0.55 && scrollProgress < 0.70
        ? Math.min((scrollProgress - 0.55) / 0.08, 1)
        : 0,
    transition: "opacity 0.3s ease",
  }

  const scene5TextStyle = {
    opacity:
      scrollProgress > 0.70 && scrollProgress < 0.85
        ? Math.min((scrollProgress - 0.70) / 0.08, 1)
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

      <div className="scene1-text" style={scene1TextStyle}>
        <p>Close your eyes...</p>
        <p>imagine.</p>
      </div>
      <div className="scene2-text" style={scene2TextStyle}>
        <p>From the purest ingredients...</p>
      </div>
      <div className="scene3-text" style={scene3TextStyle}>
        <p>Layer by layer...</p>
      </div>
      <div className="scene4-text" style={scene4TextStyle}>
        <p>Dressed to perfection...</p>
      </div>
      <div className="scene5-text" style={scene5TextStyle}>
        <p>Your masterpiece</p>
      </div>
    </>
  )
}

export default LandingExperience
