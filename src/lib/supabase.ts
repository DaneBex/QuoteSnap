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

// On web production builds, whatwg-fetch (bundled via React Native) overrides
// global.fetch, global.Headers, global.Request, and global.Response with JS
// polyfills. Chrome's native window.fetch throws "Invalid value" when it
// receives polyfilled Headers/Request instances. Restore native browser globals
// before any Supabase calls so all subsequent new Headers()/new Request() calls
// produce native instances.
if (Platform.OS === "web" && typeof window !== "undefined") {
  const g = global as Record<string, unknown>;
  const toRestore = ["fetch", "Headers", "Request", "Response", "AbortController", "AbortSignal"] as const;
  for (const name of toRestore) {
    const win = window as Record<string, unknown>;
    if (win[name] && g[name] !== win[name]) {
      console.warn(`[supabase] restoring native window.${name} (was polyfilled)`);
      g[name] = win[name];
    }
  }
}

const debugFetch: typeof fetch = async (input, init) => {
  const urlStr = input instanceof Request ? input.url : String(input);
  const h = init?.headers;
  const s = init?.signal;
  const isNativeHeaders = typeof Headers !== "undefined" && h instanceof Headers;
  const isNativeSignal = typeof AbortSignal !== "undefined" && s instanceof AbortSignal;
  console.log("[supabase] fetch →", {
    url: urlStr,
    method: init?.method ?? "GET",
    headersIsNative: h ? isNativeHeaders : "n/a",
    signalIsPresent: !!s,
    signalIsNative: s ? isNativeSignal : "n/a",
    bodyType: Object.prototype.toString.call(init?.body),
    initKeys: init ? Object.keys(init) : null,
  });

  // Build a completely clean RequestInit from scratch using only primitive/safe values.
  // Spreading the original init risks carrying non-native objects (polyfilled Headers,
  // AbortSignal, ReadableStream body, extra unknown props) that Chrome's fetch rejects.
  const safeInit: RequestInit = {};
  if (init?.method)                   safeInit.method         = init.method;
  if (init?.mode)                     safeInit.mode           = init.mode;
  if (init?.credentials)              safeInit.credentials    = init.credentials;
  if (init?.cache)                    safeInit.cache          = init.cache;
  if (init?.redirect)                 safeInit.redirect       = init.redirect;
  if (init?.referrer)                 safeInit.referrer       = init.referrer;
  if (init?.referrerPolicy)           safeInit.referrerPolicy = init.referrerPolicy;
  if (init?.integrity)                safeInit.integrity      = init.integrity;
  if (init?.keepalive !== undefined)  safeInit.keepalive      = init.keepalive;
  if (init?.body !== undefined)       safeInit.body           = init.body as BodyInit;

  if (h) {
    if (isNativeHeaders) {
      safeInit.headers = h;
    } else {
      const plain: Record<string, string> = {};
      if (typeof (h as any).forEach === "function") {
        (h as any).forEach((v: string, k: string) => { plain[k] = v; });
      } else {
        Object.assign(plain, h);
      }
      console.warn("[supabase] fetch: normalized non-native Headers to plain object");
      safeInit.headers = plain;
    }
  }

  if (s) {
    if (isNativeSignal) {
      safeInit.signal = s;
    } else {
      console.warn("[supabase] fetch: stripped non-native AbortSignal");
    }
  }

  try {
    return await window.fetch(urlStr, safeInit);
  } catch (err) {
    console.error("[supabase] fetch threw", {
      url: urlStr,
      errMessage: err instanceof Error ? err.message : String(err),
      safeInitKeys: Object.keys(safeInit),
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
