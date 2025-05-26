import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CreateTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Create Game</Text>
      <Text style={styles.subtext}>This will open the create game modal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
  },
}); 