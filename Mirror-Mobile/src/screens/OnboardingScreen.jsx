import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, {
  Path, Circle, Rect, Ellipse, Line,
  Defs, RadialGradient, Stop,
} from "react-native-svg";

const { width: SCREEN_W } = Dimensions.get("window");
const ILLUS_SIZE = Math.min(SCREEN_W * 0.72, 280);

const PRIMARY = "#D91C1C";
const CREAM   = "#FAF5EC";
const INK     = "#2A1E14";
const MUTED   = "#7A6A56";
const SUBTLE  = "#8A7558";
const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" });

const SLIDES = [
  {
    kind:    "burger",
    eyebrow: "Bem-vindo",
    before:  "A mais alta qualidade em ",
    accent:  "lanches artesanais",
    after:   ".",
    sub:     "Carnes selecionadas, pão fresco do dia, e aquele capricho que só vê de pertinho.",
  },
  {
    kind:    "flame",
    eyebrow: "Feito com tempo",
    before:  "Cada pedido sai da chapa ",
    accent:  "na hora.",
    after:   "",
    sub:     "Você pede, a gente acende o fogo. Nada de esquentar, nada de pressa.",
  },
  {
    kind:    "bag",
    eyebrow: "Chega quentinho",
    before:  "Entrega rápida, do nosso bairro ",
    accent:  "pro seu.",
    after:   "",
    sub:     "Acompanhe em tempo real, com estimativa precisa e zero surpresa.",
  },
];

// ─── Ilustrações SVG ────────────────────────────────────────────────────────

function HeroBurger({ size }) {
  return (
    <Svg viewBox="0 0 240 240" width={size} height={size}>
      <Defs>
        <RadialGradient id="bun-g" cx="50%" cy="35%" r="60%">
          <Stop offset="0%" stopColor="#E8B86A" />
          <Stop offset="100%" stopColor="#B57738" />
        </RadialGradient>
      </Defs>
      <Circle cx="120" cy="170" r="92" fill={PRIMARY} opacity="0.08" />
      <Circle cx="120" cy="170" r="70"  fill={PRIMARY} opacity="0.06" />
      {/* bottom bun */}
      <Path d="M 50 170 Q 50 150 120 150 Q 190 150 190 170 Q 190 190 120 190 Q 50 190 50 170 Z" fill="url(#bun-g)" />
      {/* lettuce */}
      <Path d="M 52 145 Q 80 138 120 142 Q 160 138 188 145 L 188 152 Q 160 156 120 152 Q 80 156 52 152 Z" fill="#7BA84A" />
      {/* patty */}
      <Path d="M 56 132 Q 56 116 120 116 Q 184 116 184 132 Q 184 144 120 144 Q 56 144 56 132 Z" fill="#5C2A18" />
      {/* cheese */}
      <Path d="M 60 122 L 180 122 L 174 134 L 66 134 Z" fill="#F2C84B" />
      {/* top bun */}
      <Path d="M 50 110 Q 60 60 120 60 Q 180 60 190 110 Q 190 120 120 120 Q 50 120 50 110 Z" fill="url(#bun-g)" />
      {/* sesame */}
      <Circle cx="100" cy="85" r="3" fill="#F5DEB3" />
      <Circle cx="125" cy="78" r="3" fill="#F5DEB3" />
      <Circle cx="150" cy="88" r="3" fill="#F5DEB3" />
      <Circle cx="115" cy="95" r="3" fill="#F5DEB3" />
      <Circle cx="138" cy="98" r="3" fill="#F5DEB3" />
    </Svg>
  );
}

function HeroFlame({ size }) {
  return (
    <Svg viewBox="0 0 240 240" width={size} height={size}>
      <Circle cx="120" cy="130" r="92" fill={PRIMARY} opacity="0.08" />
      <Ellipse cx="120" cy="200" rx="80" ry="10" fill="#2A1E14" />
      <Rect x="55" y="180" width="130" height="20" rx="4" fill="#3A2A1E" />
      <Circle cx="80"  cy="185" r="5" fill="#8A2716" />
      <Circle cx="100" cy="186" r="5" fill="#C8321F" />
      <Circle cx="120" cy="184" r="5" fill="#E85A3F" />
      <Circle cx="140" cy="186" r="5" fill="#C8321F" />
      <Circle cx="160" cy="185" r="5" fill="#8A2716" />
      <Path d="M 120 175 Q 95 145 110 110 Q 115 130 120 120 Q 125 90 145 105 Q 138 130 150 140 Q 155 160 120 175 Z" fill={PRIMARY} />
      <Path d="M 120 170 Q 105 150 115 125 Q 120 140 125 130 Q 130 110 140 120 Q 135 145 142 152 Q 145 165 120 170 Z" fill="#F5A623" />
      <Path d="M 120 160 Q 115 150 120 138 Q 125 145 130 138 Q 132 150 128 158 Q 125 162 120 160 Z" fill="#FFD66B" />
    </Svg>
  );
}

