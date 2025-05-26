import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { ArrowLeft, X, User, Users, Calendar, Clock, MapPin, Target } from 'lucide-react-native';
import { GameType, PlayerLevel, Court } from './CreateGameFlow';
import ListItem from '../ui/ListItem';
import { globalTextStyles } from '../../styles/globalStyles';

interface ReviewStepProps {
  onClose: () => void;
  onBack: () => void;
  onScheduleGame: (notes: string) => void;
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
const ICON_COLOR_DARK = '#333';
const ICON_COLOR_MEDIUM = '#888';

const ReviewStep: React.FC<ReviewStepProps> = ({
  onClose,
  onBack,
  onScheduleGame,
  isSubmitting,
  gameData,
  courts,
}) => {
  const [notes, setNotes] = useState('');

  const handleScheduleGame = () => {
    onScheduleGame(notes);
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

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContentContainer}>
          <Text style={styles.mainTitle}>Review Your Game</Text>
          <Text style={styles.descriptionText}>
            Review the details below and add any notes before scheduling your game.
          </Text>

          {/* Game Summary Section */}
          <View style={styles.summaryContainer}>
            <Text style={styles.sectionTitle}>Game Details</Text>
            
            {/* Game Type */}
            <ListItem
              title="Game Type"
              description={formatGameType(gameData.game_type)}
              avatarIcon={gameData.game_type === 'singles' ? (
                <User size={ICON_SIZE_AVATAR} color={ICON_COLOR_DARK} />
              ) : (
                <Users size={ICON_SIZE_AVATAR} color={ICON_COLOR_DARK} />
              )}
              style={styles.listItem}
            />

            {/* Partner (if doubles) */}
            {gameData.game_type === 'doubles' && gameData.partner_name && (
              <ListItem
                title="Partner"
                description={gameData.partner_name}
                avatarIcon={<User size={ICON_SIZE_AVATAR} color={ICON_COLOR_DARK} />}
                style={styles.listItem}
              />
            )}

            {/* Skill Level */}
            <ListItem
              title="Skill Level"
              description={formatPlayerLevel(gameData.player_level)}
              avatarIcon={<Target size={ICON_SIZE_AVATAR} color={ICON_COLOR_DARK} />}
              style={styles.listItem}
            />

            {/* Location */}
            <ListItem
              title="Location"
              description={courtName}
              avatarIcon={<MapPin size={ICON_SIZE_AVATAR} color={ICON_COLOR_DARK} />}
              style={styles.listItem}
            />

            {/* Date & Time */}
            <ListItem
              title="Date & Time"
              description={formatDateTime(gameData.scheduled_time)}
              avatarIcon={<Calendar size={ICON_SIZE_AVATAR} color={ICON_COLOR_DARK} />}
              style={styles.listItem}
            />
          </View>

          {/* Notes Section */}
          <View style={styles.notesContainer}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Text style={styles.notesDescription}>
              Add any additional information or requirements for your game (optional).
            </Text>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g., Looking for competitive players, bring your own paddle, etc."
              placeholderTextColor="#999"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={200}
            />
            <Text style={styles.characterCount}>{notes.length}/200</Text>
          </View>
        </ScrollView>

        {/* Schedule Game Button - Fixed at bottom */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.scheduleButton, isSubmitting && styles.disabledButton]} 
            onPress={handleScheduleGame}
            disabled={isSubmitting}
          >
            <Text style={[styles.scheduleButtonText, isSubmitting && styles.disabledButtonText]}>
              {isSubmitting ? 'Scheduling Game...' : 'Schedule Game'}
            </Text>
          </TouchableOpacity>
        </View>
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
  },
  scrollContentContainer: {
    paddingBottom: 140, // Extra space for button container
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E5E5E7',
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
    backgroundColor: '#FEF2D6',
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: 40,
  },
  scheduleButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#E5E5E7',
  },
  scheduleButtonText: {
    ...globalTextStyles.button,
    color: 'white',
  },
  disabledButtonText: {
    color: '#999',
  },
});

export default ReviewStep; 