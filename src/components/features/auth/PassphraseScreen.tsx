import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export type PassphraseMode = 'setup' | 'unlock';

interface PassphraseScreenProps {
  mode: PassphraseMode;
  onSubmit: (passphrase: string) => Promise<void>;
  error?: string | null;
  isMigrating?: boolean;
}

export function PassphraseScreen({ mode, onSubmit, error, isMigrating }: PassphraseScreenProps) {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isSetup = mode === 'setup';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (passphrase.length < 8) {
      setValidationError('Passphrase must be at least 8 characters');
      return;
    }

    if (isSetup && passphrase !== confirmPassphrase) {
      setValidationError('Passphrases do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(passphrase);
    } catch {
      // Error is handled by parent via error prop
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = validationError || error;

  return (
    <div className="h-full flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              {isSetup ? 'Encrypt Your Data' : 'Unlock Your Data'}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {isSetup
                ? 'Create a passphrase to encrypt your data. This passphrase will be required every time you open the app.'
                : 'Enter your passphrase to decrypt and access your data.'}
            </p>
            {isMigrating && (
              <p className="mt-2 text-sm text-amber-600 bg-amber-50 rounded-md px-3 py-2">
                Existing data detected. Your data will be encrypted after you create a passphrase.
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                label="Passphrase"
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder={isSetup ? 'Create a strong passphrase' : 'Enter your passphrase'}
                autoFocus
                autoComplete={isSetup ? 'new-password' : 'current-password'}
              />
            </div>

            {isSetup && (
              <Input
                label="Confirm Passphrase"
                type={showPassphrase ? 'text' : 'password'}
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                placeholder="Confirm your passphrase"
                autoComplete="new-password"
              />
            )}

            {/* Show/hide passphrase toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPassphrase}
                onChange={(e) => setShowPassphrase(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Show passphrase</span>
            </label>

            {/* Error display */}
            {displayError && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-600">{displayError}</p>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isSubmitting || passphrase.length === 0}
              className="w-full min-h-[44px] md:min-h-0"
            >
              {isSubmitting
                ? isSetup
                  ? 'Setting up encryption...'
                  : 'Unlocking...'
                : isSetup
                  ? 'Create Passphrase & Encrypt'
                  : 'Unlock'}
            </Button>
          </form>

          {/* Warning */}
          {isSetup && (
            <div className="mt-6 rounded-md bg-amber-50 border border-amber-200 p-3">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-amber-500 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div className="ml-2">
                  <h3 className="text-sm font-medium text-amber-800">Important</h3>
                  <p className="mt-1 text-xs text-amber-700">
                    If you forget your passphrase, your data cannot be recovered. There is no
                    recovery mechanism. Please store your passphrase securely.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
