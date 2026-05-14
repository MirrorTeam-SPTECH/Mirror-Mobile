import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { formatPrice, getLoyalty, getOrders, getTopProduct } from "../services/api";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const BG      = "#FAF5EC";
const INK     = "#2A1E14";
const PRIMARY = "#D91C1C";
const SUBTLE  = "#8A7558";
const LINE    = "#E8DFD1";
const MUTED   = "#7A6A56";
const GOLD    = "#FFD66B";
const SERIF   = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" });

const DAYS_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const TIME_SLOTS = ["Manhã\n6h–11h", "Tarde\n12h–17h", "Noite\n18h–23h", "Madrugada\n0h–5h"];
const TIME_ICONS = ["sunny-outline", "partly-sunny-outline", "moon-outline", "star-outline"];

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, valueStyle, flex = 1, accent = false }) {
  return (
    <View style={[s.kpiCard, { flex }, accent && s.kpiCardAccent]}>
      <View style={[s.kpiIconWrap, accent && { backgroundColor: "rgba(255,255,255,0.2)" }]}>
        <Ionicons name={icon} size={16} color={accent ? "#fff" : PRIMARY} />
      </View>
      <Text style={[s.kpiLabel, accent && { color: "rgba(255,255,255,0.7)" }]}>{label}</Text>
      <Text style={[s.kpiValue, accent && { color: "#fff" }, valueStyle]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title }) {
  return <Text style={s.sectionHeader}>{title}</Text>;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading]       = useState(true);
  const [orders, setOrders]         = useState([]);
  const [topProduct, setTopProduct] = useState(null);
  const [loyalty, setLoyalty]       = useState(null);

  useEffect(() => {
    (async () => {
      const [oR, tR, lR] = await Promise.allSettled([
        getOrders(), getTopProduct(), getLoyalty(),
      ]);
      if (oR.status === "fulfilled") setOrders(oR.value);
      if (tR.status === "fulfilled") setTopProduct(tR.value);
      if (lR.status === "fulfilled") setLoyalty(lR.value);
      setLoading(false);
    })();
  }, []);

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const nonCancelled = orders.filter((o) => o.status !== "cancelled");
  const paidOrders   = orders.filter((o) =>
    ["paid", "preparing", "ready", "delivered"].includes(o.status)
  );
  const delivered  = orders.filter((o) => o.status === "delivered").length;
  const totalSpent = paidOrders.reduce((s, o) => s + (o.total_cents || 0), 0);
  const avgTicket  = paidOrders.length > 0
    ? Math.round(totalSpent / paidOrders.length)
    : 0;

  // Top items
  const itemMap = {};
  orders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const k = String(item.product_id);
      if (!itemMap[k]) itemMap[k] = { name: item.name_snapshot, count: 0 };
      itemMap[k].count += item.quantity;
    });
  });
  let topItems = Object.values(itemMap).sort((a, b) => b.count - a.count).slice(0, 5);
  if (topItems.length === 0 && topProduct) {
    topItems = [{ name: topProduct.name, count: topProduct.total_quantity }];
  }
  const topName  = topItems[0]?.name ?? "—";
  const maxItem  = topItems[0]?.count ?? 1;

  // Day of week (Mon → Sun)
  const rawDay = Array(7).fill(0);
  orders.forEach((o) => { if (o.created_at) rawDay[new Date(o.created_at).getDay()]++; });
  const dayCounts = [rawDay[1], rawDay[2], rawDay[3], rawDay[4], rawDay[5], rawDay[6], rawDay[0]];
  const maxDay    = Math.max(...dayCounts, 1);
  const peakDayI  = dayCounts.indexOf(Math.max(...dayCounts));

  // Time slots
  const timeCounts = [0, 0, 0, 0];
  orders.forEach((o) => {
    if (!o.created_at) return;
    const h = new Date(o.created_at).getHours();
    if (h >= 6 && h < 12) timeCounts[0]++;
    else if (h >= 12 && h < 18) timeCounts[1]++;
    else if (h >= 18) timeCounts[2]++;
    else timeCounts[3]++;
  });
  const maxTime   = Math.max(...timeCounts, 1);
  const peakSlot  = timeCounts.indexOf(Math.max(...timeCounts));

  // Ranking position (same mock as DashboardScreen)
  const MOCK = [
    { orders: 47 }, { orders: 38 }, { orders: 31 }, { orders: 28 },
    { orders: 22 }, { orders: 19 }, { orders: 15 }, { orders: 11 },
  ];
  const rankPos = [...MOCK, { orders: nonCancelled.length }]
    .sort((a, b) => b.orders - a.orders)
    .findIndex((u) => u.orders === nonCancelled.length) + 1;

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { justifyContent: "center", alignItems: "center" }]}>
        <StatusBar style="dark" />
        <ActivityIndicator color={PRIMARY} size="large" />
      </SafeAreaView>
    );
  }

  const BAR_MAX_H = 110;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={INK} />
        </TouchableOpacity>
        <View>
          <Text style={s.topLabel}>Portal do Churras</Text>
          <Text style={s.topTitle}>Análises</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── KPI row 1 (3 cards) ─────────────────────────────────────────── */}
        <SectionHeader title="RESUMO" />
        <View style={s.kpiRow}>
          <KpiCard
            icon="receipt-outline"
            label="Total de pedidos"
            value={String(nonCancelled.length)}
            accent
          />
          <KpiCard
            icon="cash-outline"
            label="Total gasto"
            value={formatPrice(totalSpent)}
            valueStyle={{ fontSize: 15 }}
          />
          <KpiCard
            icon="checkmark-circle-outline"
            label="Entregues"
            value={String(delivered)}
          />
        </View>

        {/* ── KPI row 2 (2 cards) ─────────────────────────────────────────── */}
        <View style={[s.kpiRow, { marginTop: 0 }]}>
          <KpiCard
            icon="trending-up-outline"
            label="Ticket médio"
            value={avgTicket > 0 ? formatPrice(avgTicket) : "—"}
            valueStyle={{ fontSize: 15 }}
            flex={1}
          />
          <KpiCard
            icon="star-outline"
            label="Fidelidade"
            value={loyalty ? `${loyalty.stamps_in_cycle}/10 selos` : "—"}
            flex={1}
          />
          <KpiCard
            icon="trophy-outline"
            label="Ranking"
            value={`#${rankPos} da casa`}
            flex={1}
          />
        </View>

        {/* ── Gráfico de barras — Pedidos por dia da semana ───────────────── */}
        <SectionHeader title="PEDIDOS POR DIA DA SEMANA" />
        <View style={s.card}>
          <View style={s.chartLegendRow}>
            <View style={s.chartLegendDot} />
            <Text style={s.chartLegendText}>Nº de pedidos por dia</Text>
            <Text style={s.chartPeakBadge}>
              Pico: {DAYS_SHORT[peakDayI]} ({dayCounts[peakDayI]})
            </Text>
          </View>

          <View style={[s.barChart, { height: BAR_MAX_H + 48 }]}>
            {dayCounts.map((count, i) => {
              const isPeak = i === peakDayI;
              const h = maxDay > 0 ? Math.max(4, (count / maxDay) * BAR_MAX_H) : 4;
              return (
                <View key={i} style={s.barCol}>
                  <Text style={[s.barCountLabel, { color: isPeak ? PRIMARY : MUTED }]}>
                    {count > 0 ? count : ""}
                  </Text>
                  <View style={[s.barTrack, { height: BAR_MAX_H }]}>
                    <View
                      style={[
                        s.bar,
                        { height: h, backgroundColor: isPeak ? PRIMARY : `${PRIMARY}33` },
                      ]}
                    />
                  </View>
                  <Text style={[s.barDayLabel, isPeak && { color: INK, fontWeight: "700" }]}>
                    {DAYS_SHORT[i]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Gráfico horizontal — Top lanches ────────────────────────────── */}
        <SectionHeader title="TOP LANCHES" />
        <View style={s.card}>
          {topItems.length === 0 ? (
            <Text style={[s.emptyText]}>Nenhum item encontrado nos pedidos.</Text>
          ) : (
            topItems.map((item, i) => (
              <View key={i} style={s.hBarRow}>
                <View style={s.hBarMeta}>
                  <Text style={s.hBarRank}>{String(i + 1).padStart(2, "0")}</Text>
                  <Text style={s.hBarName} numberOfLines={1}>{item.name}</Text>
                  <Text style={s.hBarCount}>{item.count}×</Text>
                </View>
                <View style={s.hBarTrack}>
                  <View
                    style={[
                      s.hBarFill,
                      {
                        width: `${(item.count / maxItem) * 100}%`,
                        backgroundColor: i === 0 ? PRIMARY : `${PRIMARY}55`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── Gráfico horizontal — Horário preferido ──────────────────────── */}
        <SectionHeader title="HORÁRIO PREFERIDO" />
        <View style={s.card}>
          <View style={s.chartLegendRow}>
            <View style={s.chartLegendDot} />
            <Text style={s.chartLegendText}>Distribuição de pedidos por período</Text>
          </View>
          {timeCounts.map((count, i) => {
            const isPeak = i === peakSlot;
            const pct    = maxTime > 0 ? (count / maxTime) * 100 : 0;
            return (
              <View key={i} style={s.timeRow}>
                <View style={s.timeRowLeft}>
                  <Ionicons
                    name={TIME_ICONS[i]}
                    size={16}
                    color={isPeak ? PRIMARY : SUBTLE}
                  />
                  <Text style={[s.timeLabel, isPeak && { color: INK, fontWeight: "700" }]}>
                    {TIME_SLOTS[i].replace("\n", " ")}
                  </Text>
                </View>
                <View style={s.timeBarWrap}>
                  <View style={s.timeBarTrack}>
                    <View
                      style={[
                        s.timeBarFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: isPeak ? PRIMARY : `${PRIMARY}40`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[s.timeCount, isPeak && { color: PRIMARY, fontWeight: "700" }]}>
                    {count}
                  </Text>
                </View>
                {isPeak && (
                  <View style={s.peakTag}>
                    <Text style={s.peakTagText}>Pico</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ── Card — Lanche favorito ──────────────────────────────────────── */}
        <SectionHeader title="SEU FAVORITO" />
        <View style={[s.card, s.favCard]}>
          <Text style={{ fontSize: 40 }}>🍔</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.favName} numberOfLines={2}>{topName}</Text>
            {topItems[0] && (
              <Text style={s.favSub}>Pedido {topItems[0].count}× — seu lanche de sempre</Text>
            )}
          </View>
        </View>

        {/* ── Fidelidade ──────────────────────────────────────────────────── */}
        {loyalty && (
          <>
            <SectionHeader title="FIDELIDADE" />
            <View style={s.card}>
              <View style={s.stampsRow}>
                {Array.from({ length: 10 }).map((_, i) => {
                  const filled = i < (loyalty.stamps_in_cycle || 0);
                  return (
                    <View key={i} style={[s.stamp, filled && s.stampFilled]}>
                      {filled && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                  );
                })}
              </View>
              <Text style={s.loyaltySub}>
                {loyalty.stamps_in_cycle}/10 selos no ciclo atual ·{" "}
                <Text style={{ fontWeight: "700", color: INK }}>
                  {loyalty.cycles_completed} combo{loyalty.cycles_completed !== 1 ? "s" : ""}
                </Text>{" "}
                conquistado{loyalty.cycles_completed !== 1 ? "s" : ""}
              </Text>
            </View>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? 44 : 18,
    paddingHorizontal: 20, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: LINE,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: "#fff",
    borderWidth: 1, borderColor: LINE, alignItems: "center", justifyContent: "center",
  },
  topLabel: {
    fontSize: 10, letterSpacing: 1.6, textTransform: "uppercase", color: SUBTLE, fontWeight: "600",
  },
  topTitle: {
    fontFamily: SERIF, fontSize: 22, color: INK, fontWeight: "400", letterSpacing: -0.3,
  },

  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },

  sectionHeader: {
    fontSize: 10, letterSpacing: 1.8, textTransform: "uppercase",
    color: SUBTLE, fontWeight: "700", marginBottom: 8, marginTop: 20, paddingHorizontal: 2,
  },

  // KPI cards
  kpiRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  kpiCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1, borderColor: LINE, padding: 14, gap: 6,
  },
  kpiCardAccent: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  kpiIconWrap: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: "rgba(217,28,28,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  kpiLabel: { fontSize: 11, color: MUTED, fontWeight: "500", lineHeight: 14 },
  kpiValue: {
    fontFamily: SERIF, fontSize: 20, color: INK, fontWeight: "400", lineHeight: 24,
  },

  // Generic card
  card: {
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1, borderColor: LINE, padding: 16, marginBottom: 4,
  },

  // Chart legend
  chartLegendRow: {
    flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14,
  },
  chartLegendDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY,
  },
  chartLegendText: { flex: 1, fontSize: 12, color: MUTED },
  chartPeakBadge: {
    fontSize: 11, color: PRIMARY, fontWeight: "700",
    backgroundColor: `${PRIMARY}12`, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20,
  },

  // Vertical bar chart
  barChart: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  barCountLabel: { fontSize: 10, fontWeight: "700" },
  barTrack: { justifyContent: "flex-end", width: "100%" },
  bar: { width: "100%", borderRadius: 5, minHeight: 4 },
  barDayLabel: { fontSize: 10, color: MUTED, fontWeight: "500" },

  // Horizontal bars (top lanches)
  hBarRow: { marginBottom: 12 },
  hBarMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  hBarRank: {
    fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: SUBTLE, width: 22,
  },
  hBarName: { flex: 1, fontSize: 13, color: INK, fontWeight: "500" },
  hBarCount: { fontSize: 13, color: MUTED, minWidth: 28, textAlign: "right" },
  hBarTrack: {
    height: 8, backgroundColor: BG, borderWidth: 1, borderColor: LINE,
    borderRadius: 999, overflow: "hidden",
  },
  hBarFill: { height: "100%", borderRadius: 999 },

  // Horizontal bars (horário)
  timeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  timeRowLeft: { flexDirection: "row", alignItems: "center", gap: 6, width: 120 },
  timeLabel: { fontSize: 12, color: MUTED, flex: 1 },
  timeBarWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  timeBarTrack: {
    flex: 1, height: 8, backgroundColor: BG,
    borderWidth: 1, borderColor: LINE, borderRadius: 999, overflow: "hidden",
  },
  timeBarFill: { height: "100%", borderRadius: 999 },
  timeCount: { fontSize: 12, color: MUTED, width: 20, textAlign: "right" },
  peakTag: {
    backgroundColor: `${PRIMARY}12`, borderRadius: 20,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  peakTagText: { fontSize: 10, color: PRIMARY, fontWeight: "700" },

  // Favorito
  favCard: { flexDirection: "row", alignItems: "center", gap: 14 },
  favName: { fontFamily: SERIF, fontSize: 18, color: INK, fontWeight: "400" },
  favSub: { fontSize: 12, color: MUTED, marginTop: 4 },

  // Fidelidade
  stampsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 10 },
  stamp: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: LINE, alignItems: "center", justifyContent: "center",
  },
  stampFilled: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  loyaltySub: { fontSize: 13, color: MUTED },

  emptyText: { fontSize: 13, color: MUTED, textAlign: "center", paddingVertical: 12 },
});
