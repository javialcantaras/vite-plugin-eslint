import type { ESLint } from 'eslint';
import type { ErrorPayload } from 'vite';
import { parse } from 'querystring';

export const pluginName = 'vite-plugin-eslint';

export interface Options extends ESLint.Options {
  /** Decrease execution time */
  cache?: boolean;
  /** A single file, or array of files, to include when linting */
  include?: string | string[];
  /** A single file, or array of files, to exclude when linting */
  exclude?: string | string[];
  /** Custom error formatter or the name of a built-in formatter */
  formatter?: string | ESLint.Formatter;
  /** The warings found will be emitted */
  throwOnWarning?: boolean;
  /** The errors found will be emitted */
  throwOnError?: boolean;
}

export function checkVueFile(id: string): boolean {
  if (!id.includes('?')) return false;

  const rawQuery = id.split('?', 2)[1];

  return parse(rawQuery).vue !== null ? true : false;
}

export function transformToViteError(formatter: string): ErrorPayload['err'] {
  return {
    message: '',
    frame: formatter,
    stack: '',
    plugin: pluginName,
  };
}
