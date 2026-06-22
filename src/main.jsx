import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { BuilderProvider } from "./context/BuilderContext";
import { LocaleProvider } from "./context/LocaleContext";
import App from "./app/App";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <LocaleProvider>
      <CartProvider>
        <BuilderProvider>
          <App />
        </BuilderProvider>
      </CartProvider>
    </LocaleProvider>
  </BrowserRouter>
);
