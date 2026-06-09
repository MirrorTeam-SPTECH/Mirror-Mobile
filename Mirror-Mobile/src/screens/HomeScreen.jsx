import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, SafeAreaView, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { getTruckStatus } from "../services/api";
import TopBar from "../components/TopBar";
import SearchBar from "../components/SearchBar";
import CategoryFilter from "../components/CategoryFilter";
import ProductGrid from "../components/ProductGrid";

const BG      = "#FAF5EC";
const INK     = "#2A1E14";
const PRIMARY = "#D91C1C";
const SUBTLE  = "#8A7558";
const LINE    = "#E8DFD1";
const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" });

function TruckStatusBanner({ t }) {
  const [status, setStatus] = useState(null);
  const weekdays = t("home.truck_weekdays", { returnObjects: true });

  useEffect(() => {
    getTruckStatus().then(setStatus).catch(() => {});
  }, []);

  if (!status) return null;

  let label;
  if (status.open) {
    label = t("home.truck_open", { closes: status.closes_at });
  } else if (status.opens_today) {
    label = t("home.truck_closed_today");
  } else {
    const dayName = weekdays[status.next_weekday] ?? "";
    label = t("home.truck_closed_next", { day: dayName });
  }

  return (
    <View style={[styles.statusBanner, status.open ? styles.statusBannerOpen : styles.statusBannerClosed]}>
      <View style={[styles.statusDot, status.open ? styles.statusDotOpen : styles.statusDotClosed]} />
      <Text style={[styles.statusText, status.open ? styles.statusTextOpen : styles.statusTextClosed]}>
        {label}
      </Text>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const firstName = user?.name ? user.name.split(" ")[0] : null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <TopBar navigation={navigation} />

      <TruckStatusBanner t={t} />

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

  // Truck status banner
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginHorizontal: 20,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusBannerOpen: {
    backgroundColor: "#EBF5EB",
    borderColor: "#C8E6C9",
  },
  statusBannerClosed: {
    backgroundColor: LINE,
    borderColor: "#D6C8B0",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusDotOpen: { backgroundColor: "#388E3C" },
  statusDotClosed: { backgroundColor: SUBTLE },
  statusText: { fontSize: 12, fontWeight: "500" },
  statusTextOpen: { color: "#2E7D32" },
  statusTextClosed: { color: SUBTLE },

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
