import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  Animated,
  Share,
  Alert,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { getLoyalty } from "../services/api";

const MODAL_SEEN_KEY = "@portal_churras:loyalty_shown_cycles";

const BG      = "#FAF5EC";
const INK     = "#2A1E14";
const PRIMARY = "#D91C1C";
const SUBTLE  = "#8A7558";
const LINE    = "#E8DFD1";
const MUTED   = "#7A6A56";
const GOLD    = "#C8920A";
const GOLD_BG = "#FFF8E7";
const SERIF   = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" });

const TOTAL_STAMPS = 10;

// ─── Stamp grid ───────────────────────────────────────────────────────────────
function StampGrid({ stampsInCycle, allFilled = false }) {
  return (
    <View style={styles.stampGrid}>
      {Array.from({ length: TOTAL_STAMPS }).map((_, i) => {
        const filled = allFilled || i < stampsInCycle;
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

function formatDate(dateStr, lang) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang || "pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Web-only canvas download ─────────────────────────────────────────────────
function downloadVoucherWeb(userName, cycles, texts) {
  const W = 700, H = 420;
  const canvas = document.createElement("canvas");
  canvas.width = W * 2;
  canvas.height = H * 2;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(2, 2);

  // Background
  ctx.fillStyle = "#2A1E14";
  ctx.roundRect ? ctx.beginPath() : null;
  ctx.fillRect(0, 0, W, H);

  // Gold accent bar top
  ctx.fillStyle = "#C8920A";
  ctx.fillRect(0, 0, W, 6);

  // Header area
  ctx.fillStyle = "rgba(255,214,107,0.08)";
  ctx.fillRect(0, 0, W, 90);

  // Logo text
  ctx.fillStyle = "#FFD66B";
  ctx.font = "bold 11px Arial";
  ctx.letterSpacing = "2px";
  ctx.fillText("PORTAL DO CHURRAS", 28, 32);

  // Tagline
  ctx.fillStyle = "rgba(250,245,236,0.5)";
  ctx.font = "11px Arial";
  ctx.fillText(texts.cardLabel, 28, 52);

  // Cycles badge top-right
  ctx.fillStyle = "rgba(255,214,107,0.15)";
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(W - 90, 14, 62, 48, 8) : ctx.rect(W - 90, 14, 62, 48);
  ctx.fill();
  ctx.fillStyle = "#FFD66B";
  ctx.font = "bold 22px Georgia";
  ctx.fillText("×" + cycles, W - 74, 44);
  ctx.fillStyle = "rgba(255,214,107,0.65)";
  ctx.font = "9px Arial";
  ctx.fillText("COMBO", W - 76, 56);

  // Name
  ctx.fillStyle = "#FAF5EC";
  ctx.font = "italic bold 28px Georgia";
  ctx.fillText(texts.congrats + " " + (userName || "Cliente") + "!", 28, 120);

  // Congrats text
  ctx.fillStyle = "rgba(250,245,236,0.75)";
  ctx.font = "13px Arial";
  ctx.fillText(texts.messageLine1, 28, 148);
  ctx.fillText(texts.messageLine2, 28, 166);

  // Divider
  ctx.strokeStyle = "rgba(255,214,107,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(28, 188);
  ctx.lineTo(W - 28, 188);
  ctx.stroke();

  // Prize box
  ctx.fillStyle = "rgba(255,214,107,0.1)";
  ctx.strokeStyle = "rgba(255,214,107,0.3)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(28, 204, W - 56, 76, 12);
  else ctx.rect(28, 204, W - 56, 76);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FFD66B";
  ctx.font = "bold 15px Arial";
  ctx.textAlign = "center";
  ctx.fillText("🍔  " + texts.prizeTitle + "  🍟", W / 2, 238);
  ctx.fillStyle = "rgba(250,245,236,0.55)";
  ctx.font = "12px Arial";
  ctx.fillText(texts.prizeHint, W / 2, 260);

  // Footer
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(250,245,236,0.35)";
  ctx.font = "11px Arial";
  ctx.fillText(texts.instruction, 28, 316);

  // Date
  const today = new Date().toLocaleDateString(texts.lang || "pt-BR");
  ctx.fillText((texts.generatedOn || "Gerado em: ") + today, 28, 334);

  // Gold bottom bar
  ctx.fillStyle = "#C8920A";
  ctx.fillRect(0, H - 6, W, 6);

  const link = document.createElement("a");
  link.download = "combo-gratis-portal-churras.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// ─── Reward Modal ─────────────────────────────────────────────────────────────
function RewardModal({ visible, onClose, cycles, userName }) {
  const { t, i18n } = useTranslation();
  const { width: W, height: H } = useWindowDimensions();
  const slideAnim  = useRef(new Animated.Value(H)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 55,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: H,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(onClose);
  };

  const voucherText = t("loyalty.share_text", { burgers: cycles * TOTAL_STAMPS });

  const handleShare = async () => {
    try {
      await Share.share({ message: voucherText, title: t("loyalty.share_title") });
    } catch (_) {}
  };

  const handleSave = () => {
    if (Platform.OS === "web") {
      downloadVoucherWeb(userName, cycles, {
        cardLabel:    t("loyalty.card_label"),
        congrats:     t("loyalty.modal_congrats"),
        messageLine1: t("loyalty.modal_message_line1"),
        messageLine2: t("loyalty.modal_message_line2"),
        prizeTitle:   t(cycles === 1 ? "loyalty.modal_prize_one" : "loyalty.modal_prize_other", { count: cycles }).toUpperCase(),
        prizeHint:    t("loyalty.modal_prize_hint"),
        instruction:  t("loyalty.modal_instruction"),
        generatedOn:  t("loyalty.generated_on"),
        lang:         i18n.language,
      });
    } else {
      Share.share({ message: voucherText, title: t("loyalty.share_title") })
        .catch(() => Alert.alert("", t("loyalty.save_screenshot")));
    }
  };

  const initial = userName ? userName.charAt(0).toUpperCase() : "C";

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      {/* Overlay */}
      <Animated.View style={[rm.overlay, { opacity: overlayAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />
      </Animated.View>

      {/* Card animado */}
      <Animated.View
        style={[
          rm.cardWrap,
          { transform: [{ translateY: slideAnim }] },
        ]}
        pointerEvents="box-none"
      >
        <View style={rm.card}>
          {/* Gold stripe top */}
          <View style={rm.goldStripe} />

          {/* Dismiss button */}
          <TouchableOpacity style={rm.closeBtn} onPress={handleClose} hitSlop={12}>
            <Ionicons name="close" size={20} color="rgba(250,245,236,0.7)" />
          </TouchableOpacity>

          {/* Eyebrow */}
          <Text style={rm.eyebrow}>{t("loyalty.modal_eyebrow")}</Text>

          {/* Avatar */}
          <View style={rm.avatarWrap}>
            <View style={rm.avatar}>
              <Text style={rm.avatarText}>{initial}</Text>
            </View>
            {/* sparkles */}
            {["✦", "✦", "✦"].map((s, i) => (
              <Text
                key={i}
                style={[
                  rm.sparkle,
                  { top: i * 14, right: i === 1 ? -16 : i === 0 ? -6 : -24, fontSize: i === 1 ? 16 : 10 },
                ]}
              >
                {s}
              </Text>
            ))}
          </View>

          {/* Heading */}
          <Text style={rm.heading}>
            {t("loyalty.modal_congrats")}{"\n"}
            <Text style={rm.headingAccent}>{userName || "Cliente"}!</Text>
          </Text>

          {/* Message */}
          <Text style={rm.message}>{t("loyalty.modal_message")}</Text>

          {/* Prize box */}
          <View style={rm.prizeBox}>
            <Text style={rm.prizeEmoji}>🍔</Text>
            <View style={rm.prizeInfo}>
              <Text style={rm.prizeLabel}>{t("loyalty.modal_earned")}</Text>
              <Text style={rm.prizeValue}>
                {t(cycles === 1 ? "loyalty.modal_prize_one" : "loyalty.modal_prize_other", { count: cycles })}
              </Text>
              <Text style={rm.prizeHint}>{t("loyalty.modal_prize_hint")}</Text>
            </View>
          </View>

          {/* Stamps (all filled) */}
          <StampGrid stampsInCycle={0} allFilled />

          {/* Instruction */}
          <Text style={rm.instruction}>{t("loyalty.modal_instruction")}</Text>

          {/* Action buttons */}
          <View style={rm.actions}>
            <TouchableOpacity style={rm.btnSecondary} onPress={handleShare} activeOpacity={0.85}>
              <Ionicons name="share-social-outline" size={17} color={INK} />
              <Text style={rm.btnSecondaryText}>{t("loyalty.modal_share")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={rm.btnPrimary} onPress={handleSave} activeOpacity={0.85}>
              <Ionicons name="download-outline" size={17} color="#fff" />
              <Text style={rm.btnPrimaryText}>
                {Platform.OS === "web" ? t("loyalty.modal_save_web") : t("loyalty.modal_save_native")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Gold stripe bottom */}
          <View style={rm.goldStripeBottom} />
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LoyaltyScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { isLoggedIn, user } = useAuth();
  const [status, setStatus]       = useState("idle");
  const [loyalty, setLoyalty]     = useState(null);
  const [showReward, setShowReward] = useState(false);

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

  // Auto-refresh quando a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) load();
      else setStatus("guest");
    }, [isLoggedIn])
  );

  // Exibe o modal só quando cycles_completed cresceu desde a última vez que o usuário viu
  useEffect(() => {
    if (!loyalty || loyalty.cycles_completed === 0) return;
    AsyncStorage.getItem(MODAL_SEEN_KEY).then((stored) => {
      const seen = stored ? parseInt(stored, 10) : 0;
      if (loyalty.cycles_completed > seen) {
        AsyncStorage.setItem(MODAL_SEEN_KEY, String(loyalty.cycles_completed));
        setShowReward(true);
      }
    });
  }, [loyalty]);

  const handleCloseModal = () => setShowReward(false);

  const userName = user?.name ? user.name.split(" ")[0] : "";

  if (!isLoggedIn || status === "guest") {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <TopBar />
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={52} color={SUBTLE} />
          <Text style={styles.stateTitle}>{t("loyalty.login_prompt")}</Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>{t("loyalty.btn_login")}</Text>
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
          <Text style={styles.stateTitle}>{t("loyalty.load_error")}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.85}>
            <Text style={styles.retryText}>{t("loyalty.btn_retry")}</Text>
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

        {/* Reward banner (tap to reabrir o modal) */}
        {cycles_completed > 0 && (
          <TouchableOpacity
            style={styles.rewardBanner}
            onPress={() => setShowReward(true)}
            activeOpacity={0.88}
          >
            <View style={styles.rewardIconWrap}>
              <Ionicons name="trophy" size={22} color={GOLD} />
            </View>
            <View style={styles.rewardBody}>
              <Text style={styles.rewardTitle}>
                {t(cycles_completed === 1 ? "loyalty.reward_one" : "loyalty.reward_other", { count: cycles_completed })}
              </Text>
              <Text style={styles.rewardHint}>{t("loyalty.reward_tap")}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Stamp card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardLabel}>{t("loyalty.card_label")}</Text>
              <Text style={styles.cardTitle}>{t("common.app_name")}</Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressCount}>{stamps_in_cycle}</Text>
              <Text style={styles.progressTotal}>/10</Text>
            </View>
          </View>

          <StampGrid stampsInCycle={stamps_in_cycle} />

          <Text style={styles.cardFooter}>
            {stamps_in_cycle === 0 && total_stamps === 0
              ? t("loyalty.footer_first")
              : stamps_in_cycle === 0
              ? t("loyalty.footer_new_cycle")
              : remaining === 1
              ? t("loyalty.footer_last_stamp")
              : t("loyalty.footer_remaining", { count: remaining })}
          </Text>
        </View>

        {/* Rule card */}
        <View style={styles.ruleCard}>
          <Ionicons name="information-circle-outline" size={18} color={SUBTLE} style={{ marginTop: 1 }} />
          <Text style={styles.ruleText}>{t("loyalty.rule")}</Text>
        </View>

        {/* History */}
        {recent_stamps.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t("loyalty.history_title")}</Text>
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
                    <Text style={styles.historyLabel}>{t("loyalty.order_stamp", { id: stamp.order_id })}</Text>
                    <Text style={styles.historyDate}>{formatDate(stamp.created_at, i18n.language)}</Text>
                  </View>
                  <View style={styles.historyStampDot} />
                </View>
              ))}
            </View>
          </>
        )}

        {recent_stamps.length === 0 && (
          <>
            <Text style={styles.sectionTitle}>{t("loyalty.no_stamps")}</Text>
            <View style={styles.emptyCard}>
              <Ionicons name="storefront-outline" size={22} color={PRIMARY} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyText}>{t("loyalty.empty_text")}</Text>
            </View>
          </>
        )}

        <TouchableOpacity style={styles.refreshBtn} onPress={load} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={16} color={PRIMARY} />
          <Text style={styles.refreshText}>{t("loyalty.btn_refresh")}</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Reward modal */}
      <RewardModal
        visible={showReward}
        onClose={handleCloseModal}
        cycles={cycles_completed}
        userName={userName}
      />
    </SafeAreaView>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────
function TopBar() {
  const { t } = useTranslation();
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
        <Text style={styles.topLabel}>{t("common.app_name")}</Text>
        <Text style={styles.topTitle}>{t("loyalty.title")}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  backBtn: { padding: 4, marginBottom: 2 },
  topBarText: { flex: 1 },
  topLabel: {
    fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase",
    color: SUBTLE, fontWeight: "600", marginBottom: 4,
  },
  topTitle: {
    fontFamily: SERIF, fontSize: 28, color: INK, fontWeight: "400", letterSpacing: -0.3,
  },
  center: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 30, gap: 16,
  },
  stateTitle: { fontFamily: SERIF, fontSize: 20, color: INK, textAlign: "center" },
  loginBtn: { backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
  loginBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  retryBtn: { backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  retryText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 60, gap: 16 },

  rewardBanner: {
    backgroundColor: GOLD_BG,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: GOLD,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  rewardIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(200,146,10,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  rewardBody: { flex: 1, gap: 2 },
  rewardTitle: { fontSize: 15, fontWeight: "700", color: "#7A5200" },
  rewardHint: { fontSize: 12, color: "#9A7020", lineHeight: 18 },

  card: {
    backgroundColor: "#fff", borderRadius: 18,
    borderWidth: 1, borderColor: LINE, padding: 20, gap: 16,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  cardLabel: {
    fontSize: 10, letterSpacing: 1.8, textTransform: "uppercase",
    color: SUBTLE, fontWeight: "600", marginBottom: 4,
  },
  cardTitle: { fontFamily: SERIF, fontSize: 20, color: INK, fontWeight: "400" },
  progressBadge: {
    flexDirection: "row", alignItems: "baseline",
    backgroundColor: "rgba(217,28,28,0.07)",
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  progressCount: { fontFamily: SERIF, fontSize: 28, color: PRIMARY, fontWeight: "400", lineHeight: 32 },
  progressTotal: { fontSize: 14, color: SUBTLE, fontWeight: "500" },

  stampGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" },
  stamp: { width: "17%", aspectRatio: 1, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  stampFilled: { backgroundColor: PRIMARY },
  stampEmpty: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: LINE },
  stampNumber: { fontSize: 13, color: MUTED, fontWeight: "500" },

  cardFooter: { fontSize: 13, color: MUTED, textAlign: "center", lineHeight: 18 },

  ruleCard: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: "#fff", borderRadius: 12,
    borderWidth: 1, borderColor: LINE, padding: 14, gap: 10,
  },
  ruleText: { flex: 1, fontSize: 13, color: MUTED, lineHeight: 19 },

  sectionTitle: {
    fontFamily: SERIF, fontSize: 20, color: INK, fontWeight: "400", letterSpacing: -0.2,
  },

  historyCard: {
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1, borderColor: LINE, overflow: "hidden",
  },
  historyItem: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 16, gap: 12,
  },
  historyItemBorder: { borderBottomWidth: 1, borderBottomColor: LINE },
  historyIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(217,28,28,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  historyBody: { flex: 1, gap: 2 },
  historyLabel: { fontSize: 14, fontWeight: "600", color: INK },
  historyDate: { fontSize: 12, color: MUTED },
  historyStampDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: PRIMARY },

  emptyCard: {
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1, borderColor: LINE, padding: 20, alignItems: "flex-start",
  },
  emptyText: { fontSize: 14, color: MUTED, lineHeight: 21 },

  refreshBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: LINE, backgroundColor: "#fff",
  },
  refreshText: { fontSize: 14, color: PRIMARY, fontWeight: "500" },
});

// ─── Reward Modal Styles ──────────────────────────────────────────────────────
const rm = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,8,4,0.68)",
  },
  cardWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === "ios" ? 32 : 20,
  },
  card: {
    backgroundColor: "#2A1E14",
    borderRadius: 24,
    overflow: "hidden",
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
  goldStripe: {
    height: 4,
    backgroundColor: "#C8920A",
    marginHorizontal: -22,
    marginBottom: 14,
  },
  goldStripeBottom: {
    height: 4,
    backgroundColor: "#C8920A",
    marginHorizontal: -22,
    marginTop: 18,
  },
  closeBtn: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(250,245,236,0.1)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(200,146,10,0.75)",
    fontWeight: "700",
    marginBottom: 14,
  },
  avatarWrap: {
    alignSelf: "center",
    marginBottom: 16,
    position: "relative",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#C8920A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,214,107,0.4)",
  },
  avatarText: {
    fontFamily: SERIF,
    fontSize: 34,
    color: "#2A1E14",
    fontWeight: "400",
  },
  sparkle: {
    position: "absolute",
    color: "#FFD66B",
    fontWeight: "700",
  },
  heading: {
    fontFamily: SERIF,
    fontSize: 28,
    color: "#FAF5EC",
    fontWeight: "400",
    letterSpacing: -0.5,
    lineHeight: 34,
    textAlign: "center",
    marginBottom: 8,
  },
  headingAccent: {
    fontStyle: "italic",
    color: "#FFD66B",
  },
  message: {
    fontSize: 13,
    color: "rgba(250,245,236,0.68)",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 16,
  },
  prizeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,214,107,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,214,107,0.28)",
    borderRadius: 14,
    padding: 14,
    gap: 14,
    marginBottom: 16,
  },
  prizeEmoji: { fontSize: 36 },
  prizeInfo: { flex: 1 },
  prizeLabel: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(255,214,107,0.65)",
    fontWeight: "700",
    marginBottom: 2,
  },
  prizeValue: {
    fontFamily: SERIF,
    fontSize: 22,
    color: "#FFD66B",
    fontWeight: "400",
    letterSpacing: -0.3,
  },
  prizeHint: {
    fontSize: 11,
    color: "rgba(250,245,236,0.45)",
    marginTop: 2,
  },
  instruction: {
    fontSize: 12,
    color: "rgba(250,245,236,0.4)",
    textAlign: "center",
    lineHeight: 17,
    marginTop: 10,
    marginBottom: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginBottom: 4,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#FAF5EC",
  },
  btnSecondaryText: { fontSize: 14, color: INK, fontWeight: "600" },
  btnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#C8920A",
  },
  btnPrimaryText: { fontSize: 14, color: "#fff", fontWeight: "700" },
});
