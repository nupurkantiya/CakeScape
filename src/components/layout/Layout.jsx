import Navbar from "./Navbar";
import Footer from "./Footer";

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main className="app-container">
        {children}
      </main>
      <Footer />
    </>
  );
}

export default Layout;