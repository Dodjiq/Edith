'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/buttons/button';

interface PortalResponse {
  url?: string;
  mode?: string;
  error?: string;
}

const PortalButton: React.FC = () => {
  const t = useTranslations('billing');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClick = async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = (await response.json()) as PortalResponse;

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
    <div className="space-y-2">
      <Button type="button" onClick={handleClick} disabled={isLoading} variant="outline">
        {isLoading ? t('loading') : t('manage_subscription')}
      </Button>
      {errorMessage ? (
        <p className="text-xs text-red-400" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

export default PortalButton;
