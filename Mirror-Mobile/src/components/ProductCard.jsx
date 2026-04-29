import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { useFavorites } from "../context/FavoritesContext";

export default function ProductCard({ product }) {
  const navigation = useNavigation();
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleCardPress = () => {
    navigation.navigate("ProductDetail", { productId: product.id });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handleCardPress} activeOpacity={0.7}>
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={(e) => {
          e.stopPropagation();
          toggleFavorite(product.id);
        }}
      >
        <Text style={styles.heartIcon}>{isFavorite(product.id) ? "❤️" : "🤍"}</Text>
      </TouchableOpacity>

      <Image source={{ uri: product.image }} style={styles.image} />

      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.time}>⏱ {product.time}</Text>
      <Text style={styles.price}>{product.price}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    width: "47%",
    marginBottom: 15,
    position: "relative",
  },
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 5,
  },
  heartIcon: {
    fontSize: 18,
  },
  image: {
    width: "100%",
    height: 100,
    resizeMode: "contain",
    marginBottom: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  time: {
    fontSize: 12,
    color: "#999",
    marginBottom: 5,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2ECC71",
  },
});
