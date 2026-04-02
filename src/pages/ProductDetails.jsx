import { useParams, Link } from "react-router-dom"
import { getProductById } from "../data/products"

function ProductDetails() {
  // Get product ID from URL params
  const { id } = useParams()
  const product = getProductById(id)

  // Handle product not found
  if (!product) {
    return (
      <div className="product-details-page">
        <div className="product-not-found">
          <h1>Product Not Found</h1>
          <p>The cake you're looking for doesn't exist.</p>
          <Link to="/shop" className="back-btn">Back to Shop</Link>
        </div>
      </div>
    )
  }

  const { name, description, price, category, flavors, layers, bestseller } = product

  return (
    <div className="product-details-page">
      <Link to="/shop" className="back-link">← Back to Shop</Link>
      
      <div className="product-details-container">
        {/* Product Image */}
        <div className="product-details-image">
          <div className="product-image-placeholder large" />
          {bestseller && <span className="product-badge">Bestseller</span>}
        </div>

        {/* Product Info */}
        <div className="product-details-info">
          <span className="product-category">{category}</span>
          <h1 className="product-details-name">{name}</h1>
          <p className="product-details-description">{description}</p>

          {/* Product specs */}
          <div className="product-specs">
            <div className="spec-item">
              <span className="spec-label">Layers</span>
              <span className="spec-value">{layers}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Flavors</span>
              <span className="spec-value">{flavors.join(", ")}</span>
            </div>
          </div>

          {/* Price and Add to Cart */}
          <div className="product-details-footer">
            <span className="product-details-price">${price.toFixed(2)}</span>
            <button className="add-to-cart-btn">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetails
