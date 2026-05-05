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
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { getLoyalty } from "../services/api";

const BG      = "#FAF5EC";
const INK     = "#2A1E14";
const PRIMARY = "#D91C1C";
const SUBTLE  = "#8A7558";
const LINE    = "#E8DFD1";
const MUTED   = "#7A6A56";
const GOLD    = "#C8920A";
const SERIF   = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" });

const TOTAL_STAMPS = 10;

function StampGrid({ stampsInCycle }) {
  return (
    <View style={styles.stampGrid}>
      {Array.from({ length: TOTAL_STAMPS }).map((_, i) => {
        const filled = i < stampsInCycle;
        return (
          <View
            key={i}
            style={[styles.stamp, filled ? styles.stampFilled : styles.stampEmpty]}
          >
            {filled ? (
              <Ionicons name="checkmark" size={18} color="#fff" />
            ) : (
              <Text style={styles.stampNumber}>{i + 1}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function LoyaltyScreen({ navigation }) {
  const { isLoggedIn } = useAuth();
  const [status, setStatus]   = useState("idle");
  const [loyalty, setLoyalty] = useState(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await getLoyalty();
      setLoyalty(data);
      setStatus("ready");
    } catch (e) {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) load();
    else setStatus("guest");
  }, [isLoggedIn]);

  if (!isLoggedIn || status === "guest") {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <TopBar />
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={52} color={SUBTLE} />
          <Text style={styles.stateTitle}>Faça login para ver seu cartão fidelidade</Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (status === "loading" || status === "idle") {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <TopBar />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  if (status === "error") {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <TopBar />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={52} color={SUBTLE} />
          <Text style={styles.stateTitle}>Erro ao carregar fidelidade</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.85}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { stamps_in_cycle, cycles_completed, total_stamps, recent_stamps } = loyalty;
  const remaining = TOTAL_STAMPS - stamps_in_cycle;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <TopBar />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Reward banner */}
        {cycles_completed > 0 && (
          <View style={styles.rewardBanner}>
            <Ionicons name="trophy" size={24} color={GOLD} />
            <View style={styles.rewardBody}>
              <Text style={styles.rewardTitle}>
                {cycles_completed === 1
                  ? "Você ganhou 1 combo grátis!"
                  : `Você ganhou ${cycles_completed} combos grátis!`}
              </Text>
              <Text style={styles.rewardHint}>Apresente esse cartão no balcão ao retirar seu pedido.</Text>
            </View>
          </View>
        )}

        {/* Stamp card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardLabel}>CARTÃO FIDELIDADE</Text>
              <Text style={styles.cardTitle}>Portal do Churras</Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressCount}>{stamps_in_cycle}</Text>
              <Text style={styles.progressTotal}>/10</Text>
            </View>
          </View>

          <StampGrid stampsInCycle={stamps_in_cycle} />

          <Text style={styles.cardFooter}>
            {stamps_in_cycle === 0 && total_stamps === 0
              ? "Peça seu primeiro hambúrguer para começar!"
              : stamps_in_cycle === 0
              ? "Novo ciclo! Continue pedindo hambúrgueres."
              : remaining === 1
              ? "Falta só 1 hambúrguer para ganhar o combo!"
              : `Faltam ${remaining} hambúrgueres para ganhar o combo grátis`}
          </Text>
        </View>

        {/* Rule card */}
        <View style={styles.ruleCard}>
          <Ionicons name="information-circle-outline" size={18} color={SUBTLE} style={{ marginTop: 1 }} />
          <Text style={styles.ruleText}>
            Apenas pedidos com pelo menos 1 hambúrguer contam como carimbo.
            Bebidas e acompanhamentos sozinhos não contam.
          </Text>
        </View>

        {/* History */}
        {recent_stamps.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Histórico de carimbos</Text>
            <View style={styles.historyCard}>
              {recent_stamps.map((stamp, index) => (
                <View
                  key={stamp.order_id}
                  style={[
                    styles.historyItem,
                    index < recent_stamps.length - 1 && styles.historyItemBorder,
                  ]}
                >
                  <View style={styles.historyIconWrap}>
                    <Ionicons name="flame" size={16} color={PRIMARY} />
                  </View>
                  <View style={styles.historyBody}>
                    <Text style={styles.historyLabel}>Pedido #{stamp.order_id}</Text>
                    <Text style={styles.historyDate}>{formatDate(stamp.created_at)}</Text>
                  </View>
                  <View style={styles.historyStampDot} />
                </View>
              ))}
            </View>
          </>
        )}

        {recent_stamps.length === 0 && (
          <>
            <Text style={styles.sectionTitle}>Sem carimbos ainda</Text>
            <View style={styles.emptyCard}>
              <Ionicons name="storefront-outline" size={22} color={PRIMARY} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyText}>
                Faça seu primeiro pedido com hambúrguer e ganhe o primeiro carimbo!
              </Text>
            </View>
          </>
        )}

        <TouchableOpacity style={styles.refreshBtn} onPress={load} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={16} color={PRIMARY} />
          <Text style={styles.refreshText}>Atualizar</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function TopBar() {
  const nav = useNavigation();
  return (
    <View style={styles.topBar}>
      <TouchableOpacity
        onPress={() => nav.goBack()}
        style={styles.backBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-back" size={26} color={INK} />
      </TouchableOpacity>
      <View style={styles.topBarText}>
        <Text style={styles.topLabel}>Portal do Churras</Text>
        <Text style={styles.topTitle}>Fidelidade</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingTop: Platform.OS === "android" ? 44 : 18,
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 4,
  },
  backBtn: {
    padding: 4,
    marginBottom: 2,
  },
  backPlaceholder: {
    width: 34,
  },
  topBarText: {
    flex: 1,
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
  stateTitle: {
    fontFamily: SERIF,
    fontSize: 20,
    color: INK,
    textAlign: "center",
  },
  loginBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  loginBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  retryBtn: {
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

  rewardBanner: {
    backgroundColor: "#FFF8E7",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: GOLD,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    gap: 12,
  },
  rewardBody: { flex: 1, gap: 2 },
  rewardTitle: { fontSize: 15, fontWeight: "700", color: "#7A5200" },
  rewardHint: { fontSize: 12, color: "#9A7020", lineHeight: 18 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LINE,
    padding: 20,
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardLabel: {
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: SUBTLE,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: SERIF,
    fontSize: 20,
    color: INK,
    fontWeight: "400",
  },
  progressBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "rgba(217,28,28,0.07)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  progressCount: {
    fontFamily: SERIF,
    fontSize: 28,
    color: PRIMARY,
    fontWeight: "400",
    lineHeight: 32,
  },
  progressTotal: {
    fontSize: 14,
    color: SUBTLE,
    fontWeight: "500",
  },

  stampGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  stamp: {
    width: "17%",
    aspectRatio: 1,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  stampFilled: {
    backgroundColor: PRIMARY,
  },
  stampEmpty: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: LINE,
  },
  stampNumber: {
    fontSize: 13,
    color: MUTED,
    fontWeight: "500",
  },

  cardFooter: {
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
    lineHeight: 18,
  },

  ruleCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LINE,
    padding: 14,
    gap: 10,
  },
  ruleText: {
    flex: 1,
    fontSize: 13,
    color: MUTED,
    lineHeight: 19,
  },

  sectionTitle: {
    fontFamily: SERIF,
    fontSize: 20,
    color: INK,
    fontWeight: "400",
    letterSpacing: -0.2,
  },

  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LINE,
    overflow: "hidden",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  historyIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(217,28,28,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  historyBody: { flex: 1, gap: 2 },
  historyLabel: { fontSize: 14, fontWeight: "600", color: INK },
  historyDate: { fontSize: 12, color: MUTED },
  historyStampDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PRIMARY,
  },

  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LINE,
    padding: 20,
    alignItems: "flex-start",
  },
  emptyText: { fontSize: 14, color: MUTED, lineHeight: 21 },

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
  },
  refreshText: { fontSize: 14, color: PRIMARY, fontWeight: "500" },
});
