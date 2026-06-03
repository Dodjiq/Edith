'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/buttons/button';
import type { PlanKey } from '@/lib/plans';

interface CheckoutButtonProps {
  planKey: Exclude<PlanKey, 'free'>;
  label: string;
  isPrimary?: boolean;
}

interface CheckoutResponse {
  url?: string;
  mode?: string;
  error?: string;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({ planKey, label, isPrimary = false }) => {
  const t = useTranslations('billing');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClick = async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      });

      const data = (await response.json()) as CheckoutResponse;

      if (response.ok && data.url) {
        window.location.href = data.url;
        return;
      }

      setErrorMessage(t('error_generic'));
      setIsLoading(false);
    } catch {
      setErrorMessage(t('error_generic'));
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 space-y-2">
      <Button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="w-full"
        variant={isPrimary ? 'default' : 'outline'}
      >
        {isLoading ? t('loading') : label}
      </Button>
      {errorMessage ? (
        <p className="text-xs text-red-400" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

export default CheckoutButton;
