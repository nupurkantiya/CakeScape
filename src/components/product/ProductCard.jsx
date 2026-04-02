import { Link } from "react-router-dom"

/**
 * ProductCard - Displays a single product in the shop grid
 * 
 * @param {Object} product - Product data (id, name, price, image, etc.)
 */
function ProductCard({ product }) {
  const { id, name, description, price, image, category, bestseller } = product

  return (
    <article className="product-card">
      {/* Bestseller badge */}
      {bestseller && <span className="product-badge">Bestseller</span>}
      
      {/* Product image */}
      <div className="product-image">
        {/* Placeholder gradient until we have real images */}
        <div className="product-image-placeholder" />
      </div>

      {/* Product info */}
      <div className="product-info">
        <span className="product-category">{category}</span>
        <h3 className="product-name">{name}</h3>
        <p className="product-description">{description}</p>
        <div className="product-footer">
          <span className="product-price">${price.toFixed(2)}</span>
          <Link to={`/product/${id}`} className="product-btn">
            View Details
          </Link>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
