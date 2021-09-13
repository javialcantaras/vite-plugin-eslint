import type { Plugin, ResolvedConfig } from 'vite';
import { normalizePath } from 'vite';
import { resolve } from 'path';
import { ESLint } from 'eslint';
import { Worker } from 'worker_threads';
import { createFilter } from '@rollup/pluginutils';

import { Options } from './utils';

// if (!isMainThread) {
//   const eslint = new ESLint(workerData.eslintOptions);

//   parentPort?.on('message', async (filePath) => {
//     const report = await eslint.lintFiles(filePath);
//   });
// }

export default function eslintPlugin(options: Options = {}): Plugin {
  const {
    cache = true,
    fix = false,
    include = ['src/**/*.js', 'src/**/*.jsx', 'src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue'],
    exclude = /node_modules/,
  } = options;
  let config: ResolvedConfig;
  let worker: Worker;
  const filter = createFilter(include, exclude);

  return {
    name: 'vite:eslint',
    configResolved(viteConfig) {
      config = viteConfig;
    },
    transform(_, id) {
      const filePath = normalizePath(id);
      const eslintOptions: ESLint.Options = {
        fix,
        cache,
        cacheLocation: config.cacheDir
          ? resolve(config.cacheDir, './vite-plugin-eslint')
          : resolve(process.cwd(), './node_modules/.vite/vite-plugin-eslint'),
      };

      if (!worker) {
        worker = new Worker(__filename, {
          workerData: { eslintOptions },
        });
      }

      if (filter(filePath)) {
        worker.postMessage(filePath);
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
