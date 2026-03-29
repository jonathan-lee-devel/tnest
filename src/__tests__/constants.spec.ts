import { TNEST_OPTIONS, getClientToken, TNEST_CLIENT_PREFIX } from '../constants';

describe('TNEST_OPTIONS', () => {
  it('is a Symbol', () => {
    expect(typeof TNEST_OPTIONS).toBe('symbol');
  });
});

describe('getClientToken()', () => {
  it('returns a string prefixed with TNEST_CLIENT_PREFIX', () => {
    const token = getClientToken('USER_SERVICE');
    expect(token).toBe(`${TNEST_CLIENT_PREFIX}USER_SERVICE`);
  });

  it('returns deterministic tokens for the same name', () => {
    expect(getClientToken('SVC')).toBe(getClientToken('SVC'));
  });

  it('returns different tokens for different names', () => {
    expect(getClientToken('A')).not.toBe(getClientToken('B'));
  });
});
