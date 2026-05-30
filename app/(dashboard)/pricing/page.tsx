import { topUpAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { SubmitButton } from './submit-button';

const TOP_UP_AMOUNTS = [
  { label: '€5', cents: 500, description: 'Starter', perks: ['€5 wallet credit', 'No expiry'] },
  { label: '€10', cents: 1000, description: 'Standard', perks: ['€10 wallet credit', 'No expiry'] },
  { label: '€25', cents: 2500, description: 'Popular', perks: ['€25 wallet credit', 'No expiry'] },
  { label: '€50', cents: 5000, description: 'Pro', perks: ['€50 wallet credit', 'No expiry'] },
];

export default function PricingPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900">Add Funds</h1>
        <p className="mt-3 text-lg text-gray-500">
          Top up your wallet to continue using the MCP Bypass API
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
        {TOP_UP_AMOUNTS.map((amount) => (
          <TopUpCard key={amount.cents} {...amount} />
        ))}
      </div>
    </main>
  );
}

function TopUpCard({
  label,
  cents,
  description,
  perks,
}: {
  label: string;
  cents: number;
  description: string;
  perks: string[];
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-500 transition-colors flex flex-col">
      <h2 className="text-2xl font-medium text-gray-900 mb-1">{label}</h2>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <ul className="space-y-2 mb-6 flex-1">
        {perks.map((perk) => (
          <li key={perk} className="flex items-center text-sm text-gray-700">
            <Check className="h-4 w-4 text-orange-500 mr-2 shrink-0" />
            {perk}
          </li>
        ))}
      </ul>
      <form action={topUpAction}>
        <input type="hidden" name="amountCents" value={cents} />
        <SubmitButton />
      </form>
    </div>
  );
}
