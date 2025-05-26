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
              <View style={styles.iconContainer}>{item.icon(isActive)}</View>
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
  activeTabItem: ViewStyle; // Style for the active item wrapper
  iconContainer: ViewStyle;
  tabLabel: TextStyle;
  activeTabLabel: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  safeArea: {
    backgroundColor: '#FFFFFF', // Default background, can be overridden
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  container: {
    flexDirection: 'row',
    height: 60, // Standard tab bar height
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF', // Can be overridden by prop
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  activeTabItem: { // Subtle style for active item, e.g., slightly different background or border
    // Example: backgroundColor: '#F0F0F0', // A very light gray for active pressed state
    // borderRadius: 8, // if you want a more contained look for the active tab
  },
  iconContainer: {
    marginBottom: 2, // Space between icon and label
  },
  tabLabel: {
    fontSize: 10,
    color: '#8E8E93', // Default inactive label color (iOS style gray)
  },
  activeTabLabel: {
    color: '#007AFF', // Default active label color (iOS style blue)
    fontWeight: '500',
  },
});

export default TabBar; 