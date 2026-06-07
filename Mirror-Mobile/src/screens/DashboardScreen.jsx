import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
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

const SLIDES = ["cover", "top", "weekday", "hour", "ranking", "personality", "share"];

// ─── Donut SVG ────────────────────────────────────────────────────────────────
function DonutClock({ peakStart = 18, peakEnd = 22, peakHour = 20, size = 200, label = "PEAK HOUR" }) {
  const total  = 24;
  const R      = size * 0.37;
  const r      = size * 0.24;
  const cx     = size / 2;
  const cy     = size / 2;

  const segments = Array.from({ length: total }, (_, i) => {
    const a1  = (i / total) * Math.PI * 2 - Math.PI / 2;
    const a2  = ((i + 0.85) / total) * Math.PI * 2 - Math.PI / 2;
    const x1  = cx + Math.cos(a1) * R;
    const y1  = cy + Math.sin(a1) * R;
    const x2  = cx + Math.cos(a2) * R;
    const y2  = cy + Math.sin(a2) * R;
    const x3  = cx + Math.cos(a2) * r;
    const y3  = cy + Math.sin(a2) * r;
    const x4  = cx + Math.cos(a1) * r;
    const y4  = cy + Math.sin(a1) * r;
    const isPeak = i >= peakStart && i <= peakEnd;
    return { d: `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 0 0 ${x4} ${y4} Z`, isPeak };
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <G>
        {segments.map(({ d, isPeak }, i) => (
          <Path key={i} d={d} fill={isPeak ? PRIMARY : `${PRIMARY}22`} />
        ))}
        <SvgText
          x={cx} y={cy - 8}
          textAnchor="middle"
          fontFamily={SERIF}
          fontSize={size * 0.18}
          fill={INK}
        >
          {peakHour}h
        </SvgText>
        <SvgText
          x={cx} y={cy + 14}
          textAnchor="middle"
          fontSize={size * 0.055}
          fill={MUTED}
          letterSpacing={1.2}
        >
          {label}
        </SvgText>
      </G>
    </Svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const navigation          = useNavigation();
  const { t }               = useTranslation();
  const { user }            = useAuth();
  const DAYS_SHORT = t("dashboard.days_short", { returnObjects: true });
  const DAYS_FULL  = t("dashboard.days_full", { returnObjects: true });
  const { width: W }        = useWindowDimensions();
  const scrollRef           = useRef(null);
  const [slide, setSlide]   = useState(0);
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
  const PAID_STATUSES = ["paid", "preparing", "ready", "delivered"];
  const paidOrders    = orders.filter((o) => PAID_STATUSES.includes(o.status));
  const totalSpent    = paidOrders.reduce((s, o) => s + (o.total_cents || 0), 0);

  // Top items
  const itemMap = {};
  paidOrders.forEach((order) => {
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
  const topCount = topItems[0]?.count ?? 0;
  const maxItem  = topItems[0]?.count ?? 1;

  // Day of week (0=Dom…6=Sáb → map to Seg…Dom order)
  const rawDay = Array(7).fill(0);
  paidOrders.forEach((o) => { if (o.created_at) rawDay[new Date(o.created_at).getDay()]++; });
  // Reorder Mon–Sun: JS getDay 0=Sun,1=Mon,…,6=Sat → index mapping for DAYS_SHORT Seg…Dom
  const dayCounts = [rawDay[1], rawDay[2], rawDay[3], rawDay[4], rawDay[5], rawDay[6], rawDay[0]];
  const maxDay   = Math.max(...dayCounts, 1);
  const peakDayI = dayCounts.indexOf(Math.max(...dayCounts));

  // Time slot
  const timeCounts = [0, 0, 0, 0];
  paidOrders.forEach((o) => {
    if (!o.created_at) return;
    const h = new Date(o.created_at).getHours();
    if (h >= 6 && h < 12) timeCounts[0]++;
    else if (h >= 12 && h < 18) timeCounts[1]++;
    else if (h >= 18) timeCounts[2]++;
    else timeCounts[3]++;
  });
  const peakSlot  = timeCounts.indexOf(Math.max(...timeCounts));
  const peakHour  = peakSlot === 0 ? 9 : peakSlot === 1 ? 15 : peakSlot === 2 ? 20 : 2;
  const peakStart = peakSlot === 0 ? 6 : peakSlot === 1 ? 12 : peakSlot === 2 ? 18 : 0;
  const peakEnd   = peakSlot === 0 ? 11 : peakSlot === 1 ? 17 : peakSlot === 2 ? 22 : 5;

  // ─── Navigation ────────────────────────────────────────────────────────────
  const goTo = (i) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, i));
    setSlide(clamped);
    scrollRef.current?.scrollTo({ x: W * clamped, animated: true });
  };

  const handleScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    if (idx !== slide) setSlide(idx);
  };

  // ─── Share ─────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    try {
      await Share.share({
        message: t("dashboard.share_message", {
          orders: paidOrders.length,
          spent: formatPrice(totalSpent),
          top: topName !== "—" ? topName : "",
        }),
      });
    } catch (_) {}
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: PRIMARY }]}>
        <StatusBar style="light" />
        <ActivityIndicator color="#fff" size="large" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  // ─── Slide height (everything minus header + dots bar) ─────────────────────
  // Rendered inside SafeAreaView — header ~52px, dots bar ~56px
  const SLIDE_H_APPROX = undefined; // flex:1 handles it

  // ─── Slides ────────────────────────────────────────────────────────────────

  function SlideCover() {
    return (
      <View style={[s.slide, { width: W, backgroundColor: PRIMARY }]}>
        {/* texture dots */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <View
            key={i}
            style={[s.fleck, {
              top: `${(i * 73) % 100}%`,
              left: `${(i * 37) % 100}%`,
            }]}
          />
        ))}
        <View style={s.slidePad}>
          <View>
            <Text style={s.eyebrow}>{t("dashboard.cover_eyebrow")}</Text>
            <Text style={[s.coverTitle, { fontStyle: "italic" }]}>
              {t("dashboard.cover_title_year")}{"\n"}
              <Text style={{ color: GOLD }}>{t("dashboard.cover_title_accent")}</Text>.
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          <View>
            <Text style={[s.eyebrow, { marginBottom: 4 }]}>{t("dashboard.cover_orders_label")}</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10 }}>
              <Text style={s.bigNumber}>{paidOrders.length}</Text>
              <Text style={[s.coverSubNum, { paddingBottom: 12 }]}>{t("dashboard.cover_orders_unit")}</Text>
            </View>
            <Text style={s.coverDesc}>
              {t("dashboard.cover_desc", { amount: formatPrice(totalSpent) })}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  function SlideTop() {
    return (
      <View style={[s.slide, { width: W, backgroundColor: BG }]}>
        <View style={s.slidePad}>
          <Text style={[s.eyebrow, { color: SUBTLE }]}>{t("dashboard.top_eyebrow")}</Text>
          <Text style={[s.slideTitle, { color: INK }]}>
            {t("dashboard.top_title_before")}{" "}
            <Text style={{ fontStyle: "italic", color: PRIMARY }}>{topName}</Text>
            {"\n"}{t("dashboard.top_title_after")}
          </Text>
          <Text style={[s.slideDesc, { color: MUTED }]}>
            {t("dashboard.top_desc", { count: topCount })}
          </Text>

          <View style={s.barList}>
            {topItems.map((item, i) => (
              <View key={i} style={{ gap: 5 }}>
                <View style={s.barLabelRow}>
                  <Text style={s.barIndex}>{String(i + 1).padStart(2, "0")}</Text>
                  <Text style={[s.barName, i === 0 && { fontWeight: "700" }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={s.barCount}>{item.count}×</Text>
                </View>
                <View style={s.barTrackBg}>
                  <View
                    style={[
                      s.barFill,
                      {
                        width: `${(item.count / maxItem) * 100}%`,
                        backgroundColor: i === 0 ? PRIMARY : `${PRIMARY}55`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  function SlideWeekday() {
    const BAR_H = 110;
    return (
      <View style={[s.slide, { width: W, backgroundColor: BG }]}>
        <View style={s.slidePad}>
          <Text style={[s.eyebrow, { color: SUBTLE }]}>{t("dashboard.weekday_eyebrow")}</Text>
          <Text style={[s.slideTitle, { color: INK }]}>
            <Text style={{ fontStyle: "italic", color: PRIMARY }}>{DAYS_FULL[peakDayI]}</Text>
            {"\n"}{t("dashboard.weekday_title_after")}
          </Text>
          <Text style={[s.slideDesc, { color: MUTED }]}>
            {t("dashboard.weekday_desc", { count: dayCounts[peakDayI], day: DAYS_FULL[peakDayI] })}
          </Text>

          <View style={{ flex: 1 }} />

          <View style={[s.barChart, { height: BAR_H + 48 }]}>
            {dayCounts.map((count, i) => {
              const isPeak = i === peakDayI;
              const h = maxDay > 0 ? Math.max(4, (count / maxDay) * BAR_H) : 4;
              return (
                <View key={i} style={s.barChartCol}>
                  <Text style={[s.barChartCount, { color: isPeak ? PRIMARY : MUTED }]}>
                    {count > 0 ? count : " "}
                  </Text>
                  <View style={[s.barChartTrack, { height: BAR_H }]}>
                    <View
                      style={[
                        s.barChartBar,
                        {
                          height: h,
                          backgroundColor: isPeak ? PRIMARY : `${PRIMARY}33`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[s.barChartDay, isPeak && { color: INK, fontWeight: "700" }]}>
                    {DAYS_SHORT[i]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  function SlideHour() {
    const slotNames = [
      t("dashboard.slot_morning"),
      t("dashboard.slot_afternoon"),
      t("dashboard.slot_evening"),
      t("dashboard.slot_night"),
    ];
    const slotLabel = peakSlot === 2
      ? t("dashboard.hour_night_owl")
      : peakSlot === 0
      ? t("dashboard.hour_morning")
      : t("dashboard.hour_afternoon");
    return (
      <View style={[s.slide, { width: W, backgroundColor: BG }]}>
        <View style={s.slidePad}>
          <Text style={[s.eyebrow, { color: SUBTLE }]}>{t("dashboard.hour_eyebrow")}</Text>
          <Text style={[s.slideTitle, { color: INK }]}>
            <Text style={{ fontStyle: "italic", color: PRIMARY }}>{peakHour}h</Text>
            {" "}{t("dashboard.hour_title_after")}
          </Text>
          <Text style={[s.slideDesc, { color: MUTED }]}>
            {t("dashboard.hour_desc", { start: peakStart, end: peakEnd, slot: slotLabel })}
          </Text>

          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <DonutClock
              peakStart={peakStart}
              peakEnd={peakEnd}
              peakHour={peakHour}
              size={Math.min(W - 80, 220)}
              label={t("dashboard.peak_hour_label")}
            />
            <Text style={[s.slideDesc, { color: MUTED, textAlign: "center", marginTop: 10 }]}>
              {slotNames[peakSlot]}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  function SlideRanking() {
    // Ranking real: mock + usuário ordenados por pedidos
    const MOCK = [
      { name: "Rafael M.",  orders: 47 },
      { name: "Juliana S.", orders: 38 },
      { name: "Bruno T.",   orders: 31 },
      { name: "Ana C.",     orders: 28 },
      { name: "Pedro L.",   orders: 22 },
      { name: "Camila R.",  orders: 19 },
      { name: "Diego F.",   orders: 15 },
      { name: "Isabela N.", orders: 11 },
    ];
    const ranked = [...MOCK, { name: t("dashboard.ranking_you"), orders: paidOrders.length, isUser: true }]
      .sort((a, b) => b.orders - a.orders)
      .map((u, i) => ({ ...u, position: i + 1 }));

    const total     = ranked.length;
    const userEntry = ranked.find((u) => u.isUser);
    const userPos   = userEntry?.position ?? total;
    const inTop3    = userPos <= 3;

    // Pódio olímpico: top 3 reais (2º à esquerda, 1º ao centro, 3º à direita)
    const top3 = ranked.slice(0, 3);
    // podiumOrder = [#2, #1, #3]
    const podiumOrder   = [top3[1], top3[0], top3[2]];
    const podiumHeights = [90, 130, 72];
    const podiumLabels  = ["2", "1", "3"];

    return (
      <View style={[s.slide, { width: W }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#2A1E14" }]} />
        <View style={s.slidePad}>
          <Text style={[s.eyebrow, { color: GOLD }]}>{t("dashboard.ranking_eyebrow")}</Text>

          {inTop3 ? (
            <Text style={[s.slideTitle, { color: BG }]}>
              {t("dashboard.ranking_top3_line1")}{"\n"}
              <Text style={{ color: GOLD, fontStyle: "italic" }}>{t("dashboard.ranking_top3_line2")}</Text>
            </Text>
          ) : (
            <Text style={[s.slideTitle, { color: BG }]}>
              {t("dashboard.ranking_line1")}{"\n"}
              <Text style={{ color: GOLD, fontStyle: "italic" }}>#{userPos} da casa.</Text>
            </Text>
          )}

          <Text style={[s.slideDesc, { color: "rgba(250,245,236,0.65)" }]}>
            {inTop3
              ? t("dashboard.ranking_desc_top3", { count: paidOrders.length })
              : t("dashboard.ranking_desc", { total })}
          </Text>

          <View style={{ flex: 1 }} />

          {/* Pódio olímpico com top 3 reais */}
          <View style={s.podium}>
            {podiumOrder.map((p, i) => {
              if (!p) return <View key={i} style={s.podiumCol} />;
              const isUserHere = !!p.isUser;
              return (
                <View key={p.name} style={s.podiumCol}>
                  {isUserHere && (
                    <Ionicons name="ribbon" size={26} color={GOLD} style={{ marginBottom: 4 }} />
                  )}
                  <Text style={[s.podiumName, { color: isUserHere ? GOLD : "rgba(250,245,236,0.75)" }]}>
                    {p.name}
                  </Text>
                  <Text style={s.podiumSub}>{t("dashboard.ranking_orders", { count: p.orders })}</Text>
                  <View
                    style={[
                      s.podiumBlock,
                      {
                        height: podiumHeights[i],
                        backgroundColor: isUserHere ? GOLD : "rgba(250,245,236,0.16)",
                      },
                    ]}
                  >
                    <Text style={[s.podiumNum, { color: isUserHere ? INK : "rgba(250,245,236,0.8)" }]}>
                      {podiumLabels[i]}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Linha do usuário abaixo do pódio quando não está no top 3 */}
          {!inTop3 && (
            <View style={s.userRankRow}>
              <Ionicons name="person-circle-outline" size={18} color={GOLD} />
              <Text style={[s.podiumName, { color: GOLD, flex: 1 }]}>
                {t("dashboard.ranking_user_label", { pos: userPos })}
              </Text>
              <Text style={s.podiumSub}>
                {t("dashboard.ranking_orders", { count: paidOrders.length })}
              </Text>
            </View>
          )}

          <Text style={[s.rankDisclaimer, { color: "rgba(250,245,236,0.3)" }]}>
            {t("dashboard.ranking_disclaimer")}
          </Text>
        </View>
      </View>
    );
  }

  function SlidePersonality() {
    const tags = ["#picanha", "#bacon", "#noite", "#molho"];
    const personalityKey = loyalty && loyalty.cycles_completed >= 3
      ? "dashboard.personality_loyal"
      : "dashboard.personality_classic";
    const personalityLines = t(personalityKey).split("\n");

    return (
      <View style={[s.slide, { width: W, backgroundColor: BG }]}>
        <View style={[s.slidePad, { justifyContent: "space-between" }]}>
          <View>
            <Text style={[s.eyebrow, { color: SUBTLE }]}>{t("dashboard.personality_eyebrow")}</Text>
            <Text style={[s.personalityTitle, { color: INK }]}>
              {personalityLines[0]}{"\n"}
              <Text style={{ fontStyle: "italic", color: PRIMARY }}>
                {personalityLines[1]}
              </Text>
            </Text>
            <Text style={[s.slideDesc, { color: MUTED, marginTop: 14 }]}>
              {t("dashboard.personality_desc")}
            </Text>
          </View>

          <View style={s.tagsWrap}>
            {tags.map((tag) => (
              <View key={tag} style={s.tag}>
                <Text style={s.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <Text style={s.personalityQuote}>
            {t("dashboard.personality_quote")}
          </Text>
        </View>
      </View>
    );
  }

  function SlideShare() {
    return (
      <View style={[s.slide, { width: W, backgroundColor: BG }]}>
        <View style={[s.slidePad, { alignItems: "center", justifyContent: "center" }]}>
          <View style={s.shareAvatar}>
            <Text style={s.shareAvatarText}>
              {user?.name?.[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>

          <Text style={[s.slideTitle, { color: INK, textAlign: "center", marginTop: 18 }]}>
            {t("dashboard.share_title_before")}{" "}
            <Text style={{ fontStyle: "italic", color: PRIMARY }}>{t("dashboard.share_title_accent")}</Text>
            {"\n"}{t("dashboard.share_title_after")}
          </Text>
          <Text style={[s.slideDesc, { color: MUTED, textAlign: "center", marginTop: 8 }]}>
            {t("dashboard.share_desc", { count: paidOrders.length })}
          </Text>

          <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.85}>
            <Ionicons name="share-social-outline" size={18} color="#fff" />
            <Text style={s.shareBtnText}>{t("dashboard.share_btn")}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => goTo(0)} style={s.restartBtn} activeOpacity={0.7}>
            <Text style={s.restartBtnText}>{t("dashboard.share_restart")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const RENDERERS = {
    cover:       SlideCover,
    top:         SlideTop,
    weekday:     SlideWeekday,
    hour:        SlideHour,
    ranking:     SlideRanking,
    personality: SlidePersonality,
    share:       SlideShare,
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.topBarBtn}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={18} color={INK} />
          <Text style={s.topBarBtnText}>{t("dashboard.back")}</Text>
        </TouchableOpacity>

        <Text style={s.topBarTitle}>{t("dashboard.title")}</Text>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.topBarBtn}
          hitSlop={8}
        >
          <Ionicons name="close" size={18} color={INK} />
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleScroll}
          style={{ flex: 1 }}
        >
          {SLIDES.map((id) => {
            const Slide = RENDERERS[id];
            return <Slide key={id} />;
          })}
        </ScrollView>

        {/* Left arrow */}
        {slide > 0 && (
          <TouchableOpacity
            style={[s.arrow, { left: 10 }]}
            onPress={() => goTo(slide - 1)}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={18} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Right arrow */}
        {slide < SLIDES.length - 1 && (
          <TouchableOpacity
            style={[s.arrow, { right: 10 }]}
            onPress={() => goTo(slide + 1)}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Dots */}
      <View style={s.dotsBar}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)} hitSlop={6}>
            <View style={[s.dot, i === slide && s.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  // Top bar
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: LINE,
    backgroundColor: BG,
  },
  topBarBtn: { flexDirection: "row", alignItems: "center", gap: 2, minWidth: 56 },
  topBarBtnText: { fontSize: 13, color: INK, fontWeight: "500" },
  topBarTitle: {
    fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase",
    color: SUBTLE, fontWeight: "600",
  },

  // Slide base
  slide: { flex: 1 },
  slidePad: { flex: 1, padding: 28, paddingTop: 24 },

  // Cover
  fleck: {
    position: "absolute", width: 6, height: 6, borderRadius: 3,
    backgroundColor: "rgba(250,245,236,0.13)",
  },
  coverTitle: {
    fontFamily: SERIF, fontSize: 52, color: BG,
    fontWeight: "400", lineHeight: 56, letterSpacing: -1, marginTop: 10,
  },
  bigNumber: {
    fontFamily: SERIF, fontSize: 88, color: BG,
    fontWeight: "400", lineHeight: 88, letterSpacing: -2,
  },
  coverSubNum: {
    fontFamily: SERIF, fontSize: 22, color: BG,
    fontStyle: "italic", opacity: 0.85,
  },
  coverDesc: {
    fontSize: 13, color: "rgba(250,245,236,0.8)", lineHeight: 20, marginTop: 14,
  },
  eyebrow: {
    fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
    color: "rgba(250,245,236,0.65)", fontWeight: "700",
  },

  // Slide common
  slideTitle: {
    fontFamily: SERIF, fontSize: 32, lineHeight: 38,
    fontWeight: "400", letterSpacing: -0.5, marginTop: 8,
  },
  slideDesc: {
    fontSize: 13, lineHeight: 20, marginTop: 6,
  },

  // Top lanches bars
  barList: { marginTop: 22, gap: 14 },
  barLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barIndex: {
    fontFamily: SERIF, fontStyle: "italic", fontSize: 14, color: SUBTLE, width: 20,
  },
  barName: { flex: 1, fontSize: 13, color: INK, fontWeight: "500" },
  barCount: { fontSize: 13, color: MUTED, minWidth: 28, textAlign: "right" },
  barTrackBg: {
    height: 8, backgroundColor: "#fff",
    borderWidth: 1, borderColor: LINE, borderRadius: 999, overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 999 },

  // Weekday bar chart
  barChart: { flexDirection: "row", alignItems: "flex-end", gap: 5 },
  barChartCol: { flex: 1, alignItems: "center", gap: 5 },
  barChartCount: { fontSize: 11, fontWeight: "600" },
  barChartTrack: { justifyContent: "flex-end", width: "100%" },
  barChartBar: { width: "100%", borderRadius: 6, minHeight: 4 },
  barChartDay: { fontSize: 11, color: MUTED, fontWeight: "500" },

  // Ranking podium
  podium: {
    flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 8,
  },
  podiumCol: { flex: 1, alignItems: "center", gap: 4 },
  podiumName: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  podiumSub: { fontSize: 10, color: "rgba(250,245,236,0.5)" },
  podiumBlock: {
    width: "100%", borderRadius: 10, alignItems: "center", paddingTop: 10,
  },
  podiumNum: {
    fontFamily: SERIF, fontSize: 24, fontWeight: "400",
  },
  rankDisclaimer: {
    fontSize: 10, textAlign: "center", marginTop: 10,
  },
  userRankRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 10, paddingHorizontal: 14,
    marginTop: 10, marginBottom: 4,
    backgroundColor: "rgba(255,214,107,0.1)",
    borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,214,107,0.25)",
  },

  // Personality
  personalityTitle: {
    fontFamily: SERIF, fontSize: 46, lineHeight: 50,
    fontWeight: "400", letterSpacing: -1, marginTop: 12,
  },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    paddingVertical: 8, paddingHorizontal: 14,
    backgroundColor: "#fff", borderRadius: 999,
    borderWidth: 1, borderColor: `${PRIMARY}44`,
  },
  tagText: {
    fontFamily: SERIF, fontStyle: "italic",
    fontSize: 14, color: PRIMARY, fontWeight: "600",
  },
  personalityQuote: {
    fontFamily: SERIF, fontStyle: "italic",
    fontSize: 12, color: SUBTLE, lineHeight: 18,
  },

  // Share
  shareAvatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: PRIMARY,
    justifyContent: "center", alignItems: "center",
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35, shadowRadius: 20, elevation: 8,
  },
  shareAvatarText: {
    fontFamily: SERIF, fontSize: 42, color: BG,
    fontStyle: "italic", fontWeight: "400",
  },
  shareBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginTop: 28, backgroundColor: PRIMARY, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 28,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 5,
  },
  shareBtnText: { fontSize: 15, color: "#fff", fontWeight: "600" },
  restartBtn: { marginTop: 10, padding: 10 },
  restartBtnText: { fontSize: 13, color: MUTED, fontWeight: "500" },

  // Arrows
  arrow: {
    position: "absolute", top: "50%", marginTop: -18,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(42,30,20,0.38)",
    justifyContent: "center", alignItems: "center",
    zIndex: 10,
  },

  // Dots
  dotsBar: {
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    gap: 6, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: LINE,
    backgroundColor: BG,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: "#D6C8B0",
  },
  dotActive: { width: 22, backgroundColor: PRIMARY },
});
