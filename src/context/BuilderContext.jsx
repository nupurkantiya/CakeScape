import React, { createContext, useContext, useReducer } from 'react';

let nextId = 4;

const initialState = {
  // frosting is now per-layer: each layer carries its own frosting style
  layers: [
    { id: 1, flavor: 'chocolate',  size: 2.0, frosting: 'none' },
    { id: 2, flavor: 'vanilla',    size: 1.6, frosting: 'none' },
    { id: 3, flavor: 'strawberry', size: 1.2, frosting: 'none' },
  ],
  toppings: [],
};

function builderReducer(state, action) {
  switch (action.type) {

    case 'ADD_LAYER': {
      if (state.layers.length >= 5) return state;
      const topSize = state.layers[state.layers.length - 1]?.size ?? 2.0;
      const newSize = Math.max(0.6, +(topSize - 0.4).toFixed(2));
      return {
        ...state,
        layers: [...state.layers, { id: nextId++, flavor: 'chocolate', size: newSize, frosting: 'none' }],
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
          l.id === action.payload.id ? { ...l, flavor: action.payload.flavor } : l
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

    case 'TOGGLE_TOPPING': {
      const id = action.payload;
      const exists = state.toppings.includes(id);
      return {
        ...state,
        toppings: exists
          ? state.toppings.filter((t) => t !== id)
          : [...state.toppings, id],
      };
    }

    default:
      return state;
  }
}

const BuilderContext = createContext();

export function BuilderProvider({ children }) {
  const [state, dispatch] = useReducer(builderReducer, initialState);
  return (
    <BuilderContext.Provider value={{ state, dispatch }}>
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilder() {
  return useContext(BuilderContext);
}
