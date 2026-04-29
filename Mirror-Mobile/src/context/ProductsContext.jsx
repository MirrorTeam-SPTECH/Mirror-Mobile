import React, { createContext, useContext, useState, useEffect } from "react";
import { getCategories, getProducts } from "../services/api";

const ProductsContext = createContext();

export function ProductsProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch products when category changes
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setError("Não foi possível carregar as categorias");
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const filters = selectedCategory
        ? { category_id: selectedCategory }
        : {};

      const data = await getProducts(filters);
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Não foi possível carregar os produtos");
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = () => {
    fetchProducts();
  };

  return (
    <ProductsContext.Provider
      value={{
        categories,
        products,
        selectedCategory,
        setSelectedCategory,
        loading,
        error,
        refreshProducts,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error("useProducts must be used within ProductsProvider");
  }
  return context;
}
