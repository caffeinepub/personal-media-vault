import { useInternetIdentity } from "@/hooks/useInternetIdentity";

export function useAuth() {
  const {
    identity,
    login,
    clear,
    isInitializing,
    isLoggingIn,
    isLoginSuccess,
    isLoginError,
    loginError,
  } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return {
    identity,
    isAuthenticated,
    login,
    logout: clear,
    isInitializing,
    isLoggingIn,
    isLoginSuccess,
    isLoginError,
    loginError,
  };
}
