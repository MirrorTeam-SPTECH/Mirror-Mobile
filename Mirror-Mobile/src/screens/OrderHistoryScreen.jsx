import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { getOrders, getOrderById, formatPrice, getNutritionRanking } from "../services/api";
import { useCart } from "../context/CartContext";

const PRIMARY = "#C41E3A";
const BG = "#FAF5EC";

const STATUS_COLOR = {
  pending_payment: "#F39C12",
  paid:            "#2ECC71",
  preparing:       "#3498DB",
  ready:           PRIMARY,
  delivered:       "#27AE60",
  cancelled:       "#bbb",
};

const NUTRITION_ELIGIBLE = new Set(["paid", "preparing", "ready", "delivered"]);

function NutritionModal({ orderId, onClose }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getNutritionRanking(orderId)
      .then(setData)
      .catch((err) => setError(err.message || t("order_history.modal_load_error")))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <View style={modal.header}>
            <Text style={modal.title}>{t("order_history.modal_title")}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#2A1E14" />
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={modal.center}>
              <ActivityIndicator size="large" color={PRIMARY} />
              <Text style={modal.hint}>{t("order_history.modal_loading")}</Text>
            </View>
          )}

          {error && (
            <View style={modal.center}>
              <Ionicons name="alert-circle-outline" size={40} color="#bbb" />
              <Text style={modal.errorText}>{error}</Text>
            </View>
          )}

          {data && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={modal.scroll}>
              {data.narrative ? (
                <View style={modal.narrativeCard}>
                  <Text style={modal.narrativeText}>{data.narrative}</Text>
                </View>
              ) : null}

              <Text style={modal.sectionLabel}>{t("order_history.modal_ranking")}</Text>
              {data.ranking.map((item) => (
                <View key={item.product_id} style={modal.rankRow}>
                  <View style={modal.rankBadge}>
                    <Text style={modal.rankNum}>{item.rank}</Text>
                  </View>
                  <View style={modal.rankInfo}>
                    <Text style={modal.rankName}>
                      {item.product_name}
                      {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                    </Text>
                    <View style={modal.macroRow}>
                      <Text style={modal.macroChip}>🔥 {item.total_kcal.toFixed(0)} kcal</Text>
                      <Text style={modal.macroChip}>
                        P {item.nutrition_per_unit.total_protein_g.toFixed(1)}g
                      </Text>
                      <Text style={modal.macroChip}>
                        C {item.nutrition_per_unit.total_carb_g.toFixed(1)}g
                      </Text>
                      <Text style={modal.macroChip}>
                        G {item.nutrition_per_unit.total_fat_g.toFixed(1)}g
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              <Text style={modal.disclaimer}>{t("order_history.modal_disclaimer")}</Text>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function OrderCard({ order, onPress, onNutritionPress, onReorderPress, reordering }) {
  const { t, i18n } = useTranslation();
  const STATUS_LABEL = {
    pending_payment: t("order_history.status_pending"),
    paid:            t("order_history.status_paid"),
    preparing:       t("order_history.status_preparing"),
    ready:           t("order_history.status_ready"),
    delivered:       t("order_history.status_delivered"),
    cancelled:       t("order_history.status_cancelled"),
  };
  const color = STATUS_COLOR[order.status] || "#999";
  const label = STATUS_LABEL[order.status] || order.status;
  const date = new Date(order.created_at).toLocaleDateString(i18n.language, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>{t("order_history.order_number", { id: order.id })}</Text>
        <Text style={[styles.statusBadge, { color }]}>{label}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.date}>{date}</Text>
        {order.items && order.items.length > 0 && (
          <Text style={styles.itemsSummary} numberOfLines={1}>
            {order.items.map((i) => `${i.quantity}× ${i.name_snapshot}`).join("  ·  ")}
          </Text>
        )}
        {order.pickup_code && (
          <Text style={styles.pickupCode}>{t("order_history.pickup_code", { code: order.pickup_code })}</Text>
        )}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.total}>{formatPrice(order.total_cents)}</Text>
        <View style={styles.footerActions}>
          {NUTRITION_ELIGIBLE.has(order.status) && (
            <TouchableOpacity
              style={styles.nutritionBtn}
              onPress={(e) => { e.stopPropagation(); onNutritionPress(); }}
              activeOpacity={0.75}
            >
              <Ionicons name="leaf-outline" size={13} color={PRIMARY} />
              <Text style={styles.nutritionBtnText}>{t("order_history.btn_nutrition")}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.reorderBtn, reordering && { opacity: 0.5 }]}
            onPress={(e) => { e.stopPropagation(); onReorderPress(); }}
            activeOpacity={0.75}
            disabled={reordering}
          >
            {reordering
              ? <ActivityIndicator size={12} color="#fff" />
              : <Ionicons name="refresh-outline" size={13} color="#fff" />
            }
            <Text style={styles.reorderBtnText}>{t("order_history.btn_reorder")}</Text>
          </TouchableOpacity>
          <Text style={styles.arrow}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function OrderHistoryScreen({ navigation }) {
  const { t } = useTranslation();
  const { cart, addToCart, clearCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nutritionOrderId, setNutritionOrderId] = useState(null);
  const [reorderingId, setReorderingId] = useState(null);

  const HIDE_STATUSES = new Set(["pending_payment", "cancelled"]);

  const handleReorder = useCallback(async (order) => {
    if (reorderingId) return;

    const doReorder = async () => {
      setReorderingId(order.id);
      try {
        const full = await getOrderById(order.id);
        clearCart();
        (full.items || []).forEach((item) => {
          addToCart({
            productId: item.product_id,
            productName: item.name_snapshot,
            basePriceCents: item.unit_price_cents,
            imageUrl: null,
            quantity: item.quantity,
            selectedOptions: (item.options || []).map((opt) => ({
              optionId: opt.option_id,
              optionName: opt.option_name_snapshot,
              priceDeltaCents: opt.price_delta_cents,
            })),
          });
        });
        navigation.navigate("Main", { screen: "Orders" });
      } catch {
        Alert.alert(t("order_history.reorder_error"));
      } finally {
        setReorderingId(null);
      }
    };

    if (cart.length > 0) {
      Alert.alert(
        t("order_history.reorder_title"),
        t("order_history.reorder_confirm"),
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("order_history.reorder_ok"), onPress: doReorder },
        ]
      );
    } else {
      doReorder();
    }
  }, [reorderingId, cart, addToCart, clearCart, navigation, t]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data.filter((o) => !HIDE_STATUSES.has(o.status)));
      setError(null);
    } catch (err) {
      setError(t("order_history.load_error"));
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
        <ActivityIndicator size="large" color={PRIMARY} />
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
        <Text style={styles.headerTitle}>{t("order_history.title")}</Text>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
            <Text style={styles.retryText}>{t("common.retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>{t("order_history.empty_title")}</Text>
          <Text style={styles.emptyHint}>{t("order_history.empty_hint")}</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => navigation.navigate("OrderTracking", { orderId: item.id })}
              onNutritionPress={() => setNutritionOrderId(item.id)}
              onReorderPress={() => handleReorder(item)}
              reordering={reorderingId === item.id}
            />
          )}
          contentContainerStyle={styles.list}
          onRefresh={fetchOrders}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
        />
      )}

      {nutritionOrderId !== null && (
        <NutritionModal
          orderId={nutritionOrderId}
          onClose={() => setNutritionOrderId(null)}
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
  itemsSummary: { fontSize: 13, color: "#555", marginTop: 3, fontWeight: "500" },
  pickupCode: { fontSize: 13, color: "#666", marginTop: 4 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  total: { fontSize: 18, fontWeight: "bold", color: "#333" },
  footerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  nutritionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  nutritionBtnText: { fontSize: 12, color: PRIMARY, fontWeight: "600" },
  reorderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    minWidth: 28,
    justifyContent: "center",
  },
  reorderBtnText: { fontSize: 12, color: "#fff", fontWeight: "600" },
  arrow: { fontSize: 22, color: "#ccc" },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#333", marginBottom: 8 },
  emptyHint: { fontSize: 14, color: "#999" },
  errorText: { fontSize: 15, color: PRIMARY, textAlign: "center", marginBottom: 16 },
  retryButton: { backgroundColor: PRIMARY, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25 },
  retryText: { color: "#fff", fontWeight: "600" },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 17, fontWeight: "700", color: "#2A1E14" },
  center: { paddingVertical: 40, alignItems: "center", gap: 12 },
  hint: { fontSize: 13, color: "#7A6A56" },
  errorText: { fontSize: 14, color: "#7A6A56", textAlign: "center", marginTop: 8 },
  scroll: { paddingBottom: 8 },
  narrativeCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY,
  },
  narrativeText: { fontSize: 14, color: "#5A4A36", lineHeight: 22 },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: "#7A6A56", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  rankRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  rankNum: { color: "#fff", fontSize: 13, fontWeight: "700" },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 14, fontWeight: "600", color: "#2A1E14", marginBottom: 6 },
  macroRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  macroChip: { fontSize: 12, color: "#5A4A36", backgroundColor: "#F0E8DC", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  disclaimer: { fontSize: 11, color: "#B8A898", marginTop: 16, textAlign: "center", lineHeight: 16 },
});
