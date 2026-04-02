import { Routes, Route } from "react-router-dom"
import Hero from "../components/hero/Hero"
import Shop from "../pages/Shop"
import ProductDetails from "../pages/ProductDetails"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/product/:id" element={<ProductDetails />} />
    </Routes>
  )
}

// Temporary Home page component
function HomePage() {
  return (
    <>
      <Hero />
      {/* Spacer to enable scrolling (temporary) */}
      <div style={{ height: "100vh", background: "#0f0f14" }} />
    </>
  )
}
