import { useEffect, useState } from "react";
import { useCakeScene } from "../../hooks/useCakeScene";

function Hero() {
  // Track scroll progress (0 = top, 1 = scrolled one viewport height)
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY;
      const maxScroll = window.innerHeight;  // One full viewport height
      const progress = Math.min(scrollTop / maxScroll, 1);
      setScrollProgress(progress);
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Initialize Three.js scene with scroll progress
  const containerRef = useCakeScene(scrollProgress);

  return (
    <section className="hero">
      <div className="hero-overlay" />

      <div className="hero-content">
        <h1 className="hero-title">
          DESIGN THE FUTURE OF CAKES
        </h1>

        <p className="hero-subtitle">
          Enter the Neon Dessert Lab and build your masterpiece.
        </p>

        <button className="hero-btn">
          Start Building
        </button>
      </div>

      {/* Three.js canvas will be inserted here */}
      <div ref={containerRef} className="hero-3d" />
    </section>
  );
}

export default Hero;