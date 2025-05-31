import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

// Import custom components
import TopBar from '../components/ui/TopBar';

// Import colors
import { COLORS } from '../constants/colors';

interface ManageNotificationsScreenProps {
  onBack: () => void;
}

const ManageNotificationsScreen: React.FC<ManageNotificationsScreenProps> = ({ onBack }) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar barStyle="dark-content" />
      
      <TopBar
        title="Notifications"
        leftIcon={<ArrowLeft size={24} color="#000000" />}
        onLeftIconPress={onBack}
        style={styles.topBar}
        titleContainerStyle={styles.titleContainer}
        titleStyle={styles.titleStyle}
      />

      <View style={styles.container}>
        {/* Content will be added later */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  topBar: {
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleStyle: {
    fontSize: 20,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
});

export default ManageNotificationsScreen; 