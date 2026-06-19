import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

function Layout({ children }) {
  const location = useLocation();
  const isFullScreenPage = location.pathname === "/" || location.pathname === "/builder";

  return (
    <>
      <Navbar />
      {isFullScreenPage ? (
        // No padding for Full Screen Pages (Landing and Builder)
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