import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useBuilder } from '../../context/BuilderContext';

/* ── Constants ───*/
const FONTS = [
  { id: 'cursive', label: 'Playful', preview: 'Aa' },
  { id: 'Georgia, serif', label: 'Elegant', preview: 'Aa' },
  { id: 'Arial, sans-serif', label: 'Modern', preview: 'Aa' },
  { id: '"Courier New", monospace', label: 'Retro', preview: 'Aa' },
];
const TEXT_COLOR_PRESETS = ['#ffffff', '#fff8dc', '#ff85b3', '#ff2e88', '#00f0ff', '#9b5cff', '#ffb347', '#c8e6c9'];
const BRUSH_COLOR_PRESETS = ['#ff2e88', '#00f0ff', '#9b5cff', '#ffb347', '#ffffff', '#ff4d4d', '#7db36a', '#c68642'];
const BORDER_COLOR_PRESETS = ['#fff5e1', '#ffffff', '#ff85b3', '#ffb347', '#00f0ff', '#c8a97a', '#9b5cff', '#ff4d4d'];
const SIZE_TO_FRAME = { 0.8: 136, 1.2: 168, 1.6: 200, 2.0: 228 };
const SIZE_LABELS = { 0.8: 'S', 1.2: 'M', 1.6: 'L', 2.0: 'XL' };

