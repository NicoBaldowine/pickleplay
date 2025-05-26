import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { globalTextStyles, withGlobalFont } from '../../styles/globalStyles';

interface TopBarProps {
  title: string;
  description?: string;
  avatar?: {
    initials: string;
    onPress?: () => void;
  };
  leftIcon?: React.ReactNode;
  onLeftIconPress?: () => void;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  style?: ViewStyle; // Overall container style
  titleContainerStyle?: ViewStyle;
}

const TopBar: React.FC<TopBarProps> = ({
  title,
  description,
  avatar,
  leftIcon,
  onLeftIconPress,
  rightIcon,
  onRightIconPress,
  style,
  titleContainerStyle,
}) => {
  return (
    <View style={[styles.containerBase, style]}>
      <View style={[styles.leftSection, !leftIcon && styles.sectionEmpty]}>
        {leftIcon && (
          <TouchableOpacity onPress={onLeftIconPress} style={styles.iconButton} disabled={!onLeftIconPress}>
            {leftIcon}
          </TouchableOpacity>
        )}
      </View>
      <View style={[styles.titleContainerBase, titleContainerStyle]}>
        <Text style={styles.titleText}>{title}</Text>
        {description && <Text style={styles.descriptionText}>{description}</Text>}
      </View>
      <View style={[styles.rightSection, !rightIcon && styles.sectionEmpty]}>
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.iconButton} disabled={!onRightIconPress}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {avatar && (
        <TouchableOpacity style={styles.avatarContainer} onPress={avatar.onPress}>
          <Text style={styles.avatarText}>{avatar.initials}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface Styles {
  containerBase: ViewStyle;
  leftSection: ViewStyle;
  rightSection: ViewStyle;
  sectionEmpty: ViewStyle;
  titleContainerBase: ViewStyle;
  titleText: TextStyle;
  descriptionText: TextStyle;
  iconButton: ViewStyle;
  avatarContainer: ViewStyle;
  avatarText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  containerBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FEF2D6',
    width: '100%',
  },
  leftSection: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  sectionEmpty: {
     width: 0, // Ensure empty sections don't take up unintended space
     minWidth:0,
     paddingLeft:0,
     paddingRight:0,
     marginLeft:0,
     marginRight:0,
  },
  titleContainerBase: {
    flex: 1,
    alignItems: 'flex-start',
  },
  titleText: {
    ...globalTextStyles.h2,
    textAlign: 'left',
    marginBottom: 2,
  },
  descriptionText: {
    ...globalTextStyles.bodySmall,
    marginTop: 0,
    textAlign: 'left',
  },
  iconButton: {
    padding: 8,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  avatarText: {
    ...withGlobalFont({
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    }),
  },
});

export default TopBar; 