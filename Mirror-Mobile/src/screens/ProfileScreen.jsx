import React from "react";
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
import { useAuth } from "../context/AuthContext";

const BG = "#FAF5EC";
const INK = "#2A1E14";
const PRIMARY = "#D91C1C";
const SUBTLE = "#8A7558";
const LINE = "#E8DFD1";
const MUTED = "#7A6A56";
const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" });

const MENU_ITEMS = [
  { key: "orders",    label: "Meus Pedidos",           icon: "receipt-outline",  screen: "OrderHistory" },
  { key: "favorites", label: "Favoritos",               icon: "heart-outline",    screen: "Favorites"    },
  { key: "grill",     label: "Churrasqueiro de Bolso",  icon: "flame-outline",    screen: "GrillAdvisor" },
  { key: "scanner",   label: "Scanner Comparativo",     icon: "scan-outline",     screen: "LabelScanner" },
];

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const handleLogout = () => {
    logout();
    navigation.navigate("Login");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      <View style={styles.topBar}>
        <Text style={styles.topLabel}>Portal do Churras</Text>
        <Text style={styles.topTitle}>Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{user?.name || "Usuário"}</Text>
          {!!user?.email && <Text style={styles.email}>{user.email}</Text>}
        </View>

        <Text style={styles.sectionTitle}>Minha conta</Text>

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

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  topBar: {
    paddingTop: Platform.OS === "android" ? 44 : 18,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  topLabel: {
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: SUBTLE,
    fontWeight: "600",
    marginBottom: 4,
  },
  topTitle: {
    fontFamily: SERIF,
    fontSize: 28,
    color: INK,
    fontWeight: "400",
    letterSpacing: -0.3,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  hero: {
    alignItems: "center",
    paddingVertical: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarText: {
    color: "#fff",
    fontFamily: SERIF,
    fontSize: 34,
    fontWeight: "400",
  },
  name: {
    fontFamily: SERIF,
    fontSize: 22,
    color: INK,
    fontWeight: "400",
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: MUTED,
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontFamily: SERIF,
    fontSize: 20,
    color: INK,
    fontWeight: "400",
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LINE,
    overflow: "hidden",
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(217,28,28,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: INK,
    fontWeight: "500",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 16,
  },
  logoutText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
