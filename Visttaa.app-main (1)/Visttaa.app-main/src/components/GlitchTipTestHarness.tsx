import { useEffect, useState } from 'react';

export function GlitchTipTestHarness() {
  const [shouldThrow, setShouldThrow] = useState(false);

  useEffect(() => {
    const triggerReactError = () => setShouldThrow(true);
    window.addEventListener('vistta-glitchtip-test-react', triggerReactError);
    return () => window.removeEventListener('vistta-glitchtip-test-react', triggerReactError);
  }, []);

  if (shouldThrow) throw new Error('VISTTA TESTE - React ErrorBoundary');
  return null;
}