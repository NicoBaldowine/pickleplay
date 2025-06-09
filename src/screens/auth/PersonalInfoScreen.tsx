import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  Keyboard, 
  ScrollView, 
  StatusBar, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActionSheetIOS
} from 'react-native';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { globalTextStyles } from '../../styles/globalStyles';
import TopBar from '../../components/ui/TopBar';
import { authService } from '../../services/authService';

interface PersonalInfoScreenProps {
  onBack: () => void;
  onComplete: (personalData: { name: string; lastname: string; level: string }) => void;
  onProfileCreated?: () => void;
  isLoading?: boolean;
  isCompletingRegistration?: boolean;
  verifiedUserId?: string;
  userData?: any;
}

const ICON_SIZE_ACTION = 24;
const ICON_COLOR_DARK = '#000000';

const levelOptions = [
  { 
    id: 'beginner', 
    label: 'Beginner', 
    description: 'Learning basic rules and strokes',
    range: '1.0-2.5'
  },
  { 
    id: 'intermediate', 
    label: 'Intermediate', 
    description: 'Consistent serves and developing strategy',
    range: '3.0-3.5'
  },
  { 
    id: 'advanced', 
    label: 'Advanced', 
    description: 'Powerful shots and tournament play',
    range: '4.0-4.5'
  },
  { 
    id: 'expert', 
    label: 'Expert', 
    description: 'Tournament player',
    range: '5.0+'
  },
];

