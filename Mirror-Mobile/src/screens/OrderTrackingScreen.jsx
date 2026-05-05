import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { getOrderById, formatPrice } from "../services/api";

const STATUS_LABEL = {
  pending_payment: "Aguardando Pagamento",
  paid:            "Pagamento Confirmado",
  preparing:       "Preparando",
  ready:           "Pronto para Retirada",
  delivered:       "Entregue",
  cancelled:       "Cancelado",
};

const STATUS_COLOR = {
  pending_payment: "#F39C12",
  paid:            "#2ECC71",
  preparing:       "#3498DB",
  ready:           "#C41E3A",
  delivered:       "#27AE60",
  cancelled:       "#999",
};

const TERMINAL_STATUSES = ["delivered", "cancelled"];
const POLL_INTERVAL_MS = 5000;

export default function OrderTrackingScreen({ route, navigation }) {
  const { orderId } = route.params;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchOrder = async () => {
    try {
      const data = await getOrderById(orderId);
      setOrder(data);
      setError(null);

      // Para de fazer polling quando chega num status terminal
      if (TERMINAL_STATUSES.includes(data.status)) {
        clearInterval(intervalRef.current);
      }
    } catch (err) {
      setError("Não foi possível carregar o pedido.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    intervalRef.current = setInterval(fetchOrder, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [orderId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#C41E3A" />
        <Text style={styles.loadingText}>Carregando pedido...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error || "Pedido não encontrado"}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Main")}>
          <Text style={styles.backButtonText}>Voltar ao início</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = STATUS_COLOR[order.status] || "#999";
  const statusLabel = STATUS_LABEL[order.status] || order.status;
  const isTerminal = TERMINAL_STATUSES.includes(order.status);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Acompanhar Pedido</Text>
        <Text style={styles.orderId}>#{order.id}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View style={[styles.statusCard, { borderLeftColor: statusColor }]}>
          <Text style={styles.statusCardLabel}>Status</Text>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          {!isTerminal && (
            <Text style={styles.pollingHint}>Atualizando automaticamente...</Text>
          )}
        </View>

        {/* Código de retirada */}
        {order.pickup_code && order.status !== "cancelled" && (
          <View style={styles.pickupCard}>
            <Text style={styles.pickupLabel}>Código de Retirada</Text>
            <Text style={styles.pickupCode}>{order.pickup_code}</Text>
            <Text style={styles.pickupHint}>Mostre este código na retirada</Text>
          </View>
        )}

        {/* Itens do pedido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.itemName}>
                {item.quantity}x {item.name_snapshot}
              </Text>
              <Text style={styles.itemPrice}>
                {formatPrice(item.unit_price_cents * item.quantity)}
              </Text>
              {item.options.map((opt) => (
                <Text key={opt.id} style={styles.optionText}>• {opt.option_name_snapshot}</Text>
              ))}
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Pago</Text>
          <Text style={styles.totalValue}>{formatPrice(order.total_cents)}</Text>
        </View>

        {/* Botão de volta ao início (só em status terminal) */}
        {isTerminal && (
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate("Main")}
          >
            <Text style={styles.homeButtonText}>Voltar ao Início</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { justifyContent: "center", alignItems: "center", padding: 30 },
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
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#333" },
  orderId: { fontSize: 14, color: "#999" },
  statusCard: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 5,
  },
  statusCardLabel: { fontSize: 12, color: "#999", marginBottom: 6, textTransform: "uppercase" },
  statusText: { fontSize: 22, fontWeight: "bold" },
  pollingHint: { fontSize: 12, color: "#bbb", marginTop: 8 },
  pickupCard: {
    backgroundColor: "#C41E3A",
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  pickupLabel: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 8 },
  pickupCode: { fontSize: 48, fontWeight: "bold", color: "#fff", letterSpacing: 8 },
  pickupHint: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 8 },
  section: { backgroundColor: "#fff", marginHorizontal: 15, marginBottom: 15, padding: 20, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 12 },
  orderItem: { marginBottom: 12 },
  itemName: { fontSize: 15, fontWeight: "600", color: "#333" },
  itemPrice: { fontSize: 14, color: "#2ECC71", fontWeight: "600", marginTop: 2 },
  optionText: { fontSize: 13, color: "#666", marginTop: 2 },
  totalCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 16, fontWeight: "600", color: "#333" },
  totalValue: { fontSize: 22, fontWeight: "bold", color: "#333" },
  homeButton: {
    backgroundColor: "#C41E3A",
    marginHorizontal: 15,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
  },
  homeButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  loadingText: { marginTop: 10, fontSize: 16, color: "#666" },
  errorText: { fontSize: 16, color: "#C41E3A", textAlign: "center", marginBottom: 20 },
  backButton: {
    backgroundColor: "#C41E3A",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  backButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
