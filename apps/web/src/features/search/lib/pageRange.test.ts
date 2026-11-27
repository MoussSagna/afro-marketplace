import { describe, expect, it } from 'vitest';
import { pageRange } from './pageRange';

describe('pageRange', () => {
  it('affiche toutes les pages quand il y en a 7 ou moins', () => {
    expect(pageRange(1, 1)).toEqual([1]);
    expect(pageRange(2, 3)).toEqual([1, 2, 3]);
    expect(pageRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('au début : les 5 premières, puis la dernière', () => {
    expect(pageRange(1, 10)).toEqual([1, 2, 3, 4, 5, 'gap', 10]);
    expect(pageRange(4, 10)).toEqual([1, 2, 3, 4, 5, 'gap', 10]);
  });

  it('au milieu : la page courante entourée de ses voisines', () => {
    expect(pageRange(5, 10)).toEqual([1, 'gap', 4, 5, 6, 'gap', 10]);
  });

  it('à la fin : la première, puis les 5 dernières', () => {
    expect(pageRange(10, 10)).toEqual([1, 'gap', 6, 7, 8, 9, 10]);
    expect(pageRange(7, 10)).toEqual([1, 'gap', 6, 7, 8, 9, 10]);
  });
});