function HeroBag({ size }) {
  return (
    <Svg viewBox="0 0 240 240" width={size} height={size}>
      <Circle cx="120" cy="130" r="92" fill={PRIMARY} opacity="0.08" />
      <Path d="M 70 90 L 170 90 L 180 200 Q 180 210 170 210 L 70 210 Q 60 210 60 200 Z" fill="#D4A258" />
      <Path d="M 70 90 L 170 90 L 172 110 L 68 110 Z" fill="#B57738" />
      <Path d="M 90 90 Q 90 60 110 60 Q 110 75 100 80 L 100 90" stroke="#5C2A18" strokeWidth="4" fill="none" strokeLinecap="round" />
      <Path d="M 150 90 Q 150 60 130 60 Q 130 75 140 80 L 140 90" stroke="#5C2A18" strokeWidth="4" fill="none" strokeLinecap="round" />
      <Rect x="95" y="135" width="50" height="55" rx="3" fill="#FAF5EC" stroke="#E8DFD1" />
      <Line x1="103" y1="148" x2="137" y2="148" stroke="#C8321F" strokeWidth="2" />
      <Line x1="103" y1="158" x2="130" y2="158" stroke="#8A7558" strokeWidth="1.5" />
      <Line x1="103" y1="166" x2="135" y2="166" stroke="#8A7558" strokeWidth="1.5" />
      <Line x1="103" y1="174" x2="125" y2="174" stroke="#8A7558" strokeWidth="1.5" />
      <Path d="M 110 50 Q 105 40 115 35 Q 110 25 118 20" stroke="#A89A82" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Path d="M 130 55 Q 125 45 135 40 Q 130 30 138 25" stroke="#A89A82" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function HeroIllustration({ kind, size }) {
  if (kind === "burger") return <HeroBurger size={size} />;
  if (kind === "flame")  return <HeroFlame  size={size} />;
  return <HeroBag size={size} />;
}

// ─── Tela principal ──────────────────────────────────────────────────────────

export default function OnboardingScreen({ navigation }) {
  const [idx, setIdx] = useState(0);
  const isLast = idx === SLIDES.length - 1;
  const slide  = SLIDES[idx];

  const finish = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    navigation.replace("Login");
  };

  const handleNext = () => {
    if (isLast) finish();
    else setIdx(idx + 1);
  };

  const handleSkip = () => setIdx(SLIDES.length - 1);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      {/* Background decoration (aproxima os radial-gradients do design original) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.bgCircleTop} />
        <View style={styles.bgCircleBottom} />
      </View>

      {/* Topo: eyebrow + skip */}
      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
        {!isLast && (
          <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.skipText}>Pular</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Ilustração hero */}
      <View style={styles.heroArea}>
        <HeroIllustration kind={slide.kind} size={ILLUS_SIZE} />
      </View>

      {/* Card inferior */}
      <View style={styles.card}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === idx && styles.dotActive]}
            />
          ))}
        </View>

        {/* Headline */}
        <Text style={styles.headline}>
          {slide.before}
          <Text style={styles.headlineAccent}>{slide.accent}</Text>
          {slide.after}
        </Text>

        {/* Sub */}
        <Text style={styles.sub}>{slide.sub}</Text>

        {/* CTA principal */}
        <TouchableOpacity style={styles.ctaBtn} onPress={handleNext} activeOpacity={0.88}>
          <Text style={styles.ctaText}>{isLast ? "Começar" : "Próximo"}</Text>
        </TouchableOpacity>

        {/* Atalho secundário */}
        {!isLast && (
          <TouchableOpacity style={styles.skipBtn} onPress={finish} activeOpacity={0.7}>
            <Text style={styles.skipBtnText}>Ir direto pro app</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: CREAM,
  },
  bgCircleTop: {
    position: "absolute",
    width: 500,
    height: 380,
    borderRadius: 250,
    backgroundColor: PRIMARY + "18",
    top: -140,
    right: -120,
  },
  bgCircleBottom: {
    position: "absolute",
    width: 360,
    height: 280,
    borderRadius: 180,
    backgroundColor: PRIMARY + "10",
    bottom: -80,
    left: -100,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 44 : 18,
    paddingBottom: 0,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: SUBTLE,
    fontWeight: "600",
  },
  skipText: {
    fontSize: 13,
    fontWeight: "500",
    color: MUTED,
  },
  heroArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: "#E8DFD1",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: Platform.OS === "android" ? 28 : 20,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 8,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E0D5C2",
  },
  dotActive: {
    width: 22,
    backgroundColor: PRIMARY,
  },
  headline: {
    fontFamily: SERIF,
    fontSize: 26,
    lineHeight: 32,
    color: INK,
    fontWeight: "400",
    letterSpacing: -0.3,
    textAlign: "center",
    marginBottom: 10,
  },
  headlineAccent: {
    fontFamily: SERIF,
    fontStyle: "italic",
    color: PRIMARY,
  },
  sub: {
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 22,
  },
  ctaBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  skipBtn: {
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: "500",
    color: MUTED,
  },
});
