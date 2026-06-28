import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { LandingPage } from "@/components/landing/LandingPage";
import { tokens } from "@/styles";

export default function Index() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/(app)/dashboard");
      } else {
        setChecked(true);
      }
    });
  }, []);

  if (!checked) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: tokens.background }}>
        <ActivityIndicator size="large" color={tokens.accent} />
      </View>
    );
  }

  return <LandingPage />;
}
