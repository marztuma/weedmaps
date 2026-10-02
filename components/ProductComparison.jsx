'use client';

import Link from 'next/link';
import { Stars } from './Stars';
import { Icons } from './Icons';

export default function ProductComparison({ products = [] }) {
  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">No Products to Compare</h1>
          <p className="text-gray-600 mb-6">
            Visit product pages and click "Compare" to add items here.
          </p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-orange text-white rounded-full hover:opacity-90 transition-opacity"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const maxCols = Math.min(products.length, 4);
  const colWidth = 100 / (maxCols + 1); // +1 for label column

  // Shared attributes across all products
  const attributes = [
    { key: 'type', label: 'Type', format: (p) => p.type },
    { key: 'weight', label: 'Weight', format: (p) => p.weight },
    { key: 'thc', label: 'THC', format: (p) => `${p.thc}%` },
    { key: 'cbd', label: 'CBD', format: (p) => p.cbd ? `${p.cbd}%` : '—' },
    { key: 'rating', label: 'Rating', format: (p) => p.rating ? `${p.rating}⭐ (${p.reviewCount})` : '—' },
    { key: 'effects', label: 'Effects', format: (p) => p.effects?.slice(0, 3).join(', ') || '—' },
    { key: 'flavors', label: 'Flavors', format: (p) => p.flavors?.slice(0, 3).join(', ') || '—' },
    { key: 'terpenes', label: 'Terpenes', format: (p) => p.terpenes?.slice(0, 3).join(', ') || '—' },
    { key: 'price', label: 'Price', format: (p) => `$${p.price?.toFixed(2)}` },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Compare Products</h1>
          <p className="text-gray-600">Side-by-side comparison of {products.length} product{products.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Horizontal scroll comparison table */}
        <div className="overflow-x-auto">
          <div className="inline-block w-full min-w-min">
            {/* Headers */}
            <div className="flex border-b">
              <div style={{ width: `${colWidth}%` }} className="font-semibold p-4 bg-gray-50 sticky left-0 z-10">
                Comparison
              </div>
              {products.map((product) => (
                <div
                  key={product.id}
                  style={{ width: `${colWidth}%` }}
                  className="p-4 border-l bg-white"
                >
                  {product.image?.cloudId && (
                    <div className="mb-3">
                      <img
                        src={`https://res.cloudinary.com/weedmaps/image/fetch/w_150,h_200,c_fill/${product.image.cloudId}`}
                        alt={product.name}
                        className="w-full rounded-lg object-cover"
                      />
                    </div>
                  )}
                  <h3 className="font-bold text-base mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-orange">${product.price?.toFixed(2)}</span>
                  </div>
                  <Link
                    href={`/product/${product.slug}`}
                    className="block w-full text-center py-2 bg-orange text-white text-sm rounded-full hover:opacity-90 transition-opacity"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>

            {/* Rows */}
            {attributes.map((attr) => (
              <div key={attr.key} className="flex border-b hover:bg-orange/5 transition-colors">
                <div
                  style={{ width: `${colWidth}%` }}
                  className="font-medium p-4 bg-gray-50 sticky left-0 z-10 text-sm"
                >
                  {attr.label}
                </div>
                {products.map((product) => (
                  <div
                    key={`${product.id}-${attr.key}`}
                    style={{ width: `${colWidth}%` }}
                    className="p-4 border-l text-sm"
                  >
                    {attr.format(product)}
                  </div>
                ))}
              </div>
            ))}

            {/* Add to cart row */}
            <div className="flex border-t-2 border-orange">
              <div
                style={{ width: `${colWidth}%` }}
                className="font-medium p-4 bg-gray-50 sticky left-0 z-10 text-sm"
              >
                Add to Cart
              </div>
              {products.map((product) => (
                <div
                  key={`cart-${product.id}`}
                  style={{ width: `${colWidth}%` }}
                  className="p-4 border-l"
                >
                  <Link
                    href={`/product/${product.slug}`}
                    className="block text-center py-2 px-3 bg-orange text-white text-sm rounded-full hover:opacity-90 transition-opacity"
                  >
                    Buy Now
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-12 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-6">Comparison Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Understanding THC & CBD</h3>
              <p className="text-gray-600 text-sm">
                THC is the psychoactive compound that creates the "high." CBD is non-intoxicating and may have wellness benefits.
                Beginners typically start with lower THC percentages (under 10%), while experienced users may prefer higher potency.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Effects & Flavors</h3>
              <p className="text-gray-600 text-sm">
                Effects vary by individual and can be influenced by dosage, consumption method, and personal tolerance.
                Flavors are determined by the strain's terpene profile and can affect both taste and effects.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
