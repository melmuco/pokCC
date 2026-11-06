import { generateStaticParams } from './client';

export { generateStaticParams };

export default function CardGradingPage() {
  return <GradingClientWrapper />;
}

async function GradingClientWrapper() {
  const { CardGradingClient } = await import('./client');
  return <CardGradingClient />;
}