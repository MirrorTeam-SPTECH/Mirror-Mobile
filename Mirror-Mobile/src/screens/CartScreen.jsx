import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../services/api";

export default function CartScreen({ navigation }) {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartSubtotal,
    getCartTotal,
  } = useCart();

  const handleCheckout = () => {
    navigation.navigate("Checkout");
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;

    Alert.alert(
      "Limpar carrinho",
      "Tem certeza que deseja limpar o carrinho?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Limpar", style: "destructive", onPress: clearCart },
      ]
    );
  };

  const calculateItemTotal = (item) => {
    const optionsDelta = item.selectedOptions.reduce(
      (sum, opt) => sum + opt.priceDeltaCents,
      0
    );
    return (item.basePriceCents + optionsDelta) * item.quantity;
  };

  // Empty cart state
  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Carrinho</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>Seu carrinho está vazio</Text>
          <Text style={styles.emptyHint}>
            Adicione produtos para continuar
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate("Main")}
          >
            <Text style={styles.browseButtonText}>Ver Produtos</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Carrinho ({cart.length})</Text>
        <TouchableOpacity onPress={handleClearCart}>
          <Text style={styles.clearButton}>Limpar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        {cart.map((item) => (
          <View key={item.cartItemId} style={styles.cartItem}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.itemImage}
            />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.productName}</Text>

              {/* Selected Options */}
              {item.selectedOptions.length > 0 && (
                <View style={styles.optionsContainer}>
                  {item.selectedOptions.map((option, index) => (
                    <Text key={index} style={styles.optionText}>
                      • {option.optionName}
                      {option.priceDeltaCents !== 0 &&
                        ` (${option.priceDeltaCents > 0 ? "+" : ""}${formatPrice(
                          option.priceDeltaCents
                        )})`}
                    </Text>
                  ))}
                </View>
              )}

              {/* Quantity Controls */}
              <View style={styles.itemFooter}>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() =>
                      updateQuantity(item.cartItemId, item.quantity - 1)
                    }
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityValue}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() =>
                      updateQuantity(item.cartItemId, item.quantity + 1)
                    }
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.itemPrice}>
                  {formatPrice(calculateItemTotal(item))}
                </Text>
              </View>
            </View>

            {/* Remove Button */}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeFromCart(item.cartItemId)}
            >
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 200 }} />
      </ScrollView>

      {/* Bottom Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>
            {formatPrice(getCartSubtotal())}
          </Text>
        </View>

        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(getCartTotal())}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutButtonText}>Finalizar Pedido</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  clearButton: {
    fontSize: 14,
    color: "#C41E3A",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 30,
  },
  browseButton: {
    backgroundColor: "#C41E3A",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    position: "relative",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  optionsContainer: {
    marginBottom: 10,
  },
  optionText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#C41E3A",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 15,
    minWidth: 20,
    textAlign: "center",
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2ECC71",
  },
  removeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  summaryContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#999",
  },
  summaryValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  totalRow: {
    marginBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  checkoutButton: {
    backgroundColor: "#740000",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
