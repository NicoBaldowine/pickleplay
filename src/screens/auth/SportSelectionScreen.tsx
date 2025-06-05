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
import ListItem from '../../components/ui/ListItem';

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
  const [selectedSport, setSelectedSport] = useState<string>('pickleball');

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
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Title */}
        <Text style={styles.title}>Select your sport</Text>
        
        {/* Sports List */}
        <View style={styles.sportsList}>
          {SPORTS.map((sport) => {
            const IconComponent = sport.icon;
            const isAvailable = sport.available;
            
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
                style={!isAvailable ? styles.listItemDisabled : styles.listItem}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 24,
  },
  sportsList: {
    gap: 12,
  },
  listItem: {
    backgroundColor: '#F5E9CF',
    marginBottom: 8,
  },
  listItemDisabled: {
    backgroundColor: '#F5E9CF',
    opacity: 0.5,
    marginBottom: 8,
  },
});

export default SportSelectionScreen; 