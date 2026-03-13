import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../hooks/useAuth";
import { UserRole } from "../../types/database";
import { COLORS } from "../../lib/constants";

export default function SignupScreen() {
  const navigation = useNavigation<any>();
  const { signUp } = useAuth();

  const [role, setRole] = useState<UserRole>("driver");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak Password", "Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const { error } = await signUp(
      email,
      password,
      fullName,
      role,
      phone || undefined,
      companyName || undefined
    );
    setSubmitting(false);

    if (error) {
      Alert.alert("Signup Failed", error);
    } else {
      Alert.alert(
        "Account Created",
        "Please check your email to verify your account, then sign in.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join SprintCargo as a driver or shipper
            </Text>
          </View>

          {/* Role Selection */}
          <Text style={styles.label}>I am a...</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === "driver" && styles.roleButtonActive,
              ]}
              onPress={() => setRole("driver")}
              disabled={submitting}
            >
              <Text
                style={[
                  styles.roleEmoji,
                  { fontSize: 24 },
                ]}
              >
                D
              </Text>
              <Text
                style={[
                  styles.roleLabel,
                  role === "driver" && styles.roleLabelActive,
                ]}
              >
                Driver
              </Text>
              <Text style={styles.roleDesc}>Deliver cargo and earn money</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                role === "shipper" && styles.roleButtonActive,
              ]}
              onPress={() => setRole("shipper")}
              disabled={submitting}
            >
              <Text
                style={[
                  styles.roleEmoji,
                  { fontSize: 24 },
                ]}
              >
                S
              </Text>
              <Text
                style={[
                  styles.roleLabel,
                  role === "shipper" && styles.roleLabelActive,
                ]}
              >
                Shipper
              </Text>
              <Text style={styles.roleDesc}>Ship items quickly and reliably</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            placeholderTextColor={COLORS.gray400}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            editable={!submitting}
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.gray400}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!submitting}
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="(555) 123-4567"
            placeholderTextColor={COLORS.gray400}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!submitting}
          />

          {role === "shipper" && (
            <>
              <Text style={styles.label}>Company Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your company (optional)"
                placeholderTextColor={COLORS.gray400}
                value={companyName}
                onChangeText={setCompanyName}
                editable={!submitting}
              />
            </>
          )}

          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 8 characters"
            placeholderTextColor={COLORS.gray400}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!submitting}
          />

          <Text style={styles.label}>Confirm Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter your password"
            placeholderTextColor={COLORS.gray400}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!submitting}
          />

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.navy,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray500,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.navy,
    marginBottom: 6,
    marginTop: 16,
  },
  roleRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  roleButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  roleButtonActive: {
    borderColor: COLORS.blue,
    backgroundColor: COLORS.blueLight,
  },
  roleEmoji: {
    marginBottom: 8,
    fontWeight: "800",
    color: COLORS.navy,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.gray600,
    marginBottom: 4,
  },
  roleLabelActive: {
    color: COLORS.blue,
  },
  roleDesc: {
    fontSize: 12,
    color: COLORS.gray400,
    textAlign: "center",
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.navy,
  },
  button: {
    backgroundColor: COLORS.blue,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 28,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 32,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  footerLink: {
    fontSize: 14,
    color: COLORS.blue,
    fontWeight: "600",
  },
});
