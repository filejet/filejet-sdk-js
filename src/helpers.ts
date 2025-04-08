/**
 * Compile-time type-guard which makes sure that each state is handled.
 *
 * Throws an Unreachable error at runtime.
 *
 * EXAMPLE:
 *   interface Operation {
 *     type: 'add' | 'remove';
 *   }
 *
 *   function process(op: Operation) {
 *     if (op.type === 'add') return 'added';
 *     if (op.type === 'remove') return 'removed';
 *
 *     // Will be marked by TypeScript as error when you
 *     // add another Operation.type and you forget to handle it.
 *     assertUnreachable(op.type);
 *   }
 */
export function assertUnreachable(value: never, message = JSON.stringify(value)): never {
  throw Error('An unreachable state reached!\n' + message);
}

/**
 * Returns true when the value is not null or undefined.
 */
export function isNotNil<T>(value: T | null | undefined): value is T {
  return value != null;
}

export function base64UrlEncode(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function base64UrlDecode(value: string): string {
  return atob(value.replace(/-/g, '+').replace(/_/g, '/'));
}

export type Percentage = `${string}%`;
