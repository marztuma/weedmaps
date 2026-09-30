import LandingPage from '@/components/LandingPage';
import { getProductsByEffect, getUserReviews } from '@/db/queries';
import { canonical } from '@/lib/seo';

export const revalidate = 3600;
export const metadata = {
  title: 'Best THCa Products - High Potency Cannabis | Weedmaps',
  description: 'Explore the best THCa strains and products. THCa is the raw, non-psychoactive precursor to THC that converts when heated. Find potent, lab-tested options.',
  alternates: canonical('/best-thca-products'),
};

export default async function BestThcaPage() {
  const [products, reviews] = await Promise.all([
    getProductsByEffect('Uplifted', 12),
    getUserReviews(12),
  ]);

  const title = 'Best THCa Products';
  const subtitle = 'Discover high-potency THCa strains and products';

  const introduction = [
    'THCa (tetrahydrocannabinolic acid) is the raw, non-psychoactive precursor to THC found in fresh cannabis. When heated through smoking, vaping, or decarboxylation, THCa converts to active THC.',
    'THCa-rich products are increasingly popular among consumers seeking high potency. Our selection features the best lab-tested THCa strains and concentrates from trusted brands.',
  ];

  const sections = [
    {
      icon: '🔬',
      heading: 'What is THCa?',
      content: [
        'THCa is the acidic form of THC and makes up a large portion of fresh cannabis flower. Unlike THC, raw THCa is not psychoactive. However, when exposed to heat (smoking, vaping, cooking), THCa rapidly decarboxylates and converts to THC.',
        'Lab testing typically measures THCa content, which is why you\'ll see THCa percentages on product labels. A flower with 20% THCa will convert to approximately 18% THC when decarboxylated.',
      ],
    },
    {
      icon: '💪',
      heading: 'Why Choose High-Potency Products?',
      content: [
        'High-potency THCa products are ideal for experienced consumers looking for strong effects. They\'re also popular among medical users who need higher doses for symptom relief.',
        'Potency is just one factor in the experience—strain genetics, terpene profile, and personal tolerance all play important roles in how a product affects you.',
      ],
    },
    {
      icon: '🛒',
      heading: 'How to Use THCa Products',
      content: [
        'Flower: Smoke or vape THCa-rich flower. Vaping at higher temperatures (400°F+) will decarboxylate the THCa.',
        'Concentrates: Use THCa concentrates with a dab rig, vaporizer, or in a joint. Concentrates are already decarboxylated and ready to use.',
        'Edibles: Create infused butter or oil by heating decarboxylated flower, then use in recipes.',
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
