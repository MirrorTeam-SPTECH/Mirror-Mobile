import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";

const categories = [
  { id: 1, name: "Hamburgueres" },
  { id: 2, name: "Bebidas" },
  { id: 3, name: "Acompanhamentos" },
  { id: 4, name: "Sobremesas" },
  { id: 5, name: "Combos" },
];

export default function CategoryFilter() {
  const [selectedCategory, setSelectedCategory] = useState(1);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.button,
              selectedCategory === category.id
                ? styles.buttonActive
                : styles.buttonInactive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text
              style={[
                styles.buttonText,
                selectedCategory === category.id
                  ? styles.textActive
                  : styles.textInactive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
    paddingLeft: 15,
    width: "100%",
    justifyContent: "center",
    alignContent: "center",
  },
  scrollContent: {
    paddingRight: 15,
    gap: 10,
  },
  button: {
    paddingVertical: 9,
    paddingHorizontal: 19,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  buttonActive: {
    backgroundColor: "#C41E3A",
    borderColor: "#C41E3A",
  },
  buttonInactive: {
    backgroundColor: "#transparent",
    borderColor: "#C41E3A",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  textActive: {
    color: "#fff",
  },
  textInactive: {
    color: "#C41E3A",
  },
});
