import React, { useState, useEffect } from 'react';
import { View, Alert, ActivityIndicator, StyleSheet, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gameService } from '../../services/gameService';
import { authService } from '../../services/authService';
import TypeOfGameStep from './TypeOfGameStep';
import DoublesStep from './DoublesStep';
import CreatePartnerStep from './CreatePartnerStep';
import SelectCourtStep from './SelectCourtStep';
import OpponentLevelStep from './OpponentLevelStep';
import ScheduleStep from './ScheduleStep';
import ReviewStep from './ReviewStep';

// Import colors
import { COLORS } from '../../constants/colors';

// Define types for the create game flow
export type GameType = 'singles' | 'doubles';
export type PlayerLevel = 'beginner' | 'intermediate' | 'advanced' | 'pro';
export interface Court { id: string; name: string; distance?: string;}
export interface CreateGameData {
    game_type: GameType;
    court_id: string;
    player_level: PlayerLevel;
    scheduled_time: string;
    partner_name?: string;
    notes?: string;
    status?: string;
}

interface CreateGameFlowProps {
  onClose: () => void;
  onGameCreated: (gameId: string) => void;
}

const CreateGameFlow: React.FC<CreateGameFlowProps> = ({ onClose, onGameCreated }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false); 
  const [isFetchingCourts, setIsFetchingCourts] = useState(false); 
  const [courts, setCourts] = useState<Court[]>([]); // Will use dummy data or be empty for now
  const [isCreatingNewPartner, setIsCreatingNewPartner] = useState(false); // Track if we're in create partner flow
  const [gameData, setGameData] = useState<Partial<CreateGameData>>({
    game_type: undefined,
    court_id: undefined,
    player_level: undefined,
    scheduled_time: undefined,
    partner_name: undefined,
    notes: undefined,
  });

  useEffect(() => {
    // Provide some courts for SelectCourtStep to render
    // In a real app, this would fetch from a courts API
    setCourts([
        { id: 'court_central_park', name: 'Central Park Courts', distance: '0.5 miles' },
        { id: 'court_riverside', name: 'Riverside Recreation Center', distance: '1.2 miles' },
        { id: 'court_downtown', name: 'Downtown Sports Complex', distance: '2.1 miles' },
        { id: 'court_community', name: 'Community Center Courts', distance: '1.8 miles' },
        { id: 'court_elite', name: 'Elite Pickleball Club', distance: '3.2 miles' },
    ]);
  }, []);

  const handleNextStep = () => setStep(prev => prev + 1);
  const handlePrevStep = () => setStep(prev => prev - 1);

  const updateGameData = (data: Partial<CreateGameData>) => {
    setGameData(prev => ({ ...prev, ...data }));
  };

  const handleTypeSelect = (type: GameType) => {
    updateGameData({ game_type: type });
    handleNextStep();
  };

  const handleCreateNewPartner = () => {
    setIsCreatingNewPartner(true);
    handleNextStep();
  };

  const handlePartnerCreated = (partnerData: { name: string; lastname: string; level: string }) => {
    const fullName = `${partnerData.name} ${partnerData.lastname}`;
    updateGameData({ partner_name: fullName });
    setIsCreatingNewPartner(false);
    handleNextStep();
  };

  const handlePartnerSelect = (partnerName: string) => {
    updateGameData({ partner_name: partnerName });
    setIsCreatingNewPartner(false);
    handleNextStep();
  };

  const handleLevelSelect = (level: PlayerLevel) => {
    updateGameData({ player_level: level });
    handleNextStep();
  };

  const handleCourtSelect = (courtId: string) => {
    updateGameData({ court_id: courtId });
    handleNextStep();
  };

  const handleScheduleSelect = (dateTimeIso: string) => {
    updateGameData({ scheduled_time: dateTimeIso });
    handleNextStep(); // Go to ReviewStep instead of creating game immediately
  };

  const handleScheduleGame = async (notes: string, phoneNumber: string) => {
    setIsLoading(true);

    try {
      // Get current user and profile 
      const currentUser = await authService.getCurrentUser();
      const currentProfile = await authService.getProfile(currentUser?.id || '');

      if (!currentUser || !currentProfile) {
        Alert.alert('Error', 'Please log in to create a game.');
        setIsLoading(false);
        return;
      }

      // Convert scheduled_time to Date object and extract date/time parts
      const gameDateTime = new Date(gameData.scheduled_time!);
      const gameDate = gameDateTime.toISOString().split('T')[0]; // YYYY-MM-DD
      const gameTime = gameDateTime.toTimeString().slice(0, 5); // HH:MM

      // Get court name for location
      const selectedCourt = courts.find(court => court.id === gameData.court_id);
      const location = selectedCourt?.name || 'Unknown Court';

      // Create the game data in the format expected by gameService
      const gameToCreate = {
        creator_id: currentUser.id,
        creator_name: `${currentProfile.first_name} ${currentProfile.last_name}`,
        creator_level: currentProfile.pickleball_level || 'Intermediate',
        partner_name: gameData.partner_name,
        partner_level: gameData.partner_name ? gameData.player_level : undefined,
        date: gameDate,
        time: gameTime,
        location: location,
        game_type: gameData.game_type!,
        skill_level: gameData.player_level!,
        notes: notes || `Looking for ${gameData.game_type} players at ${gameData.player_level} level`,
        phone_number: phoneNumber, // Add phone number to game data
      };

      // Validate required fields
      if (!gameToCreate.game_type || !gameToCreate.date || !gameToCreate.time || !gameToCreate.location) {
        Alert.alert('Incomplete Information', 'Please ensure all previous steps are completed.');
        setIsLoading(false);
        return;
      }

      // For doubles, ensure partner name is provided
      if (gameToCreate.game_type === 'doubles' && !gameToCreate.partner_name) {
        Alert.alert('Partner Required', 'Please provide your partner\'s name for doubles games.');
        setIsLoading(false);
        return;
      }

      // Create the game using gameService
      const result = await gameService.createGame(gameToCreate);
      
      if (result.success && result.gameId) {
        Alert.alert('Game Created!', `Your ${gameData.game_type} game has been scheduled successfully.`);
        onGameCreated(result.gameId);
      } else {
        Alert.alert('Creation Failed', result.error || 'Could not create game. Please try again.');
      }
    } catch (error: any) {
      console.error('Error creating game in flow:', error);
      Alert.alert('Creation Failed', error.message || 'Could not create game. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingCourts && step === 5 && courts.length === 0) { 
    return <View style={styles.centered}><ActivityIndicator size="large" /><Text>Loading courts...</Text></View>;
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <TypeOfGameStep
            onClose={onClose}
            onSelectType={handleTypeSelect}
          />
        );
      case 2:
        // If doubles was selected, show DoublesStep, otherwise show OpponentLevelStep
        if (gameData.game_type === 'doubles') {
          return (
            <DoublesStep
              onClose={onClose}
              onBack={handlePrevStep}
              onSelectPartner={handlePartnerSelect}
              onCreateNewPartner={handleCreateNewPartner}
            />
          );
        } else {
          return (
            <OpponentLevelStep
              onClose={onClose}
              onBack={handlePrevStep}
              onSelectLevel={handleLevelSelect} 
            />
          );
        }
      case 3:
        // If doubles and creating new partner, show CreatePartnerStep
        if (gameData.game_type === 'doubles' && isCreatingNewPartner) {
          return (
            <CreatePartnerStep
              onClose={onClose}
              onBack={handlePrevStep}
              onCreatePartner={handlePartnerCreated}
            />
          );
        }
        // If doubles was selected (and not creating partner), this is OpponentLevelStep, otherwise SelectCourtStep
        else if (gameData.game_type === 'doubles') {
          return (
            <OpponentLevelStep
              onClose={onClose}
              onBack={handlePrevStep}
              onSelectLevel={handleLevelSelect} 
            />
          );
        } else {
          return (
            <SelectCourtStep
              courts={courts}
              isLoading={isFetchingCourts} 
              onClose={onClose}
              onBack={handlePrevStep}
              onSelectCourt={handleCourtSelect}
            />
          );
        }
      case 4:
        // If doubles was selected, this is SelectCourtStep, otherwise ScheduleStep
        if (gameData.game_type === 'doubles') {
          return (
            <SelectCourtStep
              courts={courts}
              isLoading={isFetchingCourts} 
              onClose={onClose}
              onBack={handlePrevStep}
              onSelectCourt={handleCourtSelect}
            />
          );
        } else {
          return (
            <ScheduleStep
              onClose={onClose}
              onBack={handlePrevStep}
              onSchedule={handleScheduleSelect} 
              isSubmitting={false} 
            />
          );
        }
      case 5:
        // If doubles, this is ScheduleStep, otherwise ReviewStep
        if (gameData.game_type === 'doubles') {
          return (
            <ScheduleStep
              onClose={onClose}
              onBack={handlePrevStep}
              onSchedule={handleScheduleSelect} 
              isSubmitting={false} 
            />
          );
        } else {
          return (
            <ReviewStep
              onClose={onClose}
              onBack={handlePrevStep}
              onScheduleGame={handleScheduleGame}
              isSubmitting={isLoading}
              gameData={gameData}
              courts={courts}
            />
          );
        }
      case 6:
        // This is only for doubles - ReviewStep
        return (
          <ReviewStep
            onClose={onClose}
            onBack={handlePrevStep}
            onScheduleGame={handleScheduleGame}
            isSubmitting={isLoading}
            gameData={gameData}
            courts={courts}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="dark-content" />
      {renderStep()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CreateGameFlow; 