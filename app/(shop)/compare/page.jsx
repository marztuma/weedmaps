import { getProductsByIds } from '@/db/queries';
import ProductComparison from '@/components/ProductComparison';
import { canonical } from '@/lib/seo';

export const revalidate = 3600;
export const metadata = {
  title: 'Compare Products - Weedmaps',
  description: 'Compare cannabis products side-by-side to find the best options for your needs.',
  alternates: canonical('/compare'),
};

export default async function ComparePage({ searchParams }) {
  let products = [];

  if (searchParams.ids) {
    const ids = searchParams.ids
      .split(',')
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id))
      .slice(0, 4); // Max 4 products

    products = await getProductsByIds(ids);
  }

  return (
    <div>
      <ProductComparison products={products} />
    </div>
  );
}
