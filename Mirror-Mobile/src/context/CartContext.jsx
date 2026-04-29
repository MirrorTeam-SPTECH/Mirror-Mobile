import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CartContext = createContext();

const CART_STORAGE_KEY = "@portal_churras:cart";

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Save cart to AsyncStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      saveCart();
    }
  }, [cart]);

  const loadCart = async () => {
    try {
      const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("Failed to save cart:", error);
    }
  };

  /**
   * Add item to cart
   *
   * @param {Object} item - Cart item
   * @param {number} item.productId
   * @param {string} item.productName
   * @param {number} item.basePriceCents
   * @param {string} item.imageUrl
   * @param {number} item.quantity
   * @param {Array} item.selectedOptions - [{optionId, optionName, priceDeltaCents}]
   */
  const addToCart = (item) => {
    // Generate unique ID for cart item (product + selected options)
    const cartItemId = generateCartItemId(item);

    // Check if exact same item (with same options) already in cart
    const existingItemIndex = cart.findIndex(
      (cartItem) => cartItem.cartItemId === cartItemId
    );

    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += item.quantity;
      setCart(updatedCart);
    } else {
      // Add as new cart item
      setCart([...cart, { ...item, cartItemId }]);
    }
  };

  /**
   * Remove item from cart
   */
  const removeFromCart = (cartItemId) => {
    setCart(cart.filter((item) => item.cartItemId !== cartItemId));
  };

  /**
   * Update item quantity
   */
  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    const updatedCart = cart.map((item) =>
      item.cartItemId === cartItemId
        ? { ...item, quantity: newQuantity }
        : item
    );
    setCart(updatedCart);
  };

  /**
   * Clear entire cart
   */
  const clearCart = () => {
    setCart([]);
  };

  /**
   * Get total number of items in cart
   */
  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  /**
   * Calculate cart subtotal (sum of all items)
   */
  const getCartSubtotal = () => {
    return cart.reduce((total, item) => {
      // Base price + option deltas
      const itemPrice = item.basePriceCents + getOptionsDelta(item.selectedOptions);
      return total + itemPrice * item.quantity;
    }, 0);
  };

  /**
   * Calculate cart total (same as subtotal for now, can add fees later)
   */
  const getCartTotal = () => {
    return getCartSubtotal();
  };

  /**
   * Generate unique ID for cart item based on product and options
   */
  const generateCartItemId = (item) => {
    const optionsHash = item.selectedOptions
      .map((opt) => opt.optionId)
      .sort()
      .join("-");
    return `${item.productId}_${optionsHash}`;
  };

  /**
   * Calculate total price delta from selected options
   */
  const getOptionsDelta = (selectedOptions) => {
    return selectedOptions.reduce(
      (total, option) => total + option.priceDeltaCents,
      0
    );
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartItemCount,
        getCartSubtotal,
        getCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
