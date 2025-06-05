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

        {/* Logo/Title Area */}
        <View style={styles.headerSection}>
          <Text style={styles.appTitle}>PicklePlay</Text>
          <Text style={styles.tagline}>🏓</Text>
        </View>

        {/* Welcome Message */}
        <View style={styles.messageSection}>
          <Text style={styles.welcomeText}>Find players near you.</Text>
          <Text style={styles.welcomeText}>Set up a game.</Text>
          <Text style={styles.welcomeText}>Play.</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.signUpButton} onPress={onSignUp}>
            <Text style={styles.signUpButtonText}>Sign Up</Text>
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
    backgroundColor: '#FEF2D6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  clearSessionContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
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
  headerSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 32,
  },
  messageSection: {
    alignItems: 'center',
    marginBottom: 80,
  },
  welcomeText: {
    fontSize: 24,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  buttonSection: {
    gap: 16,
  },
  signUpButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  loginButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WelcomeScreen; 