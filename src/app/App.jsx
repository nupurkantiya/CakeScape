import { Routes, Route } from "react-router-dom"
import LandingExperience from "../components/landing/LandingExperience"
import Shop from "../pages/Shop"
import ProductDetails from "../pages/ProductDetails"
import Cart from "../pages/Cart"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingExperience />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/product/:id" element={<ProductDetails />} />
      <Route path="/cart" element={<Cart />} />
    </Routes>
  )
}
