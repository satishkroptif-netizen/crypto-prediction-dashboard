import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Prediction } from '../services/api';

interface PredictionCardProps {
  prediction: Prediction;
  assetName?: string;
  assetIcon?: string;
}

function getVerdictColor(verdict: string): string {
  if (verdict.includes('Strong Buy')) return '#22c55e';
  if (verdict.includes('Buy')) return '#4ade80';
  if (verdict.includes('Strong Sell')) return '#ef4444';
  if (verdict.includes('Sell')) return '#f87171';
  return '#eab308';
}

export default function PredictionCard({ prediction, assetName, assetIcon }: PredictionCardProps) {
  const verdictColor = getVerdictColor(prediction.verdict);

  return (
    <LinearGradient
      colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.assetInfo}>
          {assetIcon && <Text style={styles.icon}>{assetIcon}</Text>}
          <View>
            <Text style={styles.assetName}>{assetName || prediction.symbol}</Text>
            <Text style={styles.price}>${prediction.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
          </View>
        </View>
        <Text style={[styles.change, { color: prediction.priceChange24h >= 0 ? '#22c55e' : '#ef4444' }]}>
          {prediction.priceChange24h >= 0 ? '+' : ''}{prediction.priceChange24h.toFixed(2)}%
        </Text>
      </View>

      <View style={styles.verdictRow}>
        <View style={[styles.verdictBadge, { backgroundColor: verdictColor + '20', borderColor: verdictColor }]}>
          <Text style={[styles.verdictText, { color: verdictColor }]}>{prediction.verdict}</Text>
        </View>
        <View style={styles.confidence}>
          <Text style={styles.confidenceLabel}>Confidence</Text>
          <Text style={styles.confidenceValue}>{prediction.confidence}%</Text>
        </View>
      </View>

      <View style={styles.scoreBar}>
        <View style={[styles.scoreFill, { width: `${((prediction.verdictScore + 1) / 2) * 100}%`, backgroundColor: verdictColor }]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 32,
  },
  assetName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  price: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 2,
  },
  change: {
    fontSize: 16,
    fontWeight: '600',
  },
  verdictRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  verdictBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  verdictText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confidence: {
    alignItems: 'flex-end',
  },
  confidenceLabel: {
    color: '#6b7280',
    fontSize: 12,
  },
  confidenceValue: {
    color: '#60a5fa',
    fontSize: 18,
    fontWeight: '700',
  },
  scoreBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 2,
  },
});
