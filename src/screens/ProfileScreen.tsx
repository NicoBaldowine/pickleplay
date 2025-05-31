import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, Check } from 'lucide-react-native';

// Import custom components
import TopBar from '../components/ui/TopBar';

// Import colors
import { COLORS } from '../constants/colors';
import { Profile } from '../lib/supabase';

interface ProfileScreenProps {
  profile: Profile;
  user: any;
  onBack: () => void;
  onSaveProfile: (updatedProfile: Partial<Profile>) => void;
}

const levelOptions = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'pro', label: 'Pro' },
];

const ProfileScreen: React.FC<ProfileScreenProps> = ({ profile, user, onBack, onSaveProfile }) => {
  const [firstName, setFirstName] = useState(profile.full_name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(profile.full_name?.split(' ').slice(1).join(' ') || '');
  const [email, setEmail] = useState(user.email || '');
  const [selectedLevel, setSelectedLevel] = useState(profile.pickleball_level || 'beginner');
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveChanges = async () => {
    if (firstName.trim().length === 0) {
      Alert.alert('First Name Required', 'Please enter your first name.');
      return;
    }
    if (lastName.trim().length === 0) {
      Alert.alert('Last Name Required', 'Please enter your last name.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updatedProfile = {
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        pickleball_level: selectedLevel,
      };
      
      await onSaveProfile(updatedProfile);
      Alert.alert('Success', 'Your profile has been updated successfully.');
      onBack();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLevelSelect = (levelId: string) => {
    setSelectedLevel(levelId);
    setShowLevelDropdown(false);
  };

  const getSelectedLevelLabel = () => {
    const level = levelOptions.find(option => option.id === selectedLevel);
    return level ? level.label : 'Select level';
  };

  const isFormValid = firstName.trim().length > 0 && lastName.trim().length > 0;
  const isButtonActive = isFormValid && !isSubmitting;

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar barStyle="dark-content" />
      
      <TopBar
        title="Profile"
        leftIcon={<ArrowLeft size={24} color="#000000" />}
        onLeftIconPress={onBack}
        style={styles.topBar}
        titleContainerStyle={styles.titleContainer}
        titleStyle={styles.titleStyle}
      />

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* First Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder=""
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Last Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder=""
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Email Input (Read-only) */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.textInput, styles.readOnlyInput]}
              value={email}
              editable={false}
            />
          </View>

          {/* Level Dropdown */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Skill Level</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setShowLevelDropdown(true)}
            >
              <Text style={styles.dropdownText}>
                {getSelectedLevelLabel()}
              </Text>
              <ChevronDown size={18} color="#888" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Save Changes Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.saveButton,
              !isButtonActive && styles.saveButtonDisabled
            ]} 
            onPress={handleSaveChanges}
            disabled={!isButtonActive}
          >
            <Text style={[
              styles.saveButtonText,
              !isButtonActive && styles.saveButtonTextDisabled
            ]}>
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
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
                  <Check size={20} color="#007AFF" />
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
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  topBar: {
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleStyle: {
    fontSize: 20,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContentContainer: {
    paddingTop: 24,
    paddingBottom: 140,
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
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  readOnlyInput: {
    backgroundColor: '#F5F5F5',
    color: '#666666',
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
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: '#000000',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: 'white',
  },
  saveButtonTextDisabled: {
    color: 'white',
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
    fontWeight: 'bold',
    color: '#000000',
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
    color: '#000000',
  },
});

export default ProfileScreen; 