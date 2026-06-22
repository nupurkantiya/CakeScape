import { Link } from "react-router-dom"
import { useCart } from "../context/CartContext"
import CakeVisualPreview from "../components/ui/CakeVisualPreview"

// ================================
// CART PAGE COMPONENT
// ================================
// This page displays all items in the cart and allows users to:
// 1. See all items with images, names, prices
// 2. Adjust quantity with +/- buttons
// 3. Remove items completely
// 4. See total price
// 5. Clear entire cart

function Cart() {
  // -------- Consume the cart context --------
  // This is where we USE the context we created!
  // useCart() gives us access to state + actions
  const { 
    items,          // Array of { product, quantity }
    totalItems,     // Total count for display
    totalPrice,     // Sum of all item prices
    updateQuantity, // Function to change quantity
    removeItem,     // Function to remove item
    clearCart       // Function to empty cart
  } = useCart()

  // -------- Handle quantity changes --------
  // These are "handler functions" - they respond to user actions
  
  const handleIncrease = (productId, currentQuantity) => {
    updateQuantity(productId, currentQuantity + 1)
  }

  const handleDecrease = (productId, currentQuantity) => {
    // updateQuantity already handles removing if quantity <= 0
    updateQuantity(productId, currentQuantity - 1)
  }

  // -------- Empty cart state --------
  // Good UX: Always handle empty states!
  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any delicious cakes yet!</p>
          <Link to="/shop" className="cart-shop-link">
            Browse Our Cakes
          </Link>
        </div>
      </div>
    )
  }

  // -------- Cart with items --------
  return (
    <div className="cart-page">
      <h1 className="cart-title">Your Cart</h1>
      
      {/* -------- Cart Layout: Items + Summary -------- */}
      <div className="cart-layout">
        
        {/* -------- LEFT: Cart Items List -------- */}
        <div className="cart-items">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="cart-item">
              
              {/* Product Image */}
              <div className="cart-item-image">
                <CakeVisualPreview 
                  layers={product.spec?.layers || product.layers || 3} 
                  flavor={product.flavor || (product.flavors && product.flavors[0]) || "vanilla"} 
                  category={product.category || "signature"} 
                />
              </div>
              
              {/* Product Info */}
              <div className="cart-item-info">
                <Link to={`/product/${product.id}`} className="cart-item-name">
                  {product.name}
                </Link>
                <p className="cart-item-price">${product.price.toFixed(2)} each</p>
              </div>
              
              {/* Quantity Controls */}
              <div className="cart-item-quantity">
                <button 
                  className="quantity-btn"
                  onClick={() => handleDecrease(product.id, quantity)}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="quantity-value">{quantity}</span>
                <button 
                  className="quantity-btn"
                  onClick={() => handleIncrease(product.id, quantity)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              
              {/* Item Subtotal */}
              <div className="cart-item-subtotal">
                ${(product.price * quantity).toFixed(2)}
              </div>
              
              {/* Remove Button */}
              <button 
                className="cart-item-remove"
                onClick={() => removeItem(product.id)}
                aria-label={`Remove ${product.name} from cart`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        
        {/* -------- RIGHT: Cart Summary -------- */}
        <div className="cart-summary">
          <h2 className="cart-summary-title">Order Summary</h2>
          
          <div className="cart-summary-row">
            <span>Items ({totalItems})</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          
          <div className="cart-summary-row">
            <span>Shipping</span>
            <span className="cart-free">FREE</span>
          </div>
          
          <div className="cart-summary-divider"></div>
          
          <div className="cart-summary-row cart-summary-total">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          
          {/* Checkout Button (placeholder for now) */}
          <button className="cart-checkout-btn">
            Proceed to Checkout
          </button>
          
          {/* Clear Cart */}
          <button className="cart-clear-btn" onClick={clearCart}>
            Clear Cart
          </button>
          
          {/* Continue Shopping */}
          <Link to="/shop" className="cart-continue">
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Cart
