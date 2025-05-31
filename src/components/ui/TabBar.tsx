import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ViewStyle, TextStyle } from 'react-native';

export interface TabBarItemType {
  id: string;
  label: string;
  icon: (isActive: boolean) => React.ReactNode; // Function that returns a node, receives active state
}

interface TabBarProps {
  items: TabBarItemType[];
  activeTabId: string;
  onTabPress: (tabId: string) => void;
  style?: ViewStyle;
  safeAreaStyle?: ViewStyle;
  activeItemStyle?: ViewStyle; // Optional style for the active TouchableOpacity item
}

const TabBar: React.FC<TabBarProps> = ({ items, activeTabId, onTabPress, style, safeAreaStyle, activeItemStyle }) => {
  if (items.length !== 5) {
    console.warn('TabBar component is designed for exactly 5 items.');
    // return null; // Optionally hide if not 5 items
  }

  return (
    <SafeAreaView style={[styles.safeArea, safeAreaStyle]}>
      <View style={[styles.container, style]}>
        {items.map((item) => {
          const isActive = item.id === activeTabId;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.tabItem, isActive && styles.activeTabItem, isActive && activeItemStyle]}
              onPress={() => onTabPress(item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={item.label}
            >
              <View style={[styles.iconContainer, isActive ? styles.activeIconContainer : styles.inactiveIconContainer]}>
                {item.icon(isActive)}
              </View>
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

interface Styles {
  safeArea: ViewStyle;
  container: ViewStyle;
  tabItem: ViewStyle;
  activeTabItem: ViewStyle;
  iconContainer: ViewStyle;
  activeIconContainer: ViewStyle;
  inactiveIconContainer: ViewStyle;
  tabLabel: TextStyle;
  activeTabLabel: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  safeArea: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  container: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  activeTabItem: {
    // Style for active item wrapper if needed
  },
  iconContainer: {
    marginBottom: 4,
    borderWidth: 2,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    borderColor: '#000000',
    opacity: 1,
  },
  inactiveIconContainer: {
    borderColor: '#000000',
    opacity: 0.4,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
    opacity: 0.4,
  },
  activeTabLabel: {
    color: '#000000',
    opacity: 1,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
  },
});

export default TabBar; 