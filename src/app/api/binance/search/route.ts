import { NextRequest, NextResponse } from 'next/server';
import { searchSymbols } from '@/lib/binance';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchSymbols(query);
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: 'Search failed', results: [] },
      { status: 500 }
    );
  }
}
