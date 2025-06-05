import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  Modal, 
  Keyboard, 
  ScrollView, 
  StatusBar, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback
} from 'react-native';
import { ArrowLeft, ChevronDown, Check } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { globalTextStyles } from '../../styles/globalStyles';
import TopBar from '../../components/ui/TopBar';

interface PersonalInfoScreenProps {
  onBack: () => void;
  onComplete: (personalData: { name: string; lastname: string; level: string }) => void;
  isLoading?: boolean;
  isCompletingRegistration?: boolean;
}

const ICON_SIZE_ACTION = 24;
const ICON_SIZE_DROPDOWN = 18;
const ICON_COLOR_DARK = '#000000';
const ICON_COLOR_MEDIUM = '#888';
const ICON_COLOR_BLUE = '#007AFF';

const levelOptions = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'expert', label: 'Expert' },
];

const PersonalInfoScreen: React.FC<PersonalInfoScreenProps> = ({ onBack, onComplete, isLoading = false, isCompletingRegistration = false }) => {
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  
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

  const handleComplete = () => {
    if (isLoading) return;
    
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
    
    onComplete({
      name: name.trim(),
      lastname: lastname.trim(),
      level: selectedLevel,
    });
  };

  const handleLevelSelect = (levelId: string) => {
    setSelectedLevel(levelId);
    setShowLevelDropdown(false);
  };

  const getSelectedLevelLabel = () => {
    const level = levelOptions.find(option => option.id === selectedLevel);
    return level ? level.label : 'Select your level';
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
            
            {isCompletingRegistration && (
              <Text style={styles.subtitle}>
                Please complete your profile to start using the app
              </Text>
            )}
          </View>

          {/* Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              ref={nameInputRef}
              style={styles.inputField}
              placeholder=""
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              autoCapitalize="none"
              returnKeyType="next"
              editable={!isLoading}
              onSubmitEditing={handleNameSubmit}
              onFocus={() => {
                console.log('🎯 Name input focused successfully');
              }}
            />
          </View>

          {/* Last Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              ref={lastnameInputRef}
              style={styles.inputField}
              placeholder=""
              placeholderTextColor="#999"
              value={lastname}
              onChangeText={setLastname}
              secureTextEntry
              returnKeyType="done"
              editable={!isLoading}
              onSubmitEditing={handleLastnameSubmit}
              onFocus={() => {
                console.log('🎯 Last name input focused successfully');
              }}
            />
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.continueButton, 
              (!isFormValid || isLoading) && styles.continueButtonDisabled
            ]}
            onPress={handleComplete}
            disabled={!isFormValid || isLoading}
          >
            <Text style={[
              styles.continueButtonText,
              (!isFormValid || isLoading) && styles.continueButtonTextDisabled
            ]}>
              {isLoading ? 'Creating Account...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Level Selection Modal */}
      <Modal
        visible={showLevelDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLevelDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLevelDropdown(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Skill Level</Text>
            {levelOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.modalOption}
                onPress={() => handleLevelSelect(option.id)}
              >
                <Text style={styles.modalOptionText}>{option.label}</Text>
                {selectedLevel === option.id && (
                  <Check size={20} color={ICON_COLOR_BLUE} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
  subtitle: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 22,
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
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dropdownButton: {
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },
  placeholderText: {
    color: COLORS.TEXT_SECONDARY,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 48 : 16,
  },
  continueButton: {
    backgroundColor: COLORS.TEXT_PRIMARY,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.BACKGROUND_PRIMARY,
  },
  continueButtonTextDisabled: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BACKGROUND_SECONDARY,
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },
});

export default PersonalInfoScreen; 