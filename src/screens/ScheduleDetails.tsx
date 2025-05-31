import React from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Clock, MapPin, Zap, FileText } from 'lucide-react-native';

// Import custom components
import TopBar from '../components/ui/TopBar';
import ListItem from '../components/ui/ListItem';

// Import colors
import { COLORS } from '../constants/colors';

// Import game service and types
import { Game, gameService } from '../services/gameService';

interface ScheduleDetailsProps {
  schedule: Game;
  onBack: () => void;
  onDeleteSchedule: (scheduleId: string) => void;
}

const ScheduleDetails: React.FC<ScheduleDetailsProps> = ({ schedule, onBack, onDeleteSchedule }) => {
  const formattedDateTime = gameService.formatGameDateTime(schedule.date, schedule.time);

  const handleCancelSchedule = () => {
    Alert.alert(
      'Cancel Schedule',
      'Are you sure you want to cancel this schedule? This action cannot be undone.',
      [
        {
          text: 'Keep Schedule',
          style: 'cancel',
        },
        {
          text: 'Cancel Schedule',
          style: 'destructive',
          onPress: () => onDeleteSchedule(schedule.id),
        },
      ]
    );
  };

  // Game type chip
  const gameTypeChip = schedule.game_type.charAt(0).toUpperCase() + schedule.game_type.slice(1);
  const gameTypeChipBackground = schedule.game_type === 'singles' ? '#96BE6B' : '#4DAAC2';

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar barStyle="dark-content" />
      
      <TopBar
        title="Scheduled Game"
        leftIcon={<ArrowLeft size={24} color="#000000" />}
        onLeftIconPress={onBack}
        style={styles.topBar}
        titleContainerStyle={styles.titleContainer}
        titleStyle={styles.titleStyle}
      />

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Type Section */}
        <ListItem
          title="Type"
          chips={[gameTypeChip]}
          chipBackgrounds={[gameTypeChipBackground]}
          avatarIcon={<User size={20} color="#000000" />}
          style={styles.listItem}
        />

        {/* Time Section */}
        <ListItem
          title="Time"
          chips={[formattedDateTime]}
          chipBackgrounds={['rgba(0, 0, 0, 0.07)']}
          avatarIcon={<Clock size={20} color="#000000" />}
          style={styles.listItem}
        />

        {/* Locations Section */}
        <ListItem
          title="Locations"
          chips={[schedule.location]}
          chipBackgrounds={['rgba(0, 0, 0, 0.07)']}
          avatarIcon={<MapPin size={20} color="#000000" />}
          style={styles.listItem}
        />

        {/* Level Section */}
        <ListItem
          title="Level"
          chips={[schedule.skill_level]}
          chipBackgrounds={['rgba(0, 0, 0, 0.07)']}
          avatarIcon={<Zap size={20} color="#000000" />}
          style={styles.listItem}
        />

        {/* My Notes Section */}
        {schedule.notes && schedule.notes.trim().length > 0 && (
          <ListItem
            title="My Notes"
            chips={[schedule.notes]}
            chipBackgrounds={['rgba(0, 0, 0, 0.07)']}
            avatarIcon={<FileText size={20} color="#000000" />}
            style={styles.listItem}
          />
        )}
      </ScrollView>

      {/* Cancel Schedule Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSchedule}>
          <Text style={styles.cancelButtonText}>Cancel Schedule</Text>
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
  listItem: {
    marginBottom: 12,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  cancelButton: {
    backgroundColor: '#000000',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default ScheduleDetails; 