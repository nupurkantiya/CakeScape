import { Routes, Route } from "react-router-dom";
import Layout from "../components/layout/Layout";

import Home from "../pages/Home";
import Shop from "../pages/Shop";
import Builder from "../pages/Builder";
import Cart from "../pages/Cart";
import Login from "../pages/Login";
import Admin from "../pages/Admin";
import ProductDetails from "../pages/ProductDetails";

const AppRoutes = () => {
  return (
    <Layout>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/builder" element={<Builder />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/product/:id" element={<ProductDetails />} />
    </Routes>
    </Layout>
  );
};

export default AppRoutes;