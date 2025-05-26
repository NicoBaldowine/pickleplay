import React from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Users, MapPin, Clock, Star, Trash2 } from 'lucide-react-native';

// Import custom components
import TopBar from '../components/ui/TopBar';

// Import game service and types
import { Game, gameService } from '../services/gameService';

interface ScheduleDetailsProps {
  schedule: Game;
  onBack: () => void;
  onDeleteSchedule: (scheduleId: string) => void;
}

const ScheduleDetails: React.FC<ScheduleDetailsProps> = ({ schedule, onBack, onDeleteSchedule }) => {
  const formattedDateTime = gameService.formatGameDateTime(schedule.date, schedule.time);

  const handleDeleteSchedule = () => {
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to delete this schedule? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteSchedule(schedule.id),
        },
      ]
    );
  };

  const renderGameTypeInfo = () => {
    if (schedule.game_type === 'singles') {
      return (
        <View style={styles.playerSection}>
          <View style={styles.playerHeader}>
            <User size={24} color="#007AFF" />
            <Text style={styles.playerHeaderText}>Singles Match</Text>
          </View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{schedule.creator_name}</Text>
            <Text style={styles.playerLevel}>Level: {schedule.creator_level}</Text>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.playerSection}>
          <View style={styles.playerHeader}>
            <Users size={24} color="#007AFF" />
            <Text style={styles.playerHeaderText}>Doubles Match</Text>
          </View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{schedule.creator_name}</Text>
            <Text style={styles.playerLevel}>Level: {schedule.creator_level}</Text>
            {schedule.partner_name ? (
              <>
                <Text style={styles.playerName}>{schedule.partner_name}</Text>
                <Text style={styles.playerLevel}>Level: {schedule.partner_level}</Text>
              </>
            ) : (
              <Text style={styles.needPartnerText}>Looking for a partner</Text>
            )}
          </View>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Use TopBar instead of custom header */}
      <TopBar
        title={formattedDateTime}
        leftIcon={<ArrowLeft size={24} color="#007AFF" />}
        onLeftIconPress={onBack}
      />

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Game Type and Player Info */}
        {renderGameTypeInfo()}

        {/* Location Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <MapPin size={20} color="#666" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{schedule.location}</Text>
              {schedule.court_number && (
                <Text style={styles.infoSubValue}>{schedule.court_number}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Time Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Clock size={20} color="#666" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{formattedDateTime}</Text>
            </View>
          </View>
        </View>

        {/* Skill Level */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Star size={20} color="#666" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Skill Level</Text>
              <Text style={styles.infoValue}>{schedule.skill_level}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {schedule.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{schedule.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Delete Schedule Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteSchedule}>
          <Trash2 size={20} color="#FFFFFF" />
          <Text style={styles.deleteButtonText}>Delete Schedule</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FEF2D6',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  playerSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  playerInfo: {
    paddingLeft: 32,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  playerLevel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  needPartnerText: {
    fontSize: 14,
    color: '#FF9500',
    fontStyle: 'italic',
    marginTop: 8,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  infoSubValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  notesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  notesContainer: {
    backgroundColor: '#F5F0E8',
    borderRadius: 8,
    padding: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default ScheduleDetails; 