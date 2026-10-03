import { Timeframe } from './types';

// Timeframe weight configurations
// Each factor's weight determines its influence on the final verdict
// Weights should sum to ~1.0 per timeframe

export const TIMEFRAME_WEIGHTS: Record<Timeframe, Record<string, number>> = {
  '15m': {
    technical: 0.25,
    takerFlow: 0.30,
    liquidations: 0.15,
    longShortRatio: 0.10,
    openInterest: 0.10,
    fearGreed: 0.05,
    newsSentiment: 0.05,
  },
  '1h': {
    technical: 0.25,
    takerFlow: 0.25,
    liquidations: 0.15,
    longShortRatio: 0.10,
    openInterest: 0.10,
    fearGreed: 0.10,
    newsSentiment: 0.05,
  },
  '4h': {
    technical: 0.25,
    openInterest: 0.15,
    macro: 0.15,
    fearGreed: 0.15,
    longShortRatio: 0.10,
    takerFlow: 0.10,
    newsSentiment: 0.10,
  },
  '1d': {
    macro: 0.25,
    technical: 0.20,
    fearGreed: 0.15,
    openInterest: 0.15,
    whaleActivity: 0.10,
    newsSentiment: 0.10,
    longShortRatio: 0.05,
  },
};

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  '15m': '15 Minutes',
  '1h': '1 Hour',
  '4h': '4 Hours',
  '1d': '1 Day+',
};

export const ALL_TIMEFRAMES: Timeframe[] = ['15m', '1h', '4h', '1d'];
