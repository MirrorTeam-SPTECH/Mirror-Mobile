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
import { useTranslation } from "react-i18next";
import { analyzeLabelScanner, formatPrice } from "../services/api";
import WebCameraModal from "../components/WebCameraModal";

const PRIMARY = "#D91C1C";
const BG = "#FAF5EC";

export default function LabelScannerScreen({ navigation }) {
  const { t } = useTranslation();
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showWebCam, setShowWebCam] = useState(false);

  const pickImage = async (source) => {
    if (source === "camera" && Platform.OS === "web") {
      setShowWebCam(true);
      return;
    }

    const options = { allowsEditing: true, quality: 0.8, base64: true };

    let scanResult;
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("scanner.perm_title"), t("scanner.perm_camera"));
        return;
      }
      scanResult = await ImagePicker.launchCameraAsync(options);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("scanner.perm_title"), t("scanner.perm_gallery"));
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

  const handleWebCapture = (img) => {
    setImage(img);
    setShowWebCam(false);
    setResult(null);
  };

  const handleScan = async () => {
    if (!image?.base64) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeLabelScanner(image.base64, image.mimeType);
      setResult(data);
    } catch (err) {
      Alert.alert(t("scanner.error_title"), err.message || t("scanner.error_msg"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebCameraModal
        visible={showWebCam}
        onCapture={handleWebCapture}
        onClose={() => setShowWebCam(false)}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#2A1E14" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("scanner.title")}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t("scanner.subtitle")}</Text>

        {image ? (
          <View style={styles.imageArea}>
            <Image source={{ uri: image.uri }} style={styles.imagePreview} resizeMode="cover" />
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="scan" size={48} color="#B8A898" />
            <Text style={styles.imagePlaceholderText}>{t("scanner.add_photo")}</Text>
          </View>
        )}

        {!image && (
          <View style={styles.pickRow}>
            <TouchableOpacity style={styles.pickBtn} onPress={() => pickImage("camera")} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={20} color={PRIMARY} />
              <Text style={styles.pickBtnText}>{t("scanner.btn_camera")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickBtn} onPress={() => pickImage("gallery")} activeOpacity={0.8}>
              <Ionicons name="images-outline" size={20} color={PRIMARY} />
              <Text style={styles.pickBtnText}>{t("scanner.btn_gallery")}</Text>
            </TouchableOpacity>
          </View>
        )}

        {image && !result && (
          <>
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
                  <Text style={styles.scanBtnText}>{t("scanner.btn_scan")}</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.changePhotoBtn} onPress={() => setImage(null)}>
              <Text style={styles.changePhotoText}>{t("scanner.btn_change")}</Text>
            </TouchableOpacity>
          </>
        )}

        {loading && (
          <Text style={styles.loadingHint}>{t("scanner.loading")}</Text>
        )}

        {result && (
          <>
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Ionicons name="document-text-outline" size={22} color={PRIMARY} />
                <Text style={styles.resultTitle}>{t("scanner.label_info")}</Text>
              </View>
              <Text style={styles.resultText}>{result.extracted_info}</Text>
            </View>

            {result.suggestions.length > 0 && (
              <View style={[styles.resultCard, { marginTop: 12 }]}>
                <View style={styles.resultHeader}>
                  <Ionicons name="restaurant-outline" size={22} color={PRIMARY} />
                  <Text style={styles.resultTitle}>{t("scanner.equivalent")}</Text>
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
              <Text style={styles.newBtnText}>{t("scanner.btn_new")}</Text>
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
    backgroundColor: "#fff",
    height: 260,
    marginBottom: 16,
  },
  imagePreview: { width: "100%", height: "100%" },
  imagePlaceholder: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E8DFD1",
    borderStyle: "dashed",
    backgroundColor: "#fff",
  },
  imagePlaceholderText: { fontSize: 14, color: "#B8A898" },

  pickRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  pickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    backgroundColor: "#fff",
  },
  pickBtnText: { fontSize: 15, fontWeight: "600", color: PRIMARY },

  scanBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  scanBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  changePhotoBtn: { alignItems: "center", marginBottom: 12 },
  changePhotoText: { fontSize: 13, color: "#7A6A56" },
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
