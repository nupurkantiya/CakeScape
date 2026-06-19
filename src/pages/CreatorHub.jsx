import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBuilder } from "../context/BuilderContext";
import { useCart } from "../context/CartContext";

const COMMUNITY_DESIGNS = [
  {
    id: "preset-1",
    name: "Double Chocolate Malt",
    creator: "@chocolate_master",
    likes: 142,
    liked: false,
    themeColor: "radial-gradient(circle, #5a1b0c 0%, #2b0b04 100%)",
    spec: {
      layers: [
        { id: 1, flavor: "chocolate", size: 2.0, frosting: "drizzle", customColor: null },
        { id: 2, flavor: "chocolate", size: 1.6, frosting: "drizzle", customColor: null },
        { id: 3, flavor: "chocolate", size: 1.2, frosting: "drizzle", customColor: null },
      ],
      toppings: [{ id: "chocolate-shavings", count: 3 }],
      customization: {
        text: "Dark Malt",
        textColor: "#ff007f",
        textFont: "Georgia, serif",
        textSize: 40,
        textOffsetX: 0,
        textOffsetY: 20,
      },
    },
  },
  {
    id: "preset-2",
    name: "Pistachio Glaze",
    creator: "@chef_sophie",
    likes: 98,
    liked: false,
    themeColor: "radial-gradient(circle, #83c572 0%, #447437 100%)",
    spec: {
      layers: [
        { id: 1, flavor: "vanilla", size: 2.0, frosting: "none", customColor: "#93c572" },
        { id: 2, flavor: "vanilla", size: 1.6, frosting: "none", customColor: "#93c572" },
      ],
      toppings: [],
      customization: {
        text: "Pistachio",
        textColor: "#ffffff",
        textFont: "cursive",
        textSize: 44,
        textOffsetX: 0,
        textOffsetY: 0,
      },
    },
  },
  {
    id: "preset-3",
    name: "Velvet Raspberry Spark",
    creator: "@velvet_vixen",
    likes: 215,
    liked: false,
    themeColor: "radial-gradient(circle, #c71585 0%, #5c073a 100%)",
    spec: {
      layers: [
        { id: 1, flavor: "vanilla", size: 2.0, frosting: "none", customColor: "#c71585" },
        { id: 2, flavor: "vanilla", size: 1.6, frosting: "none", customColor: "#c71585" },
        { id: 3, flavor: "vanilla", size: 1.2, frosting: "none", customColor: "#c71585" },
      ],
      toppings: [{ id: "macarons", count: 2 }],
      customization: {
        text: "Velvet Spark",
        textColor: "#fff5e1",
        textFont: "Georgia, serif",
        textSize: 36,
        textOffsetX: 0,
        textOffsetY: -10,
      },
    },
  },
  {
    id: "preset-4",
    name: "Lemon Zest Grid",
    creator: "@zesty_bites",
    likes: 64,
    liked: false,
    themeColor: "radial-gradient(circle, #e6d812 0%, #7d7505 100%)",
    spec: {
      layers: [
        { id: 1, flavor: "lemon", size: 2.0, frosting: "drizzle", customColor: null },
        { id: 2, flavor: "lemon", size: 1.6, frosting: "drizzle", customColor: null },
      ],
      toppings: [],
      customization: {
        text: "Zesty Grid",
        textColor: "#00ffff",
        textFont: "Arial, sans-serif",
        textSize: 42,
        textOffsetX: 0,
        textOffsetY: 0,
      },
    },
  },
  {
    id: "preset-5",
    name: "Vanilla Funfetti Volt",
    creator: "@sprinkle_storm",
    likes: 189,
    liked: false,
    themeColor: "radial-gradient(circle, #ff69b4 0%, #9932cc 100%)",
    spec: {
      layers: [
        { id: 1, flavor: "vanilla", size: 2.0, frosting: "none", customColor: null },
        { id: 2, flavor: "vanilla", size: 1.6, frosting: "none", customColor: null },
        { id: 3, flavor: "vanilla", size: 1.2, frosting: "none", customColor: null },
      ],
      toppings: [{ id: "sprinkles", count: 5 }],
      customization: {
        text: "Funfetti Volt",
        textColor: "#ffffff",
        textFont: "cursive",
        textSize: 46,
        textOffsetX: 0,
        textOffsetY: 10,
      },
    },
  },
  {
    id: "preset-6",
    name: "Salted Caramel Circuit",
    creator: "@caramel_flux",
    likes: 122,
    liked: false,
    themeColor: "radial-gradient(circle, #d2691e 0%, #5e300d 100%)",
    spec: {
      layers: [
        { id: 1, flavor: "chocolate", size: 2.0, frosting: "drizzle", customColor: "#d2691e" },
        { id: 2, flavor: "vanilla", size: 1.6, frosting: "none", customColor: "#d2691e" },
      ],
      toppings: [],
      customization: {
        text: "Caramel",
        textColor: "#ffffff",
        textFont: "Arial, sans-serif",
        textSize: 40,
        textOffsetX: 0,
        textOffsetY: 0,
      },
    },
  },
];

