import { normalizePath, Plugin, ResolvedConfig } from 'vite';
import { ESLint } from 'eslint';
import { createFilter } from '@rollup/pluginutils';
// import { isMainThread, parentPort, Worker, workerData } from 'worker_threads';

import { checkVueFile, Options, pluginName } from './utils';

// if (!isMainThread) {
//   (async () => {
//     const { formatter, eslintOptions } = workerData as {
//       eslintOptions: ESLint.Options;
//       formatter: ESLint.Formatter;
//     };
//     const eslint = new ESLint(eslintOptions);
//     let format: ESLint.Formatter;

//     switch (typeof formatter) {
//       case 'string':
//         format = await eslint.loadFormatter(formatter);
//         break;
//       case 'function':
//         format = formatter;
//         break;
//       default:
//         format = await eslint.loadFormatter('stylish');
//     }

//     parentPort?.on('message', async (filePath: string) => {
//       if (await eslint.isPathIgnored(filePath)) return;

//       const results = await eslint.lintFiles(filePath);
//       const hasWarnings = results.some((item) => item.warningCount !== 0);
//       const hasErrors = results.some((item) => item.errorCount !== 0);
//       const result = format.format(results);

//       if (hasWarnings || hasErrors) {
//         console.log(result);
//       }

//       if (hasErrors) {
//         parentPort?.postMessage({
//           type: 'error',
//           err: transformToViteError(result),
//         });
//       }
//     });
//   })();
// }

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
  let formatPromise: Promise<ESLint.Formatter>;

  switch (typeof formatter) {
    case 'string':
      formatPromise = eslint.loadFormatter(formatter);
      break;
    case 'function':
      formatPromise = Promise.resolve(formatter);
      break;
    default:
      formatPromise = eslint.loadFormatter('stylish');
      break;
  }

  return {
    name: pluginName,
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    async transform(_, id) {
      const filePath = normalizePath(id);

      if (config.command === 'build' && checkVueFile(filePath)) return null;
      if (!filter(filePath) || (await eslint.isPathIgnored(filePath))) return null;

      const results = await eslint.lintFiles(filePath);
      const hasWarnings = results.some((item) => item.warningCount !== 0);
      const hasErrors = results.some((item) => item.errorCount !== 0);
      const report = (await formatPromise).format(results);

      if (eslintOptions.fix && results) {
        ESLint.outputFixes(results);
      }

      if (hasWarnings) {
        this.warn(report);
      }

      if (hasErrors) {
        this.error(report);
      }

      return null;
    },
  };
}
