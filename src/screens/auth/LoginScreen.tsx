import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import TopBar from '../../components/ui/TopBar';

interface LoginScreenProps {
  onBack: () => void;
  onLogin: (email: string, password: string) => void;
  onForgotPassword?: (email: string) => void;
  isLoading?: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onBack, onLogin, onForgotPassword, isLoading = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isFormValid = email.trim().length > 0 && password.length >= 6;

  const handleLogin = () => {
    if (isFormValid) {
      onLogin(email.trim(), password);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <TopBar
          title=""
          leftIcon={<ArrowLeft size={24} color={COLORS.TEXT_PRIMARY} />}
          onLeftIconPress={onBack}
          style={styles.topBar}
        />

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Welcome back</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder=""
                placeholderTextColor={COLORS.TEXT_SECONDARY}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.textInput, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder=""
                  placeholderTextColor={COLORS.TEXT_SECONDARY}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  style={styles.eyeButton} 
                  onPress={togglePasswordVisibility}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={COLORS.TEXT_SECONDARY} />
                  ) : (
                    <Eye size={20} color={COLORS.TEXT_SECONDARY} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            {onForgotPassword && (
              <TouchableOpacity style={styles.forgotPasswordContainer} onPress={() => onForgotPassword(email)}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.loginButton, 
              (!isFormValid || isLoading) && styles.disabledButton
            ]} 
            onPress={handleLogin}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={[
                styles.loginButtonText, 
                (!isFormValid || isLoading) && styles.disabledButtonText
              ]}>
                Log In
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  topBar: {
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120, // Space for fixed button
  },
  titleSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },
  formSection: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50, // Make room for the eye icon
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }], // Half of icon size
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_SECONDARY,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 48,
  },
  loginButton: {
    backgroundColor: COLORS.TEXT_PRIMARY,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#FFFFFF',
  },
  disabledButtonText: {
    opacity: 0.7,
  },
});

export default LoginScreen; 