import { TabBar } from './TabBar';

export const Skeleton = ({ height = 64, width }: { height?: number; width?: string }) =>
  <div className="skeleton" style={{ height, width }} aria-hidden />;

/** First load of a tab while the gate confirms the session: the page's shape, with the real tab bar already in place. */
export function TabsSkeleton() {
  return (
    <>
      <main className="screen skeleton-screen" aria-busy="true">
        <span className="sr-only">Loading</span>
        <Skeleton height={14} width="38%" />
        <Skeleton height={38} width="62%" />
        <Skeleton height={150} />
        <div className="skeleton-screen__row"><Skeleton height={96} /><Skeleton height={96} /><Skeleton height={96} /></div>
        <Skeleton height={26} width="46%" />
        <Skeleton height={70} /><Skeleton height={70} /><Skeleton height={70} />
      </main>
      <TabBar />
    </>
  );
}
