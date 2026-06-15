import React, { useState } from 'react';
import BuilderCanvas from '../components/builder/BuilderCanvas';
import { useBuilder } from '../context/BuilderContext';
import '../styles/builder.css';

/* ── Data ────────────────────────────────────────────────────── */
const FROSTINGS = [
  { id: 'none',        label: 'None',         color: 'transparent', border: '#444' },
  { id: 'buttercream', label: 'Buttercream',  color: '#fff8dc' },
  { id: 'chocolate',   label: 'Chocolate',    color: '#3d1c02' },
  { id: 'strawberry',  label: 'Strawberry',   color: '#ff85b3' },
  { id: 'cream_cheese',label: 'Cream Cheese', color: '#fff5e1' },
  { id: 'caramel',     label: 'Caramel',      color: '#c68642' },
];

const FLAVORS = [
  { id: 'chocolate',  label: 'Chocolate',  color: '#6b3421' },
  { id: 'vanilla',    label: 'Vanilla',    color: '#f0d9a0' },
  { id: 'strawberry', label: 'Strawberry', color: '#f4a0b0' },
  { id: 'red_velvet', label: 'Red Velvet', color: '#8b1a1a' },
  { id: 'lemon',      label: 'Lemon',      color: '#f5f570' },
  { id: 'blueberry',  label: 'Blueberry',  color: '#6a5acd' },
  { id: 'matcha',     label: 'Matcha',     color: '#7db36a' },
];

const SIZE_PRESETS = [
  { label: 'S',  value: 0.8 },
  { label: 'M',  value: 1.2 },
  { label: 'L',  value: 1.6 },
  { label: 'XL', value: 2.0 },
];


const TOPPING_CATEGORIES = [
  {
    id: 'fruits', label: 'Fruits', icon: '🍓',
    options: [
      { id: 'strawberry_t', label: 'Strawberry' },
      { id: 'kiwi',         label: 'Kiwi Slices' },
      { id: 'blueberry',    label: 'Blueberry' },
      { id: 'mango',        label: 'Mango' },
    ],
  },
  {
    id: 'chocolates', label: 'Choco', icon: '🍫',
    options: [
      { id: 'choco_chips', label: 'Choco Chips' },
      { id: 'white_choco', label: 'White Choc.' },
    ],
  },
  {
    id: 'dry_fruits', label: 'Dry Fruits', icon: '🥜',
    options: [
      { id: 'almonds',    label: 'Almonds' },
      { id: 'pistachios', label: 'Pistachios' },
    ],
  },
  {
    id: 'candies', label: 'Candies', icon: '🍬',
    options: [
      { id: 'sprinkles',    label: 'Sprinkles' },
      { id: 'marshmallows', label: 'Marshmallows' },
    ],
  },
];

