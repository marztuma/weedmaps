import { getShelf, getProductsByIds } from '@/db/queries';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const ids = url.searchParams.get('ids');

    if (type === 'shelves') {
      // Return 3 shelves: flower, vape, edibles (6 items each)
      const [flower, vape, edibles] = await Promise.all([
        getShelf('flower', 6),
        getShelf('vape', 6),
        getShelf('edibles', 6),
      ]);

      return NextResponse.json({
        flower,
        vape,
        edibles,
      });
    }

    if (type === 'compare' && ids) {
      // Return specific products by ID
      const idArray = ids
        .split(',')
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id))
        .slice(0, 4);

      const products = await getProductsByIds(idArray);
      return NextResponse.json({ products });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
