/**
 * Mock product data for CakeScape
 * In a real app, this would come from an API/database
 */

export const products = [
  {
    id: 1,
    name: "Neon Dream",
    description: "A stunning 3-layer vanilla cake with electric pink frosting and edible glitter.",
    price: 49.99,
    image: "/images/cakes/neon-dream.jpg",
    category: "signature",
    flavors: ["vanilla"],
    layers: 3,
    weight: 6.0,
    bestseller: true,
  },
  {
    id: 2,
    name: "Midnight Velvet",
    description: "Rich red velvet cake with dark chocolate ganache and gold leaf accents.",
    price: 59.99,
    image: "/images/cakes/midnight-velvet.jpg",
    category: "signature",
    flavors: ["red velvet", "chocolate"],
    layers: 2,
    weight: 4.0,
    bestseller: true,
  },
  {
    id: 3,
    name: "Cyber Chocolate",
    description: "Triple chocolate overload with neon blue drip and holographic sprinkles.",
    price: 54.99,
    image: "/images/cakes/cyber-chocolate.jpg",
    category: "signature",
    flavors: ["chocolate"],
    layers: 3,
    weight: 6.0,
    bestseller: false,
  },
  {
    id: 4,
    name: "Electric Lemon",
    description: "Zesty lemon cake with cyan buttercream and candied lemon slices.",
    price: 44.99,
    image: "/images/cakes/electric-lemon.jpg",
    category: "classic",
    flavors: ["lemon"],
    layers: 2,
    weight: 4.0,
    bestseller: false,
  },
  {
    id: 5,
    name: "Birthday Blast",
    description: "Classic vanilla funfetti cake with rainbow frosting and sprinkle explosion.",
    price: 39.99,
    image: "/images/cakes/birthday-blast.jpg",
    category: "birthday",
    flavors: ["vanilla"],
    layers: 2,
    weight: 4.0,
    bestseller: true,
  },
  {
    id: 6,
    name: "Strawberry Nova",
    description: "Fresh strawberry cake with pink champagne frosting and fresh berries.",
    price: 52.99,
    image: "/images/cakes/strawberry-nova.jpg",
    category: "classic",
    flavors: ["strawberry"],
    layers: 2,
    weight: 4.0,
    bestseller: false,
  },
  {
    id: 7,
    name: "Cosmic Carrot",
    description: "Spiced carrot cake with cream cheese frosting and caramelized walnuts.",
    price: 47.99,
    image: "/images/cakes/cosmic-carrot.jpg",
    category: "classic",
    flavors: ["carrot"],
    layers: 3,
    weight: 6.0,
    bestseller: false,
  },
  {
    id: 8,
    name: "Wedding Elegance",
    description: "Elegant 4-tier white cake with pearl details and sugar flowers.",
    price: 199.99,
    image: "/images/cakes/wedding-elegance.jpg",
    category: "wedding",
    flavors: ["vanilla", "almond"],
    layers: 4,
    weight: 10.0,
    bestseller: false,
  },
  {
    id: 9,
    name: "Neon Cupcake Pack",
    description: "12 assorted cupcakes with vibrant neon frostings.",
    price: 34.99,
    image: "/images/cakes/neon-cupcakes.jpg",
    category: "cupcakes",
    flavors: ["vanilla", "chocolate", "strawberry"],
    layers: 1,
    weight: 1.5,
    bestseller: true,
  },
  {
    id: 10,
    name: "Galaxy Mousse",
    description: "Mirror glaze mousse cake with swirling galaxy design.",
    price: 64.99,
    image: "/images/cakes/galaxy-mousse.jpg",
    category: "signature",
    flavors: ["mixed berry"],
    layers: 1,
    weight: 2.0,
    bestseller: false,
  },
]

// Categories for filtering
export const categories = [
  { id: "all", name: "All Cakes" },
  { id: "signature", name: "Signature" },
  { id: "birthday", name: "Birthday" },
  { id: "wedding", name: "Wedding" },
  { id: "classic", name: "Classic" },
  { id: "cupcakes", name: "Cupcakes" },
]

// Helper function to get product by ID
export function getProductById(id) {
  return products.find(product => product.id === Number(id))
}

// Helper function to get products by category
export function getProductsByCategory(category) {
  if (category === "all") return products
  return products.filter(product => product.category === category)
}

// Helper function to get bestsellers
export function getBestsellers() {
  return products.filter(product => product.bestseller)
}
