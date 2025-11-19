
import { cn } from '../utils';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar');
  });

  it('should handle arrays and objects', () => {
    expect(cn(['foo', 'bar'], { baz: true, qux: false })).toBe('foo bar baz');
  });

  it('should merge tailwind classes correctly', () => {
    // tailwind-merge should handle conflicting classes
    expect(cn('p-4 p-2')).toBe('p-2');
    expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500');
  });

  it('should handle undefined and null inputs', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });
});
