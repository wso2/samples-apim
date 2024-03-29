export declare class Scope {
    #private;
    readonly id: number;
    constructor(parentScope?: Scope | null);
    get global(): Scope;
    has(local: string): boolean;
    add(imported: string): void;
    store(name: string, imported: string): void;
    load(name: string): string | undefined;
    fork(): Scope;
}
