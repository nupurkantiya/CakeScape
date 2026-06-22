import { Link } from "react-router-dom"
import { useCart } from "../context/CartContext"
import { useLocale } from "../context/LocaleContext"
import CakeVisualPreview from "../components/ui/CakeVisualPreview"

// ================================
// CART PAGE COMPONENT
// ================================

function Cart() {
  const { 
    items,          
    totalItems,     
    totalPrice,     
    updateQuantity, 
    removeItem,     
    clearCart       
  } = useCart()

  const { formatPrice, t } = useLocale()
  
  const handleIncrease = (productId, currentQuantity) => {
    updateQuantity(productId, currentQuantity + 1)
  }

  const handleDecrease = (productId, currentQuantity) => {
    updateQuantity(productId, currentQuantity - 1)
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <h2>{t("cartEmpty")}</h2>
          <p>{t("noCakesAdded")}</p>
          <Link to="/shop" className="cart-shop-link">
            {t("browseCakes")}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <h1 className="cart-title">{t("yourCart")}</h1>
      
      {/* -------- Cart Layout: Items + Summary -------- */}
      <div className="cart-layout">
        
        {/* -------- LEFT: Cart Items List -------- */}
        <div className="cart-items">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="cart-item">
              
              {/* Product Image */}
              <div className="cart-item-image">
                {product.customImage ? (
                  <img 
                    src={product.customImage} 
                    alt={product.name} 
                    className="cart-item-custom-image"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.03)"
                    }}
                  />
                ) : (
                  <CakeVisualPreview 
                    layers={product.spec?.layers || product.layers || 3} 
                    flavor={product.flavor || (product.flavors && product.flavors[0]) || "vanilla"} 
                    category={product.category || "signature"} 
                    spec={product.spec}
                  />
                )}
              </div>
              
              {/* Product Info */}
              <div className="cart-item-info">
                <Link to={`/product/${product.id}`} className="cart-item-name">
                  {product.name}
                </Link>
                <p className="cart-item-price">{formatPrice(product.price)} {t("each")}</p>
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
                {formatPrice(product.price * quantity)}
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
          <h2 className="cart-summary-title">{t("orderSummary")}</h2>
          
          <div className="cart-summary-row">
            <span>{t("items")} ({totalItems})</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          
          <div className="cart-summary-row">
            <span>{t("shipping")}</span>
            <span className="cart-free">{t("free")}</span>
          </div>
          
          <div className="cart-summary-divider"></div>
          
          <div className="cart-summary-row cart-summary-total">
            <span>{t("total")}</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          
          {/* Checkout Button */}
          <button className="cart-checkout-btn">
            {t("checkout")}
          </button>
          
          {/* Clear Cart */}
          <button className="cart-clear-btn" onClick={clearCart}>
            {t("clearCart")}
          </button>
          
          {/* Continue Shopping */}
          <Link to="/shop" className="cart-continue">
            ← {t("continueShopping")}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Cart
