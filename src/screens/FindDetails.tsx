import React from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Users, MapPin, Clock, Star } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

// Import custom components
import TopBar from '../components/ui/TopBar';

// Import game service and types
import { Game, gameService } from '../services/gameService';

interface FindDetailsProps {
  game: Game;
  onBack: () => void;
  onAcceptGame: (gameId: string, navigateToGames?: boolean) => void;
}

const FindDetails: React.FC<FindDetailsProps> = ({ game, onBack, onAcceptGame }) => {
  const formattedDateTime = gameService.formatGameDateTime(game.date, game.time);
  const navigation = useNavigation();

  const handleAcceptGame = () => {
    Alert.alert(
      'Game Accepted!',
      `You've successfully joined the ${game.game_type} game with ${game.creator_name}. The game details have been added to your Games tab.`,
      [
        {
          text: 'View My Games',
          onPress: () => {
            onAcceptGame(game.id, true);
          },
        },
      ],
      { cancelable: false }
    );
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
            <Text style={styles.playerName}>{game.creator_name}</Text>
            <Text style={styles.playerLevel}>Level: {game.creator_level}</Text>
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
            <Text style={styles.playerName}>{game.creator_name}</Text>
            <Text style={styles.playerLevel}>Level: {game.creator_level}</Text>
            {game.partner_name ? (
              <>
                <Text style={styles.playerName}>{game.partner_name}</Text>
                <Text style={styles.playerLevel}>Level: {game.partner_level}</Text>
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
              <Text style={styles.infoValue}>{game.location}</Text>
              {game.court_number && (
                <Text style={styles.infoSubValue}>{game.court_number}</Text>
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
              <Text style={styles.infoValue}>{game.skill_level}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {game.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{game.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Accept Game Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptGame}>
          <Text style={styles.acceptButtonText}>Accept Game</Text>
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
  acceptButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FindDetails; 