import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { getProductById } from "../data/products"
import { useCart } from "../context/CartContext"
import { useLocale } from "../context/LocaleContext"
import CakeVisualPreview from "../components/ui/CakeVisualPreview"

function ProductDetails() {
  // Get product ID from URL params
  const { id } = useParams()
  const product = getProductById(id)
  const { formatPrice, t } = useLocale()
  
  // Get addItem function from cart context
  const { addItem } = useCart()
  
  // State for "Added!" feedback
  const [added, setAdded] = useState(false)

  // Handle product not found
  if (!product) {
    return (
      <div className="product-details-page">
        <div className="product-not-found">
          <h1>{t("productNotFound")}</h1>
          <p>{t("cakeNotExist")}</p>
          <Link to="/shop" className="back-btn">{t("backToShop")}</Link>
        </div>
      </div>
    )
  }

  const { name, description, price, category, flavors, layers, bestseller } = product
  
  // Handle add to cart click
  const handleAddToCart = () => {
    addItem(product)
    setAdded(true)
    
    // Reset "Added!" text after 2 seconds
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="product-details-page">
      <Link to="/shop" className="back-link">← {t("backToShop")}</Link>
      
      <div className="product-details-container">
        {/* Product Image */}
        <div className="product-details-image">
          <CakeVisualPreview 
            layers={layers} 
            flavor={flavors && flavors.length > 0 ? flavors[0] : "vanilla"} 
            category={category} 
          />
          {bestseller && <span className="product-badge">{t("bestseller")}</span>}
        </div>

        {/* Product Info */}
        <div className="product-details-info">
          <span className="product-category">{category}</span>
          <h1 className="product-details-name">{name}</h1>
          <p className="product-details-description">{description}</p>

          {/* Product specs */}
          <div className="product-specs">
            <div className="spec-item">
              <span className="spec-label">{t("layers")}</span>
              <span className="spec-value">{layers}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">{t("flavors")}</span>
              <span className="spec-value">{flavors.join(", ")}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Weight</span>
              <span className="spec-value">{product.weight ? `${product.weight} lbs` : `${layers * 2} lbs`}</span>
            </div>
          </div>

          {/* Price and Add to Cart */}
          <div className="product-details-footer">
            <span className="product-details-price">{formatPrice(price)}</span>
            <button 
              className={`add-to-cart-btn ${added ? "added" : ""}`}
              onClick={handleAddToCart}
            >
              {added ? t("added") : t("addToCart")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetails
