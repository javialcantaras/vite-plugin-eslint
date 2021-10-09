import { Worker } from 'worker_threads';
import { createFilter } from '@rollup/pluginutils';

import { Options } from './utils';

export class ESLintChecker {
  options: Options;
  worker: Worker;
  filter: ReturnType<typeof createFilter>;

  constructor(userOptions: Options) {
    this.options = {
      cache: true,
      include: ['src/**/*.js', 'src/**/*.jsx', 'src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue', 'src/**/*.svelte'],
      exclude: 'node_modules',
      formatter: 'stylish',
      ...userOptions,
    };
    const { include, exclude, formatter, ...eslintOptions } = this.options;

    this.filter = createFilter(include, exclude);
    this.worker = new Worker(__filename, {
      workerData: {
        formatter,
        eslintOptions,
      },
    });
  }

  lintFile(path: string): void {
    this.worker.postMessage(path);
  }
}
