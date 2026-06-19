import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

function Layout({ children }) {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <>
      <Navbar />
      {isHome ? (
        // No padding for Landing Page scroll-driven canvas
        <main className="landing-layout-container">
          {children}
        </main>
      ) : (
        // Standard padded container for all other pages
        <>
          <main className="app-container">
            {children}
          </main>
          <Footer />
        </>
      )}
    </>
  );
}

export default Layout;