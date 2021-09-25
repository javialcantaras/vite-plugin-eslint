import * as path from 'path';
import { normalizePath, Plugin, ResolvedConfig } from 'vite';
import { ESLint } from 'eslint';
import { createFilter } from '@rollup/pluginutils';

import { checkVueFile, Options } from './utils';

export default function eslintPlugin(options: Options = {}): Plugin {
  const {
    cache = true,
    fix = false,
    include = ['src/**/*.js', 'src/**/*.jsx', 'src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue', 'src/**/*.svelte'],
    exclude = /node_modules/,
    formatter = 'stylish',
    ...otherEslintOptions
  } = options;

  const filter = createFilter(include, exclude);
  let config: ResolvedConfig;
  let cacheLocation = '';
  let eslint: ESLint;
  let format: ESLint.Formatter;

  return {
    name: 'vite-plugin-eslint',
    enforce: 'pre',
    configResolved(viteConfig) {
      config = viteConfig;
      cacheLocation = path.resolve(
        config.cacheDir ? config.cacheDir : path.resolve(process.cwd(), './node_modules/.vite'),
        './vite-plugin-eslint',
      );
    },
    buildStart() {
      eslint = new ESLint({
        ...otherEslintOptions,
        fix,
        cache,
        // cacheLocation,
        cacheStrategy: 'content',
      });
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

  // const eslint = new ESLint({
  //   cacheLocation: path.resolve(
  //     process.cwd(),
  //     // maybe vite config cacheDir is better ?
  //     './node_modules/.vite/vite-plugin-eslint',
  //   ),
  //   cache,
  //   fix: opts.fix,
  // });
  // const filter = createFilter(opts.include, opts.exclude || /node_modules/);
  // let formatter: ESLint.Formatter;

  // return {
  //   name: 'vite:eslint',
  //   async transform(_, id) {
  //     const file = normalizePath(id);

  //     if (!filter(id) || (await eslint.isPathIgnored(file)) || checkVueFile(id)) {
  //       return null;
  //     }

  //     switch (typeof opts.formatter) {
  //       case 'string':
  //         formatter = await eslint.loadFormatter(opts.formatter);
  //         break;
  //       case 'function':
  //         ({ formatter } = opts);
  //         break;
  //       default:
  //         formatter = await eslint.loadFormatter('stylish');
  //     }

  //     const report = await eslint.lintFiles(file);
  //     const hasWarnings = opts.throwOnWarning && report.some((item) => item.warningCount !== 0);
  //     const hasErrors = opts.throwOnError && report.some((item) => item.errorCount !== 0);
  //     const result = formatter.format(report);

  //     if (opts.fix && report) {
  //       ESLint.outputFixes(report);
  //     }

  //     if (hasWarnings) {
  //       this.warn(result);
  //     }

  //     if (hasErrors) {
  //       this.error(result);
  //     }

  //     return null;
  //   },
  // };
}
