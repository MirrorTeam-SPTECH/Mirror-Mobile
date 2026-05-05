import React from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useProducts } from "../context/ProductsContext";

const PRIMARY = "#D91C1C";
const INK = "#2A1E14";
const LINE = "#E8DFD1";

export default function CategoryFilter() {
  const { categories, selectedCategory, setSelectedCategory } = useProducts();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={[styles.pill, selectedCategory === null && styles.pillActive]}
          onPress={() => setSelectedCategory(null)}
          activeOpacity={0.8}
        >
          <Text style={[styles.pillText, selectedCategory === null && styles.pillTextActive]}>
            Tudo
          </Text>
        </TouchableOpacity>

        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.pill, selectedCategory === cat.id && styles.pillActive]}
            onPress={() => setSelectedCategory(cat.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, selectedCategory === cat.id && styles.pillTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  scrollContent: { paddingHorizontal: 20, gap: 8 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: "#fff",
  },
  pillActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "500",
    color: INK,
  },
  pillTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
});