const PersonalInfoScreen: React.FC<PersonalInfoScreenProps> = ({ 
  onBack, 
  onComplete, 
  onProfileCreated,
  isLoading = false, 
  isCompletingRegistration = false,
  verifiedUserId,
  userData
}) => {
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  
  const nameInputRef = useRef<TextInput>(null);
  const lastnameInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Simplified keyboard handling
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🔥 PersonalInfoScreen mounted, attempting to focus name input');
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleComplete = async () => {
    if (isLoading || isCreatingProfile) return;
    
    if (name.trim().length === 0) {
      Alert.alert('Name Required', 'Please enter your first name.');
      nameInputRef.current?.focus();
      return;
    }
    if (lastname.trim().length === 0) {
      Alert.alert('Last Name Required', 'Please enter your last name.');
      lastnameInputRef.current?.focus();
      return;
    }
    if (selectedLevel === '') {
      Alert.alert('Level Required', 'Please select your pickleball skill level.');
      return;
    }

    Keyboard.dismiss();
    
    // If we have verifiedUserId and userData, create profile directly
    if (verifiedUserId && userData && onProfileCreated) {
      await createProfileDirectly();
    } else {
      // Fall back to old behavior
      onComplete({
        name: name.trim(),
        lastname: lastname.trim(),
        level: selectedLevel,
      });
    }
  };

  const createProfileDirectly = async () => {
    setIsCreatingProfile(true);
    try {
      console.log('🚀 Creating profile directly from PersonalInfoScreen');
      console.log('🔧 User ID:', verifiedUserId);
      
      const fullUserData = {
        ...userData,
        name: name.trim(),
        lastname: lastname.trim(),
        level: selectedLevel,
      };
      
      console.log('📋 Full user data for profile creation:', fullUserData);
      
      const response = await authService.createProfileDirect(verifiedUserId!, fullUserData);
      
      if (response.success) {
        console.log('✅ Profile created successfully! Proceeding to avatar...');
        // Force auth state refresh
        await authService.forceAuthStateRefresh();
        onProfileCreated!();
      } else {
        console.error('❌ Profile creation failed:', response.error);
        Alert.alert('Error', response.error || 'Failed to create profile. Please try again.');
      }
    } catch (error) {
      console.error('💥 Error creating profile:', error);
      Alert.alert('Error', 'Failed to create profile. Please try again.');
    } finally {
      setIsCreatingProfile(false);
    }
  };



  const getSelectedLevelDisplay = () => {
    const level = levelOptions.find(option => option.id === selectedLevel);
    return level ? `${level.label}, ${level.range}` : 'Select your level';
  };

  const handleLevelPress = () => {
    if (Platform.OS === 'ios') {
      // Create options array with level and range
      const options = levelOptions.map(option => `${option.label} (${option.range})`);
      options.push('Cancel');

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: options,
          cancelButtonIndex: options.length - 1,
          title: 'Select your level',
        },
        (buttonIndex) => {
          if (buttonIndex < levelOptions.length) {
            setSelectedLevel(levelOptions[buttonIndex].id);
          }
        }
      );
    } else {
      // Android fallback - could use an Alert with options
      const alertOptions = levelOptions.map(option => ({
        text: `${option.label} (${option.range})`,
        onPress: () => setSelectedLevel(option.id)
      }));
      alertOptions.push({ text: 'Cancel', onPress: () => {} });
      
      Alert.alert(
        'Select Level',
        'Choose your pickleball skill level',
        alertOptions
      );
    }
  };

  const handleNameSubmit = () => {
    if (lastnameInputRef.current) {
      lastnameInputRef.current.focus();
    }
  };

  const handleLastnameSubmit = () => {
    Keyboard.dismiss();
  };

  const isFormValid = name.trim().length > 0 && lastname.trim().length > 0 && selectedLevel !== '';
  const isCurrentlyLoading = isLoading || isCreatingProfile;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      {!isCompletingRegistration && (
        <TopBar
          title="Create an account"
          leftIcon={<ArrowLeft size={24} color={COLORS.TEXT_PRIMARY} />}
          onLeftIconPress={onBack}
        />
      )}
      


      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollContent} 
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>
              {isCompletingRegistration ? 'Complete Your Profile' : 'Create an account'}
            </Text>
          </View>

          {/* Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              ref={nameInputRef}
              style={styles.inputField}
              placeholder=""
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
              editable={!isCurrentlyLoading}
              onSubmitEditing={handleNameSubmit}
              onFocus={() => {
                console.log('🎯 Name input focused successfully');
              }}
            />
          </View>

          {/* Last Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              ref={lastnameInputRef}
              style={styles.inputField}
              placeholder=""
              placeholderTextColor="#999"
              value={lastname}
              onChangeText={setLastname}
              autoCapitalize="words"
              returnKeyType="done"
              editable={!isCurrentlyLoading}
              onSubmitEditing={handleLastnameSubmit}
              onFocus={() => {
                console.log('🎯 Last name input focused successfully');
              }}
            />
          </View>

          {/* Level Selection */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Skill Level</Text>
            <TouchableOpacity 
              style={styles.levelButton}
              onPress={handleLevelPress}
              disabled={isCurrentlyLoading}
            >
              <Text style={[
                styles.levelButtonText, 
                selectedLevel === '' && styles.placeholderText
              ]}>
                {getSelectedLevelDisplay()}
              </Text>
              <ChevronDown size={18} color="#888" />
            </TouchableOpacity>
            {/* Show description below button when level is selected */}
            {selectedLevel && (
              <View style={styles.levelDescriptionContainer}>
                <Text style={styles.levelDescription}>
                  {levelOptions.find(option => option.id === selectedLevel)?.description}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.continueButton, 
              (!isFormValid || isCurrentlyLoading) && styles.continueButtonDisabled
            ]}
            onPress={handleComplete}
            disabled={!isFormValid || isCurrentlyLoading}
          >
            <Text style={[
              styles.continueButtonText,
              (!isFormValid || isCurrentlyLoading) && styles.continueButtonTextDisabled
            ]}>
              {isCreatingProfile ? 'Creating Profile...' : isLoading ? 'Creating Account...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContentContainer: {
    paddingBottom: 20,
    paddingTop: 20,
    flexGrow: 1,
  },
  titleSection: {
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  levelButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  levelDescriptionContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  levelDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  buttonContainer: {
    padding: 16,
  },
  continueButton: {
    backgroundColor: '#000000',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: 'white',
  },
  continueButtonTextDisabled: {
    color: '#999999',
  },
});

export default PersonalInfoScreen; 