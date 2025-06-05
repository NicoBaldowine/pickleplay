import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, Keyboard, TouchableWithoutFeedback, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { ArrowLeft, X, ChevronDown, Check } from 'lucide-react-native';
import { globalTextStyles } from '../../styles/globalStyles';
import { COLORS } from '../../constants/colors';
import { doublePartnersService } from '../../services/doublePartnersService';
import { authService } from '../../services/authService';

interface CreatePartnerStepProps {
  onClose: () => void;
  onBack: () => void;
  onCreatePartner: (partnerData: { name: string; lastname: string; level: string; id?: string }) => void;
}

const ICON_SIZE_ACTION = 24;
const ICON_SIZE_DROPDOWN = 18;
const ICON_SIZE_AVATAR = 20;
const ICON_COLOR_DARK = '#000000';
const ICON_COLOR_MEDIUM = '#888';
const ICON_COLOR_BLUE = '#007AFF';
const STROKE_WIDTH_STANDARD = 1.8;

const levelOptions = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'expert', label: 'Expert' },
];

const CreatePartnerStep: React.FC<CreatePartnerStepProps> = ({ onClose, onBack, onCreatePartner }) => {
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreatePartner = async () => {
    if (name.trim().length === 0) {
      Alert.alert('Name Required', 'Please enter the partner\'s first name.');
      return;
    }
    if (lastname.trim().length === 0) {
      Alert.alert('Last Name Required', 'Please enter the partner\'s last name.');
      return;
    }
    if (selectedLevel === '') {
      Alert.alert('Level Required', 'Please select the partner\'s skill level.');
      return;
    }

    setIsLoading(true);

    try {
      const partnerData = {
        name: name.trim(),
        lastname: lastname.trim(),
        level: selectedLevel,
      };

      // Get current user to save partner to database
      const currentUser = await authService.getCurrentUser();
      if (!currentUser?.id) {
        Alert.alert('Error', 'User not found. Please sign in again.');
        return;
      }

      // Save partner to database
      const result = await doublePartnersService.createPartner(currentUser.id, {
        partner_name: `${partnerData.name} ${partnerData.lastname}`,
        partner_level: partnerData.level as 'beginner' | 'intermediate' | 'advanced' | 'expert'
      });

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to create partner');
        return;
      }

      console.log('✅ Partner saved to database successfully');
      
      // Return partner data with database ID
      onCreatePartner({
        ...partnerData,
        id: result.partnerId
      });
    } catch (error) {
      console.error('Error creating partner:', error);
      Alert.alert('Error', 'An error occurred while creating the partner.');
    } finally {
      setIsLoading(false);
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

  const isFormValid = name.trim().length > 0 && lastname.trim().length > 0 && selectedLevel !== '';
  const isButtonDisabled = !isFormValid || isLoading;

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <View style={styles.topBarActions}>
          <TouchableOpacity onPress={onBack} style={styles.headerButtonLeft}>
            <ArrowLeft size={ICON_SIZE_ACTION} color={ICON_COLOR_DARK} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.headerButtonRight}>
            <X size={ICON_SIZE_ACTION} color={ICON_COLOR_DARK} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.mainTitle}>Create a New Partner</Text>

          {/* Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder=""
              value={name}
              onChangeText={setName}
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
              value={lastname}
              onChangeText={setLastname}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Level Dropdown */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Skill Level</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setShowLevelDropdown(true)}
            >
              <Text style={[styles.dropdownText, selectedLevel === '' && styles.placeholderText]}>
                {getSelectedLevelLabel()}
              </Text>
              <ChevronDown size={ICON_SIZE_DROPDOWN} color={ICON_COLOR_MEDIUM} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Create Partner Button - Fixed at bottom */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.createButton, isButtonDisabled && styles.disabledButton]}
            onPress={handleCreatePartner}
            disabled={isButtonDisabled}
          >
            <Text style={[styles.createButtonText, isButtonDisabled && styles.disabledButtonText]}>
              {isLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : 'Create Partner'}
            </Text>
          </TouchableOpacity>
        </View>

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
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  topBarActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerButtonLeft: {
    padding: 8,
  },
  headerButtonRight: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContentContainer: {
    paddingBottom: 140,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 24,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: 40,
  },
  createButton: {
    backgroundColor: '#000000',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: 'white',
  },
  disabledButtonText: {
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

export default CreatePartnerStep; 