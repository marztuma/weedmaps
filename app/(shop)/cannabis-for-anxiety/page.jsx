import LandingPage from '@/components/LandingPage';
import { getProductsByEffect, getUserReviews } from '@/db/queries';
import { canonical } from '@/lib/seo';

export const revalidate = 3600;
export const metadata = {
  title: 'Cannabis for Anxiety - Best Strains & Products | Weedmaps',
  description: 'Discover cannabis products for anxiety relief. Explore calming strains with balanced cannabinoid profiles and terpenes known to reduce stress.',
  alternates: canonical('/cannabis-for-anxiety'),
};

export default async function AnxietyPage() {
  const [products, reviews] = await Promise.all([
    getProductsByEffect('Calm', 12),
    getUserReviews(12),
  ]);

  const title = 'Cannabis for Anxiety';
  const subtitle = 'Find products designed to help you relax and manage stress';

  const introduction = [
    'Anxiety affects millions of people. While cannabis is not a medical treatment, many users report that certain strains and products help them feel calmer and more relaxed.',
    'The relationship between cannabis and anxiety is complex—some people find certain strains helpful, while others find high-THC products increase anxiety. This guide highlights products known for calming effects.',
  ];

  const sections = [
    {
      icon: '🧘',
      heading: 'Cannabis & Anxiety Relief',
      content: [
        'Research suggests that CBD and specific terpenes may help with anxiety. Low-to-moderate THC with balanced CBD content is often preferred by anxiety-conscious consumers.',
        'Strain selection matters: Strains high in limonene and myrcene are often associated with uplifting, calming effects. Individual responses vary widely.',
      ],
    },
    {
      icon: '⚖️',
      heading: 'CBD vs THC for Anxiety',
      content: [
        'CBD: Non-psychoactive and increasingly studied for anxiety. Many find CBD-rich products calming without the "high."',
        'Low-THC options: Products with moderate THC and higher CBD ratios may be easier for anxiety-prone users.',
        'High-THC products: Can sometimes increase anxiety, especially in sensitive individuals. Start low and go slow.',
      ],
    },
    {
      icon: '🌱',
      heading: 'Best Consumption Methods',
      content: [
        'Edibles: Provide steady, long-lasting effects perfect for ongoing anxiety management. Start with a low dose (2-5mg THC).',
        'Tinctures: Offer precise dosing and quick absorption under the tongue.',
        'Vaping: Provides faster onset and easier dose control compared to smoking.',
        'Flower: Try smaller amounts to find your ideal dose.',
      ],
    },
    {
      icon: '💡',
      heading: 'Tips for Anxiety-Conscious Users',
      content: [
        'Start with low doses and increase gradually to find what works for you.',
        'Avoid products very high in THC if you\'re anxiety-prone.',
        'Consider CBD-forward products or balanced CBD:THC ratios.',
        'Combine with mindfulness, exercise, and stress management for best results.',
        'Consider consulting a healthcare provider, especially if using for medical purposes.',
      ],
    },
  ];

  return (
    <LandingPage
      title={title}
      subtitle={subtitle}
      introduction={introduction}
      sections={sections}
      products={products}
      reviews={reviews}
    />
  );
}
