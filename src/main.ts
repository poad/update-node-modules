import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';

interface PackageJson {
  devDependencies?: {
    [key: string]: string
  };
  dependencies?: {
    [key: string]: string
  };
  peerDependencies?: {
    [key: string]: string
  };
  optionalDependencies?: {
    [key: string]: string
  };
}

const optionMap = {
  npm: {
    install: {
      dependencies: ['install'],
      devDependencies: ['install', '--save-dev'],
      peerDependencies: ['install', '--save-peer'],
      optionalDependencies: ['install', '--save-optional'],
    },
    remove: {
      dependencies: ['uninstall'],
      devDependencies: ['uninstall'],
      peerDependencies: ['uninstall'],
      optionalDependencies: ['uninstall'],
    },
  },
  yarn: {
    install: {
      dependencies: ['add'],
      devDependencies: ['add', '-D'],
      peerDependencies: ['add', '-P'],
      optionalDependencies: ['add', '-O'],
    },
    remove: {
      dependencies: ['remove'],
      devDependencies: ['remove'],
      peerDependencies: ['remove'],
      optionalDependencies: ['remove'],
    },
  },
};

const errHandler = (error: Error) => {
  core.error(error.message);
  core.setFailed(error.message);
};

interface GetInputParams<T> {
  name: string;
  options?: core.InputOptions;
  defaultValue?: T
}

const getInput = (params: GetInputParams<string>): string | undefined => {
  const value = core.getInput(params.name, params.options);
  return value || params.defaultValue;
};

const getBooleanInput = (params: GetInputParams<boolean>): boolean => {
  const value = core.getBooleanInput(params.name, params.options);
  return (value || params.defaultValue) || false;
};

async function run(): Promise<void> {
  const yarn: boolean = getBooleanInput({ name: 'yarn', options: { required: false } });
  const targetPath = getInput({ name: 'path', options: { required: false }, defaultValue: './package.json' })!;
  const debug: boolean = getBooleanInput({ name: 'debug', options: { required: false } });

  core.info(`yarn: ${yarn}`);
  core.info(`targetPath: ${targetPath}`);
  core.info(`debug: ${debug}`);

  if (!fs.existsSync(targetPath)) {
    throw new Error(`No such file ${targetPath}.`);
  }

  const stat = fs.statSync(targetPath, { throwIfNoEntry: true });
  if (stat === undefined) {
    throw new Error(`Can not access to ${targetPath}.`);
  }

  if (!stat.isFile() && !fs.existsSync(path.join(targetPath, 'package.json'))) {
    throw new Error(`No such file ${path.join(targetPath, 'package.json')}.`);
  }

  const filePath = stat.isFile() ? targetPath : path.join(targetPath, 'package.json');

  const absolutePath = path.resolve(filePath);

  const workDir = path.dirname(absolutePath);
  core.info(`work dir: ${workDir}`);

  const option = yarn === true ? optionMap.yarn : optionMap.npm;

  const packageJson = JSON.parse(
    fs.readFileSync(absolutePath).toString(),
  ) as PackageJson;

  const {
    devDependencies, peerDependencies, optionalDependencies, dependencies,
  } = packageJson;

  const command = childProcess.execFileSync(
    'which',
    [yarn === true ? 'yarn' : 'npm'],
    {
      cwd: workDir,
      windowsHide: true,
      shell: false,
    },
  ).toString().trim();

  const upgradeArgs = [
    option.install.devDependencies.concat(
      Object.keys(devDependencies || {}),
    ),
    option.install.peerDependencies.concat(
      Object.keys(peerDependencies || {}),
    ),
    option.install.peerDependencies.concat(
      Object.keys(optionalDependencies || {}),
    ),
    option.install.peerDependencies.concat(
      Object.keys(dependencies || {}),
    ),
    yarn === true ? ['upgrade'] : ['update'],
  ];

  childProcess.execFileSync(
    command,
    ['install'],
    {
      cwd: workDir,
      windowsHide: true,
      shell: false,
    },
  );

  upgradeArgs
    .forEach((args) => {
      if (debug) {
        core.debug(`command: ${JSON.stringify([command].concat(args), null, 2)}`);
      }
      childProcess.execFileSync(
        command,
        args,
        {
          cwd: workDir,
          windowsHide: true,
          shell: false,
        },
      );
    });
}

Promise
  .resolve(run())
  .catch((error) => errHandler(error));
