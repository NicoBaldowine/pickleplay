import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, TextInput, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

// Import custom components
import TopBar from '../components/ui/TopBar';

// Temporarily comment out the service import
// import { doublePartnersService, DoublePartner } from '../services/doublePartnersService';
import { authService } from '../services/authService';
import { COLORS } from '../constants/colors';

// Temporary type definition
interface DoublePartner {
  id: string;
  partner_name: string;
  partner_level: string;
  partner_email?: string;
  partner_phone?: string;
  is_registered: boolean;
}

interface CreateDoublePartnerScreenProps {
  route?: {
    params?: {
      existingPartner?: DoublePartner;
    };
  };
}

const CreateDoublePartnerScreen: React.FC<CreateDoublePartnerScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const existingPartner = route?.params?.existingPartner;
  const isEditMode = !!existingPartner;

  const [partnerName, setPartnerName] = useState(existingPartner?.partner_name || '');
  const [partnerLevel, setPartnerLevel] = useState(existingPartner?.partner_level || 'intermediate');
  const [partnerEmail, setPartnerEmail] = useState(existingPartner?.partner_email || '');
  const [partnerPhone, setPartnerPhone] = useState(existingPartner?.partner_phone || '');
  const [saving, setSaving] = useState(false);

  const skillLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' },
  ];

  const handleSave = async () => {
    if (!partnerName.trim()) {
      Alert.alert('Error', 'Please enter your partner\'s name');
      return;
    }

    setSaving(true);

    try {
      // Temporarily disable saving
      Alert.alert(
        'Info', 
        'Partner management is temporarily disabled while we update the system.',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
      
      /*
      const currentUser = await authService.getCurrentUser();
      if (!currentUser?.id) {
        Alert.alert('Error', 'You must be logged in to save partners');
        setSaving(false);
        return;
      }

      const partnerData = {
        user_id: currentUser.id,
        partner_name: partnerName.trim(),
        partner_level: partnerLevel,
        partner_email: partnerEmail.trim() || undefined,
        partner_phone: partnerPhone.trim() || undefined,
        is_registered: false,
      };

      let savedPartner;
      if (isEditMode) {
        savedPartner = await doublePartnersService.updatePartner(existingPartner.id, partnerData);
      } else {
        savedPartner = await doublePartnersService.createPartner({
          ...partnerData,
          user_id: currentUser.id,
        });
      }

      Alert.alert(
        'Success',
        isEditMode ? 'Partner updated successfully' : 'Partner created successfully',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
      */
    } catch (error) {
      console.error('Error saving partner:', error);
      Alert.alert('Error', 'Failed to save partner. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar barStyle="dark-content" />
      
      <TopBar
        title={isEditMode ? 'Edit Partner' : 'Create Partner'}
        leftIcon={<ArrowLeft size={24} color="#000000" />}
        onLeftIconPress={() => navigation.goBack()}
        style={styles.topBar}
        titleContainerStyle={styles.titleContainer}
        titleStyle={styles.titleStyle}
      />

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Partner management is temporarily disabled while we update the system.
          </Text>
        </View>

        {/* Partner Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Partner Name *</Text>
          <TextInput
            style={styles.input}
            value={partnerName}
            onChangeText={setPartnerName}
            placeholder="Enter partner's name"
            placeholderTextColor="#999"
          />
        </View>

        {/* Skill Level */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Skill Level</Text>
          <View style={styles.levelContainer}>
            {skillLevels.map(level => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.levelButton,
                  partnerLevel === level.value && styles.levelButtonActive
                ]}
                onPress={() => setPartnerLevel(level.value)}
              >
                <Text style={[
                  styles.levelButtonText,
                  partnerLevel === level.value && styles.levelButtonTextActive
                ]}>
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email (Optional)</Text>
          <TextInput
            style={styles.input}
            value={partnerEmail}
            onChangeText={setPartnerEmail}
            placeholder="partner@example.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone (Optional)</Text>
          <TextInput
            style={styles.input}
            value={partnerPhone}
            onChangeText={setPartnerPhone}
            placeholder="(555) 123-4567"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : (isEditMode ? 'Update Partner' : 'Create Partner')}
          </Text>
        </TouchableOpacity>
      </View>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  infoContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  levelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelButton: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  levelButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  levelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  levelButtonTextActive: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  saveButton: {
    backgroundColor: '#000000',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default CreateDoublePartnerScreen; 