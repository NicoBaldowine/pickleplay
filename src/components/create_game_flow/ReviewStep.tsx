import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { ArrowLeft, X, User, Users, Calendar, Clock, MapPin, Zap, FileText } from 'lucide-react-native';
import { GameType, PlayerLevel, Court, CreateGameData } from './CreateGameFlow';
import ListItem from '../ui/ListItem';
import { globalTextStyles } from '../../styles/globalStyles';
import { COLORS } from '../../constants/colors';

interface ReviewStepProps {
  onClose: () => void;
  onBack: () => void;
  onScheduleGame: (notes: string, phoneNumber: string) => void;
  isSubmitting: boolean;
  gameData: {
    game_type?: GameType;
    court_id?: string;
    player_level?: PlayerLevel;
    scheduled_time?: string;
    partner_name?: string;
  };
  courts: Court[];
}

const ICON_SIZE_ACTION = 24;
const ICON_SIZE_AVATAR = 20;
const ICON_COLOR_DARK = '#000000';
const ICON_COLOR_MEDIUM = '#888';

const ReviewStep: React.FC<ReviewStepProps> = ({
  onClose,
  onBack,
  onScheduleGame,
  isSubmitting,
  gameData,
  courts,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [phoneError, setPhoneError] = useState(false);
  const [notesError, setNotesError] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Phone number validation for US territory
  const validatePhoneNumber = (phone: string) => {
    if (phone.trim() === '') {
      setPhoneError(false);
      return true;
    }
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Check if it's a valid US phone number (10 digits or 11 with country code 1)
    const isValid = (digits.length === 10) || (digits.length === 11 && digits.startsWith('1'));
    setPhoneError(!isValid);
    return isValid;
  };

  // Notes character limit validation
  const validateNotes = (text: string) => {
    const isValid = text.length <= 100;
    setNotesError(!isValid);
    return isValid;
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(text);
  };

  const handlePhoneBlur = () => {
    validatePhoneNumber(phoneNumber);
  };

  const handleNotesChange = (text: string) => {
    setNotes(text);
    validateNotes(text);
  };

  const handleScheduleGame = () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Phone Required', 'Please enter your phone number to continue.');
      return;
    }

    if (phoneError || notesError) {
      Alert.alert('Invalid Input', 'Please fix the errors before continuing.');
      return;
    }

    onScheduleGame(notes.trim() || '', phoneNumber.trim());
  };

  const handleNotesFocus = () => {
    // Scroll to the bottom when notes field is focused to ensure it's visible
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Get court name
  const selectedCourt = courts.find(court => court.id === gameData.court_id);
  const courtName = selectedCourt?.name || 'Unknown Court';

  // Format date and time
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Not selected';
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString([], { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${dateStr} at ${timeStr}`;
  };

  // Format game type display
  const formatGameType = (type?: GameType) => {
    if (!type) return 'Not selected';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Format player level display
  const formatPlayerLevel = (level?: PlayerLevel) => {
    if (!level) return 'Not selected';
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  // Check if button should be active
  const isButtonActive = phoneNumber.trim().length > 0 && !phoneError && !notesError && !isSubmitting;

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

        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollContent} 
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.mainTitle}>Review Game</Text>

            {/* Game Type with Partner if doubles */}
            <ListItem
              title={gameData.game_type === 'doubles' && gameData.partner_name 
                ? `${formatGameType(gameData.game_type)} with ${gameData.partner_name}`
                : formatGameType(gameData.game_type)
              }
              chips={[formatPlayerLevel(gameData.player_level)]}
              chipBackgrounds={['rgba(0, 0, 0, 0.07)']}
              avatarIcon={gameData.game_type === 'singles' ? (
                <User size={ICON_SIZE_AVATAR} color={ICON_COLOR_DARK} />
              ) : (
                <Users size={ICON_SIZE_AVATAR} color={ICON_COLOR_DARK} />
              )}
              style={styles.listItem}
            />

            {/* Location */}
            <ListItem
              title={courtName}
              avatarIcon={<MapPin size={ICON_SIZE_AVATAR} color={ICON_COLOR_DARK} />}
              style={styles.infoListItem}
            />

            {/* Date & Time */}
            <ListItem
              title={formatDateTime(gameData.scheduled_time)}
              avatarIcon={<Calendar size={ICON_SIZE_AVATAR} color={ICON_COLOR_DARK} />}
              style={styles.infoListItem}
            />

            {/* Phone Number Field */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Phone number</Text>
              <TextInput
                style={[styles.inputField, phoneError && styles.inputFieldError]}
                placeholder=""
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                onBlur={handlePhoneBlur}
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
              {phoneError && (
                <Text style={styles.errorText}>Invalid number</Text>
              )}
            </View>

            {/* Additional Notes Field */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
              <TextInput
                style={[styles.inputField, styles.notesInput, notesError && styles.inputFieldError]}
                placeholder=""
                value={notes}
                onChangeText={handleNotesChange}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#999"
                onFocus={handleNotesFocus}
                maxLength={120}
              />
              {notesError && (
                <Text style={styles.errorText}>Characters exceeded</Text>
              )}
            </View>
          </ScrollView>

          {/* Schedule Game Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.scheduleButton,
                !isButtonActive && styles.scheduleButtonDisabled
              ]} 
              onPress={handleScheduleGame}
              disabled={!isButtonActive}
            >
              <Text style={[
                styles.scheduleButtonText,
                !isButtonActive && styles.scheduleButtonTextDisabled
              ]}>
                {isSubmitting ? 'Scheduling Game...' : 'Schedule Game'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    paddingBottom: 140, // Extra space for button container
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
  summaryContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  listItem: {
    marginBottom: 8,
  },
  notesContainer: {
    marginBottom: 30,
  },
  notesDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
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
  scheduleButton: {
    backgroundColor: '#000000',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleButtonDisabled: {
    opacity: 0.5,
  },
  scheduleButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: 'white',
  },
  scheduleButtonTextDisabled: {
    opacity: 0.7,
  },
  keyboardAvoidingView: {
    flex: 1,
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
  },
  inputFieldError: {
    borderColor: '#FF0000',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    marginTop: 4,
  },
  infoListItem: {
    marginBottom: 12,
    minHeight: 60,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ReviewStep; 