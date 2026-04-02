import { categories } from "../../data/products"

/**
 * ProductFilters - Filter buttons for product categories
 * 
 * @param {string} activeCategory - Currently selected category
 * @param {function} onCategoryChange - Callback when category changes
 */
function ProductFilters({ activeCategory, onCategoryChange }) {
  return (
    <div className="product-filters">
      {categories.map(category => (
        <button
          key={category.id}
          className={`filter-btn ${activeCategory === category.id ? "active" : ""}`}
          onClick={() => onCategoryChange(category.id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}

export default ProductFilters
