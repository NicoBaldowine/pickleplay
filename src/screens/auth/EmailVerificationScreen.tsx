import React, { useState, useEffect, useRef } from 'react';
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
        
        {/* Verifying indicator */}
        {isVerifying && (
          <View style={styles.verifyingContainer}>
            <ActivityIndicator size="large" color={COLORS.TEXT_PRIMARY} />
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
  },
  emailIcon: {
    marginBottom: 16,
  },
});