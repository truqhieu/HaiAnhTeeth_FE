import { Route, Routes } from "react-router-dom";
import Navbar from "./components/navbar";
import DefaultLayout from "@/layouts/default";
import IndexPage from "@/pages/index";
import AboutPage from "@/pages/about";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import LoginModal from "@/components/LoginModal";
import SignupModal from "@/components/SignupModal";

function App() {
  return (
    <AuthModalProvider>
      {/* Navbar chỉ render một lần ở đây */}
      <Navbar />

      {/* Sử dụng DefaultLayout để bao bọc các route */}
      <DefaultLayout>
        <Routes>
          <Route element={<IndexPage />} path="/" />
          <Route element={<AboutPage />} path="/about" />
        </Routes>
      </DefaultLayout>

      {/* Auth Modals - hiển thị ở mọi nơi */}
      <LoginModal />
      <SignupModal />
    </AuthModalProvider>
  );
}

export default App;