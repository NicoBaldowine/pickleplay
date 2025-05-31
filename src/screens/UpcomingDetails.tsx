import React from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Clock, MapPin, Zap, FileText } from 'lucide-react-native';

// Import custom components
import TopBar from '../components/ui/TopBar';
import ListItem from '../components/ui/ListItem';

// Import colors
import { COLORS } from '../constants/colors';

// Import game service and types
import { UserGame, gameService } from '../services/gameService';

interface UpcomingDetailsProps {
  game: UserGame;
  onBack: () => void;
  onCancelGame: (gameId: string) => void;
}

const UpcomingDetails: React.FC<UpcomingDetailsProps> = ({ game, onBack, onCancelGame }) => {
  const formattedDateTime = gameService.formatGameDateTime(game.date, game.time);

  // Placeholder images for profile pictures
  const playerImages = [
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  ];

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

  // Player profile picture
  const playerAvatarIcon = (
    <View style={styles.playerPictureContainer}>
      <Image
        source={{ uri: playerImages[0] }}
        style={styles.playerPicture}
      />
    </View>
  );

  // Player information and background color based on game type
  const getPlayerInfo = () => {
    if (game.game_type === 'singles') {
      return {
        title: 'Opponent',
        chip: game.opponent_name,
        backgroundColor: '#96BE6B' // Green for singles
      };
    } else {
      return {
        title: 'Opponent',
        chip: game.opponent_name,
        backgroundColor: '#4DAAC2' // Blue for doubles
      };
    }
  };

  const playerInfo = getPlayerInfo();

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar barStyle="dark-content" />
      
      <TopBar
        title="Upcoming Game"
        leftIcon={<ArrowLeft size={24} color="#000000" />}
        onLeftIconPress={onBack}
        rightIcon={
          <Text style={styles.cancelText}>Cancel</Text>
        }
        onRightIconPress={handleCancelGame}
        style={styles.topBar}
        titleContainerStyle={styles.titleContainer}
        titleStyle={styles.titleStyle}
      />

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Opponent Section */}
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

        {/* Location Section */}
        <ListItem
          title="Location"
          chips={[game.location || 'TBD']}
          chipBackgrounds={['rgba(0, 0, 0, 0.07)']}
          avatarIcon={<MapPin size={20} color="#000000" />}
          style={styles.listItem}
        />

        {/* Level Section */}
        <ListItem
          title="Level"
          chips={[game.opponent_level || 'Beginner']}
          chipBackgrounds={['rgba(0, 0, 0, 0.07)']}
          avatarIcon={<Zap size={20} color="#000000" />}
          style={styles.listItem}
        />

        {/* Notes Section */}
        {game.original_game?.notes && (
          <ListItem
            title="Game Notes"
            chips={[game.original_game.notes]}
            chipBackgrounds={['rgba(0, 0, 0, 0.07)']}
            avatarIcon={<FileText size={20} color="#000000" />}
            style={styles.listItem}
          />
        )}
      </ScrollView>

      {/* Text Player Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.textButton} onPress={() => console.log(`Text ${game.opponent_name}`)}>
          <Text style={styles.textButtonText}>Text {game.opponent_name}</Text>
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
  cancelText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
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
  textButton: {
    backgroundColor: '#000000',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default UpcomingDetails; 