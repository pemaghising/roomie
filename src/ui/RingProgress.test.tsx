import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { RingProgress } from './RingProgress';

test('renders full ring and label when total is zero', () => {
  render(<RingProgress value={0} total={0} />);
  expect(screen.getByRole('img', { name: '0 of 0 done' })).toBeInTheDocument();
});

test('computes a partial arc without NaN', () => {
  render(<RingProgress value={1} total={3} />);
  const circles = document.querySelectorAll('circle');
  const progressCircle = circles[1] as SVGCircleElement;
  expect(progressCircle.getAttribute('stroke-dashoffset')).not.toContain('NaN');
  expect(screen.getByRole('img', { name: '1 of 3 done' })).toBeInTheDocument();
});
