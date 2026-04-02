import Hero from "../components/hero/Hero"

export default function App() {
  return (
    <>
      <Hero />
      {/* Spacer to enable scrolling (temporary - will be replaced with real content later) */}
      <div style={{ height: "100vh", background: "#0f0f14" }} />
    </>
  )
}