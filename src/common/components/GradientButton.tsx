import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
}) => {
  const { isDark } = useTheme();

  const getGradientClass = () => {
    if (variant === 'primary') {
      return isDark ? 'bg-primary-gradient-dark' : 'bg-primary-gradient';
    }
    return 'bg-gray-500';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`
        ${getGradientClass()} 
        py-3 px-6 rounded-lg 
        shadow-lg
        ${disabled ? 'opacity-50' : 'opacity-100'}
      `}
    >
      <Text className="text-white text-center font-semibold text-lg">{title}</Text>
    </TouchableOpacity>
  );
};
