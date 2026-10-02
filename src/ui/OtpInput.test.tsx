import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expect, test, vi } from 'vitest';
import { OtpInput } from './OtpInput';

function Harness({ alnum, onComplete }: { alnum?: boolean; onComplete: (v: string) => void }) {
  const [v, setV] = useState('');
  return <OtpInput label="Code" value={v} onChange={setV} onComplete={onComplete} alphanumeric={alnum} />;
}

test('digits only, completes at 6', async () => {
  const done = vi.fn();
  render(<Harness onComplete={done} />);
  await userEvent.type(screen.getByLabelText('Code'), '12a3456');
  expect(done).toHaveBeenCalledWith('123456');
});

test('alphanumeric accepts a pasted invite link', async () => {
  const done = vi.fn();
  render(<Harness alnum onComplete={done} />);
  await userEvent.click(screen.getByLabelText('Code'));
  await userEvent.paste('https://roomie.example/j/abc123');
  expect(done).toHaveBeenCalledWith('ABC123');
});
