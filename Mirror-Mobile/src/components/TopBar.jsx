import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useCart } from "../context/CartContext";

const INK = "#2A1E14";
const PRIMARY = "#D91C1C";
const CREAM = "#FAF5EC";
const SUBTLE = "#8A7558";

export default function TopBar({ navigation }) {
  const { t } = useTranslation();
  const { getCartItemCount } = useCart();
  const cartCount = getCartItemCount();

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.label}>{t("common.app_name")}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={PRIMARY} />
          <Text style={styles.locationText}>{t("common.food_truck")}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.cartBtn}
        onPress={() => navigation.navigate("Orders")}
        activeOpacity={0.8}
      >
        <Ionicons name="bag-outline" size={18} color={PRIMARY} />
        {cartCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cartCount > 9 ? "9+" : String(cartCount)}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === "android" ? 44 : 18,
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: SUBTLE,
    fontWeight: "600",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "600",
    color: INK,
  },
  cartBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(217,28,28,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: CREAM,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
