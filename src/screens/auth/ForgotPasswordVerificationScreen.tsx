import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import TopBar from '../../components/ui/TopBar';

interface ForgotPasswordVerificationScreenProps {
  email: string;
  onBack: () => void;
  onPasswordResetLinkClicked: () => void;
  onResendEmail?: () => void;
}

export default function ForgotPasswordVerificationScreen({ 
  email, 
  onBack,
  onPasswordResetLinkClicked,
  onResendEmail
}: ForgotPasswordVerificationScreenProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasClickedLink, setHasClickedLink] = useState(false);

  // Handle deep linking for password reset
  useEffect(() => {
    const handleDeepLink = async (event: Linking.EventType) => {
      console.log('🔗 ForgotPasswordVerification: Deep link received:', event.url);
      
      // Prevent multiple processing
      if (hasClickedLink) {
        console.log('🔒 Link already clicked, ignoring duplicate');
        return;
      }
      
      // Check if this is a password reset link
      if (event.url.includes('type=recovery') || event.url.includes('forgot')) {
        console.log('🔑 Password reset link detected');
        setIsProcessing(true);
        setHasClickedLink(true);
        
        // Small delay to show processing state
        setTimeout(() => {
          onPasswordResetLinkClicked();
        }, 1500);
      }
    };

    // Listen for URLs when app is already running
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      linkingSubscription.remove();
    };
  }, [onPasswordResetLinkClicked, hasClickedLink]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <TopBar
        title=""
        leftIcon={<ArrowLeft size={24} color={COLORS.TEXT_PRIMARY} />}
        onLeftIconPress={onBack}
        style={styles.topBar}
      />
      
      <View style={styles.content}>
        {/* Email Icon */}
        <Ionicons name="mail" size={48} color={COLORS.TEXT_PRIMARY} style={styles.emailIcon} />
        
        {/* Title */}
        <Text style={styles.title}>Check your email</Text>
        
        {/* Description */}
        <Text style={styles.description}>
          We've sent a password reset link to {email}
        </Text>
        
        {/* Status indicator */}
        {hasClickedLink ? (
          <View style={styles.statusContainer}>
            <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
            <Text style={styles.statusText}>Link clicked!</Text>
            {isProcessing && <ActivityIndicator color={COLORS.TEXT_PRIMARY} style={styles.spinner} />}
          </View>
        ) : (
          <View style={styles.waitingContainer}>
            <ActivityIndicator color={COLORS.TEXT_PRIMARY} style={styles.spinner} />
            <Text style={styles.waitingText}>Waiting for you to click the link...</Text>
          </View>
        )}
        
        {/* Resend button */}
        {onResendEmail && (
          <TouchableOpacity style={styles.resendButton} onPress={onResendEmail}>
            <Text style={styles.resendButtonText}>Resend Email</Text>
          </TouchableOpacity>
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
  topBar: {
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  emailIcon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#4CAF50',
    marginTop: 8,
  },
  waitingContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  waitingText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 12,
  },
  spinner: {
    marginTop: 8,
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  resendButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
}); 