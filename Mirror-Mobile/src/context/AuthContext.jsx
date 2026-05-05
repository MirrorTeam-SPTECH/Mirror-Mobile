import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login as loginAPI, register as registerAPI, getMe, setAuthToken, clearAuthToken, setOnUnauthorized } from "../services/api";

const AuthContext = createContext();

const TOKEN_KEY = "@portal_churras:token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Deslogou automaticamente quando qualquer chamada retornar 401
  useEffect(() => {
    setOnUnauthorized(async () => {
      await AsyncStorage.removeItem(TOKEN_KEY);
      setUser(null);
    });
  }, []);

  // Ao abrir o app, restaura sessão salva
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          setAuthToken(token);
          const me = await getMe();
          setUser(me);
        }
      } catch (_) {
        // Token expirado ou inválido — limpa
        await AsyncStorage.removeItem(TOKEN_KEY);
        clearAuthToken();
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const data = await loginAPI(email, password);
    await AsyncStorage.setItem(TOKEN_KEY, data.access_token);
    setAuthToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (email, name, password, phone) => {
    const data = await registerAPI(email, name, password, phone);
    await AsyncStorage.setItem(TOKEN_KEY, data.access_token);
    setAuthToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isLoggedIn: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
