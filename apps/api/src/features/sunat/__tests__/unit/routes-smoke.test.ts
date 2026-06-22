import { describe, it, expect } from 'vitest';
import { sunatApiModule } from '../../index';

describe('sunatApiModule (smoke)', () => {
  it('should export an Elysia module', () => {
    expect(sunatApiModule).toBeDefined();
  });
});
