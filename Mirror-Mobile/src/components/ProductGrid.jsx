import React from "react";
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import ProductCard from "./ProductCard";
import { useProducts } from "../context/ProductsContext";
import { formatPrice } from "../services/api";

const PRIMARY = "#D91C1C";
const MUTED = "#7A6A56";

export default function ProductGrid({ query = "" }) {
  const { products, loading, error, refreshProducts } = useProducts();

  const filtered = query.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(query.toLowerCase())
      )
    : products;

  if (loading && products.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.hint}>Carregando produtos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.hint}>Verifique se a API está rodando</Text>
      </View>
    );
  }

  if (filtered.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>Nenhum produto encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refreshProducts} colors={[PRIMARY]} />
      }
    >
      <View style={styles.grid}>
        {filtered.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              id: product.id,
              name: product.name,
              description: product.description || "",
              time: `${product.prep_minutes} min`,
              price: formatPrice(product.base_price_cents),
              image: product.image_url,
            }}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  errorText: { fontSize: 15, color: PRIMARY, textAlign: "center" },
  hint: { fontSize: 13, color: MUTED, textAlign: "center", paddingHorizontal: 20 },
});
