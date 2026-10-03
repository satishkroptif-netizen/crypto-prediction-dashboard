import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { searchSymbolsLocal, SearchResult } from '../services/api';

interface SearchBarProps {
  onSelect: (symbol: string) => void;
}

export default function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    const timer = setTimeout(() => {
      const data = searchSymbolsLocal(query);
      setResults(data);
      setIsOpen(data.length > 0);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (symbol: string) => {
    const baseAsset = symbol.replace('USDT', '');
    onSelect(baseAsset);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="Search any coin..."
          placeholderTextColor="#6b7280"
          value={query}
          onChangeText={setQuery}
        />
      </View>
      {isOpen && results.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.symbol}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item.symbol)}>
                <Text style={styles.resultSymbol}>{item.baseAsset}</Text>
                <Text style={styles.resultQuote}>/{item.quoteAsset}</Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    maxHeight: 300,
    zIndex: 100,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  resultSymbol: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultQuote: {
    color: '#6b7280',
    fontSize: 14,
    marginLeft: 4,
  },
});
