import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  Pressable,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
import { Camera, Image as ImageIcon, X, Check, EyeOff } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { tokens } from "@/styles";
import type { JobPhoto } from "@/types/estimate";

interface Props {
  jobId: string;
}

export function JobPhotosSection({ jobId }: Props) {
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const captionTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!jobId) return;
    fetchPhotos();
  }, [jobId]);

  const fetchPhotos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("job_photos")
      .select("*")
      .eq("job_id", jobId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (!data) {
      setLoading(false);
      return;
    }

    const withUrls = await Promise.all(
      data.map(async (p) => {
        const { data: urlData } = await supabase.storage
          .from("job-photos")
          .createSignedUrl(p.storage_path, 3600);
        return { ...p, signedUrl: urlData?.signedUrl ?? undefined };
      })
    );

    setPhotos(withUrls);
    setLoading(false);
  };

  const updateCaption = (id: string, caption: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, description: caption } : p))
    );
    if (captionTimers.current[id]) clearTimeout(captionTimers.current[id]);
    captionTimers.current[id] = setTimeout(async () => {
      await supabase.from("job_photos").update({ description: caption }).eq("id", id);
    }, 800);
  };

  const toggleInclude = async (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (!photo) return;
    const newVal = !photo.include_in_customer_estimate;
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, include_in_customer_estimate: newVal } : p))
    );
    await supabase
      .from("job_photos")
      .update({ include_in_customer_estimate: newVal })
      .eq("id", id);
  };

  const deletePhoto = (photo: JobPhoto) => {
    const doDelete = async () => {
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      await supabase.from("job_photos").delete().eq("id", photo.id);
      await supabase.storage.from("job-photos").remove([photo.storage_path]);
    };

    if (Platform.OS === "web") {
      if (window.confirm("Remove this photo?")) doDelete();
    } else {
      Alert.alert("Remove photo?", "This cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  const addPhoto = async (useCamera: boolean) => {
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
        selectionLimit: 8 - photos.length,
      });
    }

    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (const asset of result.assets) {
        const ext = asset.uri.split(".").pop() ?? "jpg";
        const filename = `${user.id}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        const response = await fetch(asset.uri);
        const blob = await response.blob();

        const { data: uploadData } = await supabase.storage
          .from("job-photos")
          .upload(filename, blob, { contentType: `image/${ext}` });

        if (!uploadData) continue;

        const { data: inserted } = await supabase
          .from("job_photos")
          .insert({
            job_id: jobId,
            user_id: user.id,
            storage_path: uploadData.path,
            include_in_customer_estimate: false,
            sort_order: photos.length,
          })
          .select("*")
          .single();

        if (inserted) {
          const { data: urlData } = await supabase.storage
            .from("job-photos")
            .createSignedUrl(uploadData.path, 3600);
          setPhotos((prev) => [
            ...prev,
            { ...inserted, signedUrl: urlData?.signedUrl ?? undefined },
          ]);
        }
      }
    } catch {
      Alert.alert("Upload failed", "Could not upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="mb-6">
      <Text className="text-lg font-bold text-app-text-primary mb-3">Job Photos</Text>

      {loading ? (
        <ActivityIndicator color={tokens.accent} style={{ marginVertical: 12 }} />
      ) : (
        <>
          {photos.map((photo) => (
            <View
              key={photo.id}
              className="bg-app-surface border border-app-border rounded-xl mb-3"
            >
              <View className="flex-row p-3 gap-3 items-start">
                {/* Thumbnail */}
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    overflow: "hidden",
                    backgroundColor: tokens.surfaceAlt,
                    flexShrink: 0,
                  }}
                >
                  {photo.signedUrl ? (
                    <Image
                      source={{ uri: photo.signedUrl }}
                      style={{ width: 80, height: 80 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
                    >
                      <ActivityIndicator size="small" color={tokens.textSecondary} />
                    </View>
                  )}
                </View>

                {/* Right column */}
                <View className="flex-1 gap-2">
                  {/* Caption + delete */}
                  <View className="flex-row items-start gap-2">
                    <TextInput
                      value={photo.description ?? ""}
                      onChangeText={(v) => updateCaption(photo.id, v)}
                      placeholder="Add caption…"
                      placeholderTextColor={tokens.textTertiary}
                      multiline
                      scrollEnabled={false}
                      className="flex-1 bg-stone-50 border border-app-border rounded-lg px-3 py-2 text-sm text-app-text-primary"
                      style={{
                        minHeight: 36,
                        textAlignVertical: "top",
                        ...(Platform.OS === "web" ? { overflow: "hidden" } : {}),
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => deletePhoto(photo)}
                      hitSlop={8}
                      style={{ marginTop: 4 }}
                      className="w-6 h-6 rounded-full bg-red-50 items-center justify-center"
                    >
                      <X size={12} color={tokens.danger} />
                    </TouchableOpacity>
                  </View>

                  {/* Include toggle + internal badge */}
                  <View className="flex-row items-center justify-between">
                    <Pressable
                      onPress={() => toggleInclude(photo.id)}
                      className="flex-row items-center gap-2"
                      hitSlop={8}
                    >
                      <View
                        style={{ width: 20, height: 20 }}
                        className={`rounded border-2 items-center justify-center flex-shrink-0 ${
                          photo.include_in_customer_estimate
                            ? "bg-app-accent border-app-accent"
                            : "bg-white border-app-border"
                        }`}
                      >
                        {photo.include_in_customer_estimate ? (
                          <Check size={11} color="#ffffff" />
                        ) : null}
                      </View>
                      <Text className="text-xs text-app-text-secondary">
                        Include in estimate
                      </Text>
                    </Pressable>

                    {!photo.include_in_customer_estimate && (
                      <View className="flex-row items-center gap-1 bg-stone-100 rounded px-2 py-0.5">
                        <EyeOff size={10} color={tokens.textTertiary} />
                        <Text className="text-xs text-app-text-tertiary">Internal</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          ))}

          {photos.length === 0 && (
            <Text className="text-sm text-app-text-tertiary text-center mb-3">
              No photos yet. Add photos to document the job site.
            </Text>
          )}

          {/* Add photo buttons */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => addPhoto(true)}
              disabled={uploading}
              className="flex-1 flex-row items-center justify-center gap-2 bg-app-surface-alt border border-app-border rounded-xl py-3"
            >
              {uploading ? (
                <ActivityIndicator size="small" color={tokens.textSecondary} />
              ) : (
                <Camera size={16} color={tokens.textSecondary} />
              )}
              <Text className="text-sm text-app-text-secondary font-medium">Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => addPhoto(false)}
              disabled={uploading}
              className="flex-1 flex-row items-center justify-center gap-2 bg-app-surface-alt border border-app-border rounded-xl py-3"
            >
              <ImageIcon size={16} color={tokens.textSecondary} />
              <Text className="text-sm text-app-text-secondary font-medium">Library</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
