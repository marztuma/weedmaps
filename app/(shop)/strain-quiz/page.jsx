import StrainQuiz from '@/components/StrainQuiz';
import { getAllProductsArray } from '@/db/queries';
import { canonical } from '@/lib/seo';

export const revalidate = 3600;
export const metadata = {
  title: 'Strain Quiz - Find Your Perfect Cannabis Match',
  description: 'Answer 5 quick questions to discover cannabis products tailored to your preferences, effects, potency, budget, and experience level.',
  alternates: canonical('/strain-quiz'),
};

export default async function StrainQuizPage() {
  const products = await getAllProductsArray();

  return (
    <div>
      <StrainQuiz products={products} />
    </div>
  );
}
