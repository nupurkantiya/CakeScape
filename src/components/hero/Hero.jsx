function Hero() {
  return (
    <section className="hero">
      <div className="hero-overlay" />

      <div className="floating-orb orb-1" />
      <div className="floating-orb orb-2" />

      <div className="hero-content">
        <h1 className="hero-title">
          Design The Future of Cakes
        </h1>

        <p className="hero-subtitle">
          Enter the Neon Dessert Lab and build your masterpiece.
        </p>

        <button className="hero-btn">
          Start Building ⚡
        </button>
      </div>

      {/* Future Three.js Canvas will go here */}
      <div className="hero-3d-placeholder">
        3D Scene Coming Soon
      </div>
    </section>
  );
}

export default Hero;