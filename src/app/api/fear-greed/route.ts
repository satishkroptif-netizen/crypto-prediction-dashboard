import { NextResponse } from 'next/server';

const FEAR_GREED_API = 'https://api.alternative.me/fng/';

export async function GET() {
  try {
    const res = await fetch(FEAR_GREED_API, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error('F&G API error');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch Fear & Greed index' },
      { status: 500 }
    );
  }
}
