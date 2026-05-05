import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useAuth } from "../context/AuthContext";
import { getTopProduct } from "../services/api";

const BG     = "#FAF5EC";
const INK    = "#2A1E14";
const PRIMARY = "#D91C1C";
const SUBTLE  = "#8A7558";
const LINE    = "#E8DFD1";
const MUTED   = "#7A6A56";
const GREEN   = "#27AE60";
const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" });

// Rua Domingos Giglio 81, Pirituba, São Paulo
const FOOD_TRUCK_LAT     = -23.481362;
const FOOD_TRUCK_LNG     = -46.711614;
const FOOD_TRUCK_ADDRESS = "Rua Domingos Giglio, 81 — Pirituba, São Paulo";
const NEARBY_RADIUS_M  = 300; // metros

function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function TopBarHeader() {
  return (
    <View style={styles.topBar}>
      <Text style={styles.topLabel}>Portal do Churras</Text>
      <Text style={styles.topTitle}>Perto de você</Text>
    </View>
  );
}

export default function ProximityScreen() {
  const { isLoggedIn } = useAuth();
  const [status, setStatus]       = useState("idle");
  const [distance, setDistance]   = useState(null);
  const [topProduct, setTopProduct] = useState(null);

  const check = useCallback(async () => {
    setStatus("loading");
    setDistance(null);
    setTopProduct(null);
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== "granted") {
        setStatus("denied");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const d = distanceMeters(
        loc.coords.latitude,
        loc.coords.longitude,
        FOOD_TRUCK_LAT,
        FOOD_TRUCK_LNG
      );
      setDistance(d);

      if (isLoggedIn) {
        try {
          const tp = await getTopProduct();
          setTopProduct(tp);
        } catch (_) {
          // usuário sem histórico de pedidos — tudo bem
        }
      }
      setStatus("ready");
    } catch (_) {
      setStatus("error");
    }
  }, [isLoggedIn]);

  useEffect(() => { check(); }, []);

  const isNearby = distance !== null && distance <= NEARBY_RADIUS_M;

  if (status === "loading" || status === "idle") {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <TopBarHeader />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Obtendo localização...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status === "denied") {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <TopBarHeader />
        <View style={styles.center}>
          <Ionicons name="location-off-outline" size={56} color={SUBTLE} />
          <Text style={styles.stateTitle}>Localização bloqueada</Text>
          <Text style={styles.stateDesc}>
            Permita o acesso à localização nas configurações do dispositivo para usar esta função.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status === "error") {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <TopBarHeader />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={56} color={SUBTLE} />
          <Text style={styles.stateTitle}>Não foi possível obter a localização</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={check} activeOpacity={0.85}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <TopBarHeader />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Card de status */}
        <View style={[styles.statusCard, { borderColor: isNearby ? GREEN : LINE }]}>
          <View style={[
            styles.statusIconWrap,
            { backgroundColor: isNearby ? "rgba(39,174,96,0.1)" : "rgba(138,117,88,0.1)" },
          ]}>
            <Ionicons
              name={isNearby ? "location" : "location-outline"}
              size={32}
              color={isNearby ? GREEN : SUBTLE}
            />
          </View>
          <Text style={[styles.statusLabel, { color: isNearby ? GREEN : MUTED }]}>
            {isNearby ? "Você está perto!" : "Você está longe"}
          </Text>
          <Text style={styles.distanceText}>
            {isNearby
              ? `a ${formatDistance(distance)} do Portal do Churras`
              : `Portal do Churras está a ${formatDistance(distance)} de você`}
          </Text>
        </View>

        {/* Sugestão do lanche favorito — só quando perto e com histórico */}
        {isNearby && topProduct && (
          <>
            <Text style={styles.sectionTitle}>Seu lanche de sempre</Text>
            <View style={styles.suggestionCard}>
              <View style={styles.suggestionIconWrap}>
                <Ionicons name="flame-outline" size={22} color={PRIMARY} />
              </View>
              <View style={styles.suggestionBody}>
                <Text style={styles.suggestionName}>{topProduct.name}</Text>
                <Text style={styles.suggestionHint}>
                  Você já pediu {topProduct.total_quantity}× — que tal de novo?
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={SUBTLE} />
            </View>
          </>
        )}

        {/* Quando perto mas sem histórico */}
        {isNearby && !topProduct && isLoggedIn && (
          <>
            <Text style={styles.sectionTitle}>Primeira vez por aqui?</Text>
            <View style={styles.infoCard}>
              <Ionicons name="storefront-outline" size={20} color={PRIMARY} style={{ marginBottom: 8 }} />
              <Text style={styles.infoText}>
                Você está perto! Faça seu primeiro pedido e da próxima vez sugerimos o seu favorito.
              </Text>
            </View>
          </>
        )}

        {/* Incentivo quando longe */}
        {!isNearby && (
          <>
            <Text style={styles.sectionTitle}>Venha nos visitar</Text>
            <View style={styles.infoCard}>
              <Ionicons name="storefront-outline" size={20} color={PRIMARY} style={{ marginBottom: 8 }} />
              <Text style={styles.infoText}>
                Quando você estiver a menos de {NEARBY_RADIUS_M} m do Portal do Churras, avisamos e mostramos o seu lanche favorito automaticamente.
              </Text>
            </View>
          </>
        )}

        {/* Endereço do food truck */}
        <Text style={styles.sectionTitle}>Onde estamos</Text>
        <View style={styles.addressCard}>
          <View style={styles.addressIconWrap}>
            <Ionicons name="location" size={18} color={PRIMARY} />
          </View>
          <View style={styles.addressBody}>
            <Text style={styles.addressText}>{FOOD_TRUCK_ADDRESS}</Text>
            <Text style={styles.addressHint}>Procure o food truck na rua!</Text>
          </View>
        </View>

        {/* Botão de atualizar */}
        <TouchableOpacity style={styles.refreshBtn} onPress={check} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={16} color={PRIMARY} />
          <Text style={styles.refreshText}>Atualizar localização</Text>
        </TouchableOpacity>

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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    gap: 16,
  },
  loadingText: { fontSize: 14, color: MUTED },
  stateTitle: {
    fontFamily: SERIF,
    fontSize: 20,
    color: INK,
    textAlign: "center",
  },
  stateDesc: {
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 8,
  },
  statusIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statusLabel: {
    fontFamily: SERIF,
    fontSize: 22,
    fontWeight: "400",
  },
  distanceText: {
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
  },
  sectionTitle: {
    fontFamily: SERIF,
    fontSize: 20,
    color: INK,
    fontWeight: "400",
    letterSpacing: -0.2,
  },
  suggestionCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LINE,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  suggestionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(217,28,28,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionBody: { flex: 1, gap: 2 },
  suggestionName: { fontSize: 15, fontWeight: "600", color: INK },
  suggestionHint: { fontSize: 12, color: MUTED },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LINE,
    padding: 20,
  },
  infoText: { fontSize: 14, color: MUTED, lineHeight: 21 },
  addressCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LINE,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  addressIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(217,28,28,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  addressBody: { flex: 1, gap: 2 },
  addressText: { fontSize: 14, fontWeight: "600", color: INK, lineHeight: 19 },
  addressHint: { fontSize: 12, color: MUTED },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: "#fff",
    marginTop: 4,
  },
  refreshText: { fontSize: 14, color: PRIMARY, fontWeight: "500" },
});
