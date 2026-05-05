import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const LINE = "#E8DFD1";
const INK = "#2A1E14";
const MUTED = "#7A6A56";

export default function SearchBar({ query = "", onChangeQuery }) {
  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <Ionicons name="search-outline" size={18} color={MUTED} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Buscar picanha, costela, linguiça..."
          placeholderTextColor={MUTED}
          returnKeyType="search"
          // @ts-ignore — web only
          outlineStyle="none"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 14 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: INK,
  },
});
