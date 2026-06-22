import { Link, NavLink, useLocation } from "react-router-dom";
import { useScrollProgress } from "../../hooks/useScrollProgress";
import { useCart } from "../../context/CartContext";
import { useLocale } from "../../context/LocaleContext";

function Navbar() {
  const location = useLocation();
  const scrollProgress = useScrollProgress();
  const { totalItems } = useCart();
  const { 
    language, 
    setLanguage, 
    currency, 
    setCurrency, 
    theme, 
    toggleTheme, 
    t, 
    supportedLanguages, 
    supportedCurrencies 
  } = useLocale();

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
            {t("home")}
          </NavLink>
          <NavLink to="/shop" className={({ isActive }) => isActive ? "active" : ""}>
            {t("shop")}
          </NavLink>
          <NavLink to="/builder" className={({ isActive }) => isActive ? "active" : ""}>
            {t("buildCake")}
          </NavLink>
          <NavLink to="/creator-hub" className={({ isActive }) => isActive ? "active" : ""}>
            {t("creatorHub")}
          </NavLink>
          <NavLink to="/cart" className={({ isActive }) => `navbar-hud-cart ${isActive ? "active" : ""}`}>
            {t("cart")}
            {totalItems > 0 && (
              <span className="navbar-cart-badge animate-pulse">{totalItems}</span>
            )}
          </NavLink>
        </div>

        <div className="navbar-hud-controls">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="hud-select"
            title={t("language")}
          >
            {supportedLanguages.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>

          <button 
            className="hud-theme-toggle" 
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;