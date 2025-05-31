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
import { Game, gameService } from '../services/gameService';

interface FindDetailsProps {
  game: Game;
  user: any;
  profile: any;
  onBack: () => void;
  onAcceptGame: (gameId: string, navigateToGames?: boolean) => void;
}

const FindDetails: React.FC<FindDetailsProps> = ({ game, user, profile, onBack, onAcceptGame }) => {
  const formattedDateTime = gameService.formatGameDateTime(game.date, game.time);
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
        source={{ uri: playerImages[0] }}
        style={styles.playerPicture}
      />
    </View>
  );

  // Player information based on game type
  const getPlayerInfo = () => {
    if (game.game_type === 'singles') {
      return {
        title: 'Player',
        chip: game.creator_name,
        backgroundColor: '#FFC738' // Yellow for singles
      };
    } else {
      // Doubles game
      if (game.partner_name) {
        return {
          title: 'Player',
          chip: `${game.creator_name} & ${game.partner_name}`,
          backgroundColor: '#FF9442' // Orange for doubles
        };
      } else {
        return {
          title: 'Player',
          chip: `${game.creator_name} (need partner)`,
          backgroundColor: '#FF9442' // Orange for doubles
        };
      }
    }
  };

  const playerInfo = getPlayerInfo();

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
          title="Locations"
          chips={[game.location]}
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
            title={`${game.creator_name} Notes`}
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