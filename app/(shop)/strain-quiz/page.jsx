import StrainQuiz from '@/components/StrainQuiz';
import { getShelf } from '@/db/queries';
import { canonical } from '@/lib/seo';

export const revalidate = 3600;
export const metadata = {
  title: 'Strain Quiz - Find Your Perfect Cannabis Match',
  description: 'Answer 5 quick questions to discover cannabis products tailored to your preferences, effects, potency, budget, and experience level.',
  alternates: canonical('/strain-quiz'),
};

export default async function StrainQuizPage() {
  // Load only available shelves for quiz with minimal items to prevent timeout
  const [flower, vape, edibles] = await Promise.all([
    getShelf('flower', 3),
    getShelf('vape', 3),
    getShelf('edibles', 3),
  ]);

  const products = [...flower, ...vape, ...edibles];

  return (
    <div>
      <StrainQuiz products={products} />
    </div>
  );
}
