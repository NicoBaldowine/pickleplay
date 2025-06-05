import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { authService } from '../../services/authService';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabaseClient } from '../../lib/supabase';

interface ResetPasswordScreenProps {
  onBack: () => void;
  onPasswordReset: () => void;
}

export default function ResetPasswordScreen({ onBack, onPasswordReset }: ResetPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasValidToken, setHasValidToken] = useState(false);
  const [waitingForToken, setWaitingForToken] = useState(true);

  // Handle deep linking for password reset
  useEffect(() => {
    const handleDeepLink = async (event: Linking.EventType) => {
      console.log('🔗 Reset password deep link received:', event.url);
      await extractResetToken(event.url);
    };

    const extractResetToken = async (url: string) => {
      try {
        const accessibleUrl = url.replace('#', '?');
        console.log('🔗 Processing reset URL:', accessibleUrl);
        
        const { params, errorCode } = QueryParams.getQueryParams(accessibleUrl);
        
        if (errorCode) {
          console.error('❌ Error in URL params:', errorCode);
          Alert.alert('Invalid Link', 'The password reset link is invalid or expired.');
          return;
        }

        const { access_token, refresh_token, type } = params;
        
        // Check if this is a recovery link
        if (type === 'recovery' && access_token && refresh_token) {
          console.log('🎉 Found reset tokens! Setting session...');
          
          const { data, error } = await supabaseClient.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) {
            console.error('❌ Failed to set reset session:', error);
            Alert.alert('Error', 'Failed to validate reset link. Please request a new one.');
            return;
          }

          if (data && data.session) {
            console.log('✅ Reset session established for user:', data.session.user.email);
            setHasValidToken(true);
            setWaitingForToken(false);
          }
        }
      } catch (error) {
        console.error('💥 Error processing reset link:', error);
        Alert.alert('Error', 'Failed to process reset link.');
      }
    };

    // Check if app was opened with a reset URL
    const checkInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && (initialUrl.includes('reset-password') || initialUrl.includes('type=recovery'))) {
        console.log('🚀 App opened with reset URL:', initialUrl);
        await extractResetToken(initialUrl);
      } else {
        // If no reset URL, allow access after a short delay (for development)
        setTimeout(() => {
          console.log('⚠️ No reset token found, allowing direct access for development');
          setHasValidToken(true);
          setWaitingForToken(false);
        }, 1000);
      }
    };

    checkInitialURL();

    // Listen for URLs when app is already running
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    // Set a timeout to allow access even without token (for development)
    const timeout = setTimeout(() => {
      if (waitingForToken) {
        console.log('⏱️ Timeout reached, allowing access without token');
        setHasValidToken(true);
        setWaitingForToken(false);
      }
    }, 2000);

    return () => {
      linkingSubscription.remove();
      clearTimeout(timeout);
    };
  }, [waitingForToken]);

  const validatePasswords = () => {
    if (!password || !confirmPassword) {
      Alert.alert('Missing Information', 'Please fill in both password fields');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'The passwords you entered do not match');
      return false;
    }

    return true;
  };

  const handleResetPassword = async () => {
    if (!validatePasswords()) {
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔐 Resetting password...');
      
      const result = await authService.updatePassword(password);
      
      if (result.success) {
        Alert.alert(
          'Password Reset Successful!',
          'Your password has been updated. Please log in with your new password.',
          [
            {
              text: 'OK',
              onPress: () => onPasswordReset()
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Error', 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = password.length >= 6 && confirmPassword.length >= 6 && password === confirmPassword;

  // Show message if no valid token
  if (!hasValidToken) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.noTokenContainer}>
          <Text style={styles.noTokenTitle}>Reset Link Required</Text>
          <Text style={styles.noTokenText}>
            Please click the password reset link in your email to access this page.
          </Text>
          <TouchableOpacity 
            style={styles.backToLoginButton}
            onPress={onBack}
          >
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <ArrowLeft size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Create a new password for your account
              </Text>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.textInput, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter new password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#888" />
                  ) : (
                    <Eye size={20} color="#888" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.textInput, styles.passwordInput]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#888" />
                  ) : (
                    <Eye size={20} color="#888" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <Text style={[
                styles.requirementItem,
                password.length >= 6 ? styles.requirementMet : styles.requirementNotMet
              ]}>
                • At least 6 characters
              </Text>
              <Text style={[
                styles.requirementItem,
                password === confirmPassword && password.length > 0 ? styles.requirementMet : styles.requirementNotMet
              ]}>
                • Passwords match
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.resetButton,
                (!isFormValid || isLoading) && styles.disabledButton
              ]}
              onPress={handleResetPassword}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.resetButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2D6',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  titleSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  passwordContainer: {
    position: 'relative',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  requirementsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 14,
    marginBottom: 4,
  },
  requirementMet: {
    color: '#4CAF50',
  },
  requirementNotMet: {
    color: '#999',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FEF2D6',
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: 40,
  },
  resetButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#E5E5E7',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noTokenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noTokenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  noTokenText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  backToLoginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  backToLoginText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 