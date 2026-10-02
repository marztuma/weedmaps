import Link from 'next/link';
import ProductCard from './ProductCard';

export default function LandingPage({
  title,
  subtitle,
  heroImage,
  introduction,
  sections,
  products = [],
  reviews = [],
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(to bottom, rgba(241, 90, 38, 0.1), rgba(119, 85, 163, 0.05), var(--color-paper))' }} className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h1 className="text-5xl font-bold tracking-tight mb-4">{title}</h1>
          <p className="text-xl text-gray-600 mb-6">{subtitle}</p>
          {heroImage && (
            <div className="mb-8">
              <img src={heroImage} alt={title} className="w-full max-w-2xl mx-auto rounded-lg" />
            </div>
          )}
        </div>
      </div>

      {/* Introduction */}
      {introduction && (
        <section className="py-12 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="prose prose-lg">
              {Array.isArray(introduction) ? (
                introduction.map((para, i) => (
                  <p key={i} className="mb-4 leading-relaxed" style={{ color: 'var(--color-shade)' }}>
                    {para}
                  </p>
                ))
              ) : (
                <p className="mb-4 leading-relaxed" style={{ color: 'var(--color-shade)' }}>{introduction}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Info Sections */}
      {sections && sections.length > 0 && (
        <section className="py-12 px-4" style={{ backgroundColor: 'var(--color-linen)' }}>
          <div className="max-w-4xl mx-auto space-y-12">
            {sections.map((section, i) => (
              <div key={i} className="rounded-lg p-8" style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-rule)', borderWidth: '1px' }}>
                <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                  <span className="text-4xl">{section.icon}</span>
                  {section.heading}
                </h2>
                <div className="space-y-3">
                  {Array.isArray(section.content) ? (
                    section.content.map((para, j) => (
                      <p key={j} style={{ color: 'var(--color-shade)' }} className="leading-relaxed">
                        {para}
                      </p>
                    ))
                  ) : (
                    <p style={{ color: 'var(--color-shade)' }} className="leading-relaxed">{section.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      {products.length > 0 && (
        <section className="py-16 px-4" style={{ backgroundColor: 'var(--color-paper)' }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">Recommended Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.id} className="flex">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews - Removed to fix rendering issue */}

      {/* CTA */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(to right, rgba(241, 90, 38, 0.1), rgba(119, 85, 163, 0.1))' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to find your perfect product?</h2>
          <p className="text-lg mb-8" style={{ color: 'var(--color-shade)' }}>Take our strain quiz or browse our full selection.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/strain-quiz"
              className="px-8 py-3 bg-orange text-white rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Take the Quiz
            </Link>
            <Link
              href="/products"
              className="px-8 py-3 border-2 border-orange text-orange rounded-full font-medium hover:bg-orange/5 transition-colors"
            >
              Browse All
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
