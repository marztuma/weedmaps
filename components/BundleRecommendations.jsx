'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from './CartContext';

const POPULAR_BUNDLES = [
  {
    id: 'relaxation-bundle',
    name: 'Relaxation Bundle',
    description: 'Wind down with our relaxing trio',
    icon: '🌙',
    categoryFilter: (p) => p.effects?.some(e =>
      ['Relaxed', 'Calm', 'Sleepy'].includes(e)
    ),
    discount: 0.10,
  },
  {
    id: 'energy-bundle',
    name: 'Energy Bundle',
    description: 'Wake up and go with energizing picks',
    icon: '⚡',
    categoryFilter: (p) => p.effects?.some(e =>
      ['Energetic', 'Focused', 'Uplifted'].includes(e)
    ),
    discount: 0.10,
  },
  {
    id: 'social-bundle',
    name: 'Social Hour Bundle',
    description: 'Perfect for hanging with friends',
    icon: '😄',
    categoryFilter: (p) => p.effects?.some(e =>
      ['Happy', 'Euphoric', 'Creative'].includes(e)
    ),
    discount: 0.10,
  },
  {
    id: 'wellness-bundle',
    name: 'Wellness Bundle',
    description: 'Relief-focused selections',
    icon: '🌿',
    categoryFilter: (p) => p.effects?.some(e =>
      ['Pain Relief', 'Calm', 'Focused'].includes(e)
    ),
    discount: 0.10,
  },
];

export default function BundleRecommendations({ products = [], layout = 'grid' }) {
  const { addItem } = useCart();
  const [selectedBundle, setSelectedBundle] = useState(null);

  const generateBundles = () => {
    return POPULAR_BUNDLES.map(bundleTemplate => {
      const bundleProducts = products
        .filter(bundleTemplate.categoryFilter)
        .slice(0, 3);

      if (bundleProducts.length < 3) return null;

      const bundleTotal = bundleProducts.reduce((sum, p) => sum + (p.price || 0), 0);
      const bundlePrice = Math.round(bundleTotal * (1 - bundleTemplate.discount) * 100) / 100;
      const savings = Math.round(bundleTotal - bundlePrice);

      return {
        ...bundleTemplate,
        products: bundleProducts,
        total: bundleTotal,
        price: bundlePrice,
        savings,
      };
    }).filter(Boolean);
  };

  const bundles = generateBundles();

  const handleAddBundle = (bundle) => {
    bundle.products.forEach(product => {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        slug: product.slug,
        quantity: 1,
      });
    });
    setSelectedBundle(bundle.id);
    setTimeout(() => setSelectedBundle(null), 2000);
  };

  if (bundles.length === 0) return null;

  if (layout === 'sidebar') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span>📦</span> Bundle & Save
        </h3>
        <div className="space-y-3">
          {bundles.slice(0, 2).map(bundle => (
            <div key={bundle.id} className="border border-orange/20 rounded-lg p-3 bg-orange/5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{bundle.icon} {bundle.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{bundle.description}</p>
                </div>
              </div>
              <div className="flex items-end justify-between gap-2 mb-3">
                <div>
                  <p className="text-xs text-gray-600 line-through">${bundle.total.toFixed(2)}</p>
                  <p className="text-lg font-bold text-orange">${bundle.price.toFixed(2)}</p>
                  <p className="text-xs text-green-600">Save ${bundle.savings.toFixed(2)}</p>
                </div>
              </div>
              <button
                onClick={() => handleAddBundle(bundle)}
                className={`w-full py-2 px-3 rounded text-sm font-medium transition-all ${
                  selectedBundle === bundle.id
                    ? 'bg-green text-white'
                    : 'bg-orange text-white hover:opacity-90'
                }`}
              >
                {selectedBundle === bundle.id ? '✓ Added!' : 'Add to Cart'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-orange/5 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Bundle & Save Up to 10%</h2>
          <p className="text-gray-600">Curated product combinations designed for your lifestyle</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bundles.map(bundle => (
            <div key={bundle.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Bundle Header */}
              <div className="bg-gradient-to-r from-orange/10 to-orange/5 p-6 border-b">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{bundle.icon}</span>
                  <div>
                    <h3 className="font-bold text-lg">{bundle.name}</h3>
                    <p className="text-sm text-gray-600">{bundle.description}</p>
                  </div>
                </div>
              </div>

              {/* Products Preview */}
              <div className="p-6">
                <div className="space-y-3 mb-6">
                  {bundle.products.map(product => (
                    <Link
                      key={product.id}
                      href={`/product/${product.slug}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {product.image?.cloudId && (
                        <img
                          src={`https://res.cloudinary.com/weedmaps/image/fetch/w_60,h_60,c_fill/${product.image.cloudId}`}
                          alt={product.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-gray-600">{product.brand}</p>
                      </div>
                      <p className="font-semibold text-orange">${product.price}</p>
                    </Link>
                  ))}
                </div>

                {/* Pricing */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="line-through text-gray-600">${bundle.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">Bundle Savings (10%):</span>
                    <span className="text-green-600 font-medium">-${bundle.savings.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-orange">${bundle.price.toFixed(2)}</span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleAddBundle(bundle)}
                  className={`w-full py-3 rounded-full font-semibold transition-all ${
                    selectedBundle === bundle.id
                      ? 'bg-green text-white'
                      : 'bg-orange text-white hover:opacity-90'
                  }`}
                >
                  {selectedBundle === bundle.id ? '✓ Added to Cart!' : 'Add Bundle to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
