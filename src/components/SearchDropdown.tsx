'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

export default function SearchDropdown({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/binance/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
      setIsOpen(true);
    } catch {
      setResults([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const handleSelect = (symbol: string) => {
    const baseAsset = symbol.replace('USDT', '');
    router.push(`/asset/${baseAsset}`);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={wrapperRef} className="search-dropdown">
      <div className="search-input-wrapper">
        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder={compact ? 'Search BTC, ETH, Gold, Oil…' : 'Search any coin on Binance...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
        {isLoading && <div className="search-spinner" />}
      </div>
      {isOpen && results.length > 0 && (
        <div className="search-results">
          {results.map((r) => (
            <button
              key={r.symbol}
              className="search-result-item"
              onClick={() => handleSelect(r.symbol)}
            >
              <span className="result-symbol">{r.baseAsset}</span>
              <span className="result-quote">/{r.quoteAsset}</span>
            </button>
          ))}
        </div>
      )}
      {isOpen && query.length > 0 && results.length === 0 && !isLoading && (
        <div className="search-results">
          <div className="search-no-results">No results found</div>
        </div>
      )}
    </div>
  );
}
