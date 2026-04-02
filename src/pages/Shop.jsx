import { useState } from "react"
import { getProductsByCategory } from "../data/products"
import ProductGrid from "../components/product/ProductGrid"
import ProductFilters from "../components/product/ProductFilters"

function Shop() {
  const [activeCategory, setActiveCategory] = useState("all")
  
  // Get filtered products based on selected category
  const products = getProductsByCategory(activeCategory)

  return (
    <div className="shop-page">
      <header className="shop-header">
        <h1 className="shop-title">Our Creations</h1>
        <p className="shop-subtitle">
          Discover our collection of handcrafted futuristic cakes
        </p>
      </header>

      <ProductFilters 
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <ProductGrid products={products} />
    </div>
  )
}

export default Shop
