import type { ESLint } from 'eslint';
import { parse } from 'querystring';

export interface Options extends ESLint.Options {
  /** The cache is enabled by default to decrease execution time */
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

export enum DiagnosticLevel {
  Warning = 0,
  Error = 1,
  Suggestion = 2,
  Message = 3,
}

// export function normalizeESLintReport(result: ESLint.LintResult) {
//   return result.messages.map((item) => {
//     let level = DiagnosticLevel.Error;

//     switch (item.severity) {
//       // off, ignore
//       case 0:
//         level = DiagnosticLevel.Error;
//         break;
//       // warn
//       case 1:
//         level = DiagnosticLevel.Warning;
//         break;
//       // error
//       case 2:
//         level = DiagnosticLevel.Error;
//         break;
//     }
//   });
// }
