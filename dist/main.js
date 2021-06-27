"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const childProcess = __importStar(require("child_process"));
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
const errHandler = (error) => {
    core.error(error.message);
    core.setFailed(error.message);
};
const getInput = (params) => {
    const value = core.getInput(params.name, params.options);
    return value || params.defaultValue;
};
const getBooleanInput = (params) => {
    const value = core.getBooleanInput(params.name, params.options);
    return (value || params.defaultValue) || false;
};
async function run() {
    const yarn = getBooleanInput({ name: 'yarn', options: { required: false } });
    const targetPath = getInput({ name: 'path', options: { required: false }, defaultValue: './package.json' });
    const debug = getBooleanInput({ name: 'debug', options: { required: false } });
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
    const packageJson = JSON.parse(fs.readFileSync(absolutePath).toString());
    const { devDependencies, peerDependencies, optionalDependencies, dependencies, } = packageJson;
    const command = childProcess.execFileSync('which', [yarn === true ? 'yarn' : 'npm'], {
        cwd: workDir,
        windowsHide: true,
        shell: false,
    }).toString().trim();
    const upgradeArgs = [
        option.install.devDependencies.concat(Object.keys(devDependencies || {})),
        option.install.peerDependencies.concat(Object.keys(peerDependencies || {})),
        option.install.peerDependencies.concat(Object.keys(optionalDependencies || {})),
        option.install.peerDependencies.concat(Object.keys(dependencies || {})),
        yarn === true ? ['upgrade'] : ['update'],
    ];
    childProcess.execFileSync(command, ['install'], {
        cwd: workDir,
        windowsHide: true,
        shell: false,
    });
    upgradeArgs
        .forEach((args) => {
        if (debug) {
            core.debug(`command: ${JSON.stringify([command].concat(args), null, 2)}`);
        }
        childProcess.execFileSync(command, args, {
            cwd: workDir,
            windowsHide: true,
            shell: false,
        });
    });
}
Promise
    .resolve(run())
    .catch((error) => errHandler(error));
