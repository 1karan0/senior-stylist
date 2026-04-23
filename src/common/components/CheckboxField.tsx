import { useTheme } from '@/contexts/ThemeContext';
import { Text, TouchableOpacity, View } from 'react-native';

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onPress: () => void;
  disabled: boolean;
  className?: string;
}

const CheckboxField = ({ label, checked, onPress, disabled, className }: CheckboxFieldProps) => {
  const { isDark } = useTheme();
  return (
    <View className={`flex-row items-center ${className}`}>
      <TouchableOpacity onPress={onPress} disabled={disabled}>
        <View
          className={`w-6 h-6 rounded-lg border-textPrimary border-2 items-center justify-center ${checked ? 'bg-textPrimary' : isDark ? 'bg-[#162721]' : 'bg-[#F7FAF8]'}`}
        >
          {checked && <View className="w-3 h-3 rounded-md bg-white" />}
        </View>
      </TouchableOpacity>
      <Text
        className={`text-sm font-urbanist-bold ml-2 ${isDark ? 'text-white' : 'text-textDark'}`}
      >
        {label}
      </Text>
    </View>
  );
};

export default CheckboxField;
