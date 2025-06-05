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
      
      <View style={styles.topBarActions}>
        {!isCompletingRegistration && (
          <TouchableOpacity onPress={onBack} style={styles.headerButtonLeft}>
            <ArrowLeft size={ICON_SIZE_ACTION} color={ICON_COLOR_DARK} />
          </TouchableOpacity>
        )}
      </View>

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
          <Text style={styles.mainTitle}>
            {isCompletingRegistration ? 'Complete Your Profile' : 'Personal Information'}
          </Text>
          
          {isCompletingRegistration && (
            <Text style={styles.descriptionText}>
              Please complete your profile to start using the app
            </Text>
          )}

          {/* Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              ref={nameInputRef}
              style={styles.inputField}
              placeholder="Enter your first name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
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
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              ref={lastnameInputRef}
              style={styles.inputField}
              placeholder="Enter your last name"
              placeholderTextColor="#999"
              value={lastname}
              onChangeText={setLastname}
              autoCapitalize="words"
              returnKeyType="done"
              editable={!isLoading}
              onSubmitEditing={handleLastnameSubmit}
              onFocus={() => {
                console.log('🎯 Last name input focused successfully');
              }}
            />
          </View>

          {/* Level Dropdown */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Pickleball Level</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => {
                Keyboard.dismiss();
                setShowLevelDropdown(true);
              }}
              disabled={isLoading}
            >
              <Text style={[styles.dropdownText, selectedLevel === '' && styles.placeholderText]}>
                {getSelectedLevelLabel()}
              </Text>
              <ChevronDown size={ICON_SIZE_DROPDOWN} color={ICON_COLOR_MEDIUM} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Complete Profile Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.completeButton, 
              (!isFormValid || isLoading) && styles.completeButtonDisabled
            ]}
            onPress={handleComplete}
            disabled={!isFormValid || isLoading}
          >
            <Text style={[
              styles.completeButtonText,
              (!isFormValid || isLoading) && styles.completeButtonTextDisabled
            ]}>
              {isLoading ? 'Creating Account...' : 'Complete Profile'}
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
  topBarActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerButtonLeft: {
    padding: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContentContainer: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    width: '100%',
  },
  dropdownButton: {
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
  dropdownText: {
    fontSize: 16,
    color: '#000000',
  },
  placeholderText: {
    color: '#999',
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  completeButton: {
    backgroundColor: '#000000',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonDisabled: {
    opacity: 0.5,
  },
  completeButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: 'white',
  },
  completeButtonTextDisabled: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#333',
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
    borderBottomColor: '#F0F0F0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
});

export default PersonalInfoScreen; 