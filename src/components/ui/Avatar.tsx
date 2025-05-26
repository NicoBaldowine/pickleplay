import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

interface AvatarProps {
  uri?: string;
  name?: string;
  icon?: React.ReactNode;
  size?: number;
  style?: ViewStyle;
}

const Avatar: React.FC<AvatarProps> = ({ uri, name, icon, size = 50, style }) => {
  const initials = name && !uri && !icon
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '';

  const avatarSizeStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  // Specific ImageStyle for the Image component
  const imageSpecificStyle: ImageStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const textSizeStyle: TextStyle = {
    fontSize: size / 2.5,
  };

  const iconContainerStyle: ViewStyle = {
    width: size,
    height: size,
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <View style={[styles.container, avatarSizeStyle, style]}>
      {uri ? (
        <Image source={{ uri }} style={[styles.image, imageSpecificStyle]} />
      ) : icon ? (
        <View style={iconContainerStyle}>{icon}</View>
      ) : (
        <Text style={[styles.initials, textSizeStyle]}>{initials}</Text>
      )}
    </View>
  );
};

interface Styles {
  container: ViewStyle;
  image: ImageStyle;
  initials: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    backgroundColor: '#ECD8A5', // Light beige background for initials/icon fallback
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    // Styles for the image are mostly dynamic based on size
  },
  initials: {
    color: '#FFFFFF', // White text for initials
    fontWeight: 'bold',
  },
});

export default Avatar; 