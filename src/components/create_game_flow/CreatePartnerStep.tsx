import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, Keyboard, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { ArrowLeft, X, ChevronDown, Check } from 'lucide-react-native';
import { globalTextStyles } from '../../styles/globalStyles';

interface CreatePartnerStepProps {
  onClose: () => void;
  onBack: () => void;
  onCreatePartner: (partnerData: { name: string; lastname: string; level: string }) => void;
}

const ICON_SIZE_ACTION = 24;
const ICON_SIZE_DROPDOWN = 18;
const ICON_COLOR_DARK = '#333';
const ICON_COLOR_MEDIUM = '#888';
const ICON_COLOR_BLUE = '#007AFF';

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

  const handleCreatePartner = () => {
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

    onCreatePartner({
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
    return level ? level.label : 'Select level';
  };

  const isFormValid = name.trim().length > 0 && lastname.trim().length > 0 && selectedLevel !== '';

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

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.mainTitle}>Create a New Partner</Text>
          <Text style={styles.descriptionText}>
            Enter your partner's information to add them to your saved partners.
          </Text>

          {/* Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter first name"
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
              placeholder="Enter last name"
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
            style={[styles.createButton, !isFormValid && styles.disabledButton]}
            onPress={handleCreatePartner}
            disabled={!isFormValid}
          >
            <Text style={[styles.createButtonText, !isFormValid && styles.disabledButtonText]}>
              Create Partner
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
    backgroundColor: '#FEF2D6',
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
    paddingBottom: 120, // Increased space for the larger fixed button container
  },
  mainTitle: {
    ...globalTextStyles.h2,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F5F0E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  dropdownButton: {
    backgroundColor: '#F5F0E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FEF2D6',
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: 40,
  },
  createButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#E5E5E7',
  },
  createButtonText: {
    ...globalTextStyles.button,
    color: 'white',
  },
  disabledButtonText: {
    color: '#999',
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

export default CreatePartnerStep; 