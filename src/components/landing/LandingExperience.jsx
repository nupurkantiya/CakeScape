import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import CanvasRoot from "./CanvasRoot"
import LandingBody from "./LandingBody"
import Footer from "../layout/Footer"

function LandingExperience() {
  const navigate = useNavigate()
  const [introProgress, setIntroProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      // Calculate progress relative to the 500vh intro scroll spacer
      const introScrollLimit = window.innerHeight * 5
      const currentScroll = window.scrollY
      const progress = Math.min(Math.max(currentScroll / introScrollLimit, 0), 1)
      setIntroProgress(progress)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll)
    // Run initial calculation
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
    }
  }, [])

  const hintStyle = useMemo(
    () => ({
      opacity: introProgress < 0.05 ? 1 : 0,
      transition: "opacity 0.5s ease",
    }),
    [introProgress]
  )

  const scene1TextStyle = {
    opacity:
      introProgress > 0.0 && introProgress < 0.15
        ? Math.min(introProgress / 0.08, 1)
        : 0,
    transition: "opacity 0.3s ease",
  }

  const scene2TextStyle = {
    opacity:
      introProgress > 0.15 && introProgress < 0.35
        ? Math.min((introProgress - 0.15) / 0.08, 1)
        : 0,
    transition: "opacity 0.3s ease",
  }

  const scene3TextStyle = {
    opacity:
      introProgress > 0.35 && introProgress < 0.55
        ? Math.min((introProgress - 0.35) / 0.08, 1)
        : 0,
    transition: "opacity 0.3s ease",
  }

  const scene4TextStyle = {
    opacity:
      introProgress > 0.55 && introProgress < 0.70
        ? Math.min((introProgress - 0.55) / 0.08, 1)
        : 0,
    transition: "opacity 0.3s ease",
  }

  const scene5TextStyle = {
    opacity:
      introProgress > 0.70 && introProgress < 0.82
        ? Math.min((introProgress - 0.70) / 0.08, 1)
        : 0,
    transition: "opacity 0.3s ease",
  }

  const scene6TextStyle = {
    opacity:
      introProgress > 0.82 && introProgress < 0.90
        ? Math.min((introProgress - 0.82) / 0.05, 1)
        : 0,
    transition: "opacity 0.3s ease",
    pointerEvents: "none",
  }

  const journeyBtnStyle = {
    opacity:
      introProgress > 0.82 && introProgress < 0.90
        ? Math.min((introProgress - 0.82) / 0.05, 1)
        : 0,
    pointerEvents: introProgress > 0.82 && introProgress < 0.90 ? "auto" : "none",
    transition: "opacity 0.3s ease",
    zIndex: 100,
  }

  return (
    <div className="landing-experience-page">
      {/* 3D background canvas */}
      <CanvasRoot scrollProgress={introProgress} />

      {/* Scroll spacer to drive the 3D scroll animations */}
      <div className="landing-scroll-spacer" />

      {/* Floating text segments for the intro */}
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
      
      {/* Call to Action Button */}
      <div style={{
        position: 'fixed',
        bottom: '80px',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        ...journeyBtnStyle
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 32px',
          background: 'rgba(0, 240, 255, 0.1)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          borderRadius: '50px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)',
          color: '#00ffff',
          fontFamily: '"Inter", sans-serif',
          fontSize: '1rem',
          fontWeight: 600,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.background = 'rgba(0, 240, 255, 0.25)';
          e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 240, 255, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = 'rgba(0, 240, 255, 0.1)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 240, 255, 0.2)';
        }}
        onClick={() => navigate("/builder")}
        >
          <span>✨ Start Customizing in 3D ✨</span>
        </div>
      </div>

      {/* 5. Rich Landing Page Content & Footer scrolls up after intro */}
      <div className="landing-scroll-content">
        <LandingBody />
        <Footer />
      </div>
    </div>
  )
}

export default LandingExperience
