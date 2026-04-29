import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React from "react";
import ProductCard from "./ProductCard";
import { useProducts } from "../context/ProductsContext";
import { formatPrice } from "../services/api";

export default function ProductGrid() {
  const { products, loading, error, refreshProducts } = useProducts();

  // Show loading spinner
  if (loading && products.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#C41E3A" />
        <Text style={styles.loadingText}>Carregando produtos...</Text>
      </View>
    );
  }

  // Show error message
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorHint}>
          Verifique se a API está rodando em http://localhost:8000
        </Text>
      </View>
    );
  }

  // Show empty state
  if (products.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshProducts}
            colors={["#C41E3A"]}
          />
        }
      >
        <View style={styles.grid}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                id: product.id,
                name: product.name,
                time: `${product.prep_minutes} min`,
                price: formatPrice(product.base_price_cents),
                image: product.image_url,
              }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
    marginTop: 15,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#C41E3A",
    textAlign: "center",
    marginBottom: 10,
  },
  errorHint: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});
