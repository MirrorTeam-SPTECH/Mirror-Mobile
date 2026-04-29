import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { useFavorites } from "../context/FavoritesContext";
import { formatPrice } from "../services/api";

function FavoriteCard({ product }) {
  const navigation = useNavigation();
  const { toggleFavorite } = useFavorites();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate("ProductDetail", { productId: product.id })}
    >
      <Image
        source={product.image_url ? { uri: product.image_url } : null}
        style={styles.image}
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{product.description}</Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(product.base_price_cents)}</Text>
          <Text style={styles.time}>⏱ {product.prep_minutes} min</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.heartButton}
        onPress={() => toggleFavorite(product.id)}
      >
        <Text style={styles.heart}>❤️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function FavoritesScreen() {
  const { favoriteProducts, loadFavorites } = useFavorites();

  if (favoriteProducts.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar style="auto" />
        <Text style={styles.emptyIcon}>🤍</Text>
        <Text style={styles.emptyTitle}>Nenhum favorito ainda</Text>
        <Text style={styles.emptyHint}>
          Toque no coração de um lanche para salvar aqui
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favoritos</Text>
        <Text style={styles.headerCount}>{favoriteProducts.length} itens</Text>
      </View>

      <FlatList
        data={favoriteProducts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <FavoriteCard product={item} />}
        contentContainerStyle={styles.list}
        onRefresh={loadFavorites}
        refreshing={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { justifyContent: "center", alignItems: "center", padding: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 55,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#333" },
  headerCount: { fontSize: 14, color: "#999" },
  list: { padding: 15, paddingBottom: 100 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    alignItems: "center",
  },
  image: {
    width: 90,
    height: 90,
    backgroundColor: "#f0f0f0",
  },
  info: { flex: 1, padding: 12 },
  name: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 4 },
  description: { fontSize: 13, color: "#999", marginBottom: 8, lineHeight: 18 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  price: { fontSize: 16, fontWeight: "bold", color: "#2ECC71" },
  time: { fontSize: 12, color: "#999" },
  heartButton: { padding: 14 },
  heart: { fontSize: 22 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#333", marginBottom: 8 },
  emptyHint: { fontSize: 14, color: "#999", textAlign: "center", lineHeight: 20 },
});
