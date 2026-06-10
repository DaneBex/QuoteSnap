import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { AlertCircle, Plus, Trash2 } from "lucide-react-native";
import { formatCurrency, parseAmount } from "@/lib/utils";
import { tokens } from "@/styles";
import type { EstimatePayload } from "@/types/estimate";

const UNIT_OPTIONS = ["each", "hrs", "day", "sq ft", "linear ft", "fixed", "allowance", "lot"];

function UnitField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (v: string) => void;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 150)}
        placeholder="unit"
        placeholderTextColor={tokens.textTertiary}
        className={`border border-app-border rounded-xl px-3 py-3 text-base text-app-text-primary ${isFocused ? "mb-1.5" : ""}`}
      />
      {isFocused && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-1.5">
            {UNIT_OPTIONS.map((opt) => {
              const selected = value === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => onChangeText(opt)}
                  className={`rounded-lg px-2 py-1 border ${
                    selected
                      ? "bg-app-accent-light border-app-accent"
                      : "bg-app-surface-alt border-app-border"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      selected ? "text-app-accent font-medium" : "text-app-text-secondary"
                    }`}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

export function LineItemsTable() {
  const { control, setValue } = useFormContext<EstimatePayload>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });
  const [descHeights, setDescHeights] = useState<Record<string, number>>({});

  const lineItems = useWatch({ control, name: "lineItems" });

  const subtotal = (lineItems ?? []).reduce(
    (sum, li) => sum + parseAmount(li.qty) * parseAmount(li.unit_price), 0
  );
  const hasIncompletePricing =
    (lineItems ?? []).length > 0 &&
    (subtotal === 0 || (lineItems ?? []).some((li) => li.description && (Number(li.unit_price) || 0) === 0));

  const updateTotal = (index: number) => {
    const item = lineItems?.[index];
    if (item) {
      const total = parseAmount(item.qty) * parseAmount(item.unit_price);
      setValue(`lineItems.${index}.total`, total);
    }
  };

  return (
    <View className="mb-6">
      <Text className="text-lg font-bold text-app-text-primary mb-3">Line Items</Text>

      {fields.map((field, index) => (
        <View
          key={field.id}
          className="bg-app-surface rounded-2xl p-4 mb-3 border border-app-border shadow-sm"
        >
          <View className="flex-row items-start justify-between mb-2">
            <Text className="text-sm font-semibold text-app-text-secondary">
              Item {index + 1}
            </Text>
            <TouchableOpacity
              onPress={() => remove(index)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={18} color={tokens.danger} />
            </TouchableOpacity>
          </View>

          <TextInput
            defaultValue={field.description}
            onChangeText={(v) => setValue(`lineItems.${index}.description`, v)}
            placeholder="Description"
            placeholderTextColor={tokens.textTertiary}
            multiline
            scrollEnabled={false}
            textAlignVertical="top"
            onContentSizeChange={(e) =>
              setDescHeights((prev) => ({
                ...prev,
                [field.id]: Math.max(44, e.nativeEvent.contentSize.height),
              }))
            }
            className="border border-app-border rounded-xl px-3 py-3 text-base text-app-text-primary mb-2"
            style={{ minHeight: 44, height: descHeights[field.id] ?? 44, ...(Platform.OS === "web" && { overflow: "hidden" }) }}
          />

          <View className="flex-row gap-2 mb-2">
            <View className="flex-1">
              <Text className="text-xs text-app-text-secondary mb-1">Qty</Text>
              <TextInput
                defaultValue={String(field.qty)}
                onChangeText={(v) => {
                  setValue(`lineItems.${index}.qty`, parseAmount(v));
                  updateTotal(index);
                }}
                keyboardType="decimal-pad"
                placeholder="1"
                placeholderTextColor={tokens.textTertiary}
                className="border border-app-border rounded-xl px-3 py-3 text-base text-app-text-primary"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-app-text-secondary mb-1">Unit</Text>
              <UnitField
                value={lineItems?.[index]?.unit ?? field.unit}
                onChangeText={(v) => setValue(`lineItems.${index}.unit`, v)}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-app-text-secondary mb-1">Unit Price</Text>
              <TextInput
                defaultValue={String(field.unit_price)}
                onChangeText={(v) => {
                  setValue(`lineItems.${index}.unit_price`, parseAmount(v));
                  updateTotal(index);
                }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={tokens.textTertiary}
                className="border border-app-border rounded-xl px-3 py-3 text-base text-app-text-primary"
              />
            </View>
          </View>

          <View className="flex-row justify-between items-center bg-app-background rounded-xl px-3 py-2">
            <Text className="text-app-text-secondary text-sm">Total</Text>
            <Text className="font-bold text-app-accent">
              {formatCurrency(
                parseAmount(lineItems?.[index]?.qty) *
                  parseAmount(lineItems?.[index]?.unit_price)
              )}
            </Text>
          </View>
        </View>
      ))}

      <TouchableOpacity
        onPress={() =>
          append({ description: "", qty: 1, unit: "each", unit_price: 0, total: 0 })
        }
        className="flex-row items-center justify-center gap-2 border-2 border-dashed border-app-accent rounded-2xl py-4 mb-4"
      >
        <Plus size={20} color={tokens.accent} />
        <Text className="text-app-accent font-semibold">Add Line Item</Text>
      </TouchableOpacity>

      <View className="bg-app-accent-light rounded-2xl px-4 py-3 flex-row justify-between">
        <Text className="font-bold text-app-text-primary text-base">Subtotal</Text>
        <Text className="font-bold text-app-accent text-base">
          {formatCurrency(subtotal)}
        </Text>
      </View>

      {hasIncompletePricing && (
        <View className="flex-row items-center gap-1.5 mt-2 px-1">
          <AlertCircle size={14} color={tokens.danger} />
          <Text className="text-xs text-app-danger leading-4">
            Pricing incomplete — add unit prices to finalize this estimate.
          </Text>
        </View>
      )}
    </View>
  );
}
