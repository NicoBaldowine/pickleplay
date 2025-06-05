import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import { authService } from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/colors';
import { globalTextStyles } from '../../styles/globalStyles';

interface WelcomeScreenProps {
  onSignUp: () => void;
  onLogin: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSignUp, onLogin }) => {
  const [hasExistingSession, setHasExistingSession] = useState(false);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const user = await authService.getCurrentUser();
      setHasExistingSession(!!user);
    } catch (error) {
      setHasExistingSession(false);
    }
  };

  const handleClearSession = async () => {
    Alert.alert(
      'Clear Session',
      'This will clear any existing session data and let you start fresh. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🧹 Clearing existing session...');
              await AsyncStorage.clear();
              await authService.signOut();
              setHasExistingSession(false);
              console.log('✅ Session cleared');
            } catch (error) {
              console.error('Error clearing session:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.content}>
        {/* Clear Session Button - Only show if there's an existing session */}
        {hasExistingSession && (
          <View style={styles.clearSessionContainer}>
            <TouchableOpacity 
              style={styles.clearSessionButton}
              onPress={handleClearSession}
            >
              <Text style={styles.clearSessionText}>Clear Session</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Find players nearby.</Text>
            <Text style={styles.mainTitle}>Set a match.</Text>
            <Text style={styles.mainTitle}>Let's play.</Text>
          </View>

          {/* Subtitle */}
          <View style={styles.subtitleSection}>
            <Text style={styles.subtitle}>The easiest way to connect with others and enjoy sports near you.</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.createAccountButton} onPress={onSignUp}>
            <Text style={styles.createAccountButtonText}>Create an account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.loginButton} onPress={onLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  clearSessionContainer: {
    position: 'absolute',
    top: 20,
    right: 16,
    zIndex: 1,
  },
  clearSessionButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearSessionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 100,
  },
  titleSection: {
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 40,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 48,
    marginBottom: 8,
  },
  subtitleSection: {
    paddingHorizontal: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 24,
    textAlign: 'left',
  },
  buttonSection: {
    paddingBottom: 48,
    gap: 12,
    paddingHorizontal: 0,
  },
  createAccountButton: {
    backgroundColor: COLORS.TEXT_PRIMARY,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 0,
  },
  createAccountButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loginButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 0,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },
});

export default WelcomeScreen; 