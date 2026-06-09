import React, { useState, useEffect, useRef } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { getOrderById, getRating, submitRating, formatPrice } from "../services/api";

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
  const { t } = useTranslation();
  const { orderId } = route.params;

  const STATUS_LABEL = {
    pending_payment: t("order_tracking.status_pending"),
    paid:            t("order_tracking.status_paid"),
    preparing:       t("order_tracking.status_preparing"),
    ready:           t("order_tracking.status_ready"),
    delivered:       t("order_tracking.status_delivered"),
    cancelled:       t("order_tracking.status_cancelled"),
  };

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  // Rating state
  const [existingRating, setExistingRating] = useState(null);
  const [ratingChecked, setRatingChecked] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingImage, setRatingImage] = useState(null); // {uri, base64, mimeType}
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchOrder = async () => {
    try {
      const data = await getOrderById(orderId);
      setOrder(data);
      setError(null);

      if (TERMINAL_STATUSES.includes(data.status)) {
        clearInterval(intervalRef.current);
      }
    } catch (err) {
      setError(t("order_tracking.load_error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    intervalRef.current = setInterval(fetchOrder, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [orderId]);

  useEffect(() => {
    if (order?.status === "delivered" && !ratingChecked) {
      setRatingChecked(true);
      getRating(orderId).then(setExistingRating).catch(() => {});
    }
  }, [order?.status, ratingChecked, orderId]);

  const pickRatingImage = async (source) => {
    const options = { allowsEditing: true, quality: 0.6, base64: true };
    let result;
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("rating.perm_title"), t("rating.perm_camera"));
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("rating.perm_title"), t("rating.perm_gallery"));
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({ ...options, mediaTypes: ["images"] });
    }
    if (!result.canceled) {
      const asset = result.assets[0];
      setRatingImage({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType ?? "image/jpeg" });
    }
  };

  const handleSubmitRating = async () => {
    if (stars === 0 || submittingRating) return;
    setSubmittingRating(true);
    try {
      const result = await submitRating(
        orderId,
        stars,
        comment.trim() || null,
        ratingImage?.base64 || null,
      );
      setExistingRating(result);
    } catch {
      Alert.alert(t("rating.error"));
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#C41E3A" />
        <Text style={styles.loadingText}>{t("order_tracking.loading")}</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error || t("order_tracking.not_found")}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Main")}>
          <Text style={styles.backButtonText}>{t("order_tracking.btn_home")}</Text>
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
        <Text style={styles.headerTitle}>{t("order_tracking.title")}</Text>
        <Text style={styles.orderId}>#{order.id}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View style={[styles.statusCard, { borderLeftColor: statusColor }]}>
          <Text style={styles.statusCardLabel}>{t("order_tracking.status_label")}</Text>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          {!isTerminal && (
            <Text style={styles.pollingHint}>{t("order_tracking.polling_hint")}</Text>
          )}
        </View>

        {/* Código de retirada */}
        {order.pickup_code && order.status !== "cancelled" && (
          <View style={styles.pickupCard}>
            <Text style={styles.pickupLabel}>{t("order_tracking.pickup_label")}</Text>
            <Text style={styles.pickupCode}>{order.pickup_code}</Text>
            <Text style={styles.pickupHint}>{t("order_tracking.pickup_hint")}</Text>
          </View>
        )}

        {/* Itens do pedido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("order_tracking.items_title")}</Text>
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
          <Text style={styles.totalLabel}>{t("order_tracking.total_paid")}</Text>
          <Text style={styles.totalValue}>{formatPrice(order.total_cents)}</Text>
        </View>

        {/* Bloco de avaliação — só pedidos entregues */}
        {order.status === "delivered" && ratingChecked && (
          existingRating ? (
            <View style={styles.ratingCard}>
              <View style={styles.ratingDoneRow}>
                <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
                <Text style={styles.ratingDoneText}>{t("rating.thank_you")}</Text>
              </View>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Ionicons
                    key={n}
                    name={n <= existingRating.stars ? "star" : "star-outline"}
                    size={22}
                    color={n <= existingRating.stars ? "#FFD66B" : "#ccc"}
                  />
                ))}
              </View>
              {existingRating.comment ? (
                <Text style={styles.ratingCommentText}>"{existingRating.comment}"</Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.ratingCard}>
              <Text style={styles.ratingTitle}>{t("rating.title")}</Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => setStars(n)} hitSlop={6}>
                    <Ionicons
                      name={n <= stars ? "star" : "star-outline"}
                      size={34}
                      color={n <= stars ? "#FFD66B" : "#ccc"}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.commentInput}
                placeholder={t("rating.comment_placeholder")}
                placeholderTextColor="#bbb"
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={300}
              />

              {ratingImage ? (
                <View style={styles.imagePreviewRow}>
                  <Image source={{ uri: ratingImage.uri }} style={styles.imageThumb} />
                  <TouchableOpacity onPress={() => setRatingImage(null)} hitSlop={8}>
                    <Ionicons name="close-circle" size={22} color="#999" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoButtons}>
                  <TouchableOpacity style={styles.photoBtn} onPress={() => pickRatingImage("camera")} activeOpacity={0.75}>
                    <Ionicons name="camera-outline" size={15} color="#C41E3A" />
                    <Text style={styles.photoBtnText}>{t("rating.add_photo_camera")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoBtn} onPress={() => pickRatingImage("gallery")} activeOpacity={0.75}>
                    <Ionicons name="image-outline" size={15} color="#C41E3A" />
                    <Text style={styles.photoBtnText}>{t("rating.add_photo_gallery")}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitRatingBtn, stars === 0 && { opacity: 0.4 }]}
                onPress={handleSubmitRating}
                disabled={stars === 0 || submittingRating}
                activeOpacity={0.85}
              >
                {submittingRating
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.submitRatingBtnText}>{t("rating.submit")}</Text>
                }
              </TouchableOpacity>
            </View>
          )
        )}

        {/* Botão de volta ao início (só em status terminal) */}
        {isTerminal && (
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate("Main")}
          >
            <Text style={styles.homeButtonText}>{t("order_tracking.btn_home")}</Text>
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

  // Rating block
  ratingCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0E8DC",
  },
  ratingTitle: { fontSize: 16, fontWeight: "700", color: "#2A1E14", marginBottom: 14 },
  starsRow: { flexDirection: "row", gap: 6, marginBottom: 14 },
  commentInput: {
    borderWidth: 1,
    borderColor: "#E8DFD1",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#2A1E14",
    minHeight: 72,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  photoButtons: { flexDirection: "row", gap: 10, marginBottom: 16 },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C41E3A",
  },
  photoBtnText: { fontSize: 13, color: "#C41E3A", fontWeight: "600" },
  imagePreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  imageThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  submitRatingBtn: {
    backgroundColor: "#C41E3A",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
  },
  submitRatingBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  ratingDoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  ratingDoneText: { fontSize: 15, fontWeight: "600", color: "#27AE60" },
  ratingCommentText: { fontSize: 14, color: "#7A6A56", fontStyle: "italic", marginTop: 8 },
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
