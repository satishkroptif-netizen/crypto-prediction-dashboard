import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AboutScreen() {
  return (
    <LinearGradient colors={['#0a0a0f', '#0a0a0f']} style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>About PredictChain</Text>
          <Text style={styles.subtitle}>AI-Powered Market Predictions</Text>
        </View>

        <View style={styles.content}>
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>What is PredictChain?</Text>
            <Text style={styles.cardText}>
              PredictChain is an AI-powered market prediction platform that uses multi-factor analysis
              to provide real-time price predictions for cryptocurrencies and commodities.
            </Text>
          </LinearGradient>

          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>How It Works</Text>
            <Text style={styles.cardText}>
              Our algorithm analyzes 9 different factors including technical trends, taker flow,
              liquidations, long/short ratios, open interest, fear & greed index, news sentiment,
              whale activity, and macro indicators.
            </Text>
          </LinearGradient>

          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>Supported Assets</Text>
            <Text style={styles.cardText}>
              • Bitcoin (BTC){'\n'}
              • Ethereum (ETH){'\n'}
              • Gold (XAU){'\n'}
              • Silver (XAG){'\n'}
              • WTI Crude Oil
            </Text>
          </LinearGradient>

          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>Data Sources</Text>
            <Text style={styles.cardText}>
              • Binance API (Price & Futures Data){'\n'}
              • Alternative.me (Fear & Greed Index){'\n'}
              • CoinGecko (Fallback Price Data){'\n'}
              • Gold API (Commodity Prices)
            </Text>
          </LinearGradient>

          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>Disclaimer</Text>
            <Text style={styles.cardText}>
              PredictChain is for informational purposes only. Cryptocurrency and commodity trading
              involves substantial risk of loss. Past performance is not indicative of future results.
              Always do your own research before making investment decisions.
            </Text>
          </LinearGradient>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Linking.openURL('https://github.com/satishkroptif-netizen/crypto-prediction-dashboard')}
          >
            <Text style={styles.linkText}>View on GitHub</Text>
          </TouchableOpacity>
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
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardText: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 20,
  },
  linkButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  linkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
