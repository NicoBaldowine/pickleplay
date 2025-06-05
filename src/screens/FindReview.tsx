import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, TouchableOpacity, Alert, Image, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, MapPin, Clock } from 'lucide-react-native';

// Import custom components
import TopBar from '../components/ui/TopBar';
import ListItem from '../components/ui/ListItem';

// Import colors
import { COLORS } from '../constants/colors';

// Import game service and types
import { GameWithPlayers, gameService } from '../services/gameService';

interface FindReviewProps {
  game: GameWithPlayers;
  user: any;
  profile: any;
  onBack: () => void;
  onAcceptGame: (gameId: string, phoneNumber: string, notes?: string) => void;
}

const FindReview: React.FC<FindReviewProps> = ({ game, user, profile, onBack, onAcceptGame }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [phoneError, setPhoneError] = useState(false);
  const [notesError, setNotesError] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const formattedDateTime = gameService.formatGameDateTime(game.scheduled_date, game.scheduled_time);

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
    // Don't validate on change, only on blur for better UX
  };

  const handlePhoneBlur = () => {
    validatePhoneNumber(phoneNumber);
  };

  const handleNotesChange = (text: string) => {
    setNotes(text);
    validateNotes(text);
  };

  const handleAcceptGame = () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Phone Required', 'Please enter your phone number to continue.');
      return;
    }

    if (phoneError || notesError) {
      Alert.alert('Invalid Input', 'Please fix the errors before continuing.');
      return;
    }

    // Call onAcceptGame directly - wrapper handles navigation and success feedback
    onAcceptGame(game.id, phoneNumber.trim(), notes.trim() || undefined);
  };

  const handleNotesFocus = () => {
    // Scroll to the bottom when notes field is focused to ensure it's visible
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // User profile picture - use actual user avatar or fallback
  const userAvatarIcon = (
    <View style={styles.userPictureContainer}>
      {profile?.avatar_url ? (
        <Image
          source={{ uri: profile.avatar_url }}
          style={styles.userPicture}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitials}>
            {profile?.first_name?.charAt(0) || 'U'}{profile?.last_name?.charAt(0) || ''}
          </Text>
        </View>
      )}
    </View>
  );

  // Get user's full name
  const getUserName = () => {
    if (profile?.full_name) {
      return profile.full_name;
    }
    if (profile?.first_name || profile?.last_name) {
      return `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
    }
    return user?.email?.split('@')[0] || 'User';
  };

  // Check if button should be active
  const isButtonActive = phoneNumber.trim().length > 0 && !phoneError && !notesError;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <StatusBar barStyle="dark-content" />
        
        <TopBar
          title="Review game"
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
            ref={scrollViewRef}
            style={styles.scrollContainer} 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* User Info Section - Current user's info */}
            <ListItem
              title={getUserName()}
              chips={[profile?.pickleball_level || 'Beginner']}
              chipBackgrounds={['rgba(0, 0, 0, 0.07)']}
              avatarIcon={userAvatarIcon}
              style={styles.listItem}
            />

            {/* Location Section - Game location */}
            <ListItem
              title={`${game.venue_name} - ${game.venue_address}`}
              avatarIcon={<MapPin size={20} color="#000000" />}
              style={styles.infoListItem}
            />

            {/* Date & Time Section - Game date and time */}
            <ListItem
              title={formattedDateTime}
              avatarIcon={<Clock size={20} color="#000000" />}
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
                maxLength={120} // Allow a bit more than 100 to show error
              />
              {notesError && (
                <Text style={styles.errorText}>Characters exceeded</Text>
              )}
            </View>
          </ScrollView>

          {/* Accept Game Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.acceptButton,
                !isButtonActive && styles.acceptButtonDisabled
              ]} 
              onPress={handleAcceptGame}
              disabled={!isButtonActive}
            >
              <Text style={[
                styles.acceptButtonText,
                !isButtonActive && styles.acceptButtonTextDisabled
              ]}>
                Accept Game
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  listItem: {
    marginBottom: 12,
  },
  userPictureContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  userPicture: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
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
    color: '#333',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  inputFieldError: {
    borderColor: '#FF0000',
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  acceptButton: {
    backgroundColor: '#000000',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonDisabled: {
    opacity: 0.5,
  },
  acceptButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#FFFFFF',
  },
  acceptButtonTextDisabled: {
    opacity: 0.7,
  },
  infoListItem: {
    marginBottom: 12,
    minHeight: 60,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    marginTop: 4,
  },
});

export default FindReview; 