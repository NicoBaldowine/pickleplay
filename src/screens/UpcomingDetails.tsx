import React from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Users, MapPin, Clock, Star, Phone } from 'lucide-react-native';

// Import custom components
import TopBar from '../components/ui/TopBar';

// Import game service and types
import { UserGame, gameService } from '../services/gameService';

interface UpcomingDetailsProps {
  game: UserGame;
  onBack: () => void;
  onCancelGame: (gameId: string) => void;
}

const UpcomingDetails: React.FC<UpcomingDetailsProps> = ({ game, onBack, onCancelGame }) => {
  const formattedDateTime = gameService.formatGameDateTime(game.date, game.time);

  const handleCancelGame = () => {
    Alert.alert(
      'Cancel Game',
      `Are you sure you want to cancel this game with ${game.opponent_name}? They will be notified about the cancellation.`,
      [
        {
          text: 'Keep Game',
          style: 'cancel',
        },
        {
          text: 'Cancel Game',
          style: 'destructive',
          onPress: () => {
            onCancelGame(game.id);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleCallOpponent = () => {
    // Mock phone number for demo - in real app this would come from user profile
    const phoneNumber = '+1234567890';
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const renderGameTypeInfo = () => {
    if (game.game_type === 'singles') {
      return (
        <View style={styles.playerSection}>
          <View style={styles.playerHeader}>
            <User size={24} color="#007AFF" />
            <Text style={styles.playerHeaderText}>Singles Match</Text>
          </View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{game.opponent_name}</Text>
            <Text style={styles.playerLevel}>Level: {game.opponent_level}</Text>
            
            {/* Contact Info */}
            <TouchableOpacity style={styles.contactButton} onPress={handleCallOpponent}>
              <Phone size={16} color="#007AFF" />
              <Text style={styles.contactButtonText}>Call Player</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else {
      // For doubles, show team info
      const teamMembers = game.opponent_name.includes('&') 
        ? game.opponent_name.split(' & ')
        : [game.opponent_name];

      return (
        <View style={styles.playerSection}>
          <View style={styles.playerHeader}>
            <Users size={24} color="#007AFF" />
            <Text style={styles.playerHeaderText}>Doubles Match</Text>
          </View>
          <View style={styles.playerInfo}>
            {teamMembers.map((member, index) => (
              <View key={index} style={styles.teamMember}>
                <Text style={styles.playerName}>{member.trim()}</Text>
                <Text style={styles.playerLevel}>Level: {game.opponent_level}</Text>
              </View>
            ))}
            
            {/* Contact Info */}
            <TouchableOpacity style={styles.contactButton} onPress={handleCallOpponent}>
              <Phone size={16} color="#007AFF" />
              <Text style={styles.contactButtonText}>Call Team</Text>
            </TouchableOpacity>
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
              <Text style={styles.infoValue}>{game.location}</Text>
              {game.original_game.court_number && (
                <Text style={styles.infoSubValue}>{game.original_game.court_number}</Text>
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
              <Text style={styles.infoValue}>{game.original_game.skill_level}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {game.original_game.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{game.original_game.notes}</Text>
            </View>
          </View>
        )}

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <Text style={styles.contactSectionTitle}>Contact Information</Text>
          <View style={styles.contactInfo}>
            <Phone size={20} color="#666" />
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactValue}>+1 (234) 567-8900</Text>
              <Text style={styles.contactSubtext}>Tap "Call Player" to contact</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Cancel Game Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelGame}>
          <Text style={styles.cancelButtonText}>Cancel Game</Text>
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
  teamMember: {
    marginBottom: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  contactButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
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
  contactSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  contactSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  contactTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  contactLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  contactSubtext: {
    fontSize: 12,
    color: '#888',
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default UpcomingDetails; 