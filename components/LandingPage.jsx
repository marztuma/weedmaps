import Link from 'next/link';
import ProductCard from './ProductCard';
import Reviews from './Reviews';

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
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-b from-orange/10 via-purple/5 to-white py-16 px-4">
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
                  <p key={i} className="text-gray-700 mb-4 leading-relaxed">
                    {para}
                  </p>
                ))
              ) : (
                <p className="text-gray-700 mb-4 leading-relaxed">{introduction}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Info Sections */}
      {sections && sections.length > 0 && (
        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto space-y-12">
            {sections.map((section, i) => (
              <div key={i} className="bg-white rounded-lg p-8 border border-gray-200">
                <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                  <span className="text-4xl">{section.icon}</span>
                  {section.heading}
                </h2>
                <div className="space-y-3">
                  {Array.isArray(section.content) ? (
                    section.content.map((para, j) => (
                      <p key={j} className="text-gray-700 leading-relaxed">
                        {para}
                      </p>
                    ))
                  ) : (
                    <p className="text-gray-700 leading-relaxed">{section.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      {products.length > 0 && (
        <section className="py-16 px-4 bg-white">
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

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">What Customers Say</h2>
            <Reviews reviews={reviews} />
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-orange/10 to-purple/10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to find your perfect product?</h2>
          <p className="text-lg text-gray-600 mb-8">Take our strain quiz or browse our full selection.</p>
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
