import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { getOrders, formatPrice } from "../services/api";

const STATUS_LABEL = {
  pending_payment: "Aguardando Pagamento",
  paid:            "Pago",
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
  cancelled:       "#bbb",
};

function OrderCard({ order, onPress }) {
  const color = STATUS_COLOR[order.status] || "#999";
  const label = STATUS_LABEL[order.status] || order.status;
  const date = new Date(order.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>Pedido #{order.id}</Text>
        <Text style={[styles.statusBadge, { color }]}>{label}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.date}>{date}</Text>
        {order.pickup_code && (
          <Text style={styles.pickupCode}>Código: {order.pickup_code}</Text>
        )}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.total}>{formatPrice(order.total_cents)}</Text>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError("Não foi possível carregar seus pedidos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#C41E3A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Pedidos</Text>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>Nenhum pedido ainda</Text>
          <Text style={styles.emptyHint}>Seus pedidos vão aparecer aqui</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => navigation.navigate("OrderTracking", { orderId: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
          onRefresh={fetchOrders}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30 },
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
  list: { padding: 15, paddingBottom: 100 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  orderId: { fontSize: 16, fontWeight: "bold", color: "#333" },
  statusBadge: { fontSize: 13, fontWeight: "600" },
  cardBody: { marginBottom: 12 },
  date: { fontSize: 13, color: "#999" },
  pickupCode: { fontSize: 13, color: "#666", marginTop: 4 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  total: { fontSize: 18, fontWeight: "bold", color: "#333" },
  arrow: { fontSize: 22, color: "#ccc" },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#333", marginBottom: 8 },
  emptyHint: { fontSize: 14, color: "#999" },
  errorText: { fontSize: 15, color: "#C41E3A", textAlign: "center", marginBottom: 16 },
  retryButton: { backgroundColor: "#C41E3A", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25 },
  retryText: { color: "#fff", fontWeight: "600" },
});
