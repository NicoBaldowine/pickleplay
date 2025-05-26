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

interface TextAreaProps extends TextInputProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle; // Style for the TextInput itself
  inputContainerStyle?: ViewStyle; // Style for the View wrapping the TextInput
  helperTextStyle?: TextStyle;
  errorTextStyle?: TextStyle;
  numberOfLines?: number;
}

const TextArea: React.FC<TextAreaProps> = ({
  label,
  helperText,
  errorText,
  containerStyle,
  labelStyle,
  inputStyle,
  inputContainerStyle,
  helperTextStyle,
  errorTextStyle,
  numberOfLines = 4, // Default number of lines
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
          inputContainerStyle,
          isFocused && styles.inputContainerFocused,
          hasError && styles.inputContainerError,
        ]}
      >
        <TextInput
          style={[styles.input, inputStyle]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline={true}
          numberOfLines={numberOfLines}
          textAlignVertical="top" // Important for multiline
          placeholderTextColor="#A0A0A0"
          {...restOfProps}
        />
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
  inputContainer: ViewStyle;
  inputContainerFocused: ViewStyle;
  inputContainerError: ViewStyle;
  input: TextStyle;
  helperText: TextStyle;
  errorText: TextStyle;
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
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8, // Adjust padding for multiline
    backgroundColor: '#FFFFFF',
  },
  inputContainerFocused: {
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: '#FF3B30',
  },
  input: {
    fontSize: 16,
    color: '#000000',
    minHeight: 80, // Default min height for a few lines
    paddingVertical: 0, // Reset padding if container handles it
  },
  helperText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    paddingLeft: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    paddingLeft: 2,
  },
});

export default TextArea; 