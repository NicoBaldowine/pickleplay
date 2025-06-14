import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

// Import custom components
import TopBar from '../components/ui/TopBar';

// Import colors
import { COLORS } from '../constants/colors';

export interface GameFilters {
  gameTypes: {
    singles: boolean;
    doubles: boolean;
    all: boolean;
  };
  skillLevels: {
    beginner: boolean;
    intermediate: boolean;
    advanced: boolean;
    expert: boolean;
    all: boolean;
  };
  timeFilter: {
    soon: boolean;      // 1-2 hours
    today: boolean;     // within the day
    thisWeek: boolean;  // this week
    all: boolean;       // all times
  };
  radius: number; // in miles
}

interface FilterScreenProps {
  filters: GameFilters;
  onBack: () => void;
  onApplyFilters: (filters: GameFilters) => void;
}

const RADIUS_OPTIONS = [
  { value: 5, label: '5 miles' },
  { value: 10, label: '10 miles' },
  { value: 15, label: '15 miles' },
  { value: 25, label: '25 miles' },
];

const FilterScreen: React.FC<FilterScreenProps> = ({ filters: initialFilters, onBack, onApplyFilters }) => {
  const [filters, setFilters] = useState<GameFilters>(initialFilters);

  // Default filters state
  const defaultFilters: GameFilters = {
    gameTypes: {
      singles: true,
      doubles: true,
      all: true,
    },
    skillLevels: {
      beginner: true,
      intermediate: true,
      advanced: true,
      expert: true,
      all: true,
    },
    timeFilter: {
      soon: true,
      today: true,
      thisWeek: true,
      all: true,
    },
    radius: 25, // default to 25 miles
  };

  const handleGameTypeToggle = (type: 'singles' | 'doubles' | 'all') => {
    if (type === 'all') {
      // Select All, deselect singles and doubles individually
      setFilters(prev => ({
        ...prev,
        gameTypes: {
          singles: true, // All means both are enabled
          doubles: true,
          all: true
        }
      }));
    } else {
      // Select individual type, deselect All
      setFilters(prev => ({
        ...prev,
        gameTypes: {
          singles: type === 'singles',
          doubles: type === 'doubles',
          all: false
        }
      }));
    }
  };

  const handleSkillLevelToggle = (level: keyof GameFilters['skillLevels']) => {
    if (level === 'all') {
      // Toggle All - if All is currently selected, deselect everything, otherwise select all
      const isAllCurrentlySelected = filters.skillLevels.all;
      setFilters(prev => ({
        ...prev,
        skillLevels: {
          beginner: !isAllCurrentlySelected,
          intermediate: !isAllCurrentlySelected,
          advanced: !isAllCurrentlySelected,
          expert: !isAllCurrentlySelected,
          all: !isAllCurrentlySelected
        }
      }));
    } else {
      // Handle individual skill level selection
      if (filters.skillLevels.all) {
        // If "All" is currently selected, deselect "All" and activate ONLY the level clicked
        setFilters(prev => ({
          ...prev,
          skillLevels: {
            beginner: level === 'beginner',
            intermediate: level === 'intermediate', 
            advanced: level === 'advanced',
            expert: level === 'expert',
            all: false
          }
        }));
      } else {
        // Normal toggle behavior when "All" is not selected
        const newSkillLevels = {
          ...filters.skillLevels,
          [level]: !filters.skillLevels[level],
          all: false
        };
        
        // Check if all individual levels are now selected
        const individualLevels = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
        const allIndividualSelected = individualLevels.every(lvl => 
          lvl === level ? !filters.skillLevels[level] : filters.skillLevels[lvl]
        );
        
        if (allIndividualSelected) {
          // If all 4 individual levels are selected, activate "All" instead
          newSkillLevels.beginner = true;
          newSkillLevels.intermediate = true;
          newSkillLevels.advanced = true;
          newSkillLevels.expert = true;
          newSkillLevels.all = true;
        }
        
        setFilters(prev => ({
          ...prev,
          skillLevels: newSkillLevels
        }));
      }
    }
  };

  const handleTimeFilterToggle = (time: keyof GameFilters['timeFilter']) => {
    if (time === 'all') {
      // Toggle All - if All is currently selected, deselect everything, otherwise select all
      const isAllCurrentlySelected = filters.timeFilter.all;
      setFilters(prev => ({
        ...prev,
        timeFilter: {
          soon: !isAllCurrentlySelected,
          today: !isAllCurrentlySelected,
          thisWeek: !isAllCurrentlySelected,
          all: !isAllCurrentlySelected
        }
      }));
    } else {
      // Handle individual time selection
      if (filters.timeFilter.all) {
        // If "All" is currently selected, deselect "All" and activate ONLY the time clicked
        setFilters(prev => ({
          ...prev,
          timeFilter: {
            soon: time === 'soon',
            today: time === 'today',
            thisWeek: time === 'thisWeek',
            all: false
          }
        }));
      } else {
        // Normal toggle behavior when "All" is not selected
        const newTimeFilter = {
          ...filters.timeFilter,
          [time]: !filters.timeFilter[time],
          all: false
        };
        
        // Check if all individual times are now selected
        const individualTimes = ['soon', 'today', 'thisWeek'] as const;
        const allIndividualSelected = individualTimes.every(tm => 
          tm === time ? !filters.timeFilter[time] : filters.timeFilter[tm]
        );
        
        if (allIndividualSelected) {
          // If all 3 individual times are selected, activate "All" instead
          newTimeFilter.soon = true;
          newTimeFilter.today = true;
          newTimeFilter.thisWeek = true;
          newTimeFilter.all = true;
        }
        
        setFilters(prev => ({
          ...prev,
          timeFilter: newTimeFilter
        }));
      }
    }
  };

  const handleRadiusSelect = (radius: number) => {
    setFilters(prev => ({
      ...prev,
      radius
    }));
  };

  const handleReset = () => {
    setFilters(defaultFilters);
  };

  const handleApply = () => {
    // Only apply filters - the wrapper handles navigation
    onApplyFilters(filters);
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderChip = (
    label: string,
    isSelected: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={[
        styles.chip,
        isSelected ? styles.chipSelected : styles.chipDeselected
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.chipText,
        isSelected ? styles.chipTextSelected : styles.chipTextDeselected
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <TopBar
        title="Filters"
        leftIcon={<ArrowLeft size={24} color="#000000" />}
        onLeftIconPress={onBack}
        rightIcon={<Text style={styles.resetButtonText}>Reset</Text>}
        onRightIconPress={handleReset}
        style={styles.topBar}
        titleContainerStyle={styles.titleContainer}
        titleStyle={styles.titleStyle}
      />

      <ScrollView style={styles.scrollContent}>
        {/* Game Type Section */}
        {renderSection('Game type', (
          <View style={styles.chipsContainer}>
            {renderChip(
              'Singles',
              filters.gameTypes.singles && !filters.gameTypes.all,
              () => handleGameTypeToggle('singles')
            )}
            {renderChip(
              'Doubles',
              filters.gameTypes.doubles && !filters.gameTypes.all,
              () => handleGameTypeToggle('doubles')
            )}
            {renderChip(
              'All',
              filters.gameTypes.all,
              () => handleGameTypeToggle('all')
            )}
          </View>
        ))}

        {/* Skill Level Section */}
        {renderSection('Skill level', (
          <View style={styles.chipsContainer}>
            {renderChip(
              'Beginner',
              filters.skillLevels.beginner && !filters.skillLevels.all,
              () => handleSkillLevelToggle('beginner')
            )}
            {renderChip(
              'Intermediate',
              filters.skillLevels.intermediate && !filters.skillLevels.all,
              () => handleSkillLevelToggle('intermediate')
            )}
            {renderChip(
              'Advanced',
              filters.skillLevels.advanced && !filters.skillLevels.all,
              () => handleSkillLevelToggle('advanced')
            )}
            {renderChip(
              'Expert',
              filters.skillLevels.expert && !filters.skillLevels.all,
              () => handleSkillLevelToggle('expert')
            )}
            {renderChip(
              'All',
              filters.skillLevels.all,
              () => handleSkillLevelToggle('all')
            )}
          </View>
        ))}

        {/* Time Filter Section */}
        {renderSection('Time', (
          <View style={styles.chipsContainer}>
            {renderChip(
              'Soon',
              filters.timeFilter.soon && !filters.timeFilter.all,
              () => handleTimeFilterToggle('soon')
            )}
            {renderChip(
              'Today',
              filters.timeFilter.today && !filters.timeFilter.all,
              () => handleTimeFilterToggle('today')
            )}
            {renderChip(
              'This Week',
              filters.timeFilter.thisWeek && !filters.timeFilter.all,
              () => handleTimeFilterToggle('thisWeek')
            )}
            {renderChip(
              'All',
              filters.timeFilter.all,
              () => handleTimeFilterToggle('all')
            )}
          </View>
        ))}

        {/* Distance Section */}
        {renderSection('Distance', (
          <View style={styles.chipsContainer}>
            {RADIUS_OPTIONS.map((option) => (
              <View key={option.value}>
                {renderChip(
                  option.label,
                  filters.radius === option.value,
                  () => handleRadiusSelect(option.value)
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleApply}
        >
          <Text style={styles.applyButtonText}>Apply filters</Text>
        </TouchableOpacity>
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
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 100,
    minWidth: 70,
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: '#000000',
  },
  chipDeselected: {
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  chipTextDeselected: {
    color: '#000000',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  applyButton: {
    backgroundColor: '#000000',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resetButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
  },
});

export default FilterScreen; 