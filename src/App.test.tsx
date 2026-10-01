import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the Roomie shell', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /roomie/i })).toBeInTheDocument();
});
