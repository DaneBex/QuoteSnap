import { ScrollView, Text } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { BottomCTA } from "@/components/layout/BottomCTA";
import { Button } from "@/components/ui/Button";
import { useWizardStore, type WizardCustomer } from "@/stores/wizardStore";

export function Step2Customer() {
  const { customer, setCustomer, setStep } = useWizardStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<WizardCustomer>({ defaultValues: customer });

  const onSubmit = (data: WizardCustomer) => {
    setCustomer(data);
    setStep(3);
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-2xl font-bold text-gray-900 mb-1">Customer info</Text>
      <Text className="text-gray-500 mb-6">
        Only the name is required. Fill in what you have.
      </Text>

      <Controller
        control={control}
        name="name"
        rules={{ required: "Customer name is required" }}
        render={({ field }) => (
          <Input
            label="Customer Name *"
            placeholder="Jane Smith"
            value={field.value}
            onChangeText={field.onChange}
            error={errors.name?.message}
            autoCapitalize="words"
          />
        )}
      />

      <Controller
        control={control}
        name="phone"
        render={({ field }) => (
          <Input
            label="Phone"
            placeholder="(555) 000-0000"
            value={field.value}
            onChangeText={field.onChange}
            keyboardType="phone-pad"
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <Input
            label="Email"
            placeholder="jane@example.com"
            value={field.value}
            onChangeText={field.onChange}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />

      <Controller
        control={control}
        name="address"
        render={({ field }) => (
          <Input
            label="Job Site Address"
            placeholder="123 Main St, Austin TX"
            value={field.value}
            onChangeText={field.onChange}
            autoCapitalize="words"
          />
        )}
      />

      <BottomCTA>
        <Button
          onPress={handleSubmit(onSubmit)}
          size="lg"
          className="w-full"
        >
          Continue
        </Button>
      </BottomCTA>
    </ScrollView>
  );
}
