export type ArraySubject<A> = Promise<A[]> | A[];
export type ObjectSubject<A> = Promise<Record<string, A>> | Record<string, A>;

export const all: <A>(doc: ArraySubject<Promise<A> | A>) => Promise<A[]>;
export const allValues: <A>(doc: ObjectSubject<Promise<A> | A>) => Promise<Record<string, A>>;
export const entries: <A>(doc: ObjectSubject<Promise<A> | A>) => Promise<[string, A][]>;

export const every: (
  <A>(fn: FilterFn<A>, doc: ArraySubject<A>) => Promise<boolean>
) & (
  <A>(fn: FilterFn<A>) => Every<A>
);
export type Every<A> = (doc: ArraySubject<A>) => Promise<boolean>;

export const filter: (
  <A>(fn: FilterFn<A>, doc: ArraySubject<A>) => Promise<A[]>
) & (
  <A>(fn: FilterFn<A>) => Filter<A>
);
export type Filter<A> = (doc: ArraySubject<A>) => Promise<A[]>;
export type FilterFn<A> = (item: A, index: number) => Promise<boolean> | boolean;

export const map: (
  <A, B>(fn: MapFn<A, B>, doc: ArraySubject<A>) => Promise<B[]>
) & (
  <A, B>(fn: MapFn<A, B>) => Mapper<A, B>
);
export type Mapper<A, B> = (doc: ArraySubject<A>) => Promise<B[]>;
export type MapFn<A, B> = (item: A, index: number) => B;

export const reduce: (
  <A, B>(fn: ReduceFn<A, B>, initialValue: B, doc: ArraySubject<A>) => Promise<B>
) & (
  <A, B>(fn: ReduceFn<A, B>, initialValue: B) => Reducer<A, B>
) & (
  <A, B>(fn: ReduceFn<A, B>) => (initialValue: B) => Reducer<A, B>
);
export type Reducer<A, B> = (doc: ArraySubject<A>) => Promise<B>;
export type ReduceFn<A, B> = (acc: B, item: A, index: number) => Promise<B> | B;

export const some: (
  <A>(fn: FilterFn<A>, doc: ArraySubject<A>) => Promise<boolean>
) & (
  <A>(fn: FilterFn<A>) => Some<A>
);
export type Some<A> = (doc: ArraySubject<A>) => Promise<boolean>;

export const pipeline: (
  <A, B>(fns: [(a: A) => B], initialValue: A) => Promise<B>
) & (
  <A, B>(fns: [(a: A) => B]) => Pipeline<A, B>
) & (
  <A, B, C>(fns: [
    (a: A) => B,
    (b: B) => C
  ], initialValue: A) => Promise<C>
) & (
  <A, B, C>(fns: [
    (a: A) => B,
    (b: B) => C
  ]) => Pipeline<A, C>
) & (
  <A, B, C, D>(fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D
  ], initialValue: A) => Promise<D>
) & (
  <A, B, C, D>(fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D
  ]) => Pipeline<A, D>
) & (
  <A, B, C, D, E>(fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D,
    (d: D) => E
  ], initialValue: A) => Promise<E>
) & (
  <A, B, C, D, E>(fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D,
    (d: D) => E
  ]) => Pipeline<A, E>
) & (
  <A, B, C, D, E, F>(fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D,
    (d: D) => E,
    (e: E) => F
  ], initialValue: A) => Promise<F>
) & (
  <A, B, C, D, E, F>(fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D,
    (d: D) => E,
    (e: E) => F
  ]) => Pipeline<A, F>
) & (
  <A, B, C, D, E, F, G>(fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D,
    (d: D) => E,
    (e: E) => F,
    (f: F) => G
  ], initialValue: A) => Promise<G>
) & (
  <A, B, C, D, E, F, G>(fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D,
    (d: D) => E,
    (e: E) => F,
    (f: F) => G
  ]) => Pipeline<A, G>
) & (
  <A, B, C, D, E, F, G, H>(fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D,
    (d: D) => E,
    (e: E) => F,
    (f: F) => G,
    (g: G) => H
  ], initialValue: A) => Promise<H>
) & (
  <A, B, C, D, E, F, G, H>(fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D,
    (d: D) => E,
    (e: E) => F,
    (f: F) => G,
    (g: G) => H
  ]) => Pipeline<A, H>
) & (
  <A, B, C, D, E, F, G, H, I>(fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D,
    (d: D) => E,
    (e: E) => F,
    (f: F) => G,
    (g: G) => H,
    (h: H) => I
  ], initialValue: A) => Promise<I>
) & (
  <A, B, C, D, E, F, G, H, I>(fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D,
    (d: D) => E,
    (e: E) => F,
    (f: F) => G,
    (g: G) => H,
    (h: H) => I
  ]) => Pipeline<A, I>
) & (
  <A, B, C, D, E, F, G, H, I>(fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D,
    (d: D) => E,
    (e: E) => F,
    (f: F) => G,
    (g: G) => H,
    (h: H) => I,
    ...Function[] // eslint-disable-line @typescript-eslint/ban-types
  ], initialValue: A) => Promise<unknown>
) & (
  <A, B, C, D, E, F, G, H, I>(fns: [
    (a: A) => B,
    (b: B) => C,
    (c: C) => D,
    (d: D) => E,
    (e: E) => F,
    (f: F) => G,
    (g: G) => H,
    (h: H) => I,
    ...Function[] // eslint-disable-line @typescript-eslint/ban-types
  ]) => Pipeline<A, unknown>
);
export type Pipeline<A, B> = (initialValue: A) => Promise<B>;
