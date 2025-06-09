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
import { SvgXml } from 'react-native-svg';
import { authService } from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../constants/colors';
import { globalTextStyles } from '../../styles/globalStyles';

const versusIconSvg = `<svg width="58" height="58" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="58" height="58" rx="13.92" fill="#F5E9CF"/>
<g clip-path="url(#clip0_413_2548)">
<path d="M39.9457 11.8304C48.0261 11.2248 52.9712 20.6826 47.7717 26.9219C41.4337 33.5178 30.2457 44.6193 30.2457 44.3476C27.1226 46.4222 23.0703 46.5589 19.8589 44.6193C17.9158 43.4461 10.2177 35.7619 9.20726 33.8154C5.08746 25.8682 13.1246 17.331 21.295 21.0355C22.6671 21.6567 23.6482 22.8177 24.8438 23.6863L34.3638 14.2061C35.9747 12.8963 37.8434 11.9896 39.9474 11.8304H39.9457ZM39.7709 15.1145C32.2805 16.0714 33.4346 27.8736 41.4337 26.986C49.0366 26.1416 48.0503 14.0573 39.7709 15.1145ZM32.1871 23.207C26.292 23.1915 24.7988 31.6664 29.8893 34.2428C33.7167 36.1807 38.0874 33.9815 38.6116 29.7112C35.3276 28.8737 32.6491 26.7282 32.1888 23.2088L32.1871 23.207ZM24.2347 30.9829C19.5007 31.3047 17.2236 36.878 20.0821 40.5877C23.2762 44.7334 30.1644 42.972 30.6506 37.6687C27.3942 36.7949 24.6673 34.4781 24.2347 30.9829Z" fill="black"/>
<path d="M39.7711 15.1143C48.0505 14.0571 49.0368 26.1414 41.4339 26.9858C33.4348 27.8734 32.2807 16.0711 39.7711 15.1143Z" fill="#FEC700"/>
<path d="M24.2353 30.9824C24.6696 34.4759 27.3965 36.7927 30.6511 37.6682C30.1649 42.9715 23.2767 44.733 20.0826 40.5872C17.2242 36.8775 19.5012 31.3043 24.2353 30.9824Z" fill="#43A4BE"/>
<path d="M32.1867 23.2068C32.6486 26.7262 35.3254 28.8735 38.6095 29.7092C38.0852 33.9813 33.7145 36.1787 29.8871 34.2408C24.7984 31.6644 26.2899 23.1895 32.1849 23.2051L32.1867 23.2068Z" fill="#96BE6B"/>
</g>
<defs>
<clipPath id="clip0_413_2548">
<rect width="41.814" height="34.1886" fill="white" transform="translate(8.09277 11.8027)"/>
</clipPath>
</defs>
</svg>`;

interface WelcomeScreenProps {
  onSignUp: () => void;
  onLogin: () => void;
  hideSessionButton?: boolean; // Hide the clear session button during registration flow
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSignUp, onLogin, hideSessionButton = false }) => {
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
        {/* Clear Session Button - Hide completely during normal flows */}

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Icon */}
          <View style={styles.iconSection}>
            <SvgXml 
              xml={versusIconSvg} 
              width={58} 
              height={58}
            />
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Turn your free time into play time.</Text>
            <Text style={styles.mainTitle}>Pickleball made easy.</Text>
          </View>

          {/* Subtitle */}
          <View style={styles.subtitleSection}>
            <Text style={styles.subtitle}>Schedule local pickleball games that match your time and location.</Text>
          </View>
        </View>

        {/* Buttons - Positioned like SignUpScreen */}
        <View style={styles.buttonContainer}>
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
    paddingBottom: 200, // More space to push buttons lower
  },
  iconSection: {
    alignItems: 'flex-start',
    marginBottom: 20, // 20px spacing después del icono
  },
  titleSection: {
    marginBottom: 20, // 20px spacing después del título
  },
  mainTitle: {
    fontSize: 36,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
    lineHeight: 39.6, // 110% line height (36 * 1.1)
    marginBottom: 0,
  },
  subtitleSection: {
    // Remove paddingHorizontal to align with buttons (16px)
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: 'rgba(0, 0, 0, 0.4)', // #000000 40% opacity
    lineHeight: 19.2, // 120% line height (16 * 1.2)
    textAlign: 'left',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
    gap: 12,
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