import { Sprout } from './Sprout';

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="empty">
      <Sprout size={48} />
      <p className="empty__title">{title}</p>
      {body && <p className="muted">{body}</p>}
    </div>
  );
}
