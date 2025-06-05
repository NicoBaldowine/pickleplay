import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabaseClient } from '../../lib/supabase';
import { authService } from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface EmailVerificationScreenProps {
  email: string;
  password?: string;
  onVerificationComplete: () => void;
  onResendEmail?: () => void;
  onStartOver?: () => void;
}

export default function EmailVerificationScreen({ 
  email, 
  password,
  onVerificationComplete,
  onResendEmail,
  onStartOver
}: EmailVerificationScreenProps) {
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle deep linking for email verification
  useEffect(() => {
    const handleDeepLink = async (event: Linking.EventType) => {
      console.log('🔗 Deep link received:', event.url);
      await createSessionFromUrl(event.url);
    };

    const createSessionFromUrl = async (url: string) => {
      try {
        // Replace # with ? to make params accessible
        const accessibleUrl = url.replace('#', '?');
        console.log('🔗 Processing accessible URL:', accessibleUrl);
        
        // Check if this is an email verification link (has access_token)
        const isVerificationLink = accessibleUrl.includes('access_token') || 
                                 accessibleUrl.includes('email-verified');
        
        if (!isVerificationLink) {
          console.log('ℹ️ Not a verification link, ignoring');
          return;
        }
        
        setIsVerifying(true);
        const { params, errorCode } = QueryParams.getQueryParams(accessibleUrl);
        
        if (errorCode) {
          console.error('❌ Error in URL params:', errorCode);
          setIsVerifying(false);
          return;
        }

        const { access_token, refresh_token } = params;
        
        if (access_token && refresh_token) {
          console.log('🎉 Found tokens in URL! Setting session...');
          
          const { data, error } = await supabaseClient.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) {
            console.error('❌ Failed to set session:', error);
            Alert.alert('Verification Error', 'Failed to verify your email. Please try again.');
            setIsVerifying(false);
            return;
          }

          if (data && data.session) {
            console.log('✅ Email verified successfully via deep link! User:', data.session.user.email);
            console.log('📧 Email verified! Getting user session...');
            console.log('✅ User verified:', data.session.user.id);
            
            // Save user to AsyncStorage for offline access
            if (data.session.user) {
              await AsyncStorage.setItem('supabase_user', JSON.stringify(data.session.user));
            }
            
            // The session is already set, no need to login again
            // Just complete the verification
            setIsVerifying(false);
            onVerificationComplete();
          }
        } else {
          console.log('ℹ️ No tokens found in URL, not a verification link');
        }
      } catch (error) {
        console.error('💥 Error processing deep link:', error);
      } finally {
        setIsVerifying(false);
      }
    };

    // Check if app was opened with a URL (cold start)
    const checkInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('🚀 App opened with URL (cold start):', initialUrl);
        await createSessionFromUrl(initialUrl);
      }
    };

    checkInitialURL();

    // Listen for URLs when app is already running (warm start)
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      linkingSubscription.remove();
    };
  }, [onVerificationComplete, email, password]);

  const resendVerificationEmail = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    try {
      console.log('📧 Resending verification email...');
      
      // Recreate account WITHOUT metadata
      const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password || 'temp_password_123456',
        options: {
          emailRedirectTo: 'exp://10.0.0.48:8081/--/email-verified',
          // NO DATA/METADATA
        }
      });
      
      if (error && !error.message?.includes('already registered')) {
        console.error('❌ Failed to resend email:', error);
        Alert.alert('Error', 'Failed to resend verification email.');
      } else {
        console.log('✅ Verification email resent to:', email);
        console.log('🔗 Email will redirect to: exp://10.0.0.48:8081/--/email-verified');
        Alert.alert('Email Sent', 'A new verification email has been sent to your inbox.');
        setCountdown(60);
      }
      
      onResendEmail?.();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  const handleManualContinue = async () => {
    setIsVerifying(true);
    try {
      console.log('🔄 Manual continue - checking user session...');
      
      // Try to get current user session
      const user = await authService.getCurrentUser();
      if (user) {
        console.log('✅ User session found, continuing to profile setup');
        setIsVerifying(false);
        onVerificationComplete();
        return;
      }
      
      // If no user, try to sign in with email/password
      if (password) {
        console.log('🔐 Attempting to sign in with stored credentials...');
        const response = await authService.signIn(email, password);
        if (response.success) {
          console.log('✅ Sign in successful, continuing to profile setup');
          setIsVerifying(false);
          onVerificationComplete();
          return;
        }
      }
      
      // If all else fails, show message
      Alert.alert(
        'Email Not Verified',
        'Please click the verification link in your email first, then try again.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error in manual continue:', error);
      Alert.alert(
        'Verification Error',
        'Please make sure you have clicked the verification link in your email.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="mail" size={80} color="#1a1a1a" />
          <Text style={styles.title}>Check Your Email 📧</Text>
          <Text style={styles.subtitle}>
            We've sent a verification link to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
        </View>

        {/* Main Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.mainMessage}>
            Click the verification link in your email to verify your account.
          </Text>
          <Text style={styles.subMessage}>
            After verification, you'll automatically return to the app to complete your profile.
          </Text>
        </View>

        {/* Verifying indicator */}
        {isVerifying && (
          <View style={styles.verifyingContainer}>
            <ActivityIndicator size="large" color="#1a1a1a" />
            <Text style={styles.verifyingText}>Verifying your email...</Text>
          </View>
        )}

        {/* Manual Continue Button */}
        <View style={styles.manualSection}>
          <Text style={styles.manualText}>Already verified your email?</Text>
          <TouchableOpacity
            style={styles.manualButton}
            onPress={handleManualContinue}
            disabled={isVerifying}
          >
            <Text style={styles.manualButtonText}>Continue to Profile Setup</Text>
          </TouchableOpacity>
        </View>

        {/* Resend Section */}
        <View style={styles.resendSection}>
          <Text style={styles.resendText}>Didn't receive the email?</Text>
          <TouchableOpacity
            style={[
              styles.resendButton,
              (countdown > 0 || isResending) && styles.resendButtonDisabled
            ]}
            onPress={resendVerificationEmail}
            disabled={countdown > 0 || isResending}
          >
            {isResending ? (
              <ActivityIndicator size="small" color="#1a1a1a" />
            ) : (
              <Text style={styles.resendButtonText}>
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Email'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Start Over Section */}
        {onStartOver && (
          <View style={styles.startOverSection}>
            <Text style={styles.startOverText}>Having trouble?</Text>
            <TouchableOpacity
              style={styles.startOverButton}
              onPress={onStartOver}
            >
              <Text style={styles.startOverButtonText}>Start Over</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '80%',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  emailText: {
    fontWeight: 'bold',
  },
  messageContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  mainMessage: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  subMessage: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
  verifyingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  verifyingText: {
    fontSize: 16,
    marginTop: 10,
    color: '#666',
  },
  manualSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  manualText: {
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  manualButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  manualButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 16,
    marginBottom: 10,
  },
  resendButton: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 5,
  },
  resendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  resendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  startOverSection: {
    alignItems: 'center',
    marginTop: 30,
  },
  startOverText: {
    fontSize: 14,
    marginBottom: 10,
    color: '#666',
  },
  startOverButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  startOverButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
  },
});