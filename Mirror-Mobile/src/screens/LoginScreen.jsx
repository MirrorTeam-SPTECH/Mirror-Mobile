import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

const PRIMARY = "#D91C1C";
const BG = "#FAF5EC";
const BORDER = "#E8DFD1";
const BORDER_ERROR = "#C8321F";
const TEXT_DARK = "#2A1E14";
const TEXT_MID = "#7A6A56";
const TEXT_MUTED = "#A89A82";
const PLACEHOLDER = "#B8A898";

function FieldError({ text }) {
  return (
    <View style={styles.fieldErrorRow}>
      <Ionicons name="alert-circle-outline" size={12} color={BORDER_ERROR} />
      <Text style={styles.fieldErrorText}>{text}</Text>
    </View>
  );
}

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState({});
  const [focused, setFocused] = useState(null);

  const { login, register } = useAuth();

  const touch = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  const emailError = touched.email
    ? !email.trim()
      ? t("login.email_required")
      : !/\S+@\S+\.\S+/.test(email)
      ? t("login.email_invalid")
      : null
    : null;
  const pwError = touched.password && !password.trim() ? t("login.password_required") : null;
  const nameError =
    mode === "register" && touched.name && !name.trim() ? t("login.name_required") : null;

  const rowStyle = (field, hasError) => [
    styles.inputRow,
    focused === field && styles.inputRowFocus,
    hasError && styles.inputRowError,
  ];

  const handleSubmit = async () => {
    setTouched({ email: true, password: true, name: true });
    const badEmail = !email.trim() || !/\S+@\S+\.\S+/.test(email);
    const badPw = !password.trim();
    const badName = mode === "register" && !name.trim();
    if (badEmail || badPw || badName) return;

    setLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), name.trim(), password, phone.trim() || undefined);
      }
      navigation.replace("Main");
    } catch (err) {
      setError(err.message || t("checkout.error_default"));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setEmail("");
    setPassword("");
    setName("");
    setPhone("");
    setError(null);
    setTouched({});
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
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("../../assets/Portal do Churras - Logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headline}>
            {mode === "login" ? t("login.welcome_back") : t("login.create_account")}
          </Text>
          <Text style={styles.subtitle}>
            {mode === "login" ? t("login.subtitle_login") : t("login.subtitle_register")}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name — register only */}
          {mode === "register" && (
            <View style={styles.field}>
              <View style={rowStyle("name", !!nameError)}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={nameError ? BORDER_ERROR : TEXT_MUTED}
                  style={styles.icon}
                />
                <TextInput
                  style={styles.inputText}
                  placeholder={t("login.placeholder_name")}
                  placeholderTextColor={PLACEHOLDER}
                  autoCapitalize="words"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocused("name")}
                  onBlur={() => {
                    setFocused(null);
                    touch("name");
                  }}
                />
              </View>
              {nameError && <FieldError text={nameError} />}
            </View>
          )}

          {/* Phone — register only */}
          {mode === "register" && (
            <View style={styles.field}>
              <View style={rowStyle("phone", false)}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={TEXT_MUTED}
                  style={styles.icon}
                />
                <TextInput
                  style={styles.inputText}
                  placeholder={t("login.placeholder_phone")}
                  placeholderTextColor={PLACEHOLDER}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  onFocus={() => setFocused("phone")}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>
          )}

          {/* Email */}
          <View style={styles.field}>
            <View style={rowStyle("email", !!emailError)}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={emailError ? BORDER_ERROR : TEXT_MUTED}
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
                onChangeText={setEmail}
                onFocus={() => setFocused("email")}
                onBlur={() => {
                  setFocused(null);
                  touch("email");
                }}
              />
            </View>
            {emailError && <FieldError text={emailError} />}
          </View>

          {/* Password */}
          <View style={styles.field}>
            <View style={rowStyle("pw", !!pwError)}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={pwError ? BORDER_ERROR : TEXT_MUTED}
                style={styles.icon}
              />
              <TextInput
                style={[styles.inputText, { flex: 1 }]}
                placeholder={t("login.placeholder_password")}
                placeholderTextColor={PLACEHOLDER}
                secureTextEntry={!showPw}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused("pw")}
                onBlur={() => {
                  setFocused(null);
                  touch("password");
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPw((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={8}
              >
                <Ionicons
                  name={showPw ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={TEXT_MUTED}
                />
              </TouchableOpacity>
            </View>
            {pwError && <FieldError text={pwError} />}
            {mode === "login" && (
              <TouchableOpacity
                style={styles.forgotRow}
                onPress={() => navigation.navigate("ForgotPassword")}
              >
                <Text style={styles.forgot}>{t("login.forgot_password")}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Generic error */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={14} color="#8A2716" />
              <Text style={styles.errorBoxText}>{error}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.8 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === "login" ? t("login.btn_login") : t("login.btn_register")}
              </Text>
            )}
          </TouchableOpacity>

          {/* Continuar sem login */}
          {mode === "login" && (
            <TouchableOpacity
              style={styles.guestBtn}
              onPress={() => navigation.replace("Main")}
              activeOpacity={0.7}
            >
              <Text style={styles.guestBtnText}>{t("login.continue_guest")}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {mode === "login" ? t("login.no_account") : t("login.has_account")}
          </Text>
          <TouchableOpacity onPress={toggleMode}>
            <Text style={styles.footerLink}>
              {mode === "login" ? t("login.link_register") : t("login.link_login")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, paddingBottom: 32 },

  header: {
    alignItems: "center",
    paddingTop: 52,
    paddingHorizontal: 28,
    paddingBottom: 8,
  },
  logo: { width: 200, height: 60, marginBottom: 18 },
  headline: {
    fontSize: 28,
    color: TEXT_DARK,
    fontWeight: "400",
    letterSpacing: -0.3,
    textAlign: "center",
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  subtitle: {
    fontSize: 14,
    color: TEXT_MID,
    textAlign: "center",
    lineHeight: 20,
  },

  form: {
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 16,
  },
  field: { gap: 6 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputRowFocus: { borderColor: PRIMARY },
  inputRowError: { borderColor: BORDER_ERROR },
  icon: { marginRight: 10 },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: TEXT_DARK,
  },
  eyeBtn: { padding: 4 },

  fieldErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 2,
  },
  fieldErrorText: { fontSize: 12, color: BORDER_ERROR },

  forgotRow: { alignItems: "flex-end", marginTop: 4 },
  forgot: { fontSize: 13, color: TEXT_MID, fontWeight: "500" },

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
  errorBoxText: { flex: 1, fontSize: 13, color: "#8A2716" },

  submitBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },

  guestBtn: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  guestBtnText: { fontSize: 14, color: "#5A4A36", fontWeight: "500" },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 32,
  },
  footerText: { fontSize: 13, color: TEXT_MID },
  footerLink: { fontSize: 13, color: PRIMARY, fontWeight: "600" },
});
