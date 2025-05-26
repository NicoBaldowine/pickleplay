import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'medium' | 'large';
}

const Button: React.FC<ButtonProps> = ({ label, onPress, variant = 'primary', size = 'medium' }) => {
  const buttonStyle = [
    styles.button,
    variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
    size === 'large' ? styles.largeButton : styles.mediumButton,
  ];
  const textStyle = [
    styles.text,
    variant === 'primary' ? styles.primaryText : styles.secondaryText,
    size === 'large' ? styles.largeText : styles.mediumText,
  ];

  return (
    <TouchableOpacity style={buttonStyle} onPress={onPress}>
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
};

interface Styles {
  button: ViewStyle;
  primaryButton: ViewStyle;
  secondaryButton: ViewStyle;
  mediumButton: ViewStyle; // Only padding, specific text styles handle font size
  largeButton: ViewStyle;  // Only padding, specific text styles handle font size
  text: TextStyle;
  primaryText: TextStyle;
  secondaryText: TextStyle;
  mediumText: TextStyle;
  largeText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  // Variant styles
  primaryButton: {
    backgroundColor: '#007AFF', // Blue
  },
  secondaryButton: {
    backgroundColor: '#E5E5EA', // Light Gray
  },
  // Size styles for button padding
  mediumButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  // Base text style
  text: {
    fontWeight: '600',
  },
  // Variant text colors
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#000000',
  },
  // Size text styles for font size
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
});

export default Button; 