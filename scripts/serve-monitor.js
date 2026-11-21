/**
 * 本地调试监控端。连本机现场程序的 18181。
 * 先另开一个终端跑 npm run electron:serve，再跑本脚本。
 */
const { spawn } = require('child_process');
const path = require('path');

const MONITOR_HOST = '127.0.0.1';
const MONITOR_DEV_PORT = '8092';

const env = Object.assign({}, process.env, {
  MONITOR_BUILD: '1',
  MONITOR_HOST: MONITOR_HOST,
  MONITOR_DEV_PORT: MONITOR_DEV_PORT,
  VUE_APP_MONITOR_BUILD: '1',
  VUE_APP_MONITOR_HOST: MONITOR_HOST
});

const bin = path.join(
  __dirname,
  '../node_modules/.bin',
  process.platform === 'win32' ? 'vue-cli-service.cmd' : 'vue-cli-service'
);

const child = spawn(bin, ['electron:serve'], {
  cwd: path.join(__dirname, '..'),
  env,
  stdio: 'inherit'
});

child.on('exit', (code) => {
  process.exit(code == null ? 1 : code);
});
