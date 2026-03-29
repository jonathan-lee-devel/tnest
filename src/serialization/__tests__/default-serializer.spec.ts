import { DefaultPayloadSerializer } from '../default-serializer';

describe('DefaultPayloadSerializer', () => {
  let serializer: DefaultPayloadSerializer;

  beforeEach(() => {
    serializer = new DefaultPayloadSerializer();
  });

  describe('serialize()', () => {
    it('passes through the payload unchanged', () => {
      const payload = { name: 'Alice', age: 30 };
      expect(serializer.serialize(payload)).toBe(payload);
    });

    it('passes through primitives', () => {
      expect(serializer.serialize('hello')).toBe('hello');
      expect(serializer.serialize(42)).toBe(42);
      expect(serializer.serialize(null)).toBeNull();
    });
  });

  describe('deserialize()', () => {
    it('passes through the data unchanged', () => {
      const data = { name: 'Alice', age: 30 };
      expect(serializer.deserialize(data)).toBe(data);
    });

    it('passes through primitives', () => {
      expect(serializer.deserialize('hello')).toBe('hello');
      expect(serializer.deserialize(42)).toBe(42);
      expect(serializer.deserialize(null)).toBeNull();
    });
  });
});
