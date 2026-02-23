import { Link, NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">CakeScape</Link>
      </div>

      <div className="navbar-links">
        <NavLink to="/shop">Shop</NavLink>
        <NavLink to="/builder">Build Cake</NavLink>
        <NavLink to="/cart">Cart</NavLink>
        <NavLink to="/login">Login</NavLink>
      </div>
    </nav>
  );
}

export default Navbar;