import { useCakeScene } from "../../hooks/useCakeScene";

function Hero() {
  // Initialize Three.js scene and get the container ref
  const containerRef = useCakeScene();

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