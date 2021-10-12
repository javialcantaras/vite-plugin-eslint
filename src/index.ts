import { ErrorPayload, normalizePath, Plugin, ResolvedConfig } from 'vite';
import { ESLint } from 'eslint';
import { createFilter } from '@rollup/pluginutils';
import { isMainThread, parentPort, Worker, workerData } from 'worker_threads';

import { checkVueFile, Options, pluginName, transformToViteError } from './utils';

if (!isMainThread) {
  (async () => {
    const { formatter, eslintOptions } = workerData as {
      eslintOptions: ESLint.Options;
      formatter: ESLint.Formatter;
    };
    const eslint = new ESLint(eslintOptions);
    let format: ESLint.Formatter;

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

    parentPort?.on('message', async (filePath: string) => {
      if (await eslint.isPathIgnored(filePath)) return;

      const results = await eslint.lintFiles(filePath);
      const hasWarnings = results.some((item) => item.warningCount !== 0);
      const hasErrors = results.some((item) => item.errorCount !== 0);
      const result = format.format(results);

      if (hasWarnings || hasErrors) {
        console.log(result);
      }

      if (hasErrors) {
        parentPort?.postMessage({
          type: 'error',
          err: transformToViteError(result),
        });
      }
    });
  })();
}

export default function eslintPlugin(userOptions: Options = {}): Plugin {
  const options: Options = {
    include: ['src/**/*.js', 'src/**/*.jsx', 'src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue', 'src/**/*.svelte'],
    exclude: 'node_modules',
    formatter: 'stylish',
    ...userOptions,
  };
  const { include, exclude, formatter, ...eslintOptions } = options;

  const filter = createFilter(include, exclude);
  const worker = new Worker(__filename, {
    workerData: {
      eslintOptions,
      formatter,
    },
  });
  let config: ResolvedConfig;

  return {
    name: pluginName,
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    configureServer(server) {
      if (config.command === 'serve') {
        worker.on('message', (payload: ErrorPayload) => {
          server.ws.send(payload);
        });
      }
    },
    transform(_, id) {
      const filePath = normalizePath(id);

      if (config.command === 'build' && checkVueFile(filePath)) return null;
      if (!filter(filePath)) return null;

      worker.postMessage(filePath);

      // if (!filter(file) || (await eslint.isPathIgnored(file))) return null;
      // if (config.command === 'build' && checkVueFile(file)) return null;

      // switch (typeof formatter) {
      //   case 'string':
      //     format = await eslint.loadFormatter(formatter);
      //     break;
      //   case 'function':
      //     format = formatter;
      //     break;
      //   default:
      //     format = await eslint.loadFormatter('stylish');
      // }

      // const report = await eslint.lintFiles(file);
      // const hasWarnings = report.some((item) => item.warningCount !== 0);
      // const hasErrors = report.some((item) => item.errorCount !== 0);
      // const result = format.format(report);

      // if (hasWarnings) {
      //   this.warn(result);
      // }

      // if (hasErrors) {
      //   this.error(result);
      // }

      return null;
    },
  };
}
