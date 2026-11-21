/**
 * 现场包这两个值为空。监控包在打包或本地调试时写入。
 */
const enabled = process.env.VUE_APP_MONITOR_BUILD === '1';
const host = process.env.VUE_APP_MONITOR_HOST || '';

module.exports = {
  enabled,
  host,
  port: 18181
};
