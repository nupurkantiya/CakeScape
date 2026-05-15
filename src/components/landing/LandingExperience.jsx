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

  const scene6TextStyle = {
    opacity:
      scrollProgress > 0.85
        ? Math.min((scrollProgress - 0.85) / 0.08, 1)
        : 0,
    transition: "opacity 0.3s ease",
    pointerEvents: "none",
    zIndex: 100
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
      <div className="scene6-text" style={scene6TextStyle}>
        <p>Awaits.</p>
      </div>
      
      <footer style={{
        position: 'fixed',
        bottom: '40px',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        ...scene6TextStyle
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 28px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '50px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          color: 'white',
          fontFamily: '"Inter", sans-serif',
          fontSize: '0.95rem',
          letterSpacing: '1px',
          cursor: 'pointer',
          transition: 'transform 0.3s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span style={{ fontSize: '1.2rem' }}>✨</span>
          <span style={{ fontWeight: 500 }}>Select your journey to begin</span>
          <span style={{ fontSize: '1.2rem' }}>✨</span>
        </div>
      </footer>
    </>
  )
}

export default LandingExperience
