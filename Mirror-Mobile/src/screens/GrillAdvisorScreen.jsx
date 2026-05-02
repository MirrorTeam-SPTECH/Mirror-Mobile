import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { analyzeGrillImage } from "../services/api";

const PRIMARY = "#D91C1C";
const BG = "#FAF5EC";

export default function GrillAdvisorScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (source) => {
    const options = { allowsEditing: true, quality: 0.7, base64: true };

    let result;
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão necessária", "Precisamos de acesso à câmera.");
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão necessária", "Precisamos de acesso à galeria.");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        ...options,
        mediaTypes: ['images'],
      });
    }

    if (!result.canceled) {
      const asset = result.assets[0];
      setImage({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType ?? "image/jpeg" });
      setAnalysis(null);
    }
  };

  const handleChooseImage = () => {
    Alert.alert("Adicionar foto", "Como deseja adicionar a foto?", [
      { text: "Câmera", onPress: () => pickImage("camera") },
      { text: "Galeria", onPress: () => pickImage("gallery") },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const handleAnalyze = async () => {
    if (!image?.base64) return;
    setLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeGrillImage(image.base64, image.mimeType);
      setAnalysis(result.analysis);
    } catch (err) {
      Alert.alert("Erro", err.message || "Não foi possível analisar a imagem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#2A1E14" />
        </TouchableOpacity>
        <Text style={styles.title}>Churrasqueiro de Bolso</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Tire uma foto da sua carne e descubra o ponto e dicas do churrasqueiro
        </Text>

        <TouchableOpacity style={styles.imageArea} onPress={handleChooseImage} activeOpacity={0.8}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.imagePreview} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={48} color="#B8A898" />
              <Text style={styles.imagePlaceholderText}>Toque para adicionar foto</Text>
            </View>
          )}
        </TouchableOpacity>

        {image && !analysis && (
          <TouchableOpacity
            style={[styles.analyzeBtn, loading && { opacity: 0.7 }]}
            onPress={handleAnalyze}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="flame" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.analyzeBtnText}>Analisar carne</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {loading && (
          <Text style={styles.loadingHint}>Consultando o churrasqueiro...</Text>
        )}

        {analysis && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={22} color={PRIMARY} />
              <Text style={styles.resultTitle}>Análise do churrasqueiro</Text>
            </View>
            <Text style={styles.resultText}>{analysis}</Text>
            <TouchableOpacity
              style={styles.newBtn}
              onPress={() => { setImage(null); setAnalysis(null); }}
            >
              <Text style={styles.newBtnText}>Nova análise</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 40 : 12,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E8DFD1",
  },
  backBtn: { padding: 4, marginRight: 8 },
  title: { fontSize: 18, fontWeight: "600", color: "#2A1E14" },

  scroll: { padding: 20, paddingBottom: 60 },
  subtitle: {
    fontSize: 14,
    color: "#7A6A56",
    lineHeight: 20,
    marginBottom: 24,
    textAlign: "center",
  },

  imageArea: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#E8DFD1",
    borderStyle: "dashed",
    backgroundColor: "#fff",
    height: 280,
    marginBottom: 20,
  },
  imagePreview: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  imagePlaceholderText: { fontSize: 14, color: "#B8A898" },

  analyzeBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  analyzeBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  loadingHint: { textAlign: "center", color: "#7A6A56", fontSize: 13, marginBottom: 16 },

  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E8DFD1",
  },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  resultTitle: { fontSize: 16, fontWeight: "600", color: "#2A1E14" },
  resultText: { fontSize: 14, color: "#5A4A36", lineHeight: 22 },
  newBtn: { marginTop: 16, alignItems: "center" },
  newBtnText: { fontSize: 13, color: PRIMARY, fontWeight: "600" },
});
