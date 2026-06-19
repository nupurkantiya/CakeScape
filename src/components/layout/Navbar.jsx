import { Link, NavLink, useLocation } from "react-router-dom";
import { useScrollProgress } from "../../hooks/useScrollProgress";
import { useCart } from "../../context/CartContext";

function Navbar() {
  const location = useLocation();
  const scrollProgress = useScrollProgress();
  const { totalItems } = useCart();

  const isHome = location.pathname === "/";
  // Fade in navbar after scrolling past the initial screen intro start (2%)
  const isVisible = !isHome || scrollProgress > 0.02;

  return (
    <nav className={`navbar-hud ${isVisible ? "is-visible" : "is-hidden"}`}>
      <div className="navbar-hud-content">
        <div className="navbar-hud-logo">
          <Link to="/">
            CakeScape<span className="logo-dot">.</span>
          </Link>
        </div>

        <div className="navbar-hud-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>
            Home
          </NavLink>
          <NavLink to="/shop" className={({ isActive }) => isActive ? "active" : ""}>
            Shop
          </NavLink>
          <NavLink to="/builder" className={({ isActive }) => isActive ? "active" : ""}>
            Build Cake
          </NavLink>
          <NavLink to="/creator-hub" className={({ isActive }) => isActive ? "active" : ""}>
            Creator Hub
          </NavLink>
          <NavLink to="/cart" className={({ isActive }) => `navbar-hud-cart ${isActive ? "active" : ""}`}>
            Cart
            {totalItems > 0 && (
              <span className="navbar-cart-badge animate-pulse">{totalItems}</span>
            )}
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;