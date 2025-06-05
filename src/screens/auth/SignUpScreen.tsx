import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { authService } from '../../services/authService';
import { COLORS } from '../../constants/colors';
import TopBar from '../../components/ui/TopBar';

interface SignUpScreenProps {
  onBack: () => void;
  onSignUp: (email: string, password: string) => void;
  onGoogleSignUp: () => void;
  onLoginPress?: () => void;
  onEmailVerificationRequired: (email: string, password: string) => void;
}

const SignUpScreen: React.FC<SignUpScreenProps> = memo(({ 
  onBack, 
  onSignUp, 
  onGoogleSignUp,
  onLoginPress,
  onEmailVerificationRequired
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🚀 Attempting to create account:', email);
      
      // First check if email already exists
      const emailExists = await authService.checkEmailExists(email.trim());
      
      if (emailExists) {
        console.log('❌ Email already exists:', email);
        Alert.alert(
          'Email Already Registered',
          'An account with this email already exists. Would you like to log in instead?',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Go to Login',
              onPress: () => {
                console.log('🔄 Redirecting to login');
                if (onLoginPress) {
                  onLoginPress();
                }
              }
            }
          ]
        );
        setIsLoading(false);
        return;
      }
      
      // Email doesn't exist, proceed with signup
      const response = await authService.signUp(email.trim(), password.trim(), {
        email: email.trim(),
        name: '',
        lastname: '',
        level: ''
      });
      
      if (response.success) {
        // Account created, proceed to verification
        console.log('✅ Account created, proceeding to email verification');
        onEmailVerificationRequired(email.trim(), password.trim());
      } else {
        // Handle error
        Alert.alert('Sign Up Failed', response.error || 'Failed to create account');
      }
      
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, onEmailVerificationRequired, onLoginPress]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const isFormValid = email.trim().length > 0 && password.trim().length >= 6;

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
            <Text style={styles.title}>Create an account</Text>
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
            <TouchableOpacity style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.continueButton, 
              (!isFormValid || isLoading) && styles.disabledButton
            ]} 
            onPress={handleSignUp}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={[
                styles.continueButtonText, 
                (!isFormValid || isLoading) && styles.disabledButtonText
              ]}>
                Continue
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
});

SignUpScreen.displayName = 'SignUpScreen';

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
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
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
  continueButton: {
    backgroundColor: COLORS.TEXT_PRIMARY,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#FFFFFF',
  },
  disabledButtonText: {
    opacity: 0.7,
  },
});

export default SignUpScreen; 