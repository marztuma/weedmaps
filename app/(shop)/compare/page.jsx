import { getProductsByIds } from '@/db/queries';
import ProductComparison from '@/components/ProductComparison';
import { canonical } from '@/lib/seo';

export const revalidate = 300; // ISR: revalidate every 5 minutes
export const metadata = {
  title: 'Compare Products - Weedmaps',
  description: 'Compare cannabis products side-by-side to find the best options for your needs.',
  alternates: canonical('/compare'),
};

export default async function ComparePage({ searchParams }) {
  let products = [];

  try {
    if (searchParams?.ids) {
      const ids = (searchParams.ids)
        .split(',')
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id))
        .slice(0, 2); // Reduce to 2 products to avoid timeout

      products = await getProductsByIds(ids);
    }
  } catch (error) {
    console.error('Compare page error:', error);
    // Return empty products on error to show fallback UI
  }

  return (
    <div>
      <ProductComparison products={products} />
    </div>
  );
}
