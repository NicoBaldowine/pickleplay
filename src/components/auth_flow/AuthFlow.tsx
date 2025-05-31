import React, { useState } from 'react';
import { Alert } from 'react-native';
import { WelcomeScreen, SignUpScreen, PersonalInfoScreen, LoginScreen } from '../../screens/auth';
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
  };

  const handleLoginSubmit = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      console.log('🔍 Attempting login for:', email);
      
      // Special case: if this is your email, let's try to recreate the account
      if (email === 'nicolasbaldovinobarrientos@gmail.com' && password === 'Nandresbb1957') {
        console.log('🔧 Recreating your account...');
        const recreateResult = await authService.signUp(email, password, {
          email: email,
          name: 'Nicolas',
          lastname: 'Baldovino',
          level: 'intermediate'
        });
        console.log('🔧 Recreate result:', recreateResult);
        
        if (recreateResult.success) {
          Alert.alert('Account Recreated', 'Your account has been recreated successfully. You can now log in.');
          setIsLoading(false);
          return;
        } else if (recreateResult.error?.includes('already exists') || recreateResult.error?.includes('User already registered')) {
          console.log('✅ Account exists, proceeding with login...');
          // Continue with login
        } else {
          Alert.alert('Account Creation Failed', recreateResult.error || 'Failed to recreate account');
          setIsLoading(false);
          return;
        }
      }
      
      // First, let's try to create a test account to see if signup works
      if (email === 'test@test.com') {
        console.log('🧪 Creating test account...');
        const testResult = await authService.signUp('test@test.com', 'test123456', {
          email: 'test@test.com',
          name: 'Test',
          lastname: 'User',
          level: 'beginner'
        });
        console.log('🧪 Test signup result:', testResult);
        
        if (testResult.success) {
          Alert.alert('Test Account Created', 'Test account was created successfully. Now try logging in.');
          setIsLoading(false);
          return;
        } else {
          Alert.alert('Test Failed', testResult.error || 'Test signup failed');
          setIsLoading(false);
          return;
        }
      }
      
      const result = await authService.signIn(email, password);

      if (result.success && result.user && result.profile) {
        console.log('✅ Login successful');
        onAuthComplete(result.user, result.profile);
      } else {
        console.log('❌ Login failed:', result.error);
        Alert.alert(
          'Login Failed', 
          result.error || 'Invalid email or password. Please try again.'
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed', 
        'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
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
      return (
        <LoginScreen
          onBack={handleBackToWelcome}
          onLogin={handleLoginSubmit}
          isLoading={isLoading}
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