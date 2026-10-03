import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { FactorScore } from '../services/api';

interface FactorBreakdownProps {
  factors: FactorScore[];
}

export default function FactorBreakdown({ factors }: FactorBreakdownProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Factor Analysis</Text>
      {factors.map((factor, i) => (
        <View key={i} style={styles.factorItem}>
          <View style={styles.factorHeader}>
            <Text style={styles.factorName}>{factor.name}</Text>
            <Text style={[
              styles.factorScore,
              { color: factor.score > 0.1 ? '#22c55e' : factor.score < -0.1 ? '#ef4444' : '#eab308' }
            ]}>
              {factor.score > 0 ? '+' : ''}{factor.score.toFixed(3)}
            </Text>
          </View>
          <View style={styles.scoreBar}>
            <View style={[
              styles.scoreFill,
              {
                width: `${((factor.score + 1) / 2) * 100}%`,
                backgroundColor: factor.score > 0.1 ? '#22c55e' : factor.score < -0.1 ? '#ef4444' : '#eab308',
              }
            ]} />
          </View>
          <Text style={styles.factorDesc}>{factor.description}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  factorItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  factorName: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
  },
  factorScore: {
    fontSize: 14,
    fontWeight: '700',
  },
  scoreBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  scoreFill: {
    height: '100%',
    borderRadius: 2,
  },
  factorDesc: {
    color: '#6b7280',
    fontSize: 12,
  },
});
