import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Camera, X, Plus, Image as ImageIcon } from "lucide-react-native";
import { BottomCTA } from "@/components/layout/BottomCTA";
import { Button } from "@/components/ui/Button";
import { useWizardStore } from "@/stores/wizardStore";
import { supabase } from "@/lib/supabase";
import { tokens } from "@/styles";

const MAX_PHOTOS = 8;

export function Step3Photos() {
  const { photos, addPhoto, removePhoto, updatePhotoStorageKey, setStep } =
    useWizardStore();
  const [uploading, setUploading] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert("Max photos reached", `You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }

    let result: ImagePicker.ImagePickerResult;

    if (useCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Camera access needed", "Allow camera access in settings.");
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        allowsEditing: false,
      });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Photo access needed", "Allow photo library access in settings.");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
        allowsMultipleSelection: true,
        selectionLimit: MAX_PHOTOS - photos.length,
      });
    }

    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    const index = photos.length;

    for (const asset of result.assets) {
      try {
        addPhoto({ uri: asset.uri });
        const photoIndex = index + result.assets.indexOf(asset);

        // Upload to Supabase Storage
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const ext = asset.uri.split(".").pop() ?? "jpg";
          const filename = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

          const response = await fetch(asset.uri);
          const blob = await response.blob();

          const { data } = await supabase.storage
            .from("job-photos")
            .upload(filename, blob, { contentType: `image/${ext}` });

          if (data) {
            updatePhotoStorageKey(photoIndex, data.path);
          }
        }
      } catch {
        // Photo still added locally even if upload fails
      }
    }
    setUploading(false);
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
    >
      <Text className="text-2xl font-bold text-app-text-primary mb-1">Job photos</Text>
      <Text className="text-app-text-secondary mb-6">
        Add photos from the site. The AI will use these as context.
      </Text>

      {/* Photo grid */}
      {photos.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mb-4">
          {photos.map((photo, i) => (
            <View key={i} className="relative">
              <Image
                source={{ uri: photo.uri }}
                className="w-24 h-24 rounded-xl"
                resizeMode="cover"
              />
              {!photo.storageKey && (
                <View className="absolute inset-0 bg-black/30 rounded-xl items-center justify-center">
                  <ActivityIndicator color={tokens.textInverse} size="small" />
                </View>
              )}
              <TouchableOpacity
                onPress={() => removePhoto(i)}
                className="absolute top-1 right-1 bg-app-danger rounded-full w-5 h-5 items-center justify-center"
              >
                <X size={12} color={tokens.textInverse} />
              </TouchableOpacity>
            </View>
          ))}

          {photos.length < MAX_PHOTOS && (
            <TouchableOpacity
              onPress={() => pickImage(false)}
              className="w-24 h-24 rounded-xl bg-app-surface-alt items-center justify-center border-2 border-dashed border-app-border-strong"
            >
              <Plus size={24} color={tokens.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Pick buttons */}
      {photos.length === 0 && (
        <View className="gap-3 mb-4">
          <TouchableOpacity
            onPress={() => pickImage(true)}
            className="bg-app-accent rounded-2xl py-5 items-center flex-row justify-center gap-3"
            activeOpacity={0.8}
          >
            <Camera size={24} color={tokens.textInverse} />
            <Text className="text-app-text-inverse font-bold text-lg">Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => pickImage(false)}
            className="bg-app-surface border-2 border-app-accent rounded-2xl py-4 items-center flex-row justify-center gap-3"
            activeOpacity={0.8}
          >
            <ImageIcon size={22} color={tokens.accent} />
            <Text className="text-app-accent font-bold text-base">Choose from Library</Text>
          </TouchableOpacity>
        </View>
      )}

      {photos.length > 0 && (
        <View className="flex-row gap-3 mt-2">
          <TouchableOpacity
            onPress={() => pickImage(true)}
            className="flex-1 bg-app-surface-alt rounded-xl py-3 items-center flex-row justify-center gap-2"
            activeOpacity={0.8}
          >
            <Camera size={18} color={tokens.textSecondary} />
            <Text className="text-app-text-secondary font-semibold">Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => pickImage(false)}
            className="flex-1 bg-app-surface-alt rounded-xl py-3 items-center flex-row justify-center gap-2"
            activeOpacity={0.8}
          >
            <ImageIcon size={18} color={tokens.textSecondary} />
            <Text className="text-app-text-secondary font-semibold">Library</Text>
          </TouchableOpacity>
        </View>
      )}

      <BottomCTA>
        <Button
          onPress={() => setStep(4)}
          size="lg"
          className="w-full"
          loading={uploading}
        >
          {photos.length === 0 ? "Skip Photos" : `Continue with ${photos.length} photo${photos.length !== 1 ? "s" : ""}`}
        </Button>
      </BottomCTA>
    </ScrollView>
  );
}
