import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";

export default function OnboardingScreen({ navigation }) {
  const handleSkip = () => {
    navigation.replace("Home");
  };

  const handleStart = () => {
    navigation.replace("Home");
  };

  return (
    <View style={styles.container}>
      {/* Botão Pular */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Pular</Text>
      </TouchableOpacity>

      {/* Imagem */}
      <Image
        source={require("../../assets/onboarding.png")}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Texto + Botão por cima da imagem */}
      <View style={styles.bottomOverlay}>
        <Text style={styles.text}>
          Desfrute da mais alta qualidade em hamburguers artesanais!
        </Text>
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startText}>Começar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D91C1C",
  },
  skipButton: {
    position: "absolute",
    top: 40,
    right: 35,
    zIndex: 10,
  },
  skipText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  image: {
    width: "120%",
    height: "80%",
    position: "absolute",
    left: 0,
    bottom: 0,
    transform: [{ scaleX: -1 }],
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: 40,
  },
  text: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 35,
    fontStyle: "italic",
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: "#740000",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    width: "85%",
  },
  startText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
