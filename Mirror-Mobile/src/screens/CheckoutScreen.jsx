import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createOrder, createPaymentPreference, formatPrice } from "../services/api";

export default function CheckoutScreen({ navigation }) {
  const { t } = useTranslation();
  const { cart, getCartTotal, clearCart } = useCart();
  const { user, isLoggedIn } = useAuth();

  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  if (!isLoggedIn) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loginPrompt}>{t("checkout.login_prompt")}</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.loginButtonText}>{t("checkout.btn_login")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const calculateItemTotal = (item) => {
    const optionsDelta = item.selectedOptions.reduce(
      (sum, opt) => sum + opt.priceDeltaCents,
      0
    );
    return (item.basePriceCents + optionsDelta) * item.quantity;
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      const items = cart.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
        options: item.selectedOptions.map((opt) => ({ option_id: opt.optionId })),
      }));

      const order = await createOrder(items, notes || null);
      const preference = await createPaymentPreference(order.id);

      const isMock = preference.preference_id === "mock-paid";
      const payUrl = preference.sandbox_init_point || preference.init_point;

      if (!isMock && payUrl) {
        await Linking.openURL(payUrl);
      }

      clearCart();

      if (isMock) {
        setLoading(false);
        setProcessingPayment(true);
        setTimeout(() => {
          setProcessingPayment(false);
          navigation.replace("OrderTracking", { orderId: order.id });
        }, 1500);
      } else {
        navigation.replace("OrderTracking", { orderId: order.id });
      }

    } catch (error) {
      setLoading(false);
      Alert.alert(
        t("checkout.error_title"),
        error.message || t("checkout.error_default"),
        [{ text: t("common.ok") }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <Modal transparent visible={processingPayment} animationType="fade">
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color="#009EE3" />
            <Text style={styles.processingTitle}>{t("checkout.processing_title")}</Text>
            <Text style={styles.processingSubtitle}>{t("checkout.processing_subtitle")}</Text>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("checkout.title")}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Dados do cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("checkout.your_info")}</Text>
          <Text style={styles.userInfo}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        {/* Resumo do pedido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("checkout.order_summary")}</Text>
          {cart.map((item, index) => (
            <View key={item.cartItemId} style={styles.orderItem}>
              <View style={styles.orderItemHeader}>
                <Text style={styles.orderItemQuantity}>{item.quantity}x</Text>
                <Text style={styles.orderItemName}>{item.productName}</Text>
                <Text style={styles.orderItemPrice}>
                  {formatPrice(calculateItemTotal(item))}
                </Text>
              </View>
              {item.selectedOptions.length > 0 && (
                <View style={styles.orderItemOptions}>
                  {item.selectedOptions.map((opt, idx) => (
                    <Text key={idx} style={styles.orderItemOption}>
                      • {opt.optionName}
                      {opt.priceDeltaCents !== 0 &&
                        ` (${opt.priceDeltaCents > 0 ? "+" : ""}${formatPrice(opt.priceDeltaCents)})`}
                    </Text>
                  ))}
                </View>
              )}
              {index < cart.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Observações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("checkout.notes")}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t("checkout.notes_placeholder")}
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Retirada */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("checkout.pickup_title")}</Text>
          <Text style={styles.pickupText}>{t("checkout.pickup_text")}</Text>
        </View>

        {/* Pagamento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("checkout.payment_title")}</Text>
          <View style={styles.paymentMethod}>
            <Text style={styles.paymentMethodText}>{t("checkout.payment_method")}</Text>
            <Text style={styles.paymentMethodHint}>{t("checkout.payment_hint")}</Text>
          </View>
        </View>

        <View style={{ height: 200 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomLabel}>{t("checkout.total_label")}</Text>
          <Text style={styles.bottomTotal}>{formatPrice(getCartTotal())}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>{t("checkout.btn_pay")}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { justifyContent: "center", alignItems: "center", padding: 30 },
  loginPrompt: { fontSize: 16, color: "#333", textAlign: "center", marginBottom: 20 },
  loginButton: {
    backgroundColor: "#C41E3A",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backIcon: { fontSize: 28, color: "#333", marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#333" },
  section: { backgroundColor: "#fff", padding: 20, marginTop: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 12 },
  userInfo: { fontSize: 16, fontWeight: "600", color: "#333" },
  userEmail: { fontSize: 14, color: "#999", marginTop: 2 },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  textArea: { height: 80, textAlignVertical: "top" },
  orderItem: { marginBottom: 10 },
  orderItemHeader: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  orderItemQuantity: { fontSize: 16, fontWeight: "600", color: "#666", marginRight: 8 },
  orderItemName: { flex: 1, fontSize: 16, fontWeight: "600", color: "#333" },
  orderItemPrice: { fontSize: 16, fontWeight: "bold", color: "#2ECC71" },
  orderItemOptions: { marginLeft: 30 },
  orderItemOption: { fontSize: 13, color: "#666", marginBottom: 2 },
  divider: { height: 1, backgroundColor: "#eee", marginTop: 10 },
  pickupText: { fontSize: 14, color: "#666", lineHeight: 20 },
  paymentMethod: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  paymentMethodText: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 4 },
  paymentMethodHint: { fontSize: 13, color: "#999" },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomLabel: { fontSize: 14, color: "#999" },
  bottomTotal: { fontSize: 22, fontWeight: "bold", color: "#333" },
  payButton: {
    backgroundColor: "#009EE3",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    minWidth: 180,
    alignItems: "center",
  },
  payButtonDisabled: { backgroundColor: "#ccc" },
  payButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  processingOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center", alignItems: "center",
  },
  processingCard: {
    backgroundColor: "#fff", borderRadius: 20,
    paddingVertical: 36, paddingHorizontal: 48,
    alignItems: "center", gap: 16,
    shadowColor: "#000", shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 }, shadowRadius: 20, elevation: 10,
  },
  processingTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a1a", marginTop: 4 },
  processingSubtitle: { fontSize: 14, color: "#888" },
});
