import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { X, ChevronRight, User, Users } from 'lucide-react-native';
import ListItem from '../ui/ListItem';
import { globalTextStyles } from '../../styles/globalStyles';

interface TypeOfGameStepProps {
  onClose: () => void;
  onSelectType: (type: 'singles' | 'doubles') => void;
}

const ICON_SIZE_CLOSE = 24;
const ICON_SIZE_CHEVRON = 18;
const ICON_SIZE_AVATAR = 20;
const ICON_COLOR_DARK = '#333';
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
    backgroundColor: '#FEF2D6',
    paddingHorizontal: 20,
    paddingTop: 20, // This acts as top margin from Safe Area edge
  },
  topBarActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16, // Space between X and the title
    // If you need this bar to span full width and have specific height:
    // width: '100%',
    // height: 30, // Adjust as needed
  },
  closeButton: {
    padding: 8, 
  },
  mainTitle: {
    ...globalTextStyles.h2,
    marginBottom: 30, // Space between title and list items
    // textAlign: 'left', // Default, but explicit if needed
  },
  listContainer: {
    // Styles for the list container if needed
  },
  listItem: {
    marginBottom: 12,
  },
});

export default TypeOfGameStep; 