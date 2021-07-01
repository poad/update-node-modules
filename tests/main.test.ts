import * as fs from 'fs';
import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'

describe('Update NPM modules', () => {
  const defaultPackageJsonPath = path.join(__dirname, 'package-test.json');
  let tmp = fs.mkdtempSync('test', { encoding: "utf8" });
  const tmpFile = path.join(tmp, 'package.json');

  const tmpPackageLockFile = path.join(tmp, 'package-lock.json');
  const tmpYarnLockFile = path.join(tmp, 'yarn.lock');

  beforeEach(() => {
    if (fs.existsSync(tmpYarnLockFile)) {
      fs.unlinkSync(tmpYarnLockFile);
    }

    if (fs.existsSync(tmpPackageLockFile)) {
      fs.unlinkSync(tmpPackageLockFile);
    }

    fs.copyFileSync(defaultPackageJsonPath, tmpFile);
  });

  afterAll(() => {
    fs.rmdirSync(tmp, { recursive: true });
  });

  test('use npm', (): void => {
    process.env['INPUT_PATH'] = './package.json';
    process.env['INPUT_YARN'] = 'false';
    process.env['INPUT_DEBUG'] = 'false';
    const np = process.execPath;
    const ip: string = path.join(__dirname, '..', 'dist', 'main.js');
    expect(fs.existsSync(ip)).toBe(true);
    const options: cp.ExecFileSyncOptions = {
      cwd: tmp,
      env: process.env,
      stdio: ['ignore', 'inherit', 'inherit'],
      encoding: 'utf-8',
    };
    const out = cp.execFileSync(np, [ip], options);
    if (out !== null) {
      console.log(out.toString());
    }
    expect(fs.existsSync(tmpPackageLockFile)).toBe(true);
    const stat = fs.statSync(tmpPackageLockFile);
    expect(stat.isFile()).toBe(true);

    const pkgJson = JSON.parse(fs.readFileSync(tmpFile).toString());

    const { devDependencies, peerDependencies } = pkgJson;

    expect(devDependencies['@types/jest']).not.toBe("26.0.13");
    expect(devDependencies['@types/node']).not.toBe("^15.12.2");
    expect(peerDependencies['@actions/core']).not.toBe("^1.0.0");
    expect(peerDependencies['jest']).not.toBe("26.6.3");
    expect(peerDependencies['ts-jest']).not.toBe("26.5.5");
    expect(peerDependencies['react-vnc']).not.toBe("0.1.16");
  });


  test('use yarn', (): void => {
    process.env['INPUT_PATH'] = './package.json';
    process.env['INPUT_YARN'] = 'true';
    process.env['INPUT_DEBUG'] = 'false';
    const np = process.execPath;
    const ip: string = path.join(__dirname, '..', 'dist', 'main.js');
    const options: cp.ExecFileSyncOptions = {
      cwd: tmp,
      env: process.env,
      stdio: ['ignore', 'inherit', 'inherit'],
      encoding: 'utf-8',
    };
    const out = cp.execFileSync(np, [ip], options);
    if (out !== null) {
      console.log(out.toString());
    }
    expect(fs.existsSync(tmpYarnLockFile)).toBe(true);
    const stat = fs.statSync(tmpYarnLockFile);
    expect(stat.isFile()).toBe(true);

    const pkgJson = JSON.parse(fs.readFileSync(tmpFile).toString());
    const { devDependencies, dependencies, peerDependencies, optionalDependencies } = pkgJson;

    expect(devDependencies['@types/jest']).not.toBe("26.0.13");
    expect(devDependencies['@types/node']).not.toBe("^15.12.2");
    expect(dependencies['@actions/core']).not.toBe("^1.0.0");
    expect(dependencies['jest']).not.toBe("26.6.3");
    expect(dependencies['ts-jest']).not.toBe("26.5.5");
    expect(peerDependencies['@octokit/core']).not.toBe("^3.5.0");
    expect(peerDependencies['@octokit/plugin-request-log']).not.toBe("1.0.0");
    expect(optionalDependencies['react-vnc']).not.toBe("0.1.16");
  });


  test('use npm with ignore', (): void => {
    process.env['INPUT_PATH'] = './package.json';
    process.env['INPUT_YARN'] = 'false';
    process.env['INPUT_DEBUG'] = 'true';
    process.env['INPUT_IGNORE'] = JSON.stringify([
      '@types/jest', 'jest', 'jest-circus', 'ts-jest', 'react-vnc'
    ]);
    const np = process.execPath;
    const ip: string = path.join(__dirname, '..', 'dist', 'main.js');
    expect(fs.existsSync(ip)).toBe(true);
    const options: cp.ExecFileSyncOptions = {
      cwd: tmp,
      env: process.env,
      stdio: ['ignore', 'inherit', 'inherit'],
      encoding: 'utf-8',
    };
    const out = cp.execFileSync(np, [ip], options);
    if (out !== null) {
      console.log(out.toString());
    }
    expect(fs.existsSync(tmpPackageLockFile)).toBe(true);
    const stat = fs.statSync(tmpPackageLockFile);
    expect(stat.isFile()).toBe(true);

    const pkgJson = JSON.parse(fs.readFileSync(tmpFile).toString());
    const { devDependencies, dependencies, peerDependencies, optionalDependencies } = pkgJson;

    const version = Number(process.version.split('.')[0].replace('v', ''))
    console.log(version);

    expect(devDependencies['@types/jest']).toBe("26.0.13");
    expect(devDependencies['@types/node']).not.toBe("^15.12.2");
    expect(dependencies['@actions/core']).not.toBe("^1.0.0");
    expect(dependencies['jest']).toBe("26.6.3");
    expect(dependencies['ts-jest']).toBe("26.5.5");
    if (version <= 14) {
      expect(peerDependencies['@octokit/core']).toBe("^3.5.0");
    } else {
      expect(peerDependencies['@octokit/core']).not.toBe("^3.5.0");
    }
    expect(peerDependencies['@octokit/plugin-request-log']).not.toBe("1.0.0");
    expect(optionalDependencies['@octokit/core']).not.toBe("^3.5.0");
    expect(optionalDependencies['react-vnc']).toBe("0.1.16");
  });

  test('use yarn with ignore', (): void => {
    process.env['INPUT_PATH'] = './package.json';
    process.env['INPUT_YARN'] = 'true';
    process.env['INPUT_DEBUG'] = 'true';
    process.env['INPUT_IGNORE'] = JSON.stringify([
      '@types/jest', 'jest', 'jest-circus', 'ts-jest', 'react-vnc'
    ]);
    const np = process.execPath;
    const ip: string = path.join(__dirname, '..', 'dist', 'main.js');
    const options: cp.ExecFileSyncOptions = {
      cwd: tmp,
      env: process.env,
      stdio: ['ignore', 'inherit', 'inherit'],
      encoding: 'utf-8',
    };
    const out = cp.execFileSync(np, [ip], options);
    if (out !== null) {
      console.log(out.toString());
    }
    expect(fs.existsSync(tmpYarnLockFile)).toBe(true);
    const stat = fs.statSync(tmpYarnLockFile);
    expect(stat.isFile()).toBe(true);
    const pkgJson = JSON.parse(fs.readFileSync(tmpFile).toString());

    const { devDependencies, dependencies, peerDependencies, optionalDependencies } = pkgJson;

    expect(devDependencies['@types/jest']).toBe("26.0.13");
    expect(devDependencies['@types/node']).not.toBe("^15.12.2");
    expect(dependencies['@actions/core']).not.toBe("^1.0.0");
    expect(dependencies['jest']).toBe("26.6.3");
    expect(dependencies['ts-jest']).toBe("26.5.5");
    expect(peerDependencies['@octokit/core']).not.toBe("^3.5.0");
    expect(peerDependencies['@octokit/plugin-request-log']).not.toBe("1.0.0");
    expect(optionalDependencies['@octokit/core']).not.toBe("^3.5.0");
    expect(optionalDependencies['react-vnc']).toBe("0.1.16");
  });
});
