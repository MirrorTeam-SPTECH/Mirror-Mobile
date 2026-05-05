import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Platform, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFavorites } from "../context/FavoritesContext";
import { PRODUCT_IMAGES } from "../services/productImages";

const PRIMARY = "#D91C1C";
const INK = "#2A1E14";
const MUTED = "#7A6A56";
const SUBTLE = "#8A7558";
const LINE = "#E8DFD1";
const CREAM = "#FAF5EC";
const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" });

const PLACEHOLDER_COLORS = [
  "#5C2A18", "#7A3318", "#8A4426", "#C97D3F",
  "#6B2818", "#D4A258", "#8B2E1A", "#C05F3A",
];

export default function ProductCard({ product }) {
  const navigation = useNavigation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const bgColor = PLACEHOLDER_COLORS[product.id % PLACEHOLDER_COLORS.length];
  const localImage = PRODUCT_IMAGES[product.id] ?? null;

  const goToDetail = () => navigation.navigate("ProductDetail", { productId: product.id });

  return (
    <TouchableOpacity style={styles.card} onPress={goToDetail} activeOpacity={0.85}>
      {/* Image / placeholder */}
      <View style={[styles.imageArea, { backgroundColor: bgColor }]}>
        {localImage && (
          <Image source={localImage} style={styles.productImage} resizeMode="cover" />
        )}
        <View style={styles.imageOverlay} />

        {/* Favorite button */}
        <TouchableOpacity
          style={styles.favBtn}
          onPress={() => toggleFavorite(product.id)}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Ionicons
            name={isFavorite(product.id) ? "heart" : "heart-outline"}
            size={16}
            color={isFavorite(product.id) ? PRIMARY : CREAM}
          />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        {!!product.description && (
          <Text style={styles.desc} numberOfLines={1}>{product.description}</Text>
        )}
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={11} color={SUBTLE} />
          <Text style={styles.timeText}>{product.time}</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.price}>{product.price}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={goToDetail} activeOpacity={0.8}>
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LINE,
    overflow: "hidden",
  },
  imageArea: {
    height: 96,
    overflow: "hidden",
  },
  productImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 96,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  favBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 12,
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: INK,
    lineHeight: 18,
  },
  desc: {
    fontSize: 11,
    color: MUTED,
    lineHeight: 15,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
    color: SUBTLE,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  price: {
    fontFamily: SERIF,
    fontSize: 17,
    color: INK,
    fontWeight: "400",
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
});
