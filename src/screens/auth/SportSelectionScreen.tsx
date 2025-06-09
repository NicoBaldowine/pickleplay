import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { ArrowLeft, Zap, Target, Users, Calendar, Trophy } from 'lucide-react-native';

// Import colors and components
import { COLORS } from '../../constants/colors';
import { globalTextStyles } from '../../styles/globalStyles';
import ListItem from '../../components/ui/ListItem';
import TopBar from '../../components/ui/TopBar';

interface SportSelectionScreenProps {
  onBack: () => void;
  onSportSelected: (sport: string) => void;
}

const SPORTS = [
  { 
    id: 'pickleball', 
    name: 'Pickleball', 
    icon: Zap, 
    available: true 
  },
  { 
    id: 'tennis', 
    name: 'Tennis', 
    icon: Target, 
    available: false 
  },
  { 
    id: 'padel', 
    name: 'Padel', 
    icon: Users, 
    available: false 
  },
  { 
    id: 'soccer', 
    name: 'Soccer', 
    icon: Calendar, 
    available: false 
  },
  { 
    id: 'basketball', 
    name: 'Basketball', 
    icon: Trophy, 
    available: false 
  },
];

const SportSelectionScreen: React.FC<SportSelectionScreenProps> = ({ onBack, onSportSelected }) => {
  const [selectedSport, setSelectedSport] = useState<string>('');

  const handleSportSelect = (sportId: string, available: boolean) => {
    if (available) {
      setSelectedSport(sportId);
      // Directly advance when sport is selected
      onSportSelected(sportId);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <TopBar
        title=""
        leftIcon={<ArrowLeft size={24} color={COLORS.TEXT_PRIMARY} />}
        onLeftIconPress={onBack}
        style={styles.topBar}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Title */}
        <Text style={styles.title}>Select your sport</Text>
        
        {/* Sports List */}
        <View style={styles.sportsList}>
          {SPORTS.map((sport) => {
            const IconComponent = sport.icon;
            const isAvailable = sport.available;
            const isSelected = selectedSport === sport.id;
            
            return (
              <ListItem
                key={sport.id}
                title={sport.name}
                avatarIcon={
                  <IconComponent 
                    size={20} 
                    color={isAvailable ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY} 
                  />
                }
                onPress={isAvailable ? () => handleSportSelect(sport.id, sport.available) : undefined}
                style={StyleSheet.flatten([
                  styles.listItem,
                  !isAvailable && styles.listItemDisabled,
                  isSelected && sport.id !== 'pickleball' && styles.listItemSelected
                ])}
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  topBar: {
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 24,
  },
  sportsList: {
    gap: 8,
  },
  listItem: {
    height: 60,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemDisabled: {
    opacity: 0.5,
  },
  listItemSelected: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.TEXT_PRIMARY,
  },
});

export default SportSelectionScreen; 