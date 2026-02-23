import HeroScene from "../three/HeroScene";
import { useEffect, useState } from "react";


function Hero() {

    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
    const handleScroll = () => {
        const scrollTop = window.scrollY;
        const maxScroll = window.innerHeight;
        const progress = Math.min(scrollTop / maxScroll, 1);
        setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
    }, []);


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
            Start Building ⚡
            </button>
        </div>

        <div className="hero-3d">
            <HeroScene scrollProgress={scrollProgress} />
        </div>
    </section>
  );
}

export default Hero;