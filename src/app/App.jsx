import { Routes, Route } from "react-router-dom"
import Layout from "../components/layout/Layout"
import LandingExperience from "../components/landing/LandingExperience"
import Shop from "../pages/Shop"
import ProductDetails from "../pages/ProductDetails"
import Cart from "../pages/Cart"
import Builder from "../pages/Builder"
import CreatorHub from "../pages/CreatorHub"

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingExperience />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/creator-hub" element={<CreatorHub />} />
      </Routes>
    </Layout>
  )
}
