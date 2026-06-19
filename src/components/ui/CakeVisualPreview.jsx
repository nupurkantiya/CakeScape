import React from "react";

const FLAVOR_COLORS = {
  chocolate: "#6b3421",
  vanilla: "#f0d9a0",
  strawberry: "#f4a0b0",
  red_velvet: "#8b1a1a",
  redvelvet: "#8b1a1a",
  "red velvet": "#8b1a1a",
  lemon: "#f5f570",
  blueberry: "#6a5acd",
  matcha: "#7db36a",
};

const CATEGORY_COLORS = {
  signature: "#ff007f", // pink neon
  classic: "#00f0ff",   // cyan neon
  birthday: "#ffff00",  // yellow neon
  wedding: "#ffffff",   // white neon
  cupcakes: "#9b5cff",  // purple neon
};

// Simple color helper to darken/lighten hex colors
function adjustColor(hex, percent) {
  if (!hex || hex === "transparent" || !hex.startsWith("#")) return hex;
  
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  R = parseInt((R * (100 + percent)) / 100);
  G = parseInt((G * (100 + percent)) / 100);
  B = parseInt((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  R = R > 0 ? R : 0;
  G = G > 0 ? G : 0;
  B = B > 0 ? B : 0;

  const rHex = R.toString(16).padStart(2, "0");
  const gHex = G.toString(16).padStart(2, "0");
  const bHex = B.toString(16).padStart(2, "0");

  return `#${rHex}${gHex}${bHex}`;
}

export default function CakeVisualPreview({ layers = 3, flavor = "vanilla", category = "signature" }) {
  // Normalize layers count (ensure 1 to 4)
  const layerCount = Math.min(Math.max(Number(layers) || 2, 1), 4);
  
  // Normalize flavor to lookup color
  const normalizedFlavor = String(flavor || "vanilla").toLowerCase().replace("-", "_");
  const baseColor = FLAVOR_COLORS[normalizedFlavor] || FLAVOR_COLORS.vanilla;
  
  // Normalize category to lookup neon accent color
  const normalizedCategory = String(category || "signature").toLowerCase();
  const neonColor = CATEGORY_COLORS[normalizedCategory] || CATEGORY_COLORS.signature;

  // Build specifications for the stacked tiers (bottom to top)
  const tiers = [];
  for (let i = 0; i < layerCount; i++) {
    // Width scales down for higher tiers (bottom is i = 0, top is i = layerCount - 1)
    const scale = 1 - i * 0.15;
    const tierWidth = 110 * scale;
    const tierHeight = 24;
    const rx = tierWidth / 2;
    const ry = rx * 0.32; // perspective vertical stretch
    
    // Y center position for this tier's top face
    const cy = 150 - i * 26;
    
    tiers.push({
      width: tierWidth,
      height: tierHeight,
      rx,
      ry,
      cy,
      color: baseColor,
      index: i
    });
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 200 200" 
        style={{ overflow: "visible", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.5))" }}
      >
        <defs>
          {/* Base shadow */}
          <radialGradient id="floor-shadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          
          {/* Neon glow filter */}
          <filter id="neon-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Shadow under the bottom-most tier */}
        <ellipse cx="100" cy="162" rx="70" ry="20" fill="url(#floor-shadow)" />

        {/* Stacked Tiers */}
        {tiers.map((tier, idx) => {
          const sideColor = adjustColor(tier.color, -20);
          const topColor = adjustColor(tier.color, 12);
          const isTop = idx === tiers.length - 1;

          // Unique gradient ID for the side of this color
          const cleanHex = tier.color.replace("#", "");
          const gradId = `side-grad-${cleanHex}-${idx}`;

          return (
            <g key={idx} className="cake-tier">
              {/* Radial gradient for the side body to give 3D rounded appearance */}
              <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={adjustColor(sideColor, -30)} />
                  <stop offset="30%" stopColor={sideColor} />
                  <stop offset="70%" stopColor={sideColor} />
                  <stop offset="100%" stopColor={adjustColor(sideColor, -45)} />
                </linearGradient>
              </defs>

              {/* Cylinder Side Body */}
              <path
                d={`
                  M ${100 - tier.rx} ${tier.cy} 
                  v ${tier.height} 
                  A ${tier.rx} ${tier.ry} 0 0 0 ${100 + tier.rx} ${tier.cy + tier.height} 
                  v ${-tier.height} 
                  Z
                `}
                fill={`url(#${gradId})`}
              />

              {/* Cylinder Top Face */}
              <ellipse 
                cx="100" 
                cy={tier.cy} 
                rx={tier.rx} 
                ry={tier.ry} 
                fill={topColor} 
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="0.5"
              />

              {/* Interactive Neon Glowing Ring (dotted futuristic line on edge) */}
              <ellipse 
                cx="100" 
                cy={tier.cy} 
                rx={tier.rx} 
                ry={tier.ry} 
                fill="none" 
                stroke={neonColor} 
                strokeWidth="1.2" 
                strokeDasharray="4 6"
                filter="url(#neon-glow-filter)"
                opacity="0.85"
              />

              {/* Drip Frosting effect overlay on upper tiers */}
              {idx > 0 && (
                <path
                  d={`
                    M ${100 - tier.rx} ${tier.cy}
                    q ${tier.rx * 0.25} ${tier.ry * 0.7} ${tier.rx * 0.5} ${tier.ry * 0.3}
                    t ${tier.rx * 0.5} ${tier.ry * 0.5}
                    t ${tier.rx * 0.5} ${-tier.ry * 0.4}
                    t ${tier.rx * 0.5} ${tier.ry * 0.6}
                    v ${tier.height * 0.45}
                    A ${tier.rx} ${tier.ry} 0 0 1 ${100 - tier.rx} ${tier.cy}
                    Z
                  `}
                  fill={adjustColor(topColor, 20)}
                  opacity="0.25"
                />
              )}

              {/* Toppings for the top tier */}
              {isTop && (
                <g className="cake-toppings">
                  {/* Neon sprinkles scattered on top */}
                  <circle cx="100" cy={tier.cy - 4} r="2.5" fill="#ff007f" />
                  <circle cx="88" cy={tier.cy - 1} r="2" fill="#00f0ff" />
                  <circle cx="112" cy={tier.cy - 2} r="2.2" fill="#ffff00" />
                  <circle cx="94" cy={tier.cy + 3} r="1.8" fill="#9b5cff" />
                  <circle cx="106" cy={tier.cy + 2} r="2" fill="#ffffff" />

                  {/* Cherry on top */}
                  <circle 
                    cx="100" 
                    cy={tier.cy - 10} 
                    r="5.5" 
                    fill="#ff2e88" 
                    filter="url(#neon-glow-filter)"
                    style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }} 
                  />
                  {/* Cherry stem */}
                  <path 
                    d={`M 100 ${tier.cy - 15} Q 104 ${tier.cy - 24} 110 ${tier.cy - 23}`} 
                    stroke="#7db36a" 
                    strokeWidth="1.2" 
                    fill="none" 
                  />
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
