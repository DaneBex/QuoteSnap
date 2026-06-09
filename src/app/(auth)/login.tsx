import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingMagic, setLoadingMagic] = useState(false);

  const redirectTo = makeRedirectUri({ scheme: "quotesnap", path: "auth/callback" });

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === "success") {
          const url = new URL(result.url);
          const code = url.searchParams.get("code");
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
          }
        }
      }
    } catch (err) {
      Alert.alert("Sign-in failed", err instanceof Error ? err.message : "Try again.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      Alert.alert("Enter your email first");
      return;
    }
    setLoadingMagic(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setMagicLinkSent(true);
    } catch (err) {
      Alert.alert("Failed", err instanceof Error ? err.message : "Try again.");
    } finally {
      setLoadingMagic(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-20 pb-10">
          {/* Brand */}
          <View className="mb-12">
            <Text className="text-4xl font-bold text-gray-900 mb-2">QuoteSnap</Text>
            <Text className="text-lg text-gray-500 leading-6">
              Professional estimates before you leave the driveway.
            </Text>
          </View>

          {magicLinkSent ? (
            <View className="items-center py-8">
              <Text className="text-6xl mb-4">📬</Text>
              <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
                Check your email
              </Text>
              <Text className="text-gray-500 text-center leading-6">
                We sent a login link to{" "}
                <Text className="font-semibold text-gray-900">{email}</Text>
              </Text>
              <TouchableOpacity
                onPress={() => setMagicLinkSent(false)}
                className="mt-8"
              >
                <Text className="text-blue-600 font-medium">Use a different email</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Google sign-in (primary) */}
              <TouchableOpacity
                onPress={handleGoogle}
                disabled={loadingGoogle}
                className="bg-blue-600 rounded-2xl py-4 items-center flex-row justify-center gap-3 mb-6"
                activeOpacity={0.85}
              >
                {loadingGoogle ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-2xl">G</Text>
                    <Text className="text-white font-bold text-lg">
                      Continue with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center mb-6">
                <View className="flex-1 h-px bg-gray-200" />
                <Text className="mx-4 text-gray-400 font-medium">or</Text>
                <View className="flex-1 h-px bg-gray-200" />
              </View>

              {/* Magic link */}
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                className="border-2 border-gray-200 rounded-2xl px-4 py-4 text-base text-gray-900 mb-3"
              />
              <TouchableOpacity
                onPress={handleMagicLink}
                disabled={loadingMagic}
                className="border-2 border-blue-600 rounded-2xl py-4 items-center"
                activeOpacity={0.85}
              >
                {loadingMagic ? (
                  <ActivityIndicator color="#2563eb" />
                ) : (
                  <Text className="text-blue-600 font-bold text-base">
                    Send Magic Link
                  </Text>
                )}
              </TouchableOpacity>

              <Text className="text-xs text-gray-400 text-center mt-6 leading-5">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
