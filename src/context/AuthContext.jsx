import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getAuthErrorMessage,
  loginWithEmail,
  logoutUser,
  sendPhoneOtp,
  sendResetPasswordEmail,
  signUpWithEmail,
  subscribeToAuthChanges,
  upsertUserProfile,
  verifyPhoneOtp,
} from "../firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(
      async (user) => {
        setCurrentUser(user);

        if (user) {
          try {
            await upsertUserProfile(user);
          } catch (error) {
            console.error("Unable to sync authenticated user profile", error);
          }
        }

        setIsAuthLoading(false);
      },
      (error) => {
        console.error("Auth state subscription failed", error);
        setIsAuthLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      isAuthLoading,
      signUpWithEmail,
      loginWithEmail,
      sendResetPasswordEmail,
      sendPhoneOtp,
      verifyPhoneOtp,
      logoutUser,
      getAuthErrorMessage,
    }),
    [currentUser, isAuthLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
