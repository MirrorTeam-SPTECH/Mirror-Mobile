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
import { forgotPassword } from "../services/api";

const BG = "#FAF5EC";
const INK = "#2A1E14";
const PRIMARY = "#D91C1C";
const SUBTLE = "#8A7558";
const LINE = "#E8DFD1";
const MUTED = "#7A6A56";
const PLACEHOLDER = "#B8A898";
const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" });

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);

  const emailInvalid = email.trim() && !/\S+@\S+\.\S+/.test(email);

  const handleSend = async () => {
    if (!email.trim() || emailInvalid) {
      setError(t("forgot_password.error_invalid_email"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message || t("forgot_password.error_send_failed"));
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.title}>{t("forgot_password.title")}</Text>
          <Text style={styles.subtitle}>
            {sent
              ? t("forgot_password.subtitle_sent")
              : t("forgot_password.subtitle_default")}
          </Text>
        </View>

        {sent ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle-outline" size={48} color={PRIMARY} />
            <Text style={styles.successTitle}>{t("forgot_password.success_title")}</Text>
            <Text style={styles.successText}>{t("forgot_password.success_text")}</Text>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => navigation.navigate("ResetPassword")}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>{t("forgot_password.btn_enter_code")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View
              style={[
                styles.inputRow,
                focused && styles.inputRowFocus,
                emailInvalid && styles.inputRowError,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color={emailInvalid ? "#C8321F" : MUTED}
                style={styles.icon}
              />
              <TextInput
                style={styles.inputText}
                placeholder={t("login.placeholder_email")}
                placeholderTextColor={PLACEHOLDER}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(null); }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </View>
            {emailInvalid && (
              <Text style={styles.fieldError}>{t("forgot_password.field_email_invalid")}</Text>
            )}

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={14} color="#8A2716" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.8 }]}
              onPress={handleSend}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>{t("forgot_password.btn_send")}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate("ResetPassword")}
            >
              <Text style={styles.secondaryBtnText}>{t("forgot_password.btn_have_code")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  backBtn: { padding: 20, alignSelf: "flex-start" },

  header: { paddingHorizontal: 28, paddingBottom: 32 },
  title: {
    fontSize: 28,
    fontFamily: SERIF,
    color: INK,
    marginBottom: 10,
  },
  subtitle: { fontSize: 15, color: MUTED, lineHeight: 22 },

  form: { paddingHorizontal: 24, gap: 14 },

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
  inputRowError: { borderColor: "#C8321F" },
  icon: { marginRight: 10 },
  inputText: { flex: 1, fontSize: 15, color: INK },
  fieldError: { fontSize: 12, color: "#C8321F", paddingLeft: 2 },

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

  secondaryBtn: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  secondaryBtnText: { fontSize: 14, color: SUBTLE, fontWeight: "500" },

  successBox: {
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 12,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: SERIF,
    color: INK,
    marginTop: 8,
  },
  successText: {
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 8,
  },
});
