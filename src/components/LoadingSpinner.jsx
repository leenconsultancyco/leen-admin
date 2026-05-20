import { Spinner } from '@heroui/react';

export default function LoadingSpinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
      <Spinner size="lg" color="primary" />
      {label && <p className="text-sm text-default-400">{label}</p>}
    </div>
  );
}
