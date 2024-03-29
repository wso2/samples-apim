import * as chai from 'chai';
import { safeDump } from '../src';
const expect = chai.expect;

suite('Dumper', () => {
  suite('lineWidth dump option', () => {
    test('should respect lineWidth for multi-line strings', () => {
      const description = `Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae
Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et.`;

      expect(safeDump({ description }, { lineWidth: 100 })).to.equal(`description: >-
  Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium,
  totam rem aperiam, eaque ipsa quae

  Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed
  quia non numquam eius modi tempora incidunt ut labore et.
`);
    });

    test('should use literal block-scalar style if lineWidth is Infinity (or very lengthy)', () => {
      const description = `Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae
Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et.`;

      expect(safeDump({ description }, { lineWidth: Infinity })).to.equal(`description: |-
  Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae
  Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et.
`);
    });
  });

  suite('noRefs dump option', () => {
    context('when no option is set', () => {
      test('should use anchors for same objects by default', () => {
        const obj = { foo: 'bar' };

        expect(safeDump({ a: obj, b: obj })).to.equal(`a: &ref_0
  foo: bar
b: *ref_0
`)
      });
      test('dumps anchors', () => {
        const obj = { foo: 'bar' };

        expect(safeDump([obj, obj])).to.equal(`- &ref_0
  foo: bar
- *ref_0
`)
      });
    });

    test('should not use anchors for same objects if truthy', () => {
      const obj = { foo: 'bar' };

      expect(safeDump({ a: obj, b: obj }, { noRefs: true })).to.equal(`a:
  foo: bar
b:
  foo: bar
`)
    });
  });

  suite('int schema', () => {
    test('binary number', () => {
      expect(safeDump({ value: '0b10101' })).to.equal(`value: '0b10101'\n`);
    });
    test('hex number', () => {
      expect(safeDump({ value: '0x25DC' })).to.equal(`value: '0x25DC'\n`);
    });
    test('oct number', () => {
      expect(safeDump({ value: '01234567' })).to.equal(`value: '01234567'\n`);
    });
    test('dec number', () => {
      expect(safeDump({ value: '1234567890' })).to.equal(`value: '1234567890'\n`);
    });
    test('leading zero dec number', () => {
      expect(safeDump({ value: '0123456789' })).to.equal(`value: '0123456789'\n`);
    });
    test('big ints', () => {
      expect(safeDump({ value: 2n ** 63n - 1n })).to.equal(`value: 9223372036854775807\n`);
      expect(safeDump({ value: 2n ** 63n * -1n })).to.equal(`value: -9223372036854775808\n`);
      expect(safeDump({ value: 2n ** 64n })).to.equal(`value: 18446744073709551616\n`);
      expect(safeDump({ value: 2n ** 128n - 1n })).to.equal(`value: 340282366920938463463374607431768211455\n`);
    });
  });
});
