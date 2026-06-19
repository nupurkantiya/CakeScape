import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer-hud">
      <div className="footer-hud-content">
        <div className="footer-hud-brand">
          <h3 className="footer-brand-title">CakeScape<span className="logo-dot">.</span></h3>
          <p className="footer-brand-desc">
            The world's first cybernetic dessert lab. Blending molecular gastronomy with 3D print engineering to design your sweet future.
          </p>
          <div className="footer-status-indicator">
            <span className="status-light-green"></span>
            <span className="status-text">Baking Engines Online</span>
          </div>
        </div>

        <div className="footer-hud-links">
          <h4 className="footer-section-title">Navigation</h4>
          <ul className="footer-links-list">
            <li><Link to="/shop">Creations Shop</Link></li>
            <li><Link to="/builder">3D Cake Builder</Link></li>
            <li><Link to="/creator-hub">Creator Hub</Link></li>
            <li><Link to="/cart">My Cart</Link></li>
          </ul>
        </div>

        <div className="footer-hud-info">
          <h4 className="footer-section-title">Lab Location</h4>
          <p className="footer-info-text">
            Sector 7, Neon Grid 4<br />
            Metropolis Hub
          </p>
          <h4 className="footer-section-title">Operations</h4>
          <p className="footer-info-text">
            24/7 Automated Synthesizers
          </p>
        </div>
      </div>

      <div className="footer-hud-bottom">
        <p className="footer-copyright">
          &copy; {new Date().getFullYear()} CakeScape. All rights reserved. Powered by Cyber-Ovens.
        </p>
        <div className="footer-socials">
          <a href="#github" className="social-icon">GH-01</a>
          <a href="#twitter" className="social-icon">X-99</a>
          <a href="#discord" className="social-icon">DSC-LAB</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;