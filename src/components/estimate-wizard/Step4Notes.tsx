import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react-native";
import { BottomCTA } from "@/components/layout/BottomCTA";
import { Button } from "@/components/ui/Button";
import { useWizardStore } from "@/stores/wizardStore";
import { useVoiceInput } from "@/hooks/useVoiceInput";

const PLACEHOLDER = `Example: "Customer wants back deck stairs replaced, railing tightened, two rotted boards swapped. Pressure wash and stain the full deck. Backyard access through side gate. Mid-grade stain. Need to confirm color."`;

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
      <Text className="text-2xl font-bold text-gray-900 mb-1">Job notes</Text>
      <Text className="text-gray-500 mb-4">
        Describe the work in your own words. The messier the better — the AI will clean it up.
      </Text>

      {isSupported && (
        <TouchableOpacity
          onPress={toggleVoice}
          className={`flex-row items-center justify-center gap-2 rounded-2xl py-4 mb-4 ${
            isListening ? "bg-red-500" : "bg-blue-600"
          }`}
          activeOpacity={0.8}
        >
          {isListening ? (
            <>
              <MicOff size={22} color="#fff" />
              <Text className="text-white font-bold text-base">Stop Recording</Text>
            </>
          ) : (
            <>
              <Mic size={22} color="#fff" />
              <Text className="text-white font-bold text-base">Record Voice Note</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {isListening && (
        <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-3">
          <Text className="text-red-600 font-medium text-sm">
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
        placeholderTextColor="#9ca3af"
        className="bg-white border border-gray-200 rounded-2xl px-4 py-4 text-base text-gray-900 min-h-[200px]"
        style={{ fontFamily: Platform.select({ ios: "System", android: "Roboto" }) }}
      />

      <Text className="text-gray-400 text-sm mt-2 text-right">
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
