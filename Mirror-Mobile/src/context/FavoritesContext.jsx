import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { getFavorites, addFavorite, removeFavorite } from "../services/api";

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  // Sincroniza com o backend quando auth muda
  useEffect(() => {
    if (isLoggedIn) {
      loadFavorites();
    } else {
      setFavoriteProducts([]);
      setFavoriteIds(new Set());
    }
  }, [isLoggedIn]);

  const loadFavorites = async () => {
    try {
      const products = await getFavorites();
      setFavoriteProducts(products);
      setFavoriteIds(new Set(products.map((p) => p.id)));
    } catch (err) {
      console.error("Failed to load favorites:", err);
    }
  };

  const toggleFavorite = async (productId) => {
    const isFav = favoriteIds.has(productId);

    // Atualização otimista
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(productId);
      else next.add(productId);
      return next;
    });

    if (!isLoggedIn) return;

    try {
      if (isFav) {
        await removeFavorite(productId);
        setFavoriteProducts((prev) => prev.filter((p) => p.id !== productId));
      } else {
        await addFavorite(productId);
        // Recarrega lista completa para ter os dados do produto
        await loadFavorites();
      }
    } catch (err) {
      // Reverte em caso de erro
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(productId);
        else next.delete(productId);
        return next;
      });
    }
  };

  const isFavorite = (productId) => favoriteIds.has(productId);

  return (
    <FavoritesContext.Provider
      value={{ favoriteProducts, favoriteIds, toggleFavorite, isFavorite, loadFavorites }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
