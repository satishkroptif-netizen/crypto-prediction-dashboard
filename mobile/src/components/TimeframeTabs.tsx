import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Timeframe = '15m' | '1h' | '4h' | '1d';

interface TimeframeTabsProps {
  active: Timeframe;
  onChange: (tf: Timeframe) => void;
}

const TIMEFRAMES: { key: Timeframe; label: string }[] = [
  { key: '15m', label: '15m' },
  { key: '1h', label: '1H' },
  { key: '4h', label: '4H' },
  { key: '1d', label: '1D' },
];

export default function TimeframeTabs({ active, onChange }: TimeframeTabsProps) {
  return (
    <View style={styles.container}>
      {TIMEFRAMES.map((tf) => (
        <TouchableOpacity
          key={tf.key}
          style={[styles.tab, active === tf.key && styles.activeTab]}
          onPress={() => onChange(tf.key)}
        >
          <Text style={[styles.tabText, active === tf.key && styles.activeTabText]}>
            {tf.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
});
