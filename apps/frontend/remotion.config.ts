import { Config, WebpackOverrideFn } from '@remotion/cli/config';
import path from 'node:path';

Config.setEntryPoint('./src/app/projects/[project-id]/_editor-container/remotion/index.ts');

export const webpackOverride: WebpackOverrideFn = (config) => {
  config.resolve = config.resolve ?? {};
  config.resolve.alias = {
    ...(config.resolve.alias ?? {}),
    '@': path.resolve(process.cwd(), 'src'),
  };
  return config;
};

Config.overrideWebpackConfig(webpackOverride);
