import React, { createContext, useContext, useState, useEffect } from "react";

const LocaleContext = createContext();

const EXCHANGE_RATES = {
  USD: 1.0,
  INR: 83.0,
  EUR: 0.92,
  GBP: 0.79,
};

const CURRENCY_SYMBOLS = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
};

const TRANSLATIONS = {
  en: {
    home: "Home",
    shop: "Shop",
    buildCake: "Build Cake",
    creatorHub: "Creator Hub",
    cart: "Cart",
    addToCart: "Add to Cart",
    addCreationToCart: "Add Creation to Cart",
    viewDetails: "View Details",
    backToShop: "← Back to Shop",
    bestseller: "Bestseller",
    layers: "Layers",
    flavors: "Flavors",
    flavor: "Flavor",
    frosting: "Frosting",
    toppings: "Toppings",
    size: "Size",
    applyFrostingAll: "Apply one frosting to ALL layers at once",
    selectedToppings: "Selected Toppings",
    noneSelected: "None selected",
    added: "Added!",
    write: "Write",
    draw: "Draw",
    photo: "Photo",
    artistry: "ARTISTRY",
    personaliseCake: "Personalise your cake",
    cakeBuilder: "CAKE BUILDER",
    designPerfectDessert: "Design your perfect dessert",
    customColor: "Custom Color",
    pickAnyColor: "Pick any color",
    remove: "Remove",
    addLayer: "Add Layer",
    emptyCart: "Your cart is empty",
    emptyCartDesc: "Looks like you haven't added any delicious cakes yet!",
    browseCakes: "Browse Our Cakes",
    yourCart: "Your Cart",
    each: "each",
    summary: "Order Summary",
    subtotal: "Subtotal",
    delivery: "Delivery",
    free: "Free",
    total: "Total",
    checkout: "Proceed to Checkout",
    trendingLabs: "Trending Labs",
    orderTracker: "Order Tracker",
    inspectCustom: "Inspect custom syntheses from the community or track active pipelines.",
    remix: "Remix",
    quickAdd: "Quick Add",
    theme: "Theme",
    language: "Language",
    currency: "Currency",
  },
  hi: {
    home: "होम",
    shop: "दुकान",
    buildCake: "केक बनाएं",
    creatorHub: "क्रिएटर हब",
    cart: "कार्ट",
    addToCart: "कार्ट में डालें",
    addCreationToCart: "निर्माण को कार्ट में जोड़ें",
    viewDetails: "विवरण देखें",
    backToShop: "← दुकान पर वापस जाएं",
    bestseller: "बेस्टसेलर",
    layers: "परतें",
    flavors: "स्वाद",
    flavor: "स्वाद",
    frosting: "फ्रॉस्टिंग",
    toppings: "टॉपिंग्स",
    size: "आकार",
    applyFrostingAll: "सभी परतों पर एक साथ फ्रॉस्टिंग लगाएं",
    selectedToppings: "चुने हुए टॉपिंग्स",
    noneSelected: "कोई चुना नहीं गया",
    added: "जोड़ा गया!",
    write: "लिखें",
    draw: "चित्र बनाएं",
    photo: "फोटो",
    artistry: "कलात्मकता",
    personaliseCake: "अपने केक को व्यक्तिगत रूप दें",
    cakeBuilder: "केक बिल्डर",
    designPerfectDessert: "अपनी आदर्श मिठाई डिज़ाइन करें",
    customColor: "कस्टम रंग",
    pickAnyColor: "कोई भी रंग चुनें",
    remove: "हटाएं",
    addLayer: "परत जोड़ें",
    emptyCart: "आपकी कार्ट खाली है",
    emptyCartDesc: "ऐसा लगता है कि आपने अभी तक कोई स्वादिष्ट केक नहीं जोड़ा है!",
    browseCakes: "हमारे केक देखें",
    yourCart: "आपकी कार्ट",
    each: "प्रत्येक",
    summary: "ऑर्डर सारांश",
    subtotal: "उप-योग",
    delivery: "वितरण",
    free: "मुफ़्त",
    total: "कुल",
    checkout: "चेकआउट के लिए आगे बढ़ें",
    trendingLabs: "ट्रेंडिंग लैब्स",
    orderTracker: "ऑर्डर ट्रैकर",
    inspectCustom: "समुदाय से कस्टम संश्लेषणों का निरीक्षण करें या सक्रिय पाइपलाइनों को ट्रैक करें।",
    remix: "रीमिक्स",
    quickAdd: "तुरंत जोड़ें",
    theme: "थीम",
    language: "भाषा",
    currency: "मुद्रा",
  },
  es: {
    home: "Inicio",
    shop: "Tienda",
    buildCake: "Crear Pastel",
    creatorHub: "Centro de Creadores",
    cart: "Carrito",
    addToCart: "Añadir al Carrito",
    addCreationToCart: "Añadir Creación al Carrito",
    viewDetails: "Ver Detalles",
    backToShop: "← Volver a la Tienda",
    bestseller: "Más Vendido",
    layers: "Capas",
    flavors: "Sabores",
    flavor: "Sabor",
    frosting: "Glaseado",
    toppings: "Coberturas",
    size: "Tamaño",
    applyFrostingAll: "Aplicar un glaseado a TODAS las capas a la vez",
    selectedToppings: "Coberturas Seleccionadas",
    noneSelected: "Ninguna seleccionada",
    added: "¡Añadido!",
    write: "Escribir",
    draw: "Dibujar",
    photo: "Foto",
    artistry: "ARTESANÍA",
    personaliseCake: "Personaliza tu pastel",
    cakeBuilder: "DISEÑADOR DE PASTELES",
    designPerfectDessert: "Diseña tu postre perfecto",
    customColor: "Color Personalizado",
    pickAnyColor: "Elige cualquier color",
    remove: "Eliminar",
    addLayer: "Añadir Capa",
    emptyCart: "Tu carrito está vacío",
    emptyCartDesc: "¡Parece que aún no has añadido ningún pastel delicioso!",
    browseCakes: "Ver Nuestros Pasteles",
    yourCart: "Tu Carrito",
    each: "cada uno",
    summary: "Resumen de Pedido",
    subtotal: "Subtotal",
    delivery: "Envío",
    free: "Gratis",
    total: "Total",
    checkout: "Proceder al Pago",
    trendingLabs: "Laboratorios de Tendencia",
    orderTracker: "Rastreador de Pedidos",
    inspectCustom: "Inspecciona síntesis personalizadas de la comunidad o rastrea tuberías de horneado.",
    remix: "Remezclar",
    quickAdd: "Añadir Rápido",
    theme: "Tema",
    language: "Idioma",
    currency: "Moneda",
  },
  fr: {
    home: "Accueil",
    shop: "Boutique",
    buildCake: "Créer un Gâteau",
    creatorHub: "Hub Créateur",
    cart: "Panier",
    addToCart: "Ajouter au Panier",
    addCreationToCart: "Ajouter la Création au Panier",
    viewDetails: "Voir les Détails",
    backToShop: "← Retour à la Boutique",
    bestseller: "Meilleure Vente",
    layers: "Couches",
    flavors: "Saveurs",
    flavor: "Saveur",
    frosting: "Glaçage",
    toppings: "Garnitures",
    size: "Taille",
    applyFrostingAll: "Appliquer un glaçage à TOUTES les couches à la fois",
    selectedToppings: "Garnitures Sélectionnées",
    noneSelected: "Aucune sélectionnée",
    added: "Ajouté !",
    write: "Écrire",
    draw: "Dessiner",
    photo: "Photo",
    artistry: "ARTISANAT",
    personaliseCake: "Personnalisez votre gâteau",
    cakeBuilder: "CRÉATEUR DE GÂTEAUX",
    designPerfectDessert: "Concevez votre dessert parfait",
    customColor: "Couleur Personnalisée",
    pickAnyColor: "Choisir une couleur",
    remove: "Supprimer",
    addLayer: "Ajouter une Couche",
    emptyCart: "Votre panier est vide",
    emptyCartDesc: "Il semble que vous n'ayez pas encore ajouté de délicieux gâteaux !",
    browseCakes: "Découvrir Nos Gâteaux",
    yourCart: "Votre Panier",
    each: "chaque",
    summary: "Résumé de la Commande",
    subtotal: "Sous-total",
    delivery: "Livraison",
    free: "Gratuit",
    total: "Total",
    checkout: "Passer à la Caisse",
    trendingLabs: "Tendances Labs",
    orderTracker: "Suivi des Commandes",
    inspectCustom: "Inspectez les synthèses personnalisées de la communauté ou suivez les pipelines actifs.",
    remix: "Remixer",
    quickAdd: "Ajout Rapide",
    theme: "Thème",
    language: "Langue",
    currency: "Devise",
  }
};

