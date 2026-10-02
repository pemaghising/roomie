import { Button } from './Button';
import { Sprout } from './Sprout';

export function Splash({ error, onRetry }: { error?: boolean; onRetry?: () => void }) {
  return (
    <main className="splash">
      <Sprout size={64} />
      {error ? (
        <>
          <p>Can't reach Roomie right now.</p>
          <Button variant="secondary" onClick={onRetry}>Try again</Button>
        </>
      ) : <span className="sr-only">Loading</span>}
    </main>
  );
}
