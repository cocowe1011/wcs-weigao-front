const { defineConfig } = require('@vue/cli-service');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const path = require('path');

const isMonitorBuild = process.env.MONITOR_BUILD === '1';
const monitorHost = process.env.MONITOR_HOST || '';

function bakeMonitorEnv(config) {
  config.plugin('define').tap((args) => {
    const definitions = args[0];
    const bakedBuild = JSON.stringify(isMonitorBuild ? '1' : '');
    const bakedHost = JSON.stringify(monitorHost);
    if (
      definitions['process.env'] &&
      typeof definitions['process.env'] === 'object'
    ) {
      definitions['process.env'].VUE_APP_MONITOR_BUILD = bakedBuild;
      definitions['process.env'].VUE_APP_MONITOR_HOST = bakedHost;
    }
    definitions['process.env.VUE_APP_MONITOR_BUILD'] = bakedBuild;
    definitions['process.env.VUE_APP_MONITOR_HOST'] = bakedHost;
    return args;
  });
}

const builderOptions = {
  productName: isMonitorBuild ? 'wcs-weigao-monitor' : 'wcs-weigao-front',
  appId: isMonitorBuild ? 'com.wl.wcs.monitor' : 'com.wl.wcs',
  copyright: 'wl',
  nsis: {
    oneClick: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    installerIcon: './build/icons/icon.ico',
    uninstallerIcon: './build/icons/icon.ico',
    installerHeaderIcon: './build/icons/icon.ico',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: isMonitorBuild ? 'WCS监控' : 'WCS',
    runAfterFinish: false
  },
  win: {
    icon: 'build/icons/icon.ico',
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ]
  },
  asar: false
};

if (isMonitorBuild) {
  builderOptions.directories = {
    output: 'dist_electron_monitor'
  };
  // 监控包不启动 Java，不把 public 里的虚拟机和中间件 jar 打进安装包
  builderOptions.files = ['**/*', '!jre/**', '!jarlib/**'];
}

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: Number(process.env.MONITOR_DEV_PORT) || 8090
  },
  configureWebpack: {
    resolve: {
      fallback: {
        fs: false,
        crypto: require.resolve('crypto-browserify')
      },
      alias: {
        '@': path.join(__dirname, 'src')
      }
    },
    plugins: [new NodePolyfillPlugin()]
  },
  chainWebpack: (config) => {
    bakeMonitorEnv(config);
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      outputDir: isMonitorBuild ? 'dist_electron_monitor' : 'dist_electron',
      chainWebpackMainProcess: (config) => {
        bakeMonitorEnv(config);
      },
      builderOptions
    }
  }
});
