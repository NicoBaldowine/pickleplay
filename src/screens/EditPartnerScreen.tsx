import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, Keyboard, TouchableWithoutFeedback, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, Check } from 'lucide-react-native';
import TopBar from '../components/ui/TopBar';
import { COLORS } from '../constants/colors';
import { doublePartnersService, DoublePartner } from '../services/doublePartnersService';

interface EditPartnerScreenProps {
  partner: DoublePartner;
  onBack: () => void;
  onPartnerUpdated?: () => void; // Callback to refresh the list
}

const levelOptions = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'expert', label: 'Expert' },
];

const EditPartnerScreen: React.FC<EditPartnerScreenProps> = ({ partner, onBack, onPartnerUpdated }) => {
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with partner data
  useEffect(() => {
    if (partner) {
      // Split the partner name into first and last name
      const nameParts = partner.partner_name?.split(' ') || ['', ''];
      setName(nameParts[0] || '');
      setLastname(nameParts.slice(1).join(' ') || ''); // Handle names with multiple parts
      setSelectedLevel(partner.partner_level || 'intermediate');
    }
  }, [partner]);

  const handleSaveChanges = async () => {
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
      // Update partner in database
      console.log('🎯 Starting partner update in UI...');
      const result = await doublePartnersService.updatePartner(partner.id, {
        partner_name: `${name.trim()} ${lastname.trim()}`,
        partner_level: selectedLevel as 'beginner' | 'intermediate' | 'advanced' | 'expert'
      });

      console.log('🎯 Update result received in UI:', result);

      if (!result.success) {
        console.log('❌ Update failed in UI with error:', result.error);
        
        // Check if the error is about session expiration (only if refresh also failed)
        if (result.error?.includes('Session expired and could not be refreshed') || 
            result.error?.includes('Please log in again')) {
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please log in again to continue.',
            [
              { text: 'OK', onPress: () => {
                onBack(); // Go back to the previous screen
              }}
            ]
          );
          return;
        }
        
        // Don't show PGRST301 errors - these are handled automatically by refresh
        if (result.error?.includes('PGRST301') || result.error?.includes('JWT expired')) {
          Alert.alert('Error', 'Session issue occurred but was handled automatically. Please try again.');
          return;
        }
        
        Alert.alert('Error', result.error || 'Failed to update partner');
        return;
      }

      console.log('✅ Partner updated successfully in UI');
      
      // Show success message
      Alert.alert(
        'Partner Updated',
        `${name} ${lastname} has been updated successfully.`,
        [
          {
            text: 'OK',
            onPress: () => {
              try {
                console.log('🔄 Calling onPartnerUpdated callback...');
                onPartnerUpdated?.(); // Refresh the list
                console.log('🏠 Navigating back...');
                onBack(); // Go back to the previous screen
              } catch (callbackError) {
                console.error('❌ Error in success callbacks:', callbackError);
                // Still navigate back even if callback fails
                onBack();
              }
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('💥 Caught error in EditPartner UI:', error);
      
      // Check for JWT expired in catch block too (should not happen with new auto-refresh)
      if (error.message?.includes('JWT expired') || error.message?.includes('Session expired') || error.code === 'PGRST301') {
        console.log('⚠️ PGRST301 error caught in UI - this should not happen with auto-refresh');
        Alert.alert(
          'Session Issue',
          'A session issue occurred. The operation may have succeeded. Please check and try again if needed.',
          [
            { text: 'OK', onPress: () => {
              // Refresh the list and go back
              try {
                onPartnerUpdated?.();
              } catch (refreshError) {
                console.error('Error refreshing list:', refreshError);
              }
              onBack();
            }}
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'An error occurred while updating the partner.');
      }
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
          title="Edit Partner"
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

        {/* Save Changes Button - Fixed at bottom */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, isButtonDisabled && styles.saveButtonDisabled]}
            onPress={handleSaveChanges}
            disabled={isButtonDisabled}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[styles.saveButtonText, isButtonDisabled && styles.saveButtonTextDisabled]}>
                Save Changes
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

export default EditPartnerScreen; 