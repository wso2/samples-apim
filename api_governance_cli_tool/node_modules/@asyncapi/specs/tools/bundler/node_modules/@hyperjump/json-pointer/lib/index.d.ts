export type JsonPointer = {
  nil: "";
  append: (
    (segment: string, pointer: string) => string
  ) & (
    (segment: string) => (pointer: string) => string
  );
  get: (
    (pointer: string, subject: Pointable) => unknown
  ) & (
    (pointer: string) => Getter
  );
  set: (
    <A extends Pointable>(pointer: string, subject: A, value: unknown) => A
  ) & (
    (pointer: string) => Setter
  );
  assign: (
    <A extends Pointable>(pointer: string, subject: A, value: unknown) => void
  ) & (
    (pointer: string) => Assigner
  );
  unset: (
    <A extends Pointable>(pointer: string, subject: A) => A
  ) & (
    (pointer: string) => Unsetter
  );
  remove: (
    (pointer: string, subject: Pointable) => void
  ) & (
    (pointer: string) => Remover
  );
}

export type Getter = (subject: Pointable) => unknown;
export type Setter = (
  <A extends Pointable>(subject: A, value: unknown) => A
) & (
  <A extends Pointable>(subject: A) => (value: unknown) => A
);
export type Assigner = (
  <A extends Pointable>(subject: A, value: unknown) => void
) & (
  <A extends Pointable>(subject: A) => (value: unknown) => void
);
export type Unsetter = <A extends Pointable>(subject: A) => A;
export type Remover = (subject: Pointable) => void;

export type Json = string | number | boolean | null | JsonObject | Json[];
export type JsonObject = {
  [property: string]: Json;
};

export type Pointable = JsonObject | Json[];

declare const JsonPointer: JsonPointer;
export const nil: JsonPointer["nil"];
export const append: JsonPointer["append"];
export const get: JsonPointer["get"];
export const set: JsonPointer["set"];
export const assign: JsonPointer["assign"];
export const unset: JsonPointer["unset"];
export const remove: JsonPointer["remove"];

export default JsonPointer;
