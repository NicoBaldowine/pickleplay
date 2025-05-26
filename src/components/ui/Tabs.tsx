import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { globalTextStyles } from '../../styles/globalStyles';

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  activeTabId: string;
  onTabPress: (tabId: string) => void;
  style?: ViewStyle;
}

const Tabs: React.FC<TabsProps> = ({ items, activeTabId, onTabPress, style }) => {
  if (items.length < 2 || items.length > 3) {
    console.warn('Tabs component is optimized for 2 or 3 items.');
    // Optionally render nothing or a message if item count is not 2 or 3
    // return null;
  }

  return (
    <View style={[styles.container, style]}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.tabItem,
            item.id === activeTabId && styles.activeTabItem,
          ]}
          onPress={() => onTabPress(item.id)}
        >
          <Text style={[styles.tabLabel, item.id === activeTabId && styles.activeTabLabel]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

interface Styles {
  container: ViewStyle;
  tabItem: ViewStyle;
  activeTabItem: ViewStyle;
  tabLabel: TextStyle;
  activeTabLabel: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#F7EAC9', // Beige background for the whole tab bar
    padding: 4, // Padding around the items
    marginVertical: 4, // Reduced from 8
  },
  tabItem: {
    flex: 1, // Distribute space equally
    paddingVertical: 8, // Reduced from 10
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6, // Slightly rounded corners for individual tabs
  },
  activeTabItem: {
    backgroundColor: '#FFF6E2', // Light cream background for active tab
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabLabel: {
    ...globalTextStyles.body,
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.5)', // Black text with 50% opacity for inactive tabs
  },
  activeTabLabel: {
    ...globalTextStyles.body,
    fontSize: 15,
    color: '#000000', // Black text for active tab
    fontWeight: '600',
  },
});

export default Tabs; 