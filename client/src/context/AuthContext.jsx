import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchProfile } from "../api/auth";
import { clearAuthTokens, setAuthTokens, TOKEN_KEY } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);

      if (!storedToken) {
        if (isMounted) {
          setToken(null);
          setUser(null);
          setIsCheckingAuth(false);
        }
        return;
      }

      try {
        const response = await fetchProfile();

        if (isMounted) {
          setToken(storedToken);
          setUser(response.data);
        }
      } catch (error) {
        clearAuthTokens();

        if (isMounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = ({ refreshToken, token: nextToken, user: nextUser }) => {
    setAuthTokens({
      refreshToken,
      token: nextToken
    });
    setToken(nextToken);
    setUser(nextUser);
  };

  const signOut = () => {
    clearAuthTokens();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      isCheckingAuth,
      signIn,
      signOut,
      token,
      user
    }),
    [isCheckingAuth, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
