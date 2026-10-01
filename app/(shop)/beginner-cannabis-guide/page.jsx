import LandingPage from '@/components/LandingPage';
import { canonical } from '@/lib/seo';

export const revalidate = 3600;
export const metadata = {
  title: 'Beginner\'s Guide to Cannabis | Weedmaps',
  description: 'New to cannabis? Learn the basics: how to consume, what effects to expect, dosing, strains, and finding the right products for you.',
  alternates: canonical('/beginner-cannabis-guide'),
};

export default async function BeginnerPage() {
  const beginnerProducts = [];

  const title = 'Beginner\'s Guide to Cannabis';
  const subtitle = 'Everything you need to know to start your cannabis journey safely and confidently';

  const introduction = [
    'Cannabis is increasingly legal, but navigating the options can be overwhelming. This guide covers everything a beginner needs to know: consumption methods, effects, dosing, and how to find the right products.',
    'Everyone\'s relationship with cannabis is unique. This guide focuses on helping you make informed choices based on your preferences and comfort level.',
  ];

  const sections = [
    {
      icon: '🌿',
      heading: 'Cannabis Basics',
      content: [
        'Cannabis is a plant containing over 100 different compounds called cannabinoids. The two most well-known are THC and CBD.',
        'THC is the psychoactive compound that produces a "high." CBD is non-intoxicating and may have wellness benefits.',
        'Effects vary significantly between individuals based on genetics, tolerance, dose, and consumption method.',
      ],
    },
    {
      icon: '🍃',
      heading: 'Types of Cannabis Products',
      content: [
        'Flower: Dried cannabis buds. Smoked or vaped. Immediate effects.',
        'Edibles: Infused food products. Longer onset (30 min - 2 hours) but longer duration (6-8 hours).',
        'Concentrates: Highly potent extracts used with special equipment. Very fast onset.',
        'Vape Cartridges: Convenient, discreet, and easy to dose.',
        'Topicals: Creams and lotions applied to skin. Usually non-intoxicating.',
      ],
    },
    {
      icon: '💨',
      heading: 'Consumption Methods Explained',
      content: [
        'Smoking: Roll in a joint, pack in a pipe, or use a bong. Immediate effects (5-15 min), lasting 2-4 hours.',
        'Vaping: Heat cannabis without combustion. Similar timeline to smoking, gentler on lungs.',
        'Edibles: Ingest infused food. Slower onset but longer duration. Better for all-day effects.',
        'Tinctures: Liquid cannabis placed under tongue. Quick absorption, precise dosing.',
      ],
    },
    {
      icon: '📊',
      heading: 'Understanding Dosing',
      content: [
        'Start very low: 1-2mg THC for your first time.',
        'Go slow: Wait at least 2 hours after edibles before taking more.',
        'Individual factors matter: Body weight, metabolism, tolerance, food, and hydration all affect effects.',
        'Remember: You can always take more, but you can\'t take less once consumed.',
      ],
    },
    {
      icon: '🎯',
      heading: 'Choosing the Right Product',
      content: [
        'Consider your experience level: Beginners should stick to lower-THC products.',
        'Think about desired effects: Relaxation, focus, energy, or something else?',
        'Check reviews: See what other customers say about products.',
        'Try the Strain Quiz: Answer 5 questions to get personalized recommendations.',
      ],
    },
    {
      icon: '⚠️',
      heading: 'Safety Tips for Beginners',
      content: [
        'Never drive or operate machinery while impaired.',
        'Use in a safe, comfortable environment for your first time.',
        'Have a trusted friend present if possible.',
        'Avoid very high-potency products until you understand your tolerance.',
        'Be cautious mixing cannabis with alcohol or other substances.',
        'Store safely away from children and pets.',
      ],
    },
    {
      icon: '🚫',
      heading: 'Who Should Avoid Cannabis',
      content: [
        'Anyone under 21 years old.',
        'Pregnant or breastfeeding individuals.',
        'Those with personal or family history of mental health conditions (consult doctor first).',
        'People with respiratory conditions (if smoking).',
        'Those taking medications that interact with cannabis.',
      ],
    },
  ];

  return (
    <LandingPage
      title={title}
      subtitle={subtitle}
      introduction={introduction}
      sections={sections}
      products={beginnerProducts}
    />
  );
}
