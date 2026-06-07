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
import { analyzeGrillImage } from "../services/api";
import WebCameraModal from "../components/WebCameraModal";

const PRIMARY = "#D91C1C";
const BG = "#FAF5EC";

export default function GrillAdvisorScreen({ navigation }) {
  const { t } = useTranslation();
  const [image, setImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showWebCam, setShowWebCam] = useState(false);

  const pickImage = async (source) => {
    if (source === "camera" && Platform.OS === "web") {
      setShowWebCam(true);
      return;
    }

    const options = { allowsEditing: true, quality: 0.7, base64: true };

    let result;
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("grill.perm_title"), t("grill.perm_camera"));
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("grill.perm_title"), t("grill.perm_gallery"));
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

  const handleWebCapture = (img) => {
    setImage(img);
    setShowWebCam(false);
    setAnalysis(null);
  };

  const handleAnalyze = async () => {
    if (!image?.base64) return;
    setLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeGrillImage(image.base64, image.mimeType);
      setAnalysis(result.analysis);
    } catch (err) {
      Alert.alert(t("grill.error_title"), err.message || t("grill.error_msg"));
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
        <Text style={styles.title}>{t("grill.title")}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t("grill.subtitle")}</Text>

        {image ? (
          <View style={styles.imageArea}>
            <Image source={{ uri: image.uri }} style={styles.imagePreview} resizeMode="cover" />
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera" size={48} color="#B8A898" />
            <Text style={styles.imagePlaceholderText}>{t("grill.add_photo")}</Text>
          </View>
        )}

        {!image && (
          <View style={styles.pickRow}>
            <TouchableOpacity style={styles.pickBtn} onPress={() => pickImage("camera")} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={20} color={PRIMARY} />
              <Text style={styles.pickBtnText}>{t("grill.btn_camera")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickBtn} onPress={() => pickImage("gallery")} activeOpacity={0.8}>
              <Ionicons name="images-outline" size={20} color={PRIMARY} />
              <Text style={styles.pickBtnText}>{t("grill.btn_gallery")}</Text>
            </TouchableOpacity>
          </View>
        )}

        {image && !analysis && (
          <>
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
                  <Text style={styles.analyzeBtnText}>{t("grill.btn_analyze")}</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.changePhotoBtn} onPress={() => setImage(null)}>
              <Text style={styles.changePhotoText}>{t("grill.btn_change")}</Text>
            </TouchableOpacity>
          </>
        )}

        {loading && (
          <Text style={styles.loadingHint}>{t("grill.loading")}</Text>
        )}

        {analysis && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={22} color={PRIMARY} />
              <Text style={styles.resultTitle}>{t("grill.result_title")}</Text>
            </View>
            <Text style={styles.resultText}>{analysis}</Text>
            <TouchableOpacity
              style={styles.newBtn}
              onPress={() => { setImage(null); setAnalysis(null); }}
            >
              <Text style={styles.newBtnText}>{t("grill.btn_new")}</Text>
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
    backgroundColor: "#fff",
    height: 280,
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

  analyzeBtn: {
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
  analyzeBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
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
  newBtn: { marginTop: 16, alignItems: "center" },
  newBtnText: { fontSize: 13, color: PRIMARY, fontWeight: "600" },
});
