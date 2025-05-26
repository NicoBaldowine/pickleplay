import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import Avatar from './Avatar'; // Assuming Avatar.tsx is in the same directory
import { globalTextStyles, withGlobalFont } from '../../styles/globalStyles';

interface ListItemProps {
  title: string;
  description?: string;
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
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      {rightElement && (
        <TouchableOpacity onPress={onRightElementPress} style={styles.rightElementContainer} disabled={!onRightElementPress}>
          {rightElement}
        </TouchableOpacity>
      )}
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
  rightElementContainer: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F7EAC9',
    borderRadius: 12,
    marginVertical: 4,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1, // Allows text to take remaining space
  },
  title: {
    ...globalTextStyles.semiBold,
    fontSize: 16,
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