/**
 * 打监控安装包。现场电脑 IP 写在 MONITOR_HOST，打包时写进程序。
 */
const { spawn } = require('child_process');
const path = require('path');

const MONITOR_HOST = '10.8.51.200';

const env = Object.assign({}, process.env, {
  MONITOR_BUILD: '1',
  MONITOR_HOST: MONITOR_HOST,
  VUE_APP_MONITOR_BUILD: '1',
  VUE_APP_MONITOR_HOST: MONITOR_HOST
});

const bin = path.join(
  __dirname,
  '../node_modules/.bin',
  process.platform === 'win32' ? 'vue-cli-service.cmd' : 'vue-cli-service'
);

const child = spawn(bin, ['electron:build'], {
  cwd: path.join(__dirname, '..'),
  env,
  stdio: 'inherit'
});

child.on('exit', (code) => {
  process.exit(code == null ? 1 : code);
});
