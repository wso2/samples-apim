import type Fallback from './codegen/fallback';

export type Callback = (scope: EmittedScope) => void;

type JsonPath = (string | number)[];
type Input = Record<string, unknown> | unknown[];

export type EmittedScope = {
  readonly path: JsonPath;
  readonly value: unknown;
};

declare class Nimma {
  constructor(
    expressions: string[],
    opts?: {
      fallback: Fallback;
      unsafe: boolean;
      output: 'ES2018' | 'ES2021' | 'auto'
    },
  ): Nimma;

  public query(input: Input, callbacks: Record<string, Callback>): void;
  public readonly sourceCode: string;
}

export default Nimma;
