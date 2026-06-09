import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react-native";
import { formatCurrency } from "@/lib/utils";
import { tokens } from "@/styles";
import type { EstimatePayload } from "@/types/estimate";

export function LineItemsTable() {
  const { control, register, setValue } = useFormContext<EstimatePayload>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const lineItems = useWatch({ control, name: "lineItems" });

  const subtotal = (lineItems ?? []).reduce((sum, li) => sum + (Number(li.total) || 0), 0);

  const updateTotal = (index: number) => {
    const item = lineItems?.[index];
    if (item) {
      const total = (Number(item.qty) || 0) * (Number(item.unit_price) || 0);
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
            className="border border-app-border rounded-xl px-3 py-3 text-base text-app-text-primary mb-2"
          />

          <View className="flex-row gap-2 mb-2">
            <View className="flex-1">
              <Text className="text-xs text-app-text-secondary mb-1">Qty</Text>
              <TextInput
                defaultValue={String(field.qty)}
                onChangeText={(v) => {
                  setValue(`lineItems.${index}.qty`, Number(v) || 0);
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
              <TextInput
                defaultValue={field.unit}
                onChangeText={(v) => setValue(`lineItems.${index}.unit`, v)}
                placeholder="hrs"
                placeholderTextColor={tokens.textTertiary}
                className="border border-app-border rounded-xl px-3 py-3 text-base text-app-text-primary"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-app-text-secondary mb-1">Unit Price</Text>
              <TextInput
                defaultValue={String(field.unit_price)}
                onChangeText={(v) => {
                  setValue(`lineItems.${index}.unit_price`, Number(v) || 0);
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
            <Text className="font-bold text-app-text-primary">
              {formatCurrency(
                (Number(lineItems?.[index]?.qty) || 0) *
                  (Number(lineItems?.[index]?.unit_price) || 0)
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
    </View>
  );
}
