import { describe, it, expect } from 'vitest';
import { reconciliationsModule } from '../../index';

describe('reconciliationsModule (smoke)', () => {
  it('should export an Elysia module', () => {
    expect(reconciliationsModule).toBeDefined();
  });
});
