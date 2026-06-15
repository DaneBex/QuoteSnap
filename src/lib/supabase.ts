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
  platform: Platform.OS,
  urlDefined: !!supabaseUrl,
  urlLength: supabaseUrl?.length,
  // On web, React Native may polyfill AbortController with a JS implementation
  // that Chrome's native fetch rejects with "Invalid value". Check if native globals
  // are being shadowed.
  abortControllerIsNative:
    typeof window !== "undefined" && typeof AbortController !== "undefined"
      ? AbortController === window.AbortController
      : "n/a",
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

// On web production builds, React Native polyfills AbortController with a JS
// implementation whose .signal is not a native AbortSignal instance. Chrome's
// native fetch throws "Failed to execute 'fetch' on 'Window': Invalid value"
// when it receives a non-native AbortSignal. Restore native browser globals
// before any Supabase calls are made.
if (Platform.OS === "web" && typeof window !== "undefined") {
  const g = global as Record<string, unknown>;
  if (window.AbortController && g["AbortController"] !== window.AbortController) {
    console.warn("[supabase] replacing polyfilled AbortController with native browser implementation");
    g["AbortController"] = window.AbortController;
    g["AbortSignal"] = window.AbortSignal;
  }
}

const debugFetch: typeof fetch = async (input, init) => {
  const urlStr = input instanceof Request ? input.url : String(input);
  const signal = init?.signal;
  console.log("[supabase] fetch →", {
    url: urlStr,
    method: init?.method ?? "GET",
    hasSignal: !!signal,
    signalIsNative:
      signal && typeof AbortSignal !== "undefined"
        ? signal instanceof AbortSignal
        : "n/a",
    signalType: signal ? Object.prototype.toString.call(signal) : "none",
  });
  try {
    return await window.fetch(urlStr, init);
  } catch (err) {
    console.error("[supabase] fetch threw", {
      url: urlStr,
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
