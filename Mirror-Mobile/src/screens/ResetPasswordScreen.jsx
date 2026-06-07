import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { resetPassword } from "../services/api";

const BG = "#FAF5EC";
const INK = "#2A1E14";
const PRIMARY = "#D91C1C";
const LINE = "#E8DFD1";
const MUTED = "#7A6A56";
const PLACEHOLDER = "#B8A898";
const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" });

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleSubmit = async () => {
    if (!code.trim()) { setError(t("reset_password.error_no_code")); return; }
    if (newPassword.length < 6) { setError(t("reset_password.error_short_password")); return; }
    if (newPassword !== confirmPassword) { setError(t("reset_password.error_password_mismatch")); return; }

    setLoading(true);
    setError(null);
    try {
      await resetPassword(code.trim().toUpperCase(), newPassword);
      setDone(true);
    } catch (err) {
      setError(err.message || t("reset_password.error_invalid_code"));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={styles.doneContainer}>
        <Ionicons name="checkmark-circle" size={72} color={PRIMARY} />
        <Text style={styles.doneTitle}>{t("reset_password.done_title")}</Text>
        <Text style={styles.doneText}>{t("reset_password.done_text")}</Text>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={() => navigation.navigate("Login")}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>{t("reset_password.btn_go_login")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={INK} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>{t("reset_password.title")}</Text>
          <Text style={styles.subtitle}>{t("reset_password.subtitle")}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>{t("reset_password.label_code")}</Text>
            <View style={[styles.inputRow, focused === "code" && styles.inputRowFocus]}>
              <Ionicons name="key-outline" size={18} color={MUTED} style={styles.icon} />
              <TextInput
                style={[styles.inputText, styles.codeInput]}
                placeholder="AB3X9K"
                placeholderTextColor={PLACEHOLDER}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                value={code}
                onChangeText={(v) => { setCode(v.toUpperCase()); setError(null); }}
                onFocus={() => setFocused("code")}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t("reset_password.label_new_password")}</Text>
            <View style={[styles.inputRow, focused === "pw" && styles.inputRowFocus]}>
              <Ionicons name="lock-closed-outline" size={18} color={MUTED} style={styles.icon} />
              <TextInput
                style={[styles.inputText, { flex: 1 }]}
                placeholder={t("reset_password.placeholder_new_password")}
                placeholderTextColor={PLACEHOLDER}
                secureTextEntry={!showPw}
                value={newPassword}
                onChangeText={(v) => { setNewPassword(v); setError(null); }}
                onFocus={() => setFocused("pw")}
                onBlur={() => setFocused(null)}
              />
              <TouchableOpacity onPress={() => setShowPw((v) => !v)} hitSlop={8}>
                <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={18} color={MUTED} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t("reset_password.label_confirm_password")}</Text>
            <View style={[styles.inputRow, focused === "confirm" && styles.inputRowFocus]}>
              <Ionicons name="lock-closed-outline" size={18} color={MUTED} style={styles.icon} />
              <TextInput
                style={[styles.inputText, { flex: 1 }]}
                placeholder={t("reset_password.placeholder_confirm")}
                placeholderTextColor={PLACEHOLDER}
                secureTextEntry={!showPw}
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setError(null); }}
                onFocus={() => setFocused("confirm")}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={14} color="#8A2716" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.8 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>{t("reset_password.btn_submit")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  backBtn: { padding: 20, alignSelf: "flex-start" },

  header: { paddingHorizontal: 28, paddingBottom: 32 },
  title: { fontSize: 28, fontFamily: SERIF, color: INK, marginBottom: 10 },
  subtitle: { fontSize: 15, color: MUTED, lineHeight: 22 },

  form: { paddingHorizontal: 24, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, color: MUTED, fontWeight: "500", paddingLeft: 2 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputRowFocus: { borderColor: PRIMARY },
  icon: { marginRight: 10 },
  inputText: { fontSize: 15, color: INK },
  codeInput: {
    flex: 1,
    letterSpacing: 6,
    fontWeight: "700",
    fontSize: 20,
    color: PRIMARY,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#FDECE8",
    borderWidth: 1,
    borderColor: "#F4C9BE",
    borderRadius: 10,
  },
  errorText: { flex: 1, fontSize: 13, color: "#8A2716" },

  submitBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },

  doneContainer: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  doneTitle: { fontSize: 26, fontFamily: SERIF, color: INK },
  doneText: { fontSize: 15, color: MUTED, textAlign: "center" },
});
