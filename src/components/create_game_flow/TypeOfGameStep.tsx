import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { X, ChevronRight, User, Users } from 'lucide-react-native';
import ListItem from '../ui/ListItem';
import { globalTextStyles } from '../../styles/globalStyles';
import { COLORS } from '../../constants/colors';

interface TypeOfGameStepProps {
  onClose: () => void;
  onSelectType: (type: 'singles' | 'doubles') => void;
}

const ICON_SIZE_CLOSE = 24;
const ICON_SIZE_CHEVRON = 18;
const ICON_SIZE_AVATAR = 20;
const ICON_COLOR_DARK = '#000000';
const ICON_COLOR_MEDIUM = '#888';
const STROKE_WIDTH_STANDARD = 1.8;

const TypeOfGameStep: React.FC<TypeOfGameStepProps> = ({ onClose, onSelectType }) => {
  return (
    <View style={styles.container}>
      {/* Top action bar for the close button */}
      <View style={styles.topBarActions}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={ICON_SIZE_CLOSE} color={ICON_COLOR_DARK} />
        </TouchableOpacity>
      </View>

      {/* Main title below the action bar */}
      <Text style={styles.mainTitle}>Type of Game</Text>

      {/* List items */}
      <View style={styles.listContainer}>
        <ListItem
          title="Singles"
          avatarIcon={<User size={ICON_SIZE_AVATAR} color={ICON_COLOR_DARK} />}
          onPress={() => onSelectType('singles')}
          rightElement={<ChevronRight size={ICON_SIZE_CHEVRON} color={ICON_COLOR_MEDIUM} />}
          style={styles.listItem}
        />
        <ListItem
          title="Doubles"
          avatarIcon={<Users size={ICON_SIZE_AVATAR} color={ICON_COLOR_DARK} />}
          onPress={() => onSelectType('doubles')}
          rightElement={<ChevronRight size={ICON_SIZE_CHEVRON} color={ICON_COLOR_MEDIUM} />}
          style={styles.listItem}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
    paddingHorizontal: 20,
    paddingTop: 20, // This acts as top margin from Safe Area edge
  },
  topBarActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16, // Space between X and the title
  },
  closeButton: {
    padding: 8, 
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 24, // Space between title and list items
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
});

export default TypeOfGameStep; 