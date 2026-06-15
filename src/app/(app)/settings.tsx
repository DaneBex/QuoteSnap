import {
  View,
  Text,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { BottomCTA } from "@/components/layout/BottomCTA";
import { supabase } from "@/lib/supabase";
import { tokens } from "@/styles";

interface BusinessForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  license_number: string;
}

function Field({
  label,
  field,
  placeholder,
  keyboardType,
  form,
  setForm,
}: {
  label: string;
  field: keyof BusinessForm;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "email-address";
  form: BusinessForm;
  setForm: React.Dispatch<React.SetStateAction<BusinessForm>>;
}) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-app-text-secondary mb-1.5">{label}</Text>
      <TextInput
        value={form[field]}
        onChangeText={(v) => setForm((f) => ({ ...f, [field]: v }))}
        placeholder={placeholder}
        placeholderTextColor={tokens.textTertiary}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
        className="bg-app-surface border border-app-border rounded-xl px-4 py-3.5 text-base text-app-text-primary"
      />
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<BusinessForm>({
    name: "",
    phone: "",
    email: "",
    address: "",
    license_number: "",
  });
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<"success" | "error" | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaveResultRef = useRef<"success" | "error">("success");
  if (saveResult !== null) lastSaveResultRef.current = saveResult;

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (data) {
        setBusinessId(data.id);
        setForm({
          name: data.name ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          address: data.address ?? "",
          license_number: data.license_number ?? "",
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert("Business name is required");
      return;
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveResult(null);
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (businessId) {
        await supabase
          .from("businesses")
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq("id", businessId);
      } else {
        const { data: newRow } = await supabase
          .from("businesses")
          .insert({ ...form, user_id: user.id })
          .select("id")
          .single();
        if (newRow) setBusinessId(newRow.id);
      }
      setSaveResult("success");
      saveTimerRef.current = setTimeout(() => setSaveResult(null), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Try again.";
      setSaveResult("error");
      setSaveErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View className="flex-1 bg-app-background" style={{ paddingTop: insets.top }}>
      <PageHeader title="Business Settings" showBack />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={tokens.accent} />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-sm font-semibold text-app-text-tertiary uppercase tracking-wide mb-4">
            Business Profile
          </Text>

          <Field label="Business Name *" field="name" placeholder="Smith Contracting" form={form} setForm={setForm} />
          <Field label="Phone" field="phone" placeholder="(555) 000-0000" keyboardType="phone-pad" form={form} setForm={setForm} />
          <Field label="Email" field="email" placeholder="you@business.com" keyboardType="email-address" form={form} setForm={setForm} />
          <Field label="Address" field="address" placeholder="123 Main St, City, TX" form={form} setForm={setForm} />
          <Field label="License Number" field="license_number" placeholder="TX-123456" form={form} setForm={setForm} />

          <View className="mt-8 pt-6 border-t border-app-border">
            <TouchableOpacity
              onPress={handleSignOut}
              className="items-center py-4"
            >
              <Text className="text-app-danger font-semibold text-base">Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <BottomCTA>
        <Toast
          visible={saveResult !== null}
          type={lastSaveResultRef.current}
          message={
            lastSaveResultRef.current === "success"
              ? "Profile saved"
              : saveErrorMsg || "Could not save profile. Please try again."
          }
        />
        <Button onPress={handleSave} loading={saving} size="lg" className="w-full">
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </BottomCTA>
    </View>
  );
}
