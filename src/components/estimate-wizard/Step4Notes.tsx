import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react-native";
import { BottomCTA } from "@/components/layout/BottomCTA";
import { Button } from "@/components/ui/Button";
import { useWizardStore } from "@/stores/wizardStore";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { tokens } from "@/styles";

const PLACEHOLDER = `Example: "Customer wants back deck stairs replaced, railing tightened, two rotted boards swapped. Pressure wash and stain the full deck. Backyard access through side gate. Mid-grade stain. Need to confirm color."`;

const PROMPT_CHIPS = ["Scope", "Measurements", "Materials", "Access", "Timeline", "Problem areas", "Customer requests"];

export function Step4Notes() {
  const { notes, setNotes, setStep } = useWizardStore();
  const { isListening, transcript, isSupported, start, stop, clear } =
    useVoiceInput();
  const prevTranscriptRef = useRef(transcript);

  // Append new voice transcript to existing notes
  useEffect(() => {
    const newText = transcript.slice(prevTranscriptRef.current.length);
    if (newText) {
      setNotes(notes ? notes + " " + newText : newText);
    }
    prevTranscriptRef.current = transcript;
  }, [transcript]);

  const toggleVoice = () => {
    if (isListening) {
      stop();
      clear();
    } else {
      clear();
      start();
    }
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-2xl font-bold text-app-text-primary mb-1">Job notes</Text>
      <Text className="text-app-text-secondary mb-1">
        Describe the work in your own words. The messier the better — the AI will clean it up.
      </Text>
      <Text className="text-sm text-app-text-secondary mb-3">
        Mention what needs done, rough measurements, material preferences, access issues, timeline, and anything uncertain.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
      >
        {PROMPT_CHIPS.map((chip) => (
          <TouchableOpacity
            key={chip}
            onPress={() => setNotes(notes ? `${notes}\n${chip}: ` : `${chip}: `)}
            className="px-3 py-1.5 rounded-full border border-app-border bg-app-surface-alt"
            activeOpacity={0.7}
          >
            <Text className="text-sm text-app-text-secondary">{chip}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isSupported && (
        <TouchableOpacity
          onPress={toggleVoice}
          className={`flex-row items-center justify-center gap-2 rounded-2xl py-4 mb-4 ${
            isListening ? "bg-app-danger" : "bg-app-accent"
          }`}
          activeOpacity={0.8}
        >
          {isListening ? (
            <>
              <MicOff size={22} color={tokens.textInverse} />
              <Text className="text-app-text-inverse font-bold text-base">Stop Recording</Text>
            </>
          ) : (
            <>
              <Mic size={22} color={tokens.textInverse} />
              <Text className="text-app-text-inverse font-bold text-base">Record Voice Note</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {isListening && (
        <View className="bg-app-danger-light border border-app-danger rounded-xl px-4 py-3 mb-3">
          <Text className="text-app-danger font-medium text-sm">
            🎙️ Listening… speak now
          </Text>
        </View>
      )}

      <TextInput
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={8}
        textAlignVertical="top"
        placeholder={PLACEHOLDER}
        placeholderTextColor={tokens.textTertiary}
        className="bg-app-surface border border-app-border rounded-2xl px-4 py-4 text-base text-app-text-primary min-h-[200px]"
        style={{ fontFamily: Platform.select({ ios: "System", android: "Roboto" }) }}
      />

      <Text className="text-app-text-tertiary text-sm mt-2 text-right">
        {notes.length} characters
      </Text>

      <BottomCTA>
        <Button
          onPress={() => setStep(5)}
          size="lg"
          className="w-full"
          disabled={isListening}
        >
          Generate Estimate
        </Button>
      </BottomCTA>
    </ScrollView>
  );
}
