import React, { createContext, useContext, useState } from 'react';

interface AuthModalContextType {
  isLoginModalOpen: boolean;
  isSignupModalOpen: boolean;
  openLoginModal: () => void;
  openSignupModal: () => void;
  closeModals: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
    setIsSignupModalOpen(false);
  };

  const openSignupModal = () => {
    setIsSignupModalOpen(true);
    setIsLoginModalOpen(false);
  };

  const closeModals = () => {
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(false);
  };

  return (
    <AuthModalContext.Provider
      value={{
        isLoginModalOpen,
        isSignupModalOpen,
        openLoginModal,
        openSignupModal,
        closeModals,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};
