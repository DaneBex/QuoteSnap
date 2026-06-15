import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// URL polyfill is only needed on native (Hermes lacks URL/URLSearchParams).
// Importing it on web overrides the browser's native URL and breaks fetch.
if (Platform.OS !== "web") {
  require("react-native-url-polyfill/auto");
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

console.log("[supabase] init", {
  urlDefined: !!supabaseUrl,
  urlLength: supabaseUrl?.length,
  urlPrefix: supabaseUrl?.slice(0, 40) ?? "MISSING",
  urlSuffix: supabaseUrl?.slice(-5) ?? "MISSING",
  urlCharCodes: supabaseUrl ? [...supabaseUrl].slice(-3).map(c => c.charCodeAt(0)) : "MISSING",
  keyDefined: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length,
  platform: Platform.OS,
});

// Use SecureStore on native, localStorage on web
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === "web") {
      return Promise.resolve(localStorage.getItem(key));
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

const debugFetch: typeof fetch = async (input, init) => {
  const urlStr = input instanceof Request ? input.url : String(input);
  console.log("[supabase] fetch →", {
    urlType: typeof input,
    urlStr,
    urlLength: urlStr.length,
    urlValid: (() => { try { new URL(urlStr); return true; } catch { return false; } })(),
    method: init?.method ?? "GET",
  });
  try {
    return await fetch(input as string, init);
  } catch (err) {
    console.error("[supabase] fetch threw", {
      urlStr,
      errMessage: err instanceof Error ? err.message : String(err),
      errName: err instanceof Error ? err.name : undefined,
    });
    throw err;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: { fetch: debugFetch },
});
