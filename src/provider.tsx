import type { NavigateOptions } from "react-router-dom";
import { HeroUIProvider } from "@heroui/system";
import { useHref, useNavigate } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import {
  AuthModalProvider,
  useAuthModal,
} from "@/contexts/AuthModalContext";
import ForgotPasswordModal from "@/components/Auth/ForgotPasswordModal";
import LoginForm from "@/components/Auth/LoginForm";
import SignupForm from "@/components/Auth/SignupForm";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

// This component will render the modals based on the context state
const AppModals = () => {
  const { isLoginModalOpen, isSignupModalOpen, isForgotPasswordModalOpen } =
    useAuthModal();

  // We render the modals here so they can be displayed on top of any page
  return (
    <>
      {isLoginModalOpen && <LoginForm />}
      {isSignupModalOpen && <SignupForm />}
      {isForgotPasswordModalOpen && <ForgotPasswordModal />}
    </>
  );
};

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <AuthProvider>
        <AuthModalProvider>
          {children}
          <AppModals />
        </AuthModalProvider>
      </AuthProvider>
    </HeroUIProvider>
  );
}