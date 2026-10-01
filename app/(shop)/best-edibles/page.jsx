import LandingPage from '@/components/LandingPage';
import { canonical } from '@/lib/seo';

export const revalidate = 3600;
export const metadata = {
  title: 'Best Edibles - Gummies, Chocolate & More | Weedmaps',
  description: 'Explore the best cannabis edibles. Find gummies, chocolate, mints, and other infused products. Learn about edible dosing and effects.',
  alternates: canonical('/best-edibles'),
};

export default async function EdiblesPage() {
  const products = [];

  const title = 'Best Cannabis Edibles';
  const subtitle = 'Gummies, chocolate, mints, and more—carefully selected for quality and taste';

  const introduction = [
    'Cannabis edibles offer a discreet, convenient way to consume cannabis. From gummies to chocolates to mints, there\'s something for every taste.',
    'Edibles provide longer-lasting effects than flower or vaping, making them popular for all-day or all-night relief. Our curated selection features the best brands and products available.',
  ];

  const sections = [
    {
      icon: '🍬',
      heading: 'Types of Edibles',
      content: [
        'Gummies: Chewy, fruity, and precisely dosed. The most popular edible format.',
        'Chocolate: Rich, indulgent, and delicious. Great for dessert-like experience.',
        'Mints: Breath freshening with a cannabis twist. Subtle and minty.',
        'Baked goods: Brownies, cookies, and other treats for home preparation.',
      ],
    },
    {
      icon: '⏱️',
      heading: 'Edible Effects & Timing',
      content: [
        'Onset: Effects typically begin 30 minutes to 2 hours after consumption (longer with food in stomach).',
        'Duration: Effects last 6-8 hours or longer, much longer than smoking or vaping.',
        'Intensity: Edibles often feel more intense than comparable doses of smoked cannabis due to liver metabolism.',
        'Consistency: Edibles provide predictable, consistent effects when dosing is accurate.',
      ],
    },
    {
      icon: '📏',
      heading: 'Understanding Edible Dosing',
      content: [
        'Standard dose: 5-10mg THC for beginners, 10-20mg for regular users.',
        'Start low: Begin with 2-5mg if new to edibles and wait 2 hours before taking more.',
        'Body weight matters: Heavier individuals may need higher doses.',
        'Metabolism varies: Individual metabolism affects onset and duration.',
        'Not all calories equal: Higher-fat edibles may increase absorption.',
      ],
    },
    {
      icon: '🎯',
      heading: 'Tips for Edible Success',
      content: [
        'Always check the label and verify dosing information.',
        'Consume with food for faster, more predictable absorption.',
        'Be patient—don\'t take more before the first dose takes effect.',
        'Store edibles safely, away from children and pets.',
        'Keep track of how different products affect you.',
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
