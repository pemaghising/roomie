import { expect, test } from 'vitest';
import { pantryHealth } from './pantry-health';

const item = (name: string, stock: 'in_stock' | 'low' | 'out') => ({ id: name, owner_id: null, name, rule: null, stock, created_at: '' });

test('splits the shelf into what needs restocking (out first, then low) and what is fine', () => {
  const h = pantryHealth([item('Rice', 'in_stock'), item('Milk', 'low'), item('Bread', 'out'), item('Eggs', 'low'), item('Apples', 'in_stock')]);
  expect(h.needs.map((i) => i.name)).toEqual(['Bread', 'Eggs', 'Milk']);
  expect(h.ok.map((i) => i.name)).toEqual(['Apples', 'Rice']);
  expect(h).toMatchObject({ total: 5, low: 2, out: 1 });
});

test('an empty shelf has nothing to restock', () => {
  expect(pantryHealth([])).toEqual({ total: 0, low: 0, out: 0, needs: [], ok: [] });
});
