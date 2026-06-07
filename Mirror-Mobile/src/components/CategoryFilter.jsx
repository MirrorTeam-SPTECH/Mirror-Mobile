import React from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { useProducts } from "../context/ProductsContext";

const PRIMARY = "#D91C1C";
const INK = "#2A1E14";
const LINE = "#E8DFD1";

const CATEGORY_KEY_MAP = {
  "Hambúrgueres": "hamburgeres",
  "Bebidas": "bebidas",
  "Acompanhamentos": "acompanhamentos",
  "Sobremesas": "sobremesas",
  "Combos": "combos",
};

export default function CategoryFilter() {
  const { t } = useTranslation();
  const { categories, selectedCategory, setSelectedCategory } = useProducts();

  const getCatLabel = (name) => {
    const key = CATEGORY_KEY_MAP[name];
    return key ? t(`category.${key}`) : name;
  };

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
            {t("category.all")}
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
              {getCatLabel(cat.name)}
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
