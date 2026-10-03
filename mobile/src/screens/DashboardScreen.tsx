import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Prediction, DEFAULT_ASSETS, fetchPrediction, fetchFearGreed, FearGreedData, getApiPair } from '../services/api';
import PredictionCard from '../components/PredictionCard';
import SearchBar from '../components/SearchBar';
import TimeframeTabs from '../components/TimeframeTabs';

type Timeframe = '15m' | '1h' | '4h' | '1d';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('1h');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fng = await fetchFearGreed();
      setFearGreed(fng);

      const allPredictions: Prediction[] = [];
      await Promise.all(
        DEFAULT_ASSETS.map(async (asset) => {
          try {
            const apiPair = getApiPair(asset.symbol);
            const data = await fetchPrediction(apiPair, activeTimeframe);
            allPredictions.push(data.prediction);
          } catch (e) {
            console.error(`Failed to fetch ${asset.symbol}:`, e);
          }
        })
      );
      setPredictions(allPredictions);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    }
    setLoading(false);
  }, [activeTimeframe]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSearch = (symbol: string) => {
    navigation.navigate('AssetDetail', { symbol });
  };

  return (
    <LinearGradient colors={['#0a0a0f', '#0a0a0f']} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.logo}>◆ PredictChain</Text>
            <SearchBar onSelect={handleSearch} />
          </View>
          {fearGreed && (
            <View style={styles.fngBanner}>
              <Text style={styles.fngLabel}>Fear & Greed:</Text>
              <Text style={[
                styles.fngValue,
                { color: fearGreed.value < 30 ? '#ef4444' : fearGreed.value > 70 ? '#22c55e' : '#eab308' }
              ]}>
                {fearGreed.value}
              </Text>
              <Text style={styles.fngClass}>({fearGreed.classification})</Text>
            </View>
          )}
        </View>

        {/* Timeframe Tabs */}
        <View style={styles.timeframeContainer}>
          <TimeframeTabs active={activeTimeframe} onChange={setActiveTimeframe} />
        </View>

        {/* Predictions */}
        <View style={styles.predictionsContainer}>
          <Text style={styles.sectionTitle}>Market Predictions</Text>
          {loading && predictions.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Analyzing market data...</Text>
            </View>
          ) : (
            predictions.map((pred) => {
              const asset = DEFAULT_ASSETS.find((a) => a.symbol === pred.symbol);
              return (
                <TouchableOpacity
                  key={`${pred.symbol}-${pred.timeframe}`}
                  onPress={() => navigation.navigate('AssetDetail', { symbol: pred.symbol })}
                >
                  <PredictionCard
                    prediction={pred}
                    assetName={asset?.name}
                    assetIcon={asset?.icon}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </View>
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
    marginBottom: 12,
  },
  logo: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  fngBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  fngLabel: {
    color: '#9ca3af',
    fontSize: 14,
  },
  fngValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  fngClass: {
    color: '#6b7280',
    fontSize: 14,
  },
  timeframeContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  predictionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
  },
});
