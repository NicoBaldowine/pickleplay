import React from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Clock, MapPin, Zap, FileText } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

// Import custom components
import TopBar from '../components/ui/TopBar';
import ListItem from '../components/ui/ListItem';

// Import colors
import { COLORS } from '../constants/colors';

// Import game service and types
import { GameWithPlayers, gameService } from '../services/gameService';

interface FindDetailsProps {
  game: GameWithPlayers;
  user: any;
  profile: any;
  onBack: () => void;
  onAcceptGame: (gameId: string, navigateToGames?: boolean) => void;
}

const FindDetails: React.FC<FindDetailsProps> = ({ game, user, profile, onBack, onAcceptGame }) => {
  const formattedDateTime = gameService.formatGameDateTime(game.scheduled_date, game.scheduled_time);
  const navigation = useNavigation();

  // Placeholder images for profile pictures
  const playerImages = [
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1494790108755-2616b612b510?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  ];

  const handleContinue = () => {
    (navigation as any).navigate('FindReview', { 
      game,
      user,
      profile,
      onAcceptGame: (gameId: string, phoneNumber: string, notes?: string) => {
        // Handle the actual game acceptance with phone and notes
        onAcceptGame(gameId, true);
      }
    });
  };

  // Player profile picture
  const playerAvatarIcon = (
    <View style={styles.playerPictureContainer}>
      <Image
        source={{ uri: game.creator?.avatar_url || playerImages[0] }}
        style={styles.playerPicture}
      />
    </View>
  );

  // Player information based on game type
  const getPlayerInfo = () => {
    // Use synchronous display name logic (same as SearchScreen)
    const getDisplayName = () => {
      if (!game.creator) return 'Unknown Player';
      
      const creatorName = game.creator.full_name || 
                         `${game.creator.first_name || ''} ${game.creator.last_name || ''}`.trim() || 
                         'Unknown Player';

      if (game.game_type === 'singles') {
        return creatorName;
      } else {
        // For doubles, check if partner info is in notes
        if (game.notes && game.notes.includes('with partner:')) {
          const partnerMatch = game.notes.match(/with partner: (.+?)(?:\.|$)/);
          if (partnerMatch && partnerMatch[1]) {
            // Extract first names only for cleaner display
            const creatorFirstName = game.creator.first_name || creatorName.split(' ')[0] || 'User';
            const partnerFullName = partnerMatch[1].trim();
            const partnerFirstName = partnerFullName.split(' ')[0] || 'Partner';
            return `${creatorFirstName} & ${partnerFirstName}`;
          }
        }
        
        // Check if we have other registered players
        const otherPlayers = game.players?.filter(p => p.user_id !== game.creator_id) || [];
        if (otherPlayers.length > 0 && otherPlayers[0].profile) {
          const creatorFirstName = game.creator.first_name || creatorName.split(' ')[0] || 'User';
          const partnerName = otherPlayers[0].profile.full_name || 
                             `${otherPlayers[0].profile.first_name || ''} ${otherPlayers[0].profile.last_name || ''}`.trim() || 
                             'Partner';
          const partnerFirstName = otherPlayers[0].profile.first_name || partnerName.split(' ')[0] || 'Partner';
          return `${creatorFirstName} & ${partnerFirstName}`;
        }
        
        return `${creatorName} (need partner)`;
      }
    };
    
    const displayName = getDisplayName();
    const backgroundColor = game.game_type === 'singles' ? '#FFC738' : '#FF9442';
    
    return {
      title: 'Player',
      chip: displayName,
      backgroundColor
    };
  };

  const playerInfo = getPlayerInfo();

  // Get creator name for notes
  const creatorName = game.creator?.full_name || 
                     `${game.creator?.first_name || ''} ${game.creator?.last_name || ''}`.trim() || 
                     'Player';

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar barStyle="dark-content" />
      
      <TopBar
        title="Game Found"
        leftIcon={<ArrowLeft size={24} color="#000000" />}
        onLeftIconPress={onBack}
        style={styles.topBar}
        titleContainerStyle={styles.titleContainer}
        titleStyle={styles.titleStyle}
      />

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Player Section */}
        <ListItem
          title={playerInfo.title}
          chips={[playerInfo.chip]}
          chipBackgrounds={['rgba(255, 255, 255, 0.3)']}
          avatarIcon={playerAvatarIcon}
          style={{
            ...styles.listItem,
            backgroundColor: playerInfo.backgroundColor
          }}
        />

        {/* Date & Time Section */}
        <ListItem
          title="Date & Time"
          chips={[formattedDateTime]}
          chipBackgrounds={['rgba(0, 0, 0, 0.07)']}
          avatarIcon={<Clock size={20} color="#000000" />}
          style={styles.listItem}
        />

        {/* Locations Section */}
        <ListItem
          title="Location"
          chips={[game.venue_name]}
          chipBackgrounds={['rgba(0, 0, 0, 0.07)']}
          avatarIcon={<MapPin size={20} color="#000000" />}
          style={styles.listItem}
        />

        {/* Level Section */}
        <ListItem
          title="Level"
          chips={[game.skill_level]}
          chipBackgrounds={['rgba(0, 0, 0, 0.07)']}
          avatarIcon={<Zap size={20} color="#000000" />}
          style={styles.listItem}
        />

        {/* Player Notes Section */}
        {game.notes && (
          <ListItem
            title={`${creatorName} Notes`}
            chips={[game.notes]}
            chipBackgrounds={['rgba(0, 0, 0, 0.07)']}
            avatarIcon={<FileText size={20} color="#000000" />}
            style={styles.listItem}
          />
        )}
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
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
  playerPictureContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  playerPicture: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  continueButton: {
    backgroundColor: '#000000',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default FindDetails; 