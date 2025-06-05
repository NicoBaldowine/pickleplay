import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, Keyboard, TouchableWithoutFeedback, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, Check } from 'lucide-react-native';
import TopBar from '../components/ui/TopBar';
import { COLORS } from '../constants/colors';
import { doublePartnersService } from '../services/doublePartnersService';
import { authService } from '../services/authService';

interface CreatePartnerScreenProps {
  onBack: () => void;
  onPartnerCreated?: () => void; // Callback to refresh the list
}

const levelOptions = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'expert', label: 'Expert' },
];

const CreatePartnerScreen: React.FC<CreatePartnerScreenProps> = ({ onBack, onPartnerCreated }) => {
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
      // Get current user to save partner to database
      const currentUser = await authService.getCurrentUser();
      if (!currentUser?.id) {
        Alert.alert('Error', 'User not found. Please sign in again.');
        return;
      }

      // Save partner to database
      const result = await doublePartnersService.createPartner(currentUser.id, {
        partner_name: `${name.trim()} ${lastname.trim()}`,
        partner_level: selectedLevel as 'beginner' | 'intermediate' | 'advanced' | 'expert'
      });

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to create partner');
        return;
      }

      console.log('✅ Partner saved to database successfully');
      
      // Show success message
      Alert.alert(
        'Partner Created',
        `${name} ${lastname} has been added to your doubles partners.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onPartnerCreated?.(); // Refresh the list
              onBack(); // Go back to the previous screen
            }
          }
        ]
      );
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
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <TopBar
          title="Add New Partner"
          leftIcon={<ArrowLeft size={24} color="#000000" />}
          onLeftIconPress={onBack}
          style={styles.topBar}
          titleContainerStyle={styles.titleContainer}
          titleStyle={styles.titleStyle}
        />

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
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
              <ChevronDown size={18} color="#888" />
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
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[styles.createButtonText, isButtonDisabled && styles.disabledButtonText]}>
                Create Partner
              </Text>
            )}
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
                    <Check size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContentContainer: {
    paddingTop: 20,
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

export default CreatePartnerScreen; 