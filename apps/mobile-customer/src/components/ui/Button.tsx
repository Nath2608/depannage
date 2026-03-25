import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '@constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.base,
      ...styles[`size_${size}`],
      ...(fullWidth && styles.fullWidth),
    };

    if (isDisabled) {
      return { ...baseStyle, ...styles.disabled };
    }

    switch (variant) {
      case 'secondary':
        return { ...baseStyle, ...styles.secondary };
      case 'outline':
        return { ...baseStyle, ...styles.outline };
      case 'ghost':
        return { ...baseStyle, ...styles.ghost };
      case 'danger':
        return { ...baseStyle, ...styles.danger };
      default:
        return { ...baseStyle, ...styles.primary };
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = styles[`text_${size}`];

    if (isDisabled) {
      return { ...baseStyle, ...styles.textDisabled };
    }

    switch (variant) {
      case 'outline':
      case 'ghost':
        return { ...baseStyle, ...styles.textOutline };
      default:
        return { ...baseStyle, ...styles.textPrimary };
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[getButtonStyle(), style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? Colors.light.primary : Colors.light.white}
          size="small"
        />
      ) : (
        <>
          {leftIcon}
          <Text style={[getTextStyle(), textStyle, leftIcon && { marginLeft: Spacing.sm }]}>
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
  },
  fullWidth: {
    width: '100%',
  },
  // Sizes
  size_sm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 36,
  },
  size_md: {
    paddingVertical: Spacing.md - 2,
    paddingHorizontal: Spacing.lg,
    minHeight: 48,
  },
  size_lg: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    minHeight: 56,
  },
  // Variants
  primary: {
    backgroundColor: Colors.light.primary,
  },
  secondary: {
    backgroundColor: Colors.light.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.light.error,
  },
  disabled: {
    backgroundColor: Colors.light.surfaceSecondary,
  },
  // Text sizes
  text_sm: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  text_md: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  text_lg: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  // Text variants
  textPrimary: {
    color: Colors.light.white,
  },
  textOutline: {
    color: Colors.light.primary,
  },
  textDisabled: {
    color: Colors.light.textTertiary,
  },
});
