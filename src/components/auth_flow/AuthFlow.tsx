import React, { useState } from 'react';
import { Alert } from 'react-native';
import { WelcomeScreen, SignUpScreen, PersonalInfoScreen } from '../../screens/auth';
import { authService } from '../../services/authService';
import { Profile } from '../../lib/supabase';

type AuthStep = 'welcome' | 'signup' | 'personal-info' | 'login';

interface AuthFlowProps {
  onAuthComplete: (user: any, profile: Profile) => void;
}

const AuthFlow: React.FC<AuthFlowProps> = ({ onAuthComplete }) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    name: '',
    lastname: '',
    level: '',
  });

  const handleSignUpStart = () => {
    setCurrentStep('signup');
  };

  const handleLoginStart = () => {
    setCurrentStep('login');
    // TODO: Create LoginScreen component
    console.log('Login pressed - LoginScreen to be implemented');
  };

  const handleSignUpSubmit = async (email: string, password: string) => {
    setAuthData(prev => ({ ...prev, email, password }));
    setCurrentStep('personal-info');
  };

  const handleGoogleSignUp = () => {
    // TODO: Implement Google sign up with Supabase
    Alert.alert('Coming Soon', 'Google sign up will be available soon!');
  };

  const handlePersonalInfoComplete = async (personalData: { name: string; lastname: string; level: string }) => {
    setIsLoading(true);
    
    try {
      const result = await authService.signUp(
        authData.email,
        authData.password,
        {
          email: authData.email,
          name: personalData.name,
          lastname: personalData.lastname,
          level: personalData.level,
        }
      );

      if (result.success && result.user && result.profile) {
        onAuthComplete(result.user, result.profile);
      } else {
        Alert.alert(
          'Sign Up Failed', 
          result.error || 'An error occurred during sign up. Please try again.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Sign Up Failed', 
        'An unexpected error occurred. Please try again.'
      );
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToWelcome = () => {
    setCurrentStep('welcome');
  };

  const handleBackToSignUp = () => {
    setCurrentStep('signup');
  };

  switch (currentStep) {
    case 'welcome':
      return (
        <WelcomeScreen
          onSignUp={handleSignUpStart}
          onLogin={handleLoginStart}
        />
      );
    
    case 'signup':
      return (
        <SignUpScreen
          onBack={handleBackToWelcome}
          onSignUp={handleSignUpSubmit}
          onGoogleSignUp={handleGoogleSignUp}
        />
      );
    
    case 'personal-info':
      return (
        <PersonalInfoScreen
          onBack={handleBackToSignUp}
          onComplete={handlePersonalInfoComplete}
          isLoading={isLoading}
        />
      );
    
    case 'login':
      // TODO: Implement LoginScreen
      return (
        <WelcomeScreen
          onSignUp={handleSignUpStart}
          onLogin={handleLoginStart}
        />
      );
    
    default:
      return (
        <WelcomeScreen
          onSignUp={handleSignUpStart}
          onLogin={handleLoginStart}
        />
      );
  }
};

export default AuthFlow; 