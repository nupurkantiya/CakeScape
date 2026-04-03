import { createContext, useContext, useReducer, useEffect } from "react"

// ================================
// 1. CREATE THE CONTEXT
// ================================
// Context is like a "global container" that any component can access
const CartContext = createContext()

// ================================
// 2. DEFINE INITIAL STATE
// ================================
// This is what the cart looks like when empty
const initialState = {
  items: [],      // Array of cart items: { product, quantity }
  totalItems: 0,  // Total number of items (for navbar badge)
  totalPrice: 0,  // Total cost (for checkout)
}

// ================================
// 3. DEFINE THE REDUCER
// ================================
// A reducer is a function that takes current state + action,
// and returns NEW state (never mutate the old state!)
//
// Think of it like a state machine:
// Current State + Action = New State

function cartReducer(state, action) {
  switch (action.type) {
    
    // -------- ADD ITEM --------
    case "ADD_ITEM": {
      const product = action.payload
      
      // Check if item already exists in cart
      const existingIndex = state.items.findIndex(
        item => item.product.id === product.id
      )
      
      let newItems
      
      if (existingIndex >= 0) {
        // Item exists → increase quantity
        newItems = state.items.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        // Item doesn't exist → add new item with quantity 1
        newItems = [...state.items, { product, quantity: 1 }]
      }
      
      // Calculate new totals
      return {
        ...state,
        items: newItems,
        totalItems: calculateTotalItems(newItems),
        totalPrice: calculateTotalPrice(newItems),
      }
    }
    
    // -------- REMOVE ITEM --------
    case "REMOVE_ITEM": {
      const productId = action.payload
      
      // Filter out the item with matching ID
      const newItems = state.items.filter(
        item => item.product.id !== productId
      )
      
      return {
        ...state,
        items: newItems,
        totalItems: calculateTotalItems(newItems),
        totalPrice: calculateTotalPrice(newItems),
      }
    }
    
    // -------- UPDATE QUANTITY --------
    case "UPDATE_QUANTITY": {
      const { productId, quantity } = action.payload
      
      // If quantity is 0 or less, remove the item
      if (quantity <= 0) {
        const newItems = state.items.filter(
          item => item.product.id !== productId
        )
        return {
          ...state,
          items: newItems,
          totalItems: calculateTotalItems(newItems),
          totalPrice: calculateTotalPrice(newItems),
        }
      }
      
      // Update the quantity for the matching item
      const newItems = state.items.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
      
      return {
        ...state,
        items: newItems,
        totalItems: calculateTotalItems(newItems),
        totalPrice: calculateTotalPrice(newItems),
      }
    }
    
    // -------- CLEAR CART --------
    case "CLEAR_CART": {
      return initialState
    }
    
    // -------- LOAD CART (from localStorage) --------
    case "LOAD_CART": {
      return action.payload
    }
    
    // -------- DEFAULT --------
    default:
      return state
  }
}

// ================================
// 4. HELPER FUNCTIONS
// ================================

// Calculate total number of items in cart
function calculateTotalItems(items) {
  return items.reduce((total, item) => total + item.quantity, 0)
}

// Calculate total price of all items
function calculateTotalPrice(items) {
  return items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  )
}

// ================================
// 5. CREATE THE PROVIDER COMPONENT
// ================================
// This wraps our app and makes cart available everywhere

export function CartProvider({ children }) {
  // useReducer returns [state, dispatch]
  // - state: current cart state
  // - dispatch: function to send actions to the reducer
  const [state, dispatch] = useReducer(cartReducer, initialState)
  
  // -------- Load cart from localStorage on mount --------
  useEffect(() => {
    const savedCart = localStorage.getItem("cakescape-cart")
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        dispatch({ type: "LOAD_CART", payload: parsedCart })
      } catch (error) {
        console.error("Error loading cart from localStorage:", error)
      }
    }
  }, [])
  
  // -------- Save cart to localStorage whenever it changes --------
  useEffect(() => {
    localStorage.setItem("cakescape-cart", JSON.stringify(state))
  }, [state])
  
  // -------- Action functions (easier than calling dispatch directly) --------
  
  const addItem = (product) => {
    dispatch({ type: "ADD_ITEM", payload: product })
  }
  
  const removeItem = (productId) => {
    dispatch({ type: "REMOVE_ITEM", payload: productId })
  }
  
  const updateQuantity = (productId, quantity) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { productId, quantity } })
  }
  
  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" })
  }
  
  // -------- Value provided to all children --------
  const value = {
    // State
    items: state.items,
    totalItems: state.totalItems,
    totalPrice: state.totalPrice,
    
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  }
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

// ================================
// 6. CUSTOM HOOK TO USE CART
// ================================
// This makes it easy to use cart in any component:
// const { items, addItem } = useCart()

export function useCart() {
  const context = useContext(CartContext)
  
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  
  return context
}


