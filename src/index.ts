import type { Plugin, ResolvedConfig } from 'vite';
import { normalizePath } from 'vite';
import { resolve } from 'path';
import { ESLint } from 'eslint';
import { isMainThread, parentPort, Worker, workerData } from 'worker_threads';
import { createFilter } from '@rollup/pluginutils';

import { Options } from './utils';

// use worker to lint file
if (!isMainThread) {
  const eslint = new ESLint(workerData.eslintOptions);

  parentPort?.on('message', async (filePath) => {
    let formatter: ESLint.Formatter;

    switch (typeof workerData.formatter) {
      case 'string':
        formatter = await eslint.loadFormatter(workerData.formatter);
        break;
      case 'function':
        ({ formatter } = workerData);
        break;
      default:
        formatter = await eslint.loadFormatter('stylish');
    }

    const reports = await eslint.lintFiles(filePath);
    const hasWarnings = reports.some((item) => item.warningCount > 0);
    const hasErrors = reports.some((item) => item.errorCount > 0);
    const result = formatter.format(reports);

    if (result) {
      console.log(result);
    }

    // if (hasWarnings) {
    //   workerData.warn(result);
    // }

    // if (hasErrors) {
    //   workerData.error(result);
    // }
  });
}

export default function eslintPlugin(options: Options = {}): Plugin {
  const {
    cache = true,
    fix = false,
    include = ['src/**/*.js', 'src/**/*.jsx', 'src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue'],
    exclude = /node_modules/,
    formatter = 'stylish',
    ...otherEslintOptions
  } = options;
  const filter = createFilter(include, exclude);
  let config: ResolvedConfig;
  let worker: Worker;

  return {
    name: 'vite:eslint',
    configResolved(viteConfig) {
      config = viteConfig;
    },
    transform(_, id) {
      const filePath = normalizePath(id);
      const eslintOptions: ESLint.Options = {
        ...otherEslintOptions,
        fix,
        cache,
        cacheLocation: config.cacheDir
          ? resolve(config.cacheDir, './vite-plugin-eslint')
          : resolve(process.cwd(), './node_modules/.vite/vite-plugin-eslint'),
      };

      if (!worker) {
        worker = new Worker(__filename, {
          workerData: {
            eslintOptions,
            formatter,
            // warn: this.warn,
            // error: this.error,
          },
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