/* ── Colour Swatch Strip ──*/
function ColorStrip({ colors, value, onChange }) {
  return (
    <div className="dc-color-strip">
      {colors.map((c) => (
        <button
          key={c}
          className={`dc-color-dot ${value === c ? 'active' : ''}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
          title={c}
        />
      ))}
      <label className="dc-color-dot dc-color-custom" title="Custom colour">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }}
        />
        <span>+</span>
      </label>
    </div>
  );
}

/* ── Slider Row ─────*/
function SliderRow({ label, value, min, max, step = 1, onChange }) {
  return (
    <div className="dc-slider-row">
      <div className="dc-slider-label">
        <span>{label}</span>
        <span className="dc-slider-val">{value}</span>
      </div>
      <input
        type="range" className="dc-slider"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/* ── Text Tab ───── */
function TextTab({ customization, dispatch }) {
  const { text, textColor, textFont, textSize, textOffsetX, textOffsetY } = customization;
  const set = (payload) => dispatch({ type: 'UPDATE_CUSTOMIZATION', payload });

  return (
    <div className="dc-tab-body">
      <p className="dc-section-label">Your Message</p>
      <textarea
        className="dc-textarea"
        placeholder="Happy Birthday, Tia ✨"
        value={text}
        maxLength={80}
        rows={3}
        onChange={(e) => set({ text: e.target.value })}
      />
      <div className="dc-char-count">{text.length}/80</div>

      <p className="dc-section-label">Font Style</p>
      <div className="dc-font-grid">
        {FONTS.map((f) => (
          <button
            key={f.id}
            className={`dc-font-btn ${textFont === f.id ? 'active' : ''}`}
            style={{ fontFamily: f.id }}
            onClick={() => set({ textFont: f.id })}
          >
            <span className="dc-font-preview">{f.preview}</span>
            <span className="dc-font-label">{f.label}</span>
          </button>
        ))}
      </div>

      <p className="dc-section-label">Cream Colour</p>
      <ColorStrip colors={TEXT_COLOR_PRESETS} value={textColor} onChange={(c) => set({ textColor: c })} />

      <SliderRow label="Text Size" value={textSize} min={20} max={80} onChange={(v) => set({ textSize: v })} />

      <p className="dc-section-label">Position</p>
      <SliderRow label="Horizontal" value={textOffsetX} min={-180} max={180} onChange={(v) => set({ textOffsetX: v })} />
      <SliderRow label="Vertical" value={textOffsetY} min={-180} max={180} onChange={(v) => set({ textOffsetY: v })} />

      {text && (
        <button className="dc-clear-btn" onClick={() => set({ text: '' })}>Clear Text</button>
      )}
    </div>
  );
}

/* ── Doodle Tab ─────────────────────────────────────────────────── */
function DoodleTab({ customization, dispatch, decorCanvasRef }) {
  const { doodleMode, uploadedDrawingUrl, brushColor, brushSize } = customization;
  const padRef = useRef(null);
  const isDrawing = useRef(false);
  const set = (payload) => dispatch({ type: 'UPDATE_CUSTOMIZATION', payload });

  // Mount the shared canvas into the pad (draw mode only)
  useEffect(() => {
    if (doodleMode !== 'draw') return;
    if (!padRef.current || !decorCanvasRef.current) return;
    const c = decorCanvasRef.current;
    c.style.width = '100%';
    c.style.height = '100%';
    c.style.borderRadius = '50%';
    padRef.current.appendChild(c);
    return () => { if (padRef.current?.contains(c)) padRef.current.removeChild(c); };
  }, [doodleMode, decorCanvasRef]);

  const getPos = (e, rect) => {
    const client = e.touches ? e.touches[0] : e;
    return {
      x: ((client.clientX - rect.left) / rect.width) * 512,
      y: ((client.clientY - rect.top) / rect.height) * 512,
    };
  };

  const startDraw = useCallback((e) => {
    if (doodleMode !== 'draw') return;
    isDrawing.current = true;
    const rect = padRef.current.getBoundingClientRect();
    const { x, y } = getPos(e, rect);
    const ctx = decorCanvasRef.current.getContext('2d');
    ctx.beginPath(); ctx.moveTo(x, y);
  }, [doodleMode, decorCanvasRef]);

  const draw = useCallback((e) => {
    if (!isDrawing.current || doodleMode !== 'draw') return;
    e.preventDefault();
    const rect = padRef.current.getBoundingClientRect();
    const { x, y } = getPos(e, rect);
    const ctx = decorCanvasRef.current.getContext('2d');
    ctx.lineWidth = brushSize; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = brushColor;
    ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y);
  }, [doodleMode, brushColor, brushSize, decorCanvasRef]);

  const stopDraw = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    dispatch({ type: 'INCREMENT_REVISION' });
  }, [dispatch]);

  // Upload: just store the URL — BuilderCanvas handles tinting with current brushColor
  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      set({ uploadedDrawingUrl: ev.target.result, doodleMode: 'upload' });
      dispatch({ type: 'INCREMENT_REVISION' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="dc-tab-body">
      <div className="dc-mode-toggle">
        <button className={`dc-mode-btn ${doodleMode === 'draw' ? 'active' : ''}`} onClick={() => set({ doodleMode: 'draw' })}>🖌️ Hand Draw</button>
        <button className={`dc-mode-btn ${doodleMode === 'upload' ? 'active' : ''}`} onClick={() => set({ doodleMode: 'upload' })}>📤 Upload Outline</button>
      </div>

      {doodleMode === 'upload' && (
        <label className="dc-upload-zone">
          <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
          {uploadedDrawingUrl
            ? <><img src={uploadedDrawingUrl} alt="preview" className="dc-upload-preview" /><span>Tap to replace</span></>
            : <><div className="dc-upload-icon">🎨</div><span>Upload drawing outline</span><span className="dc-upload-hint">PNG with transparent bg works best</span></>
          }
        </label>
      )}

      {doodleMode === 'draw' && (
        <div
          ref={padRef}
          className="dc-doodle-pad"
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
        />
      )}

      <p className="dc-section-label">Cream Colour</p>
      <ColorStrip colors={BRUSH_COLOR_PRESETS} value={brushColor} onChange={(c) => set({ brushColor: c })} />

      {doodleMode === 'draw' && (
        <SliderRow label="Brush Size" value={brushSize} min={4} max={36} onChange={(v) => set({ brushSize: v })} />
      )}
      {doodleMode === 'upload' && uploadedDrawingUrl && (
        <p className="dc-upload-hint" style={{ marginTop: 8, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
          Pick a colour above to repaint the outline instantly.
        </p>
      )}
      <button className="dc-clear-btn" onClick={() => dispatch({ type: 'CLEAR_DOODLE' })}>Clear Drawing</button>
    </div>
  );
}

/* ── Photo Tab ──────────────────────────────────────────────────── */
function PhotoTab({ customization, dispatch, topLayerSize }) {
  const { photoUrl, photoScale, photoOffsetX, photoOffsetY, photoShape, photoBorder, photoBorderColor } = customization;
  const set = (payload) => dispatch({ type: 'UPDATE_CUSTOMIZATION', payload });

  // Drag state (local — updates context on every move for live 3D preview)
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef(null);
  const offsetAtDragStart = useRef({ x: 0, y: 0 });

  const frameSize = SIZE_TO_FRAME[topLayerSize] ?? 168;
  const sizeLabel = SIZE_LABELS[topLayerSize] ?? 'M';

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set({ photoUrl: ev.target.result, photoOffsetX: 0, photoOffsetY: 0, photoScale: 1.0 });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onMouseDown = (e) => {
    if (!photoUrl) return;
    setDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    offsetAtDragStart.current = { x: photoOffsetX, y: photoOffsetY };
    e.preventDefault();
  };
  const onMouseMove = (e) => {
    if (!dragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const canvasScale = 512 / frameSize;  // frame px → canvas px
    set({
      photoOffsetX: Math.round(offsetAtDragStart.current.x + dx * canvasScale),
      photoOffsetY: Math.round(offsetAtDragStart.current.y + dy * canvasScale),
    });
  };
  const onMouseUp = () => setDragging(false);

  // Map canvas-space offsets back to frame-space for the CSS preview
  const s2f = frameSize / 512;
  const previewOX = photoOffsetX * s2f;
  const previewOY = photoOffsetY * s2f;
  const previewSize = frameSize * photoScale;

  return (
    <div className="dc-tab-body">
      {/* Upload */}
      {!photoUrl ? (
        <label className="dc-upload-zone">
          <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
          <div className="dc-upload-icon">🖼️</div>
          <span>Upload your photo</span>
          <span className="dc-upload-hint">Edible print on top of your cake</span>
        </label>
      ) : (
        <label className="dc-upload-zone dc-upload-zone--compact">
          <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
          <span>📷 Replace photo</span>
        </label>
      )}

      {photoUrl && (
        <>
          {/* Drag-to-fit crop frame */}
          <p className="dc-section-label">
            Fit to Frame <span className="dc-frame-size-badge">{sizeLabel}</span>
          </p>
          <p className="dc-crop-hint">Drag to reposition · Zoom to fit</p>

          <div
            className={`dc-crop-frame ${photoShape === 'circle' ? 'is-circle' : 'is-square'} ${dragging ? 'is-dragging' : ''}`}
            style={{ width: frameSize, height: frameSize }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <img
              src={photoUrl}
              className="dc-crop-img"
              style={{
                width: previewSize,
                height: previewSize,
                transform: `translate(calc(-50% + ${previewOX}px), calc(-50% + ${previewOY}px))`,
                objectFit: 'cover',
              }}
              draggable={false}
              alt="crop preview"
            />
          </div>

          <SliderRow label="Zoom" value={photoScale} min={0.5} max={3} step={0.05} onChange={(v) => set({ photoScale: v })} />

          <p className="dc-section-label">Photo Shape</p>
          <div className="dc-shape-toggle">
            <button className={`dc-shape-btn ${photoShape === 'circle' ? 'active' : ''}`} onClick={() => set({ photoShape: 'circle' })}>
              <span className="dc-shape-icon circle-icon" />Circle
            </button>
            <button className={`dc-shape-btn ${photoShape === 'square' ? 'active' : ''}`} onClick={() => set({ photoShape: 'square' })}>
              <span className="dc-shape-icon square-icon" />Square
            </button>
          </div>

          <p className="dc-section-label">Piped Border</p>
          <div className="dc-border-row">
            <button className={`dc-border-toggle ${photoBorder ? 'active' : ''}`} onClick={() => set({ photoBorder: !photoBorder })}>
              {photoBorder ? 'Border On' : 'Border Off'}
            </button>
            {photoBorder && <ColorStrip colors={BORDER_COLOR_PRESETS} value={photoBorderColor} onChange={(c) => set({ photoBorderColor: c })} />}
          </div>

          <button className="dc-clear-btn" onClick={() => set({ photoUrl: null })}>Remove Photo</button>
        </>
      )}
    </div>
  );
}

/* ── Main Panel ─────────────────────────────────────────────────── */
const TABS = [
  { id: 'text', label: 'Write', icon: '✍️' },
  { id: 'doodle', label: 'Draw', icon: '🎨' },
  { id: 'photo', label: 'Photo', icon: '🖼️' },
];

export default function DecorationPanel() {
  const { state, dispatch, decorCanvasRef } = useBuilder();
  const { customization } = state;
  const { activeTab } = customization;

  const topLayerSize = state.layers[state.layers.length - 1]?.size ?? 1.2;
  const setTab = (id) => dispatch({ type: 'UPDATE_CUSTOMIZATION', payload: { activeTab: id } });

  return (
    <div className="decor-panel">
      <div className="decor-panel-inner">
        {/* Header */}
        <div className="decor-header">
          <div className="decor-header-icon">✨</div>
          <div>
            <h2 className="decor-title">ARTISTRY</h2>
            <p className="decor-subtitle">Personalise your cake</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="decor-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`decor-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="decor-tab-icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab body */}
        {activeTab === 'text' && <TextTab customization={customization} dispatch={dispatch} />}
        {activeTab === 'doodle' && <DoodleTab customization={customization} dispatch={dispatch} decorCanvasRef={decorCanvasRef} />}
        {activeTab === 'photo' && <PhotoTab customization={customization} dispatch={dispatch} topLayerSize={topLayerSize} />}

        {/* Footer */}
        <div className="decor-footer">
          <button className="decor-reset-btn" onClick={() => dispatch({ type: 'RESET_CUSTOMIZATION' })}>
            Reset All Decoration
          </button>
        </div>
      </div>
    </div>
  );
}
