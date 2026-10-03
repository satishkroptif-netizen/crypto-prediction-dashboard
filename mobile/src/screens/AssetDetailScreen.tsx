import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AssetData, DEFAULT_ASSETS, fetchPrediction, getApiPair } from '../services/api';
import TradingViewChart from '../components/TradingViewChart';
import TimeframeTabs from '../components/TimeframeTabs';
import FactorBreakdown from '../components/FactorBreakdown';
import SearchBar from '../components/SearchBar';

type Timeframe = '15m' | '1h' | '4h' | '1d';

export default function AssetDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const symbol = route.params?.symbol?.toUpperCase() || 'BTC';

  const [data, setData] = useState<AssetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Timeframe>('1h');

  const asset = DEFAULT_ASSETS.find((a) => a.symbol === symbol);
  const apiPair = getApiPair(symbol);
  const isCommodity = ['GOLD', 'SILVER', 'WTI', 'XAU', 'XAG'].includes(symbol);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPrediction(apiPair, activeTab);
      setData(result);
    } catch (e) {
      setError('Failed to load asset data. Please try again.');
    }
    setLoading(false);
  }, [apiPair, activeTab]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getVerdictColor = (verdict: string) => {
    if (verdict.includes('Strong Buy')) return '#22c55e';
    if (verdict.includes('Buy')) return '#4ade80';
    if (verdict.includes('Strong Sell')) return '#ef4444';
    if (verdict.includes('Sell')) return '#f87171';
    return '#eab308';
  };

  return (
    <LinearGradient colors={['#0a0a0f', '#0a0a0f']} style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <SearchBar onSelect={(sym) => navigation.push('AssetDetail', { symbol: sym })} />
          </View>

          <View style={styles.assetHeader}>
            <View style={styles.assetTitle}>
              {asset && <Text style={styles.assetIcon}>{asset.icon}</Text>}
              <View>
                <Text style={styles.assetName}>{asset?.name || symbol}</Text>
                <Text style={styles.assetSymbol}>{symbol}/USDT</Text>
              </View>
            </View>
            {isCommodity && (
              <View style={styles.commodityBadge}>
                <Text style={styles.commodityText}>Commodity</Text>
              </View>
            )}
          </View>

          {data && (
            <View style={styles.priceContainer}>
              <Text style={styles.price}>
                ${data.prediction.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </Text>
              <Text style={[
                styles.change,
                { color: data.prediction.priceChange24h >= 0 ? '#22c55e' : '#ef4444' }
              ]}>
                {data.prediction.priceChange24h >= 0 ? '+' : ''}{data.prediction.priceChange24h.toFixed(2)}%
              </Text>
            </View>
          )}
        </View>

        {/* Timeframe Tabs */}
        <View style={styles.timeframeContainer}>
          <TimeframeTabs active={activeTab} onChange={setActiveTab} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Analyzing {symbol}...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : data ? (
          <>
            {/* Prediction Cards */}
            <View style={styles.cardsContainer}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                style={styles.card}
              >
                <Text style={styles.cardLabel}>Verdict</Text>
                <Text style={[styles.cardValue, { color: getVerdictColor(data.prediction.verdict) }]}>
                  {data.prediction.verdict}
                </Text>
                <View style={styles.scoreBar}>
                  <View style={[
                    styles.scoreFill,
                    {
                      width: `${((data.prediction.verdictScore + 1) / 2) * 100}%`,
                      backgroundColor: getVerdictColor(data.prediction.verdict),
                    }
                  ]} />
                </View>
              </LinearGradient>

              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                style={styles.card}
              >
                <Text style={styles.cardLabel}>Confidence</Text>
                <Text style={[styles.cardValue, { color: '#60a5fa' }]}>
                  {data.prediction.confidence}%
                </Text>
                <View style={styles.scoreBar}>
                  <View style={[styles.scoreFill, { width: `${data.prediction.confidence}%`, backgroundColor: '#3b82f6' }]} />
                </View>
              </LinearGradient>

              {data.fearGreed && (
                <LinearGradient
                  colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                  style={styles.card}
                >
                  <Text style={styles.cardLabel}>Market Sentiment</Text>
                  <Text style={[
                    styles.cardValue,
                    { color: data.fearGreed.value < 30 ? '#ef4444' : data.fearGreed.value > 70 ? '#22c55e' : '#eab308' }
                  ]}>
                    {data.fearGreed.value} - {data.fearGreed.classification}
                  </Text>
                </LinearGradient>
              )}
            </View>

            {/* TradingView Chart */}
            <View style={styles.chartContainer}>
              <Text style={styles.sectionTitle}>Price Chart</Text>
              <TradingViewChart symbol={symbol} height={300} />
            </View>

            {/* Factor Breakdown */}
            <View style={styles.factorContainer}>
              <FactorBreakdown factors={data.prediction.factors} />
            </View>

            {/* Top Factors */}
            <View style={styles.topFactorsContainer}>
              <Text style={styles.sectionTitle}>Top 3 Factors</Text>
              {data.prediction.topFactors.map((factor, i) => (
                <View key={i} style={styles.topFactorItem}>
                  <View style={styles.topFactorRank}>
                    <Text style={styles.topFactorRankText}>#{i + 1}</Text>
                  </View>
                  <View style={styles.topFactorInfo}>
                    <Text style={styles.topFactorName}>{factor.name}</Text>
                    <Text style={styles.topFactorDesc}>{factor.description}</Text>
                  </View>
                  <Text style={[
                    styles.topFactorScore,
                    { color: factor.score > 0 ? '#22c55e' : '#ef4444' }
                  ]}>
                    {factor.score > 0 ? '+' : ''}{factor.score.toFixed(3)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backButton: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assetTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  assetIcon: {
    fontSize: 40,
  },
  assetName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  assetSymbol: {
    color: '#9ca3af',
    fontSize: 14,
  },
  commodityBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  commodityText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  price: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  change: {
    fontSize: 18,
    fontWeight: '600',
  },
  timeframeContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
  },
  errorContainer: {
    padding: 60,
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  cardsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardLabel: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
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
  chartContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  factorContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  topFactorsContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
    paddingBottom: 100,
  },
  topFactorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  topFactorRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topFactorRankText: {
    color: '#60a5fa',
    fontWeight: '700',
  },
  topFactorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  topFactorName: {
    color: '#e5e7eb',
    fontWeight: '600',
  },
  topFactorDesc: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
  topFactorScore: {
    fontSize: 16,
    fontWeight: '700',
  },
});
