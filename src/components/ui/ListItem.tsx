import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import Avatar from './Avatar'; // Assuming Avatar.tsx is in the same directory
import { globalTextStyles, withGlobalFont } from '../../styles/globalStyles';

interface ListItemProps {
  title: string;
  description?: string;
  chips?: string[]; // New prop for chip data
  chipBackgrounds?: string[]; // New prop for chip background colors
  avatarName?: string; // For initials if no URI
  avatarUri?: string;
  avatarIcon?: React.ReactNode;
  avatarSize?: number;
  onPress?: () => void;
  style?: ViewStyle;
  rightElement?: React.ReactNode;
  onRightElementPress?: () => void;
}

const ListItem: React.FC<ListItemProps> = ({
  title,
  description,
  chips,
  chipBackgrounds,
  avatarName,
  avatarUri,
  avatarIcon,
  avatarSize = 40,
  onPress,
  style,
  rightElement,
  onRightElementPress,
}) => {
  const mainContent = (
    <>
      <Avatar name={avatarName} uri={avatarUri} icon={avatarIcon} size={avatarSize} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {chips && chips.length > 0 && (
          <View style={styles.chipsContainer}>
            {/* First line: name and level */}
            <View style={styles.chipRow}>
              {chips[0] && chips[0].trim() !== '' && (
                <View style={[
                  styles.chip, 
                  { backgroundColor: chipBackgrounds?.[0] || 'rgba(0, 0, 0, 0.07)' }
                ]}>
                  <Text style={styles.chipText}>{chips[0]}</Text>
                </View>
              )}
              {chips[1] && chips[1].trim() !== '' && (
                <View style={[
                  styles.chip, 
                  { backgroundColor: chipBackgrounds?.[1] || 'rgba(0, 0, 0, 0.07)' }
                ]}>
                  <Text style={styles.chipText}>{chips[1]}</Text>
                </View>
              )}
            </View>
            {/* Second line: location */}
            {chips[2] && chips[2].trim() !== '' && (
              <View style={styles.chipRow}>
                <View style={[
                  styles.chip, 
                  { backgroundColor: chipBackgrounds?.[2] || 'rgba(0, 0, 0, 0.07)' }
                ]}>
                  <Text style={styles.chipText}>{chips[2]}</Text>
                </View>
                {/* Additional chips for second line */}
                {chips[3] && chips[3].trim() !== '' && (
                  <View style={[
                    styles.chip, 
                    { backgroundColor: chipBackgrounds?.[3] || 'rgba(0, 0, 0, 0.07)' }
                  ]}>
                    <Text style={styles.chipText}>{chips[3]}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.container, style]}>
        {mainContent}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.container, style]}>{mainContent}</View>;
};

interface Styles {
  container: ViewStyle;
  textContainer: ViewStyle;
  title: TextStyle;
  description: TextStyle;
  chipsContainer: ViewStyle;
  chipRow: ViewStyle;
  chip: ViewStyle;
  chipText: TextStyle;
  rightElementContainer: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Changed to flex-start to allow proper centering
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F5E9CF',
    borderRadius: 16,
    marginVertical: 4,
  },
  textContainer: {
    marginLeft: 8,
    flex: 1,
    justifyContent: 'center', // Center the text content vertically
  },
  title: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
  },
  chipsContainer: {
    gap: 4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    // backgroundColor is now set dynamically via chipBackgrounds prop
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'InterTight-Medium',
    fontWeight: '500',
    color: '#000000',
  },
  description: {
    ...globalTextStyles.bodySmall,
  },
  rightElementContainer: {
    marginLeft: 'auto', // Pushes it to the far right
    paddingLeft: 8, // Some space between text and right element
  },
});

export default ListItem; 