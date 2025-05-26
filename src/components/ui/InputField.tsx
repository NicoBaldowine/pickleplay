import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native';

interface InputFieldProps extends TextInputProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle; // Corrected to TextStyle
  inputContainerStyle?: ViewStyle; // Style for the View wrapping the TextInput
  helperTextStyle?: TextStyle;
  errorTextStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  helperText,
  errorText,
  containerStyle,
  labelStyle,
  inputStyle, // This is for the TextInput itself
  inputContainerStyle, // This is for the surrounding View
  helperTextStyle,
  errorTextStyle,
  leftIcon,
  rightIcon,
  onFocus,
  onBlur,
  ...restOfProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  const hasError = Boolean(errorText);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          inputContainerStyle, // User-defined style for the input's wrapping View
          isFocused && styles.inputContainerFocused,
          hasError && styles.inputContainerError,
        ]}
      >
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, inputStyle]} // User-defined style for the TextInput
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor="#A0A0A0" // Default placeholder text color
          {...restOfProps}
        />
        {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
      </View>
      {hasError && errorText && (
        <Text style={[styles.errorText, errorTextStyle]}>{errorText}</Text>
      )}
      {!hasError && helperText && (
        <Text style={[styles.helperText, helperTextStyle]}>{helperText}</Text>
      )}
    </View>
  );
};

interface Styles {
  container: ViewStyle;
  label: TextStyle;
  inputContainer: ViewStyle; // Default style for the View wrapping the TextInput
  inputContainerFocused: ViewStyle;
  inputContainerError: ViewStyle;
  input: TextStyle; // Default style for the TextInput itself
  helperText: TextStyle;
  errorText: TextStyle;
  iconContainer: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 6,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  inputContainerFocused: {
    borderColor: '#007AFF', // Blue border on focus
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2, // For Android focus effect
  },
  inputContainerError: {
    borderColor: '#FF3B30', // Red border for error
  },
  input: {
    flex: 1,
    height: 44, // Standard input height
    fontSize: 16,
    color: '#000000',
    paddingVertical: 0, // Ensure consistent height within the container
  },
  helperText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    paddingLeft: 2, // Align with input text generally
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30', // Red color for error text
    marginTop: 4,
    paddingLeft: 2,
  },
  iconContainer: {
    paddingHorizontal: 8,
  },
});

export default InputField; 