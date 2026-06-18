import React, { createContext, useContext, useReducer, useRef } from 'react';

let nextId = 4;

// Stable offscreen canvas — created once, shared across components
const decorCanvas = document.createElement('canvas');
decorCanvas.width = 512;
decorCanvas.height = 512;

const initialState = {
  // frosting is now per-layer: each layer carries its own frosting style
  layers: [
    { id: 1, flavor: 'chocolate',  size: 2.0, frosting: 'none', customColor: null },
    { id: 2, flavor: 'vanilla',    size: 1.6, frosting: 'none', customColor: null },
    { id: 3, flavor: 'strawberry', size: 1.2, frosting: 'none', customColor: null },
  ],
  toppings: [],
  customization: {
    activeTab: 'text', // 'text' | 'doodle' | 'photo'
    // Text
    text: '',
    textColor: '#ffffff',
    textFont: 'cursive',
    textSize: 44,
    textOffsetX: 0,
    textOffsetY: 0,
    // Doodle
    doodleMode: 'draw',       // 'draw' | 'upload'
    uploadedDrawingUrl: null,
    revision: 0,
    brushColor: '#ff2e88',
    brushSize: 10,
    // Photo
    photoUrl: null,
    photoScale: 1.0,
    photoOffsetX: 0,
    photoOffsetY: 0,
    photoShape: 'circle',     // 'circle' | 'square'
    photoBorder: true,
    photoBorderColor: '#fff5e1',
  },
};

function builderReducer(state, action) {
  switch (action.type) {

    case 'ADD_LAYER': {
      if (state.layers.length >= 5) return state;
      const topSize = state.layers[state.layers.length - 1]?.size ?? 2.0;
      const newSize = Math.max(0.6, +(topSize - 0.4).toFixed(2));
      return {
        ...state,
        layers: [...state.layers, { id: nextId++, flavor: 'chocolate', size: newSize, frosting: 'none', customColor: null }],
      };
    }

    case 'REMOVE_LAYER': {
      if (state.layers.length <= 1) return state;
      return { ...state, layers: state.layers.slice(0, -1) };
    }

    case 'UPDATE_LAYER_SIZE': {
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.payload.id ? { ...l, size: action.payload.size } : l
        ),
      };
    }

    case 'UPDATE_LAYER_FLAVOR': {
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.payload.id ? { ...l, flavor: action.payload.flavor, customColor: null } : l
        ),
      };
    }

    case 'UPDATE_LAYER_CUSTOM_COLOR': {
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.payload.id ? { ...l, customColor: action.payload.color } : l
        ),
      };
    }

    case 'UPDATE_LAYER_FROSTING': {
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.payload.id ? { ...l, frosting: action.payload.frosting } : l
        ),
      };
    }

    // Convenience: apply one frosting style to ALL layers at once
    case 'SET_FROSTING_ALL': {
      return {
        ...state,
        layers: state.layers.map((l) => ({ ...l, frosting: action.payload })),
      };
    }

    case 'ADD_TOPPING': {
      const id = action.payload;
      const existing = state.toppings.find((t) => t.id === id);
      return {
        ...state,
        toppings: existing
          ? state.toppings.map((t) => t.id === id ? { ...t, count: t.count + 1 } : t)
          : [...state.toppings, { id, count: 1 }],
      };
    }

    case 'REMOVE_TOPPING': {
      return {
        ...state,
        toppings: state.toppings.filter((t) => t.id !== action.payload),
      };
    }

    // ── Customization actions ──────────────────────────────────────
    case 'UPDATE_CUSTOMIZATION': {
      return {
        ...state,
        customization: { ...state.customization, ...action.payload },
      };
    }

    case 'INCREMENT_REVISION': {
      return {
        ...state,
        customization: { ...state.customization, revision: state.customization.revision + 1 },
      };
    }

    case 'CLEAR_DOODLE': {
      const ctx = decorCanvas.getContext('2d');
      ctx.clearRect(0, 0, decorCanvas.width, decorCanvas.height);
      return {
        ...state,
        customization: {
          ...state.customization,
          uploadedDrawingUrl: null,
          revision: state.customization.revision + 1,
        },
      };
    }

    case 'RESET_CUSTOMIZATION': {
      const ctx = decorCanvas.getContext('2d');
      ctx.clearRect(0, 0, decorCanvas.width, decorCanvas.height);
      return {
        ...state,
        customization: { ...initialState.customization },
      };
    }

    default:
      return state;
  }
}

const BuilderContext = createContext();

export function BuilderProvider({ children }) {
  const [state, dispatch] = useReducer(builderReducer, initialState);
  // Expose the stable canvas ref so components can draw on it without causing re-renders
  const decorCanvasRef = useRef(decorCanvas);

  return (
    <BuilderContext.Provider value={{ state, dispatch, decorCanvasRef }}>
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilder() {
  return useContext(BuilderContext);
}