/* ── Sub-components ─────────────────────────────────────────── */
function LayerCard({ layer, index, total, dispatch }) {
  const label = total - index; // top = 1, bottom = total
  const posLabel = index === 0 ? 'Top' : index === total - 1 ? 'Base' : `Layer ${label}`;

  return (
    <div className="layer-card">
      <div className="layer-card-header">
        <div className="layer-badge">{label}</div>
        <span className="layer-card-title">{posLabel}</span>
      </div>

      {/* Size presets */}
      <p className="section-label" style={{ marginTop: 0 }}>Size</p>
      <div className="size-presets">
        {SIZE_PRESETS.map((p) => (
          <button
            key={p.label}
            className={`size-preset-btn ${layer.size === p.value ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'UPDATE_LAYER_SIZE', payload: { id: layer.id, size: p.value } })}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Per-layer Frosting */}
      <p className="section-label">Frosting</p>
      <div className="layer-frosting-row">
        {FROSTINGS.map((f) => (
          <button
            key={f.id}
            className={`layer-frosting-btn ${layer.frosting === f.id ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'UPDATE_LAYER_FROSTING', payload: { id: layer.id, frosting: f.id } })}
          >
            <div
              className="layer-frosting-dot"
              style={{ backgroundColor: f.color, border: f.border ? `1px solid ${f.border}` : undefined }}
            />
            {f.label}
          </button>
        ))}
      </div>

      {/* Flavor swatches */}
      <p className="section-label">Flavor</p>
      <div className="flavor-swatches">
        {FLAVORS.map((f) => (
          <div
            key={f.id}
            className={`flavor-swatch ${layer.flavor === f.id ? 'active' : ''}`}
            style={{ backgroundColor: f.color }}
            onClick={() => dispatch({ type: 'UPDATE_LAYER_FLAVOR', payload: { id: layer.id, flavor: f.id } })}
            title={f.label}
          >
            <span className="flavor-swatch-tooltip">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Builder Page ───────────────────────────────────────── */
function Builder() {
  const { state, dispatch } = useBuilder();
  const [activeTab, setActiveTab]   = useState('layers');
  const [activeCat, setActiveCat]   = useState('fruits');

  const TABS = [
    { id: 'layers',   label: 'Layers',   icon: '🎂' },
    { id: 'frosting', label: 'Apply All', icon: '🍦' },
    { id: 'toppings', label: 'Toppings', icon: '🍒' },
  ];

  // Render layers top-to-bottom (last in array = top layer)
  const layersTopDown = [...state.layers].reverse();
  const activeCatData = TOPPING_CATEGORIES.find((c) => c.id === activeCat);
  const allToppingOptions = TOPPING_CATEGORIES.flatMap((c) => c.options);

  return (
    <div className="builder-page">
      <BuilderCanvas />

      <div className="builder-ui-panel">
        {/* Brand */}
        <div className="builder-brand">
          <h1>CAKE BUILDER</h1>
          <p>Design your perfect dessert</p>
        </div>

        {/* Tab bar */}
        <div className="builder-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`builder-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── LAYERS TAB ── */}
        {activeTab === 'layers' && (
          <div className="tab-content">
            <div className="layer-actions">
              <button
                className="layer-action-btn add"
                onClick={() => dispatch({ type: 'ADD_LAYER' })}
                disabled={state.layers.length >= 5}
              >
                + Add Layer
              </button>
              <button
                className="layer-action-btn remove"
                onClick={() => dispatch({ type: 'REMOVE_LAYER' })}
                disabled={state.layers.length <= 1}
              >
                − Remove
              </button>
            </div>

            {layersTopDown.map((layer, idx) => (
              <LayerCard
                key={layer.id}
                layer={layer}
                index={idx}
                total={layersTopDown.length}
                dispatch={dispatch}
              />
            ))}
          </div>
        )}

        {/* ── FROSTING TAB (Apply to all layers) ── */}
        {activeTab === 'frosting' && (
          <div className="tab-content">
            <p className="section-label">Apply one frosting to ALL layers at once</p>
            <div className="frosting-grid">
              {FROSTINGS.map((f) => (
                <button
                  key={f.id}
                  className="frosting-card"
                  onClick={() => dispatch({ type: 'SET_FROSTING_ALL', payload: f.id })}
                >
                  <div
                    className="frosting-swatch"
                    style={{
                      backgroundColor: f.color,
                      border: f.border ? `1px solid ${f.border}` : undefined,
                    }}
                  />
                  <span className="frosting-label">{f.label}</span>
                </button>
              ))}
            </div>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '12px', lineHeight: 1.5 }}>
              💡 To set frosting per layer, open the <strong style={{color:'rgba(255,255,255,0.5)'}}>Layers</strong> tab and expand each layer card.
            </p>
          </div>
        )}

        {/* ── TOPPINGS TAB ── */}
        {activeTab === 'toppings' && (
          <div className="tab-content">
            {/* Category pills */}
            <div className="topping-category-tabs">
              {TOPPING_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`topping-cat-btn ${activeCat === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCat(cat.id)}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Options for active category */}
            {activeCatData && (
              <div className="topping-options">
                {activeCatData.options.map((opt) => (
                  <button
                    key={opt.id}
                    className={`topping-option-btn ${state.toppings.includes(opt.id) ? 'active' : ''}`}
                    onClick={() => dispatch({ type: 'TOGGLE_TOPPING', payload: opt.id })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Active toppings summary */}
            <div className="active-toppings-summary">
              <div className="active-toppings-summary-label">Selected Toppings</div>
              {state.toppings.length === 0 ? (
                <span className="no-toppings-text">None selected</span>
              ) : (
                <div className="active-toppings-list">
                  {state.toppings.map((id) => {
                    const opt = allToppingOptions.find((o) => o.id === id);
                    return opt ? (
                      <span key={id} className="active-topping-chip">{opt.label}</span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Builder;