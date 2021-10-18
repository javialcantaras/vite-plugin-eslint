import { ESLint } from 'eslint';
import { isMainThread, parentPort, Worker } from 'worker_threads';
import { CreateFilter, createFilter } from '@rollup/pluginutils';

import { Options } from './utils';

export class ESLintChecker {
  worker: Worker;
  eslint: ESLint;
  formatPromise: Promise<ESLint.Formatter>;
  filter: ReturnType<CreateFilter>;

  constructor(options: Options) {
    const { include, exclude, formatter, ...eslintOptions } = options;

    this.eslint = new ESLint(eslintOptions);
    this.filter = createFilter(include, exclude);
    this.worker = new Worker(__filename);

    switch (typeof formatter) {
      case 'string':
        this.formatPromise = this.eslint.loadFormatter(formatter);
        break;
      case 'function':
        this.formatPromise = Promise.resolve(formatter);
        break;
      default:
        this.formatPromise = this.eslint.loadFormatter('stylish');
        break;
    }
  }

  // initWorkerThreads(eslintOptions: ESLint.Options) {
  //   if (!isMainThread) {
  //     parentPort?.on('message', (filePath) => {

  //     });
  //   }
  // }

  lint(filePath: string) {
    this.worker.postMessage(filePath);
  }
}
