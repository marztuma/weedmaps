import StrainQuiz from '@/components/StrainQuiz';
import { canonical } from '@/lib/seo';

export const revalidate = 3600;
export const metadata = {
  title: 'Strain Quiz - Find Your Perfect Cannabis Match',
  description: 'Answer 5 quick questions to discover cannabis products tailored to your preferences, effects, potency, budget, and experience level.',
  alternates: canonical('/strain-quiz'),
};

export default async function StrainQuizPage() {
  // Products loaded dynamically in client to avoid server timeout
  return (
    <div>
      <StrainQuiz products={[]} />
    </div>
  );
}
