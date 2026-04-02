import ProductCard from "./ProductCard"

/**
 * ProductGrid - Displays a grid of product cards
 * 
 * @param {Array} products - Array of product objects
 */
function ProductGrid({ products }) {
  if (products.length === 0) {
    return (
      <div className="product-grid-empty">
        <p>No products found.</p>
      </div>
    )
  }

  return (
    <div className="product-grid">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export default ProductGrid
