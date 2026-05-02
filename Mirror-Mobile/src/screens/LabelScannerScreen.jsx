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
import { analyzeLabelScanner, formatPrice } from "../services/api";

const PRIMARY = "#D91C1C";
const BG = "#FAF5EC";

export default function LabelScannerScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (source) => {
    const options = { allowsEditing: true, quality: 0.8, base64: true };

    let scanResult;
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão necessária", "Precisamos de acesso à câmera.");
        return;
      }
      scanResult = await ImagePicker.launchCameraAsync(options);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão necessária", "Precisamos de acesso à galeria.");
        return;
      }
      scanResult = await ImagePicker.launchImageLibraryAsync({
        ...options,
        mediaTypes: ['images'],
      });
    }

    if (!scanResult.canceled) {
      const asset = scanResult.assets[0];
      setImage({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType ?? "image/jpeg" });
      setResult(null);
    }
  };

  const handleChooseImage = () => {
    Alert.alert("Adicionar foto", "Como deseja fotografar o rótulo?", [
      { text: "Câmera", onPress: () => pickImage("camera") },
      { text: "Galeria", onPress: () => pickImage("gallery") },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const handleScan = async () => {
    if (!image?.base64) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeLabelScanner(image.base64, image.mimeType);
      setResult(data);
    } catch (err) {
      Alert.alert("Erro", err.message || "Não foi possível escanear o rótulo.");
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
        <Text style={styles.title}>Scanner Comparativo</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Fotografe o rótulo nutricional de um lanche concorrente e encontre o equivalente no Portal do Churras
        </Text>

        <TouchableOpacity style={styles.imageArea} onPress={handleChooseImage} activeOpacity={0.8}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.imagePreview} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="scan" size={48} color="#B8A898" />
              <Text style={styles.imagePlaceholderText}>Toque para fotografar o rótulo</Text>
            </View>
          )}
        </TouchableOpacity>

        {image && !result && (
          <TouchableOpacity
            style={[styles.scanBtn, loading && { opacity: 0.7 }]}
            onPress={handleScan}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.scanBtnText}>Analisar rótulo</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {loading && (
          <Text style={styles.loadingHint}>Analisando o rótulo...</Text>
        )}

        {result && (
          <>
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Ionicons name="document-text-outline" size={22} color={PRIMARY} />
                <Text style={styles.resultTitle}>Informações do rótulo</Text>
              </View>
              <Text style={styles.resultText}>{result.extracted_info}</Text>
            </View>

            {result.suggestions.length > 0 && (
              <View style={[styles.resultCard, { marginTop: 12 }]}>
                <View style={styles.resultHeader}>
                  <Ionicons name="restaurant-outline" size={22} color={PRIMARY} />
                  <Text style={styles.resultTitle}>Equivalente no Portal do Churras</Text>
                </View>
                {result.suggestions.map((s) => (
                  <View key={s.product_id} style={styles.suggestionItem}>
                    <Text style={styles.suggestionName}>{s.name}</Text>
                    <Text style={styles.suggestionPrice}>{formatPrice(s.base_price_cents)}</Text>
                    {s.note ? <Text style={styles.suggestionNote}>{s.note}</Text> : null}
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.newBtn}
              onPress={() => { setImage(null); setResult(null); }}
            >
              <Text style={styles.newBtnText}>Novo scan</Text>
            </TouchableOpacity>
          </>
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
    height: 260,
    marginBottom: 20,
  },
  imagePreview: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  imagePlaceholderText: { fontSize: 14, color: "#B8A898" },

  scanBtn: {
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
  scanBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
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

  suggestionItem: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0E8DC",
    marginTop: 12,
  },
  suggestionName: { fontSize: 15, fontWeight: "600", color: "#2A1E14", marginBottom: 2 },
  suggestionPrice: { fontSize: 13, color: PRIMARY, fontWeight: "500", marginBottom: 4 },
  suggestionNote: { fontSize: 13, color: "#7A6A56", lineHeight: 18 },

  newBtn: { marginTop: 20, alignItems: "center" },
  newBtnText: { fontSize: 13, color: PRIMARY, fontWeight: "600" },
});
