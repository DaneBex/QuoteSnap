import { ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { DemoVideo } from "./DemoVideo";

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Add customer info and rough job notes",
    body: "Enter the customer name, job address, and any notes from the site visit — even rough ones.",
  },
  {
    step: "2",
    title: "QuoteSnap creates a clean estimate draft",
    body: "Scope of work, line items, and a customer-ready summary are drafted for you automatically.",
  },
  {
    step: "3",
    title: "Review, edit, confirm pricing, and save",
    body: "You check every line, confirm your prices, make edits, and save or print the final estimate.",
  },
];

const BUILT_FOR = [
  "Handymen",
  "Painters",
  "Drywall repair",
  "Deck and fence repair",
  "Flooring",
  "Landscaping",
  "Pressure washing",
  "Small remodel and repair contractors",
];

const CONTROL_POINTS = [
  "QuoteSnap creates a draft — you decide what goes out.",
  "You review every line item before saving.",
  "You confirm your own pricing.",
  "You can edit anything before sending.",
  "QuoteSnap does not replace your judgment.",
];

export function LandingPage() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-app-background" contentContainerStyle={{ paddingBottom: 64 }}>
      {/* Header */}
      <View className="px-5 pt-6 pb-3 flex-row items-center justify-between">
        <Text className="text-app-text-primary font-bold text-xl tracking-tight">QuoteSnap</Text>
        <Pressable
          onPress={() => router.push("/(auth)/login")}
          className="px-4 py-2 rounded-lg bg-app-surface border border-app-border"
        >
          <Text className="text-app-text-primary text-sm font-medium">Sign in</Text>
        </Pressable>
      </View>

      {/* Hero */}
      <View className="px-5 pt-8 pb-10">
        <View className="mb-3">
          <View className="self-start bg-app-accent-light px-3 py-1 rounded-full mb-4">
            <Text className="text-amber-700 text-xs font-semibold">Beta — Free to try</Text>
          </View>
          <Text className="text-app-text-primary text-3xl font-bold leading-tight mb-4">
            Create professional estimate drafts from rough jobsite notes in minutes.
          </Text>
          <Text className="text-app-text-secondary text-base leading-relaxed mb-3">
            QuoteSnap helps small contractors organize customer info, job notes, photos, scope of work, line items, and a printable estimate preview — without starting from scratch.
          </Text>
          <Text className="text-app-text-tertiary text-sm leading-relaxed">
            Built locally in Eau Claire, WI for small contractors, handymen, painters, remodelers, and repair pros.
          </Text>
        </View>

        <View className="flex-row gap-3 mt-6">
          <Pressable
            onPress={() => router.push("/(auth)/login")}
            className="flex-1 bg-app-accent rounded-xl py-4 items-center"
          >
            <Text className="text-white font-bold text-base">Try the Beta</Text>
          </Pressable>
        </View>
      </View>

      {/* Demo Video */}
      <View className="px-5 mb-10">
        <Text className="text-app-text-primary font-semibold text-lg mb-3">See it in action</Text>
        <View className="items-center">
          <View className="rounded-2xl overflow-hidden w-full bg-app-background" style={{ maxWidth: 320 }}>
            <DemoVideo />
          </View>
        </View>
      </View>

      {/* How it works */}
      <View className="px-5 mb-10">
        <Text className="text-app-text-primary font-bold text-xl mb-6">How it works</Text>
        <View className="gap-5">
          {HOW_IT_WORKS.map((item) => (
            <View key={item.step} className="flex-row gap-4">
              <View className="w-8 h-8 rounded-full bg-app-accent items-center justify-center shrink-0 mt-0.5">
                <Text className="text-white font-bold text-sm">{item.step}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-app-text-primary font-semibold text-base mb-1">{item.title}</Text>
                <Text className="text-app-text-secondary text-sm leading-relaxed">{item.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Built for */}
      <View className="px-5 mb-10">
        <Text className="text-app-text-primary font-bold text-xl mb-4">Built for</Text>
        <View className="flex-row flex-wrap gap-2">
          {BUILT_FOR.map((trade) => (
            <View key={trade} className="bg-app-surface border border-app-border rounded-lg px-4 py-2">
              <Text className="text-app-text-secondary text-sm">{trade}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Contractor stays in control */}
      <View className="mx-5 mb-10 bg-app-surface border border-app-border rounded-2xl p-6">
        <Text className="text-app-text-primary font-bold text-xl mb-4">You stay in control</Text>
        <View className="gap-3">
          {CONTROL_POINTS.map((point) => (
            <View key={point} className="flex-row gap-3 items-start">
              <Text className="text-app-accent text-base mt-0.5">✓</Text>
              <Text className="text-app-text-secondary text-sm leading-relaxed flex-1">{point}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Final CTA */}
      <View className="mx-5 bg-stone-900 rounded-2xl p-6 items-center">
        <Text className="text-white font-bold text-xl text-center mb-2">
          Want to try QuoteSnap on your next estimate?
        </Text>
        <Text className="text-stone-400 text-sm text-center mb-6 leading-relaxed">
          First few estimates are free while I'm collecting contractor feedback.
        </Text>
        <Pressable
          onPress={() => router.push("/(auth)/login")}
          className="w-full bg-app-accent rounded-xl py-4 items-center"
        >
          <Text className="text-white font-bold text-base">Try the Beta</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
