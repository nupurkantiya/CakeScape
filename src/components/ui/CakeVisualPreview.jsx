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

const FROSTING_COLORS = {
  buttercream: "#fff8dc",
  chocolate: "#3d1c02",
  strawberry: "#ff85b3",
  cream_cheese: "#fff5e1",
  caramel: "#c68642",
};

export default function CakeVisualPreview({ layers = 3, flavor = "vanilla", category = "signature", spec = null }) {
  // Normalize layers count (can be a number or a spec array)
  const isCustomSpec = Array.isArray(layers) || (spec && Array.isArray(spec.layers));
  const layersSource = Array.isArray(layers) ? layers : (spec && Array.isArray(spec.layers)) ? spec.layers : null;
  const layerCount = isCustomSpec ? layersSource.length : Math.min(Math.max(Number(layers) || 2, 1), 4);
  
  // Normalize flavor to lookup color
  const normalizedFlavor = String(flavor || "vanilla").toLowerCase().replace("-", "_").replace(" ", "_");
  const baseColor = FLAVOR_COLORS[normalizedFlavor] || FLAVOR_COLORS.vanilla;
  
  // Normalize category to lookup neon accent color
  const normalizedCategory = String(category || "signature").toLowerCase();
  const neonColor = CATEGORY_COLORS[normalizedCategory] || CATEGORY_COLORS.signature;

  // Use a unique ID suffix to prevent collisions on defs IDs when multiple SVGs render on one page
  const idSuffix = React.useId().replace(/:/g, "");
  const shadowId = `floor-shadow-${idSuffix}`;
  const filterId = `neon-filter-${idSuffix}`;
  const clipId = `top-tier-clip-${idSuffix}`;

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

    let tierColor = baseColor;
    let frostingColor = null;

    if (isCustomSpec && layersSource) {
      const layerData = layersSource[i];
      if (layerData) {
        if (layerData.customColor) {
          tierColor = layerData.customColor;
        } else {
          const lFlavor = String(layerData.flavor || "vanilla").toLowerCase().replace("-", "_").replace(" ", "_");
          tierColor = FLAVOR_COLORS[lFlavor] || FLAVOR_COLORS.vanilla;
        }
        if (layerData.frosting && layerData.frosting !== "none") {
          frostingColor = FROSTING_COLORS[layerData.frosting] || "#ffffff";
        }
      }
    }
    
    tiers.push({
      width: tierWidth,
      height: tierHeight,
      rx,
      ry,
      cy,
      color: tierColor,
      frostingColor,
      index: i
    });
  }

  const topTier = tiers[tiers.length - 1];

  // Helper function to render toppings based on spec
  const renderSpecToppings = () => {
    const toppingsList = spec?.toppings || [];
    if (toppingsList.length === 0) return null;
    
    // Stable pseudo-random generator
    let seed = 98765;
    const nextRandom = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    const elements = [];
    toppingsList.forEach(({ id, count }) => {
      if (count <= 0) return;
      
      // Determine how many toppings to draw (scaled down for SVG preview)
      const drawCount = Math.min(count * 5, 25);
      
      for (let j = 0; j < drawCount; j++) {
        // Decide which tier to put this topping on.
        // 70% chance on the top-most tier, 30% on lower tiers' exposed rings.
        const putOnTop = nextRandom() > 0.3 || tiers.length <= 1;
        
        let targetTier = topTier;
        let rMin = 0;
        let rMax = 0.8;
        
        if (!putOnTop) {
          // pick a random lower tier
          const lowerIdx = Math.floor(nextRandom() * (tiers.length - 1));
          targetTier = tiers[lowerIdx];
          const nextTier = tiers[lowerIdx + 1];
          // place in the exposed outer ring
          rMin = nextTier.rx / targetTier.rx;
          rMax = 0.88;
        }

        const rFactor = rMin + nextRandom() * (rMax - rMin);
        const angle = nextRandom() * Math.PI * 2;
        const tx = 100 + Math.cos(angle) * targetTier.rx * rFactor;
        const ty = targetTier.cy + Math.sin(angle) * targetTier.ry * rFactor;
        const key = `top-${id}-${j}-${targetTier.index}`;

        if (id === "strawberry_t") {
          elements.push(
            <g key={key} transform={`translate(${tx}, ${ty}) scale(0.42)`}>
              <path d="M 0 -4 Q -4 -4 -3 2 Q 0 6 3 2 Q 4 -4 0 -4 Z" fill="#ff2d88" />
              <circle cx="-1" cy="0" r="0.3" fill="#ffeb3b" />
              <circle cx="1" cy="1" r="0.3" fill="#ffeb3b" />
              <circle cx="0" cy="-2" r="0.3" fill="#ffeb3b" />
              <path d="M -1 -4 Q 0 -5.5 1 -4 Z" fill="#7db36a" />
            </g>
          );
        } else if (id === "kiwi") {
          elements.push(
            <g key={key} transform={`translate(${tx}, ${ty}) scale(0.48)`}>
              <circle cx="0" cy="0" r="4" fill="#8bc34a" stroke="#7cb342" strokeWidth="0.5" />
              <circle cx="0" cy="0" r="1.3" fill="#f1f8e9" />
              <circle cx="-1.5" cy="0" r="0.3" fill="#212121" />
              <circle cx="1.5" cy="0" r="0.3" fill="#212121" />
              <circle cx="0" cy="-1.5" r="0.3" fill="#212121" />
              <circle cx="0" cy="1.5" r="0.3" fill="#212121" />
            </g>
          );
        } else if (id === "blueberry") {
          elements.push(
            <circle key={key} cx={tx} cy={ty} r="1.8" fill="#3f51b5" stroke="#303f9f" strokeWidth="0.3" />
          );
        } else if (id === "mango") {
          elements.push(
            <rect key={key} x={tx - 1.5} y={ty - 1.2} width="3" height="2.4" rx="0.3" fill="#ffa020" transform={`rotate(${nextRandom() * 360}, ${tx}, ${ty})`} />
          );
        } else if (id === "choco_chips") {
          elements.push(
            <path key={key} d={`M ${tx} ${ty - 1.5} L ${tx - 1.2} ${ty + 1} L ${tx + 1.2} ${ty + 1} Z`} fill="#2d1200" transform={`rotate(${nextRandom() * 360}, ${tx}, ${ty})`} />
          );
        } else if (id === "white_choco") {
          elements.push(
            <rect key={key} x={tx - 0.6} y={ty - 1.5} width="1.2" height="3" rx="0.6" fill="#fff8f0" transform={`rotate(${nextRandom() * 360}, ${tx}, ${ty})`} />
          );
        } else if (id === "almonds") {
          elements.push(
            <ellipse key={key} cx={tx} cy={ty} rx="2.5" ry="1.2" fill="#c8a97a" transform={`rotate(${nextRandom() * 360}, ${tx}, ${ty})`} />
          );
        } else if (id === "pistachios") {
          elements.push(
            <ellipse key={key} cx={tx} cy={ty} rx="2.2" ry="1.0" fill="#8fb870" transform={`rotate(${nextRandom() * 360}, ${tx}, ${ty})`} />
          );
        } else if (id === "sprinkles") {
          const colors = ["#ff007f", "#00f0ff", "#ffff00", "#9b5cff", "#ff5722", "#4caf50"];
          const col = colors[Math.floor(nextRandom() * colors.length)];
          elements.push(
            <line key={key} x1={tx - 1.5} y1={ty} x2={tx + 1.5} y2={ty} stroke={col} strokeWidth="0.8" strokeLinecap="round" transform={`rotate(${nextRandom() * 360}, ${tx}, ${ty})`} />
          );
        } else if (id === "marshmallows") {
          elements.push(
            <rect key={key} x={tx - 2} y={ty - 1.5} width="4" height="3" rx="0.5" fill="#fff0f5" stroke="#e1bee7" strokeWidth="0.3" transform={`rotate(${nextRandom() * 360}, ${tx}, ${ty})`} />
          );
        }
      }
    });

    return <g className="custom-toppings">{elements}</g>;
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 200 200" 
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Base shadow */}
          <radialGradient id={shadowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          
          {/* Neon glow filter */}
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Clip path for top tier photo overlay */}
          {topTier && (
            <clipPath id={clipId}>
              <ellipse cx="100" cy={topTier.cy} rx={topTier.rx * 0.9} ry={topTier.ry * 0.9} />
            </clipPath>
          )}
        </defs>

        {/* Shadow under the bottom-most tier */}
        <ellipse cx="100" cy="162" rx="70" ry="20" fill={`url(#${shadowId})`} />

        {/* Stacked Tiers */}
        {tiers.map((tier, idx) => {
          const sideColor = adjustColor(tier.color, -20);
          const topColor = tier.frostingColor 
            ? adjustColor(tier.frostingColor, 12) 
            : adjustColor(tier.color, 12);
          const isTop = idx === tiers.length - 1;

          // Unique gradient ID for the side of this color
          const cleanHex = tier.color.replace("#", "");
          const gradId = `side-grad-${cleanHex}-${idx}-${idSuffix}`;

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
                filter={`url(#${filterId})`}
                opacity="0.85"
              />

              {/* Frosting Drips (actual selected frosting color, or fallback highlight) */}
              {tier.frostingColor ? (
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
                  fill={adjustColor(tier.frostingColor, -10)}
                  opacity="0.95"
                />
              ) : (
                idx > 0 && (
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
                )
              )}

              {/* Photo Customization (placed flat on top tier face) */}
              {isTop && spec?.customization?.photoUrl && (
                <g className="cake-photo">
                  <image
                    href={spec.customization.photoUrl}
                    x={100 - tier.rx * 0.85}
                    y={tier.cy - tier.ry * 0.85}
                    width={tier.rx * 1.7}
                    height={tier.ry * 1.7}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#${clipId})`}
                  />
                  {spec.customization.photoBorder && (
                    <ellipse
                      cx="100"
                      cy={tier.cy}
                      rx={tier.rx * 0.85}
                      ry={tier.ry * 0.85}
                      fill="none"
                      stroke={spec.customization.photoBorderColor || "#fff5e1"}
                      strokeWidth="1.5"
                      strokeDasharray="2 3"
                    />
                  )}
                </g>
              )}

              {/* Text Customization (rendered flat using perspective skew) */}
              {isTop && spec?.customization?.text && (
                <text
                  x="100"
                  y={tier.cy + (spec.customization.textOffsetY || 0) / 10}
                  fill={spec.customization.textColor || "#ffffff"}
                  fontSize={Math.min(spec.customization.textSize ? spec.customization.textSize / 3.8 : 12, 16)}
                  fontFamily={spec.customization.textFont === "cursive" ? "cursive, sans-serif" : "inherit"}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`translate(${(spec.customization.textOffsetX || 0) / 10}, 0) scale(1, 0.38)`}
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
                >
                  {spec.customization.text}
                </text>
              )}

              {/* Default Toppings (only when NOT custom spec) */}
              {!spec && isTop && (
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
                    filter={`url(#${filterId})`}
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

        {/* Custom Spec Toppings (rendered on top of tiers) */}
        {renderSpecToppings()}
      </svg>
    </div>
  );
}
