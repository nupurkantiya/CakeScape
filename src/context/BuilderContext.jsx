import React, { createContext, useContext, useReducer } from 'react';

// 1. Initial State: What does a default cake look like?
const initialState = {
  layers: 3,
  flavor: 'chocolate', 
  frosting: 'none',    
  toppings: []         
};

// 2. Reducer Function: How do we change the cake?
function builderReducer(state, action) {
  switch (action.type) {
    case 'SET_LAYERS':
      // The payload will be the new number of layers (e.g., 2, 3, or 4)
      return { ...state, layers: action.payload };
    case 'SET_FLAVOR':
      return { ...state, flavor: action.payload };
    case 'SET_FROSTING':
      return { ...state, frosting: action.payload };
    default:
      return state;
  }
}

// 3. Create the Context
const BuilderContext = createContext();

// 4. Provider Component to wrap our app
export function BuilderProvider({ children }) {
  const [state, dispatch] = useReducer(builderReducer, initialState);
  return (
    <BuilderContext.Provider value={{ state, dispatch }}>
      {children}
    </BuilderContext.Provider>
  );
}

// 5. Custom Hook for easy access
export function useBuilder() {
  return useContext(BuilderContext);
}
