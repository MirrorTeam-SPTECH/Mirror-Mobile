import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { setLanguage } from "../i18n";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { getOrders } from "../services/api";

const BG = "#FAF5EC";
const INK = "#2A1E14";
const PRIMARY = "#D91C1C";
const SUBTLE = "#8A7558";
const LINE = "#E8DFD1";
const MUTED = "#7A6A56";
const GOLD = "#FFD66B";
const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" });

function statusLabel(count, t) {
  if (count >= 16) return t("profile.status_loyal");
  if (count >= 6) return t("profile.status_regular");
  return t("profile.status_new");
}

export default function ProfileScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { favoriteIds } = useFavorites();
  const [ordersCount, setOrdersCount] = useState(null);

  const MENU_ITEMS = [
    { key: "analytics", label: t("profile.menu_analytics"), icon: "bar-chart-outline", screen: "Analytics" },
    { key: "orders",    label: t("profile.menu_orders"),    icon: "receipt-outline",   screen: "OrderHistory" },
    { key: "nearby",    label: t("profile.menu_nearby"),    icon: "location-outline",  screen: "Nearby" },
    { key: "grill",     label: t("profile.menu_grill"),     icon: "flame-outline",     screen: "GrillAdvisor" },
    { key: "scanner",   label: t("profile.menu_scanner"),   icon: "scan-outline",      screen: "LabelScanner" },
  ];

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";
  const firstName = user?.name ? user.name.split(" ")[0] : t("profile.guest");

  useFocusEffect(
    useCallback(() => {
      getOrders()
        .then((orders) => {
          const valid = orders.filter((o) =>
            ["paid", "preparing", "ready", "delivered"].includes(o.status)
          );
          setOrdersCount(valid.length);
        })
        .catch(() => setOrdersCount(0));
    }, [])
  );

  const handleLogout = () => {
    logout();
    navigation.navigate("Login");
  };

  const toggleLanguage = () => {
    const next = i18n.language === "pt-BR" ? "en" : "pt-BR";
    setLanguage(next);
  };

  const count = ordersCount ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      <View style={styles.topBar}>
        <Text style={styles.topLabel}>{t("common.app_name")}</Text>
        <Text style={styles.topTitle}>{t("profile.title")}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </View>
          <Text style={styles.greeting}>{t("profile.greeting", { name: firstName })}</Text>
          {!!user?.email && <Text style={styles.email}>{user.email}</Text>}
        </View>

        {/* Mini stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{ordersCount === null ? "—" : String(count)}</Text>
            <Text style={styles.statLabel}>{t("profile.stats_orders")}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{favoriteIds.size}</Text>
            <Text style={styles.statLabel}>{t("profile.stats_favorites")}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.statSerifItalic]}>{statusLabel(count, t)}</Text>
            <Text style={styles.statLabel}>{t("profile.stats_status")}</Text>
          </View>
        </View>

        {/* Retrospectiva card */}
        <TouchableOpacity
          style={styles.retroCard}
          onPress={() => navigation.navigate("Dashboard")}
          activeOpacity={0.88}
        >
          <View style={styles.retroBadge}>
            <Text style={styles.retroBadgeNumber}>{count}</Text>
            <Text style={styles.retroBadgeLabel}>{t("profile.stats_orders")}</Text>
          </View>
          <View style={styles.retroInfo}>
            <Text style={styles.retroEyebrow}>{t("profile.retro_eyebrow")}</Text>
            <Text style={styles.retroTitle}>
              {t("profile.retro_title_year")}{" "}
              <Text style={styles.retroTitleAccent}>{t("profile.retro_title_accent")}</Text>
            </Text>
            <Text style={styles.retroSub}>{t("profile.retro_sub")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(250,245,236,0.7)" />
        </TouchableOpacity>

        {/* Menu */}
        <Text style={styles.sectionTitle}>{t("profile.shortcuts")}</Text>
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.menuItem, index < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon} size={18} color={PRIMARY} />
              </View>
              <Text style={styles.menuText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={SUBTLE} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Language toggle */}
        <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage} activeOpacity={0.8}>
          <Ionicons name="language-outline" size={18} color={SUBTLE} />
          <Text style={styles.langText}>{t("profile.language")}</Text>
          <Text style={styles.langValue}>{i18n.language === "pt-BR" ? "PT-BR" : "EN"}</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color="#8A2716" />
          <Text style={styles.logoutText}>{t("profile.logout")}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>{t("profile.version")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  topBar: {
    paddingTop: Platform.OS === "android" ? 44 : 18,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  topLabel: {
    fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase",
    color: SUBTLE, fontWeight: "600", marginBottom: 4,
  },
  topTitle: {
    fontFamily: SERIF, fontSize: 28, color: INK, fontWeight: "400", letterSpacing: -0.3,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  hero: { alignItems: "center", paddingVertical: 24 },
  avatarRing: {
    width: 92, height: 92, borderRadius: 46,
    borderWidth: 3, borderColor: PRIMARY,
    backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    marginBottom: 14,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: PRIMARY,
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { color: BG, fontFamily: SERIF, fontSize: 34, fontWeight: "400" },
  greeting: {
    fontFamily: SERIF, fontSize: 26, color: INK, fontWeight: "400",
    letterSpacing: -0.3, marginBottom: 4,
  },
  email: { fontSize: 13, color: MUTED, letterSpacing: 0.2 },

  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1, padding: 10, backgroundColor: "#fff",
    borderWidth: 1, borderColor: LINE, borderRadius: 12, alignItems: "center",
  },
  statValue: { fontSize: 22, fontWeight: "600", color: INK, lineHeight: 26 },
  statSerifItalic: {
    fontFamily: SERIF, fontStyle: "italic", fontSize: 17,
    fontWeight: "400", color: PRIMARY,
  },
  statLabel: {
    fontSize: 10, letterSpacing: 1, textTransform: "uppercase",
    color: SUBTLE, fontWeight: "500", marginTop: 4,
  },

  retroCard: {
    flexDirection: "row", alignItems: "center", gap: 14, padding: 16,
    backgroundColor: PRIMARY, borderRadius: 16, marginBottom: 28,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  retroBadge: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: "rgba(255,214,107,0.18)",
    borderWidth: 1, borderColor: "rgba(255,214,107,0.35)",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  retroBadgeNumber: {
    fontFamily: SERIF, fontSize: 22, color: GOLD, fontWeight: "400", lineHeight: 26,
  },
  retroBadgeLabel: {
    fontSize: 8, letterSpacing: 1.4, textTransform: "uppercase", color: GOLD, opacity: 0.85,
  },
  retroInfo: { flex: 1 },
  retroEyebrow: {
    fontSize: 10, letterSpacing: 1.8, textTransform: "uppercase",
    color: "rgba(250,245,236,0.7)", fontWeight: "600",
  },
  retroTitle: {
    fontFamily: SERIF, fontSize: 20, color: BG,
    fontWeight: "400", letterSpacing: -0.3, marginTop: 2,
  },
  retroTitleAccent: { color: GOLD, fontStyle: "italic" },
  retroSub: { fontSize: 12, color: "rgba(250,245,236,0.75)", marginTop: 4 },

  sectionTitle: {
    fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase",
    color: SUBTLE, fontWeight: "600", paddingHorizontal: 4, marginBottom: 8,
  },
  menuCard: {
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1, borderColor: LINE, overflow: "hidden", marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 16, paddingHorizontal: 16, gap: 12,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: LINE },
  menuIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(217,28,28,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  menuText: { flex: 1, fontSize: 15, color: INK, fontWeight: "500" },

  langBtn: {
    flexDirection: "row", alignItems: "center",
    gap: 12, paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 1, borderColor: LINE, borderRadius: 14,
    backgroundColor: "#fff", marginBottom: 12,
  },
  langText: { flex: 1, fontSize: 15, color: INK, fontWeight: "500" },
  langValue: { fontSize: 13, color: SUBTLE, fontWeight: "600" },

  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderWidth: 1, borderColor: LINE, borderRadius: 14,
    paddingVertical: 16, marginBottom: 16,
  },
  logoutText: { color: "#8A2716", fontSize: 15, fontWeight: "500" },

  version: {
    textAlign: "center", fontSize: 12, color: "#A89A82",
    fontFamily: SERIF, fontStyle: "italic",
  },
});