const TRACKED_ORDERS = [
  {
    id: "LAB-8042",
    cakeName: "Double Chocolate Malt",
    price: 64.99,
    date: "June 19, 2026",
    eta: "Today, 6:00 PM",
    step: 3, // En Route
    specs: "3 Layers, Chocolate frosting, chocolate flakes, personalized cream text",
  },
  {
    id: "LAB-8043",
    cakeName: "Vanilla Funfetti Volt",
    price: 54.99,
    date: "June 18, 2026",
    eta: "Tomorrow, 2:00 PM",
    step: 2, // Decorating
    specs: "3 Layers, Vanilla, full sprinkles, neon pink cream text",
  },
  {
    id: "LAB-8044",
    cakeName: "Lemon Zest Grid",
    price: 49.99,
    date: "June 18, 2026",
    eta: "June 21, 2026",
    step: 0, // Baking
    specs: "2 Layers, Lemon, cyan piped cream text",
  },
];

export default function CreatorHub() {
  const navigate = useNavigate();
  const { dispatch: builderDispatch } = useBuilder();
  const { addItem } = useCart();

  const [activeTab, setActiveTab] = useState("gallery");
  const [designs, setDesigns] = useState(COMMUNITY_DESIGNS);
  const [toast, setToast] = useState(null);

  const handleLike = (id) => {
    setDesigns((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            liked: !d.liked,
            likes: d.liked ? d.likes - 1 : d.likes + 1,
          };
        }
        return d;
      })
    );
  };

  const handleRemix = (preset) => {
    // Dispatch the preset to the Builder Context
    builderDispatch({
      type: "LOAD_PRESET",
      payload: preset.spec,
    });
    showToast(`Loaded "${preset.name}" preset! Opening 3D Builder...`);
    setTimeout(() => {
      navigate("/builder");
    }, 1200);
  };

  const handleQuickAdd = (preset) => {
    // Generate a simple product mock
    const cartProduct = {
      id: Math.floor(Math.random() * 100000) + 1000,
      name: `Custom: ${preset.name}`,
      description: `Customized creation by ${preset.creator}`,
      price: 59.99,
      image: "/images/cakes/neon-dream.jpg", // placeholder image for custom cake
      custom: true,
    };
    addItem(cartProduct);
    showToast(`Added custom "${preset.name}" to cart!`);
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="creator-hub-page">
      {/* Toast Alert */}
      {toast && (
        <div className="hub-toast">
          <span className="hub-toast-icon">⚡</span>
          <span className="hub-toast-msg">{toast}</span>
        </div>
      )}

      {/* Header */}
      <header className="hub-header">
        <h1 className="hub-title">
          CREATOR HUB<span className="logo-dot">.</span>
        </h1>
        <p className="hub-subtitle">
          Inspect custom syntheses from the community or track your active baking pipelines.
        </p>
      </header>

      {/* Toggles */}
      <div className="hub-tab-toggle">
        <button
          className={`hub-toggle-btn ${activeTab === "gallery" ? "is-active" : ""}`}
          onClick={() => setActiveTab("gallery")}
        >
          <span className="btn-icon">🌌</span>
          Trending Labs
        </button>
        <button
          className={`hub-toggle-btn ${activeTab === "orders" ? "is-active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          <span className="btn-icon">🛸</span>
          Cyber-Tracker
        </button>
      </div>

      {/* Body Content */}
      <div className="hub-body">
        {activeTab === "gallery" ? (
          <div className="hub-grid">
            {designs.map((preset) => (
              <div className="hub-card" key={preset.id}>
                {/* 3D Visualizer Thumbnail */}
                <div
                  className="hub-card-preview"
                  style={{ background: preset.themeColor }}
                >
                  <div className="hub-preview-cake">
                    <div className="cake-ring tier-1"></div>
                    <div className="cake-ring tier-2"></div>
                    <div className="cake-ring tier-3"></div>
                  </div>
                  <div className="hub-preview-overlay">
                    <span className="spec-label">
                      {preset.spec.layers.length} tiers • {preset.spec.layers[0].flavor}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="hub-card-body">
                  <div className="hub-card-header">
                    <div>
                      <h3 className="hub-cake-name">{preset.name}</h3>
                      <span className="hub-creator">{preset.creator}</span>
                    </div>
                    <button
                      className={`hub-like-btn ${preset.liked ? "is-liked" : ""}`}
                      onClick={() => handleLike(preset.id)}
                    >
                      <span className="heart-icon">{preset.liked ? "❤️" : "🤍"}</span>
                      <span className="likes-count">{preset.likes}</span>
                    </button>
                  </div>

                  <div className="hub-tags">
                    {preset.spec.customization.text && (
                      <span className="hub-tag">
                        Cream Text: "{preset.spec.customization.text}"
                      </span>
                    )}
                    {preset.spec.toppings.length > 0 && (
                      <span className="hub-tag">
                        Topping: {preset.spec.toppings[0].id.replace("-", " ")}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="hub-card-actions">
                    <button
                      className="hub-action-btn remix-btn"
                      onClick={() => handleRemix(preset)}
                    >
                      Remix in 3D
                    </button>
                    <button
                      className="hub-action-btn add-btn"
                      onClick={() => handleQuickAdd(preset)}
                    >
                      Quick Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="tracker-list">
            {TRACKED_ORDERS.map((order) => (
              <div className="tracker-card" key={order.id}>
                {/* Header */}
                <div className="tracker-card-header">
                  <div>
                    <span className="order-id">{order.id}</span>
                    <h3 className="order-cake-name">{order.cakeName}</h3>
                    <p className="order-specs">{order.specs}</p>
                  </div>
                  <div className="order-meta">
                    <span className="order-price">${order.price}</span>
                    <span className="order-date">{order.date}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="tracker-progress">
                  <div className="progress-track-line">
                    <div
                      className="progress-fill-line"
                      style={{ width: `${(order.step / 3) * 100}%` }}
                    ></div>
                  </div>
                  <div className="progress-steps">
                    {[
                      { label: "Bake Core", icon: "🧪" },
                      { label: "Cryo-Frosting", icon: "❄️" },
                      { label: "Decorating", icon: "✍️" },
                      { label: "En Route", icon: "🛸" },
                    ].map((step, idx) => {
                      const isActive = idx <= order.step;
                      const isCurrent = idx === order.step;
                      return (
                        <div
                          className={`progress-step-node ${isActive ? "is-active" : ""} ${
                            isCurrent ? "is-current" : ""
                          }`}
                          key={idx}
                        >
                          <div className="node-circle">
                            <span className="node-icon">{step.icon}</span>
                          </div>
                          <span className="node-label">{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="tracker-card-footer">
                  <p className="tracker-eta-msg">
                    Delivery Estimate: <span className="eta-highlight">{order.eta}</span>
                  </p>
                  <button
                    className="tracker-reorder-btn"
                    onClick={() => {
                      showToast(`Adding components of ${order.cakeName} to 3D Builder...`);
                      builderDispatch({
                        type: "LOAD_PRESET",
                        payload: COMMUNITY_DESIGNS.find(
                          (c) => c.name === order.cakeName
                        )?.spec || COMMUNITY_DESIGNS[0].spec,
                      });
                      setTimeout(() => navigate("/builder"), 1200);
                    }}
                  >
                    Load & Reorder
                  </button>
                </div>
              </div>
            ))}

            {/* Saved Designs Section */}
            <div className="saved-designs-section">
              <h2 className="saved-section-title">Saved Configurations</h2>
              <div className="saved-grid">
                <div className="saved-card">
                  <div className="saved-card-info">
                    <h4>Pistachio Glaze (Custom)</h4>
                    <p>2 Layers • Pistachio base • Cream Text "Pistachio"</p>
                  </div>
                  <button
                    className="saved-load-btn"
                    onClick={() => handleRemix(designs[1])}
                  >
                    Open in Builder
                  </button>
                </div>
                <div className="saved-card">
                  <div className="saved-card-info">
                    <h4>Velvet Raspberry Spark (Custom)</h4>
                    <p>3 Layers • Raspberry Compote • Macaron Topping</p>
                  </div>
                  <button
                    className="saved-load-btn"
                    onClick={() => handleRemix(designs[2])}
                  >
                    Open in Builder
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
