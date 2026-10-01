import LandingPage from '@/components/LandingPage';
import { canonical } from '@/lib/seo';

export const revalidate = 3600;
export const metadata = {
  title: 'Cannabis for Sleep - Best Strains & Products | Weedmaps',
  description: 'Find the best cannabis products for sleep. Explore relaxing strains, edibles, and concentrates designed to help you rest better.',
  alternates: canonical('/cannabis-for-sleep'),
};

export default async function SleepPage() {
  const products = [];

  const title = 'Cannabis for Sleep';
  const subtitle = 'Find the perfect product to help you rest and recover';

  const introduction = [
    'Quality sleep is essential for health and well-being. Many people use cannabis to support better sleep through relaxation and stress relief.',
    'Our sleep-focused product selection features strains and edibles known for their calming, sedative properties. Whether you\'re looking for flower, edibles, or concentrates, we\'ve got options to help you wind down.',
  ];

  const sections = [
    {
      icon: '😴',
      heading: 'How Cannabis Supports Sleep',
      content: [
        'Cannabis can promote relaxation and reduce racing thoughts that keep you awake. Many users report that certain strains help them fall asleep faster and stay asleep longer.',
        'The effects vary by individual and strain. Indica-dominant strains are traditionally associated with relaxing effects, though modern cannabis is more complex—terpene profiles and individual cannabinoid ratios matter significantly.',
      ],
    },
    {
      icon: '🌙',
      heading: 'Best Products for Sleep',
      content: [
        'Edibles: Gummies and other edibles provide long-lasting effects, making them ideal for all-night sleep support. Effects typically last 6-8 hours.',
        'Flower: Smoking or vaping relaxing strains provides quick onset and easy dose control.',
        'Concentrates: Dabs and vape cartridges offer fast, potent effects with minimal inhalation.',
      ],
    },
    {
      icon: '⏰',
      heading: 'Timing & Tips',
      content: [
        'Take edibles 1-2 hours before bed to allow time for effects to set in.',
        'For flower and concentrates, use 30-60 minutes before sleep.',
        'Start with a lower dose if you\'re new to cannabis—effects can be stronger at night.',
        'Consider pairing with relaxation techniques like deep breathing or meditation for best results.',
      ],
    },
    {
      icon: '🛡️',
      heading: 'Sleep Hygiene Matters',
      content: [
        'Cannabis works best when combined with good sleep habits: consistent bedtime, cool dark room, and limiting screens.',
        'If sleep issues persist despite cannabis use, consider consulting a healthcare provider.',
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
    />
  );
}
