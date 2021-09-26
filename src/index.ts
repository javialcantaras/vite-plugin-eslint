import type { Plugin } from 'vite';
import { normalizePath, ResolvedConfig } from 'vite';
import { ESLint } from 'eslint';
import { createFilter } from '@rollup/pluginutils';

import { checkVueFile, Options } from './utils';

export default function eslintPlugin(userOptions: Options = {}): Plugin {
  const options: Options = {
    cache: true,
    include: ['src/**/*.js', 'src/**/*.jsx', 'src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue', 'src/**/*.svelte'],
    exclude: 'node_modules',
    formatter: 'stylish',
    ...userOptions,
  };
  const { include, exclude, formatter, ...eslintOptions } = options;

  const filter = createFilter(include, exclude);
  const eslint = new ESLint(eslintOptions);
  let config: ResolvedConfig;
  let format: ESLint.Formatter;

  return {
    name: 'vite-plugin-eslint',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    async transform(_, id) {
      const file = normalizePath(id);

      if (!filter(file) || (await eslint.isPathIgnored(file))) return null;
      if (config.command === 'build' && checkVueFile(file)) return null;

      switch (typeof formatter) {
        case 'string':
          format = await eslint.loadFormatter(formatter);
          break;
        case 'function':
          format = formatter;
          break;
        default:
          format = await eslint.loadFormatter('stylish');
      }

      const report = await eslint.lintFiles(file);
      const hasWarnings = report.some((item) => item.warningCount !== 0);
      const hasErrors = report.some((item) => item.errorCount !== 0);
      const result = format.format(report);

      if (hasWarnings) {
        this.warn(result);
      }

      if (hasErrors) {
        this.error(result);
      }

      return null;
    },
  };
}
