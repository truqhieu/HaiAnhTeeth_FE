import { Route, Routes } from "react-router-dom";
import Navbar from "./components/navbar";
import IndexPage from "@/pages/index";
import DocsPage from "@/pages/docs";
import PricingPage from "@/pages/pricing";
import BlogPage from "@/pages/blog";
import AboutPage from "@/pages/about";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import LoginModal from "@/components/LoginModal";
import SignupModal from "@/components/SignupModal";

function App() {
  return (
    <AuthModalProvider>
      {/* Navbar luôn hiển thị */}
      <Navbar />

      {/* Các route */}
      <Routes>
        <Route element={<IndexPage />} path="/" />
        <Route element={<DocsPage />} path="/docs" />
        <Route element={<PricingPage />} path="/pricing" />
        <Route element={<BlogPage />} path="/blog" />
        <Route element={<AboutPage />} path="/about" />
      </Routes>

      {/* Auth Modals - hiển thị ở mọi nơi */}
      <LoginModal />
      <SignupModal />
    </AuthModalProvider>
  );
}

export default App;
