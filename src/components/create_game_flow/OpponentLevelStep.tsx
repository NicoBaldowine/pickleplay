import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft, X, ChevronRight, Rabbit, Cat, Dog, Crown } from 'lucide-react-native';
import ListItem from '../ui/ListItem';
import { PlayerLevel } from './CreateGameFlow'; // Import PlayerLevel type from local file
import { globalTextStyles } from '../../styles/globalStyles';
import { COLORS } from '../../constants/colors';

interface OpponentLevelStepProps {
  // gameType: 'singles' | 'doubles'; // Removed, not essential for this step
  onClose: () => void;
  onBack: () => void;
  onSelectLevel: (level: PlayerLevel) => void; // Updated to use PlayerLevel type
}

const levelData: { id: PlayerLevel; title: string; description: string; range: string; icon: React.ReactNode }[] = [
  { 
    id: 'beginner', 
    title: 'Beginner', 
    description: 'Learning basic rules and strokes',
    range: '1.0-2.5',
    icon: <Rabbit size={20} color="#000000" />
  },
  { 
    id: 'intermediate', 
    title: 'Intermediate', 
    description: 'Consistent serves and developing strategy',
    range: '3.0-3.5',
    icon: <Cat size={20} color="#000000" />
  },
  { 
    id: 'advanced', 
    title: 'Advanced', 
    description: 'Powerful shots and tournament play',
    range: '4.0-4.5',
    icon: <Dog size={20} color="#000000" />
  },
  { 
    id: 'expert', 
    title: 'Expert', 
    description: 'Tournament player',
    range: '5.0+',
    icon: <Crown size={20} color="#000000" />
  },
];

const ICON_SIZE_ACTION = 24; 
const ICON_SIZE_CHEVRON = 18;
const ICON_COLOR_DARK = '#000000';
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
            chips={[level.range]}
            chipBackgrounds={['rgba(0, 0, 0, 0.07)']}
            avatarIcon={level.icon}
            onPress={() => onSelectLevel(level.id)}
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
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
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
    fontSize: 28,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 24,
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    // Using gap: 12 from container for consistent spacing
  },
});

export default OpponentLevelStep; 