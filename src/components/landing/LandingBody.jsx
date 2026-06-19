import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";

const BESTSELLERS = [
  {
    id: 1,
    name: "Neon Dream",
    price: 49.99,
    description: "3-layer vanilla cake with electric pink frosting and edible glitter.",
    color: "rgba(255, 107, 157, 0.15)",
    border: "rgba(255, 107, 157, 0.4)",
    glow: "0 0 15px rgba(255, 107, 157, 0.3)",
  },
  {
    id: 2,
    name: "Midnight Velvet",
    price: 59.99,
    description: "Rich red velvet cake with chocolate ganache and gold leaf accents.",
    color: "rgba(186, 12, 47, 0.15)",
    border: "rgba(186, 12, 47, 0.4)",
    glow: "0 0 15px rgba(186, 12, 47, 0.3)",
  },
  {
    id: 3,
    name: "Cyber Chocolate",
    price: 54.99,
    description: "Triple chocolate overload with neon blue drip and holographic sprinkles.",
    color: "rgba(0, 240, 255, 0.15)",
    border: "rgba(0, 240, 255, 0.4)",
    glow: "0 0 15px rgba(0, 240, 255, 0.3)",
  },
];

const PHILOSOPHY_TABS = [
  {
    id: "cryo",
    title: "Cryo-Baking",
    desc: "We use liquid nitrogen flash-freezing chambers to seal in flavor compounds at -196°C. This ensures the cake crumb remains incredibly moist and fresh without using preservatives.",
    stat: "99.2% Flavor Retention",
  },
  {
    id: "synthesis",
    title: "Organic Synthesis",
    desc: "All dyes and pigments are molecularly extracted from organic superfoods (like blue spirulina and dragon fruit). No artificial colors or chemicals enter the lab.",
    stat: "100% Organic Extracts",
  },
  {
    id: "laser",
    title: "Precision Layers",
    desc: "Our automated baking systems check sponge density and layer thickness using visual laser scans to ensure balanced structural integrity for every cake.",
    stat: "0.1mm Accuracy Tolerance",
  },
];

export default function LandingBody() {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [activePhilTab, setActivePhilTab] = useState("cryo");
  const [email, setEmail] = useState("");
  const [signedUp, setSignedUp] = useState(false);

  const handleSignup = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSignedUp(true);
      setEmail("");
    }
  };

  return (
    <div className="landing-body-container">
      {/* 1. Feature Grid */}
      <section className="landing-section features-sec">
        <h2 className="landing-sec-title">
          THE ARTISTRY SYSTEMS<span className="logo-dot">.</span>
        </h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">WebGL</span>
            <h3>3D Customizer</h3>
            <p>Stack tiers, select frosting textures, and configure custom shapes live in our interactive WebGL sandbox.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">✍️</span>
            <h3>Artisan Piped Cream</h3>
            <p>Draw custom doodles or type personalized messages projected as 3D raised frosting on top of your cake.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🖼️</span>
            <h3>Edible Photo Prints</h3>
            <p>Upload a memory and crop it in real time using our drag-to-fit sizing frame, finished with piped borders.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🧪</span>
            <h3>Molecular Flavors</h3>
            <p>Experience unique flavor pairings like Electric Yuzu, Midnight Raspberry, and Caramel Circuit.</p>
          </div>
        </div>
      </section>

      {/* 2. Bestsellers Carousel */}
      <section className="landing-section bestsellers-sec">
        <h2 className="landing-sec-title">
          POPULAR SYNTHESES<span className="logo-dot">.</span>
        </h2>
        <div className="bestsellers-row">
          {BESTSELLERS.map((cake) => (
            <div 
              className="bestseller-card" 
              key={cake.id}
              style={{
                background: cake.color,
                borderColor: cake.border,
                boxShadow: cake.glow,
              }}
            >
              <div className="card-top">
                <span className="bestseller-badge font-mono">Bestseller</span>
                <span className="bestseller-price">${cake.price}</span>
              </div>
              <h3 className="bestseller-name">{cake.name}</h3>
              <p className="bestseller-desc">{cake.description}</p>
              
              <div className="bestseller-actions">
                <button 
                  className="bestseller-btn buy-btn"
                  onClick={() => {
                    addItem({
                      id: cake.id,
                      name: cake.name,
                      price: cake.price,
                      description: cake.description,
                      image: "/images/cakes/neon-dream.jpg",
                    });
                  }}
                >
                  Quick Add
                </button>
                <Link to="/builder" className="bestseller-btn customize-btn">
                  Customize 3D
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Philosophy Section */}
      <section className="landing-section philosophy-sec">
        <h2 className="landing-sec-title">
          LAB METHODOLOGY<span className="logo-dot">.</span>
        </h2>
        <div className="phil-container">
          <div className="phil-tabs-left">
            {PHILOSOPHY_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`phil-tab-btn ${activePhilTab === tab.id ? "is-active" : ""}`}
                onClick={() => setActivePhilTab(tab.id)}
              >
                {tab.title}
              </button>
            ))}
          </div>
          <div className="phil-content-right">
            {PHILOSOPHY_TABS.map((tab) => {
              if (tab.id !== activePhilTab) return null;
              return (
                <div className="phil-tab-pane animate-fade-in" key={tab.id}>
                  <p className="phil-pane-desc">{tab.desc}</p>
                  <div className="phil-pane-stat">
                    <span className="stat-label">Metric Output</span>
                    <span className="stat-val font-mono">{tab.stat}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Newsletter Signup */}
      <section className="landing-section newsletter-sec">
        <div className="newsletter-card-wrapper">
          <h2 className="news-title">JOIN THE COMM-FEED</h2>
          <p className="news-desc">Subscribe to receive telemetry updates on new ingredients, lab expansion, and custom drop schedules.</p>
          
          {signedUp ? (
            <div className="news-success font-mono">
              <span className="success-pulse"></span>
              TRANSMISSION LINK ESTABLISHED 📡
            </div>
          ) : (
            <form onSubmit={handleSignup} className="news-form">
              <input 
                type="email" 
                className="news-input" 
                placeholder="ENTER CLIENT EMAIL..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="news-submit-btn font-mono">
                SUBSCRIBE
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
