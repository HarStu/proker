import { Text, View, TextInput } from "react-native";
import { useState, useEffect } from "react";

interface CashSelectorProps {
  /**
   * Callback fired when values change.
   * pot - chips in pot
   * call - chips to call
   * isValid - whether the values make sense (call <= pot)
   */
  onChange?: (pot: number, call: number, isValid: boolean) => void;
}

export default function CashSelector({ onChange }: CashSelectorProps) {
  const [potAmount, setPotAmount] = useState<string>("");
  const [callAmount, setCallAmount] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(true);

  useEffect(() => {
    const pot = parseFloat(potAmount) || 0;
    const call = parseFloat(callAmount) || 0;
    const valid = call <= pot;
    setIsValid(valid);
    onChange?.(pot, call, valid);
  }, [potAmount, callAmount, onChange]);

  return (
    <View className="mb-4">
      <View className="flex-row gap-3">
        {/* Pot Amount */}
        <View className="flex-1">
          <Text className="text-xs font-semibold mb-1">Pot</Text>
          <TextInput
            className="p-2 border-2 border-gray-300 rounded-lg bg-white"
            value={potAmount}
            onChangeText={setPotAmount}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        {/* Call Amount */}
        <View className="flex-1">
          <Text className="text-xs font-semibold mb-1">Call</Text>
          <TextInput
            className={`p-2 border-2 rounded-lg bg-white ${!isValid && callAmount && potAmount
              ? 'border-red-500'
              : 'border-gray-300'
              }`}
            value={callAmount}
            onChangeText={setCallAmount}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Error Message */}
      {!isValid && callAmount && potAmount && (
        <View className="mt-2">
          <Text className="text-xs text-red-700">
            Call amount cannot be greater than pot amount
          </Text>
        </View>
      )}
    </View>
  );
} 