export function LocaleProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("cakescape-lang");
    if (saved) return saved;

    // Detect user country/timezone
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.toLowerCase().includes("kolkata") || tz.toLowerCase().includes("india")) {
        return "en"; // Default to English in India as requested
      }
    } catch (e) {}
    return "en";
  });

  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem("cakescape-currency");
    if (saved) return saved;

    // Detect country/timezone for currency defaulting
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.toLowerCase().includes("kolkata") || tz.toLowerCase().includes("india")) {
        return "INR";
      }
      if (tz.toLowerCase().includes("europe")) {
        return "EUR";
      }
      if (tz.toLowerCase().includes("london") || tz.toLowerCase().includes("gb")) {
        return "GBP";
      }
    } catch (e) {}
    return "USD";
  });

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("cakescape-theme");
    return saved || "dark"; // Default is dark
  });

  useEffect(() => {
    localStorage.setItem("cakescape-lang", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("cakescape-currency", currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem("cakescape-theme", theme);
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light-theme");
      root.classList.remove("dark-theme");
    } else {
      root.classList.add("dark-theme");
      root.classList.remove("light-theme");
    }
  }, [theme]);

  // Translate a key
  const t = (key) => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  };

  // Convert and format USD price
  const formatPrice = (usdPrice) => {
    const rate = EXCHANGE_RATES[currency] || 1.0;
    const symbol = CURRENCY_SYMBOLS[currency] || "$";
    const converted = usdPrice * rate;
    
    // Format nicely
    if (currency === "INR") {
      return `${symbol}${Math.round(converted).toLocaleString("en-IN")}`;
    }
    return `${symbol}${converted.toFixed(2)}`;
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <LocaleContext.Provider value={{
      language,
      setLanguage,
      currency,
      setCurrency,
      theme,
      setTheme,
      toggleTheme,
      t,
      formatPrice,
      supportedLanguages: [
        { code: "en", label: "English" },
        { code: "hi", label: "हिन्दी" },
        { code: "es", label: "Español" },
        { code: "fr", label: "Français" }
      ],
      supportedCurrencies: [
        { code: "USD", symbol: "$" },
        { code: "INR", symbol: "₹" },
        { code: "EUR", symbol: "€" },
        { code: "GBP", symbol: "£" }
      ]
    }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
