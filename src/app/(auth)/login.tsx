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
import { makeRedirectUri } from "expo-auth-session";
import { tokens } from "@/styles";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingMagic, setLoadingMagic] = useState(false);

  const nativeRedirectTo = makeRedirectUri({ scheme: "quotesnap", path: "auth/callback" });

  function logAuthError(label: string, err: unknown) {
    console.error(`[login] ${label} error`, {
      type: err instanceof Error ? err.constructor.name : typeof err,
      message: err instanceof Error ? err.message : String(err),
      cause: err instanceof Error ? err.cause : undefined,
      status: (err as any)?.status,
      code: (err as any)?.code,
      name: err instanceof Error ? err.name : undefined,
      stack: err instanceof Error ? err.stack : undefined,
      raw: err,
    });
  }

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    try {
      if (Platform.OS === "web") {
        const redirectTo = `${window.location.origin}/auth/callback`;
        console.log("[login] Google OAuth (web)", { redirectTo, origin: window.location.origin });
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });
        console.log("[login] signInWithOAuth result", { url: data?.url, hasError: !!error });
        if (error) throw error;
        return; // browser redirects away
      }

      console.log("[login] Google OAuth (native)", { nativeRedirectTo });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: nativeRedirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, nativeRedirectTo);
        if (result.type === "success") {
          const url = new URL(result.url);
          const code = url.searchParams.get("code");
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
          }
        }
      }
    } catch (err) {
      logAuthError("Google", err);
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
      const magicLinkRedirect = Platform.OS === "web"
        ? `${window.location.origin}/auth/callback`
        : nativeRedirectTo;
      console.log("[login] Magic link", { magicLinkRedirect, email: email.trim(), platform: Platform.OS });
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: magicLinkRedirect },
      });
      if (error) {
        logAuthError("Magic link", error);
        throw error;
      }
      setMagicLinkSent(true);
    } catch (err) {
      if (!(err as any)?.__logged) logAuthError("Magic link (catch)", err);
      Alert.alert("Failed", err instanceof Error ? err.message : "Try again.");
    } finally {
      setLoadingMagic(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-app-surface"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-20 pb-10">
          {/* Brand */}
          <View className="mb-12">
            <Text className="text-4xl font-bold text-app-text-primary mb-2">QuoteSnap</Text>
            <Text className="text-lg text-app-text-secondary leading-6">
              Professional estimates before you leave the driveway.
            </Text>
          </View>

          {magicLinkSent ? (
            <View className="items-center py-8">
              <Text className="text-6xl mb-4">📬</Text>
              <Text className="text-2xl font-bold text-app-text-primary text-center mb-2">
                Check your email
              </Text>
              <Text className="text-app-text-secondary text-center leading-6">
                We sent a login link to{" "}
                <Text className="font-semibold text-app-text-primary">{email}</Text>
              </Text>
              <TouchableOpacity
                onPress={() => setMagicLinkSent(false)}
                className="mt-8"
              >
                <Text className="text-app-accent font-medium">Use a different email</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Google sign-in (primary) */}
              <TouchableOpacity
                onPress={handleGoogle}
                disabled={loadingGoogle}
                className="bg-app-accent rounded-2xl py-4 items-center flex-row justify-center gap-3 mb-6"
                activeOpacity={0.85}
              >
                {loadingGoogle ? (
                  <ActivityIndicator color={tokens.textInverse} />
                ) : (
                  <>
                    <Text className="text-2xl">G</Text>
                    <Text className="text-app-text-inverse font-bold text-lg">
                      Continue with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center mb-6">
                <View className="flex-1 h-px bg-app-border" />
                <Text className="mx-4 text-app-text-tertiary font-medium">or</Text>
                <View className="flex-1 h-px bg-app-border" />
              </View>

              {/* Magic link */}
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={tokens.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                className="border-2 border-app-border rounded-2xl px-4 py-4 text-base text-app-text-primary mb-3"
              />
              <TouchableOpacity
                onPress={handleMagicLink}
                disabled={loadingMagic}
                className="border-2 border-app-accent rounded-2xl py-4 items-center"
                activeOpacity={0.85}
              >
                {loadingMagic ? (
                  <ActivityIndicator color={tokens.accent} />
                ) : (
                  <Text className="text-app-accent font-bold text-base">
                    Send Magic Link
                  </Text>
                )}
              </TouchableOpacity>

              <Text className="text-xs text-app-text-tertiary text-center mt-6 leading-5">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
