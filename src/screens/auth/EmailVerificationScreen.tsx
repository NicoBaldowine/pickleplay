import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabaseClient } from '../../lib/supabase';
import { authService } from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/colors';

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
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);
  const [hasCompletedVerification, setHasCompletedVerification] = useState(false);

  // Global function to handle successful verification
  const handleSuccessfulVerification = useCallback(async (user: any) => {
    // Prevent multiple calls
    if (hasCompletedVerification) {
      console.log('🔒 Verification already completed, ignoring duplicate call');
      return;
    }
    
    console.log('✅ Email verified successfully! User:', user.email);
    setHasCompletedVerification(true);
    
    // Save user to AsyncStorage for offline access
    if (user) {
      await AsyncStorage.setItem('supabase_user', JSON.stringify(user));
    }
    
    // Mark as verified and complete the verification
    setHasVerified(true);
    setIsVerifying(false);
    
    console.log('🎯 Email successfully verified! Calling onVerificationComplete to proceed to profile setup...');
    
    // Small delay to show verified state, then proceed
    setTimeout(() => {
      onVerificationComplete();
    }, 1500);
  }, [onVerificationComplete, hasCompletedVerification]);

  // Check if user is already verified on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      // Prevent multiple verification checks
      if (hasCompletedVerification) {
        console.log('🔒 Verification already completed, skipping session check');
        return;
      }
      
      try {
        console.log('🔍 EmailVerificationScreen: Checking for existing session...');
        const user = await authService.getCurrentUser();
        
        // Only proceed if explicitly verified (must be true, not just "not false")
        const isExplicitlyVerified = user && (
          user.email_verified === true || 
          user.user_metadata?.email_verified === true ||
          user.email_confirmed_at // Alternative verification check
        );
        
        console.log('📧 Verification status:', {
          hasUser: !!user,
          email_verified: user?.email_verified,
          user_metadata_verified: user?.user_metadata?.email_verified,
          email_confirmed_at: user?.email_confirmed_at,
          isExplicitlyVerified
        });
        
        if (isExplicitlyVerified) {
          console.log('⚡ User already verified on mount! Proceeding directly...');
          await handleSuccessfulVerification(user);
        } else {
          console.log('📧 User not verified or no user found, waiting for verification...');
        }
      } catch (error) {
        console.log('ℹ️ No existing session, normal verification flow');
      }
    };

    checkExistingSession();
  }, [handleSuccessfulVerification, hasCompletedVerification]);

    // Handle deep linking for email verification - SIMPLIFIED
  useEffect(() => {
    const handleDeepLink = async (event: Linking.EventType) => {
      console.log('🔗 EmailVerificationScreen: Deep link received:', event.url);
      
      // Prevent multiple verification attempts
      if (hasCompletedVerification) {
        console.log('🔒 Verification already completed, ignoring deep link');
        return;
      }
      
      // Any deep link while on verification screen means user clicked email link
      if (!hasVerified && !isVerifying) {
        console.log('📧 Deep link detected while waiting for verification - assuming email clicked');
        setIsVerifying(true);
        
        // Process verification tokens from deep link
        setTimeout(async () => {
          try {
            // Extract tokens from the deep link URL if present
            if (event.url.includes('access_token')) {
              console.log('🔑 Extracting tokens from deep link...');
              
              // Parse URL fragments for tokens
              const url = new URL(event.url);
              const fragment = url.hash?.substring(1) || '';
              const params = new URLSearchParams(fragment);
              
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');
              
              if (accessToken && refreshToken) {
                console.log('✅ Found tokens in deep link, setting session...');
                
                // Set the session using the tokens from the deep link
                await supabaseClient.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken
                });
                
                console.log('🔑 Session set successfully with tokens from deep link');
              }
            }
            
            // Now force refresh to pick up the new session
            await authService.forceAuthStateRefresh();
            const user = await authService.getCurrentUser();
            
            if (user) {
              console.log('✅ User session found after deep link');
              await handleSuccessfulVerification(user);
            } else {
              console.log('⚠️ No user session found after deep link');
              setIsVerifying(false);
            }
          } catch (error) {
            console.error('Error after deep link:', error);
            setIsVerifying(false);
          }
        }, 2000);
      }
    };

    // Listen for URLs when app is already running
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      linkingSubscription.remove();
    };
  }, [handleSuccessfulVerification, hasVerified, isVerifying, hasCompletedVerification]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.content}>
        {/* Email Icon */}
        <Ionicons name="mail" size={48} color={COLORS.TEXT_PRIMARY} style={styles.emailIcon} />
        
        {/* Title */}
        <Text style={styles.title}>Check your email</Text>
        
        {/* Description */}
        <Text style={styles.description}>
          We've sent the verification link to {email}
        </Text>
        
        {/* Status indicator */}
        {hasVerified ? (
          <View style={styles.statusContainer}>
            <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
            <Text style={styles.statusText}>Email verified!</Text>
          </View>
        ) : isVerifying ? (
          <View style={styles.verifyingContainer}>
            <ActivityIndicator size="large" color={COLORS.TEXT_PRIMARY} />
            <Text style={styles.verifyingText}>Verifying your email...</Text>
          </View>
        ) : (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingText}>
              Tap the verification link in your email to continue
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
  verifyingContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  verifyingText: {
    fontSize: 14,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_SECONDARY,
    marginTop: 12,
    textAlign: 'center',
  },
  statusContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#4CAF50',
    marginTop: 8,
    textAlign: 'center',
  },
  waitingContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 14,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
  emailIcon: {
    marginBottom: 16,
  },
  clearButton: {
    marginTop: 16,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});