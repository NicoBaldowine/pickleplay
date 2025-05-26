import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft, X, ChevronRight, Rabbit, Cat, Dog, Crown } from 'lucide-react-native';
import ListItem from '../ui/ListItem';
import { PlayerLevel } from '../../services/gameService'; // Import PlayerLevel type
import { globalTextStyles } from '../../styles/globalStyles';

interface OpponentLevelStepProps {
  // gameType: 'singles' | 'doubles'; // Removed, not essential for this step
  onClose: () => void;
  onBack: () => void;
  onSelectLevel: (level: PlayerLevel) => void; // Updated to use PlayerLevel type
}

const levelData: { id: PlayerLevel; title: string; description: string; icon: React.ReactNode }[] = [
  { 
    id: 'beginner', 
    title: 'Beginner', 
    description: '1.0-2.5 • Learning basic rules and strokes',
    icon: <Rabbit size={20} color="#333" />
  },
  { 
    id: 'intermediate', 
    title: 'Intermediate', 
    description: '3.0-3.5 • Consistent serves and developing strategy',
    icon: <Cat size={20} color="#333" />
  },
  { 
    id: 'advanced', 
    title: 'Advanced', 
    description: '4.0-4.5 • Powerful shots and tournament play',
    icon: <Dog size={20} color="#333" />
  },
  { 
    id: 'pro', 
    title: 'Pro', 
    description: '5.0+ • Professional level play',
    icon: <Crown size={20} color="#333" />
  },
];

const ICON_SIZE_ACTION = 24; 
const ICON_SIZE_CHEVRON = 18;
const ICON_COLOR_DARK = '#333';
const ICON_COLOR_MEDIUM = '#888';
const STROKE_WIDTH_STANDARD = 1.8;

const OpponentLevelStep: React.FC<OpponentLevelStepProps> = ({ /*gameType,*/ onClose, onBack, onSelectLevel }) => {
  return (
    <View style={styles.container}>
      <View style={styles.topBarActions}>
        <TouchableOpacity onPress={onBack} style={styles.headerButtonLeft}>
          <ArrowLeft size={ICON_SIZE_ACTION} color={ICON_COLOR_DARK} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={styles.headerButtonRight}>
          <X size={ICON_SIZE_ACTION} color={ICON_COLOR_DARK} />
        </TouchableOpacity>
      </View>

      <Text style={styles.mainTitle}>Opponent's Level</Text>

      <View style={styles.listContainer}>
        {levelData.map((level) => (
          <ListItem
            key={level.id}
            title={level.title}
            description={level.description}
            avatarIcon={level.icon}
            onPress={() => onSelectLevel(level.id)}
            rightElement={<ChevronRight size={ICON_SIZE_CHEVRON} color={ICON_COLOR_MEDIUM} />}
            style={styles.listItem}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2D6',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  topBarActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerButtonLeft: {
    padding: 8,
  },
  headerButtonRight: {
    padding: 8,
  },
  mainTitle: {
    ...globalTextStyles.h2,
    marginBottom: 30,
  },
  listContainer: {
    // Styles for the list container if needed
  },
  listItem: {
    marginBottom: 12,
  },
});

export default OpponentLevelStep; 