import React, { useState } from "react";
import { StyleSheet, Text, View, SafeAreaView, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import SearchBar from "../components/SearchBar";
import CategoryFilter from "../components/CategoryFilter";
import ProductGrid from "../components/ProductGrid";

const BG = "#FAF5EC";
const INK = "#2A1E14";
const PRIMARY = "#D91C1C";
const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" });

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const firstName = user?.name ? user.name.split(" ")[0] : null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <TopBar navigation={navigation} />

      <Text style={styles.heading}>
        {firstName ? t("home.greeting_name", { name: firstName }) : t("home.greeting")}
        <Text style={styles.headingAccent}>{t("home.question")}</Text>
      </Text>

      <SearchBar query={query} onChangeQuery={setQuery} />
      <CategoryFilter />

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>{t("home.section_start")}</Text>
      </View>

      <ProductGrid query={query} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  heading: {
    fontFamily: SERIF,
    fontSize: 28,
    lineHeight: 36,
    color: INK,
    fontWeight: "400",
    letterSpacing: -0.3,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headingAccent: {
    fontFamily: SERIF,
    fontStyle: "italic",
    color: PRIMARY,
  },
  sectionRow: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontFamily: SERIF,
    fontSize: 20,
    color: INK,
    fontWeight: "400",
    letterSpacing: -0.2,
  },
});
