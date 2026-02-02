import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Menu,
  dialog,
  Tray,
  screen
} from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import nodes7 from 'nodes7';
import HttpUtil from '@/utils/HttpUtil';
import logger from 'electron-log';
// 设置日志文件的保存路径
logger.transports.file.file = app.getPath('userData') + '/app.log';

// 初始化日志记录器
logger.transports.file.level = 'info';
logger.transports.console.level = 'info';
// 日期样式
logger.transports.file.format =
  '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}';
console.log(app.getPath('userData'));
logger.transports.file.file = app.getPath('userData') + '/app.log';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
var appTray = null;
let closeStatus = false;
var conn = new nodes7();

// 记录日志的辅助函数
function logToFile(message) {
  const timestamp = new Date().toLocaleString();
  const logPath =
    'D://wcs_temp_data/log/' +
    new Date().toLocaleDateString().replaceAll('/', '-') +
    'runlog.txt';
  fs.appendFile(logPath, `[${timestamp}] ${message}\n`, (err) => {
    if (err) console.error('Error writing to log file:', err);
  });
}

// 日志缓冲相关变量
let logBuffer = [];
let logBufferTimer = null;
const LOG_BUFFER_SIZE = 10; // 缓冲区大小
const LOG_FLUSH_INTERVAL = 5000; // 5秒刷新一次

// 优化的日志写入函数
function writeLogToLocalOptimized(logData) {
  // 添加时间戳
  const timestamp = new Date().toLocaleString();
  const logEntry = `[${timestamp}] ${logData}\n`;

  // 添加到缓冲区
  logBuffer.push(logEntry);

  // 如果缓冲区满了，立即刷新
  if (logBuffer.length >= LOG_BUFFER_SIZE) {
    flushLogBuffer();
  } else if (!logBufferTimer) {
    // 设置定时器，定期刷新缓冲区
    logBufferTimer = setTimeout(() => {
      flushLogBuffer();
    }, LOG_FLUSH_INTERVAL);
  }
}

// 刷新日志缓冲区
function flushLogBuffer() {
  if (logBuffer.length === 0) return;

  const logPath =
    'D://wcs_temp_data/log/' +
    (new Date().toLocaleDateString() + '.txt').replaceAll('/', '-');

  // 确保日志目录存在
  const logDir = 'D://wcs_temp_data/log';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // 检查日志文件大小，如果超过10MB则进行轮转
  try {
    if (fs.existsSync(logPath)) {
      const stats = fs.statSync(logPath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      if (fileSizeInMB > 10) {
        // 创建备份文件
        const backupPath = logPath.replace('.txt', `_${Date.now()}.txt`);
        fs.renameSync(logPath, backupPath);
        console.log(`日志文件过大，已轮转到: ${backupPath}`);
      }
    }
  } catch (error) {
    console.error('检查日志文件大小时出错:', error);
  }

  // 批量写入日志
  const logContent = logBuffer.join('');
  fs.appendFile(logPath, logContent, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });

  // 清空缓冲区
  logBuffer = [];

  // 清除定时器
  if (logBufferTimer) {
    clearTimeout(logBufferTimer);
    logBufferTimer = null;
  }
}
// electron 开启热更新
try {
  require('electron-reloader')(module, {});
} catch (_) {
  // 忽略热更新错误
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出时确保所有日志都被写入
app.on('before-quit', () => {
  flushLogBuffer();
});

// 单实例锁，防止应用被多开 - 必须在app.ready之前检查
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  // 直接退出，不创建任何窗口，避免白色背景框
  console.log('检测到已有程序运行，直接退出');
  // 使用 process.exit 确保立即退出，避免任何延迟
  process.exit(0);
} else {
  app.on('second-instance', (event, argv, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });
}

global.sharedObject = {
  userInfo: {}
};
let mainWindow = null;
app.on('ready', () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 600,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false
    },
    icon: './build/icons/icon.ico'
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    mainWindow.loadURL('app://./index.html');
    // mainWindow.webContents.openDevTools();
  }
  ipcMain.on('logStatus', (event, arg) => {
    console.log(arg);
    if (arg === 'login') {
      mainWindow.setResizable(true);
      mainWindow.setBounds({
        x: 0,
        y: 0,
        width: screen.getPrimaryDisplay().workAreaSize.width,
        height: screen.getPrimaryDisplay().workAreaSize.height
      });
    } else {
      // 太几把坑了，windows系统setSize center方法失效 必须先mainWindow.unmaximize()
      mainWindow.unmaximize();
      mainWindow.setSize(1100, 600);
      mainWindow.center();
      global.sharedObject.userInfo = {};
      // mainWindow.setResizable(false)
    }
  });
  // 定义自定义事件
  ipcMain.on('close-window', function () {
    mainWindow.close();
  });
  // 定义自定义事件
  ipcMain.on('min-window', (event, arg) => {
    mainWindow.minimize();
  });
  // writeValuesToPLC
  ipcMain.on('writeValuesToPLC', (event, arg1, arg2) => {
    writeValuesToPLC(arg1, arg2);
  });
  // writeSingleValueToPLC - 单独给PLC某个变量写值，通过批量写入数组实现
  ipcMain.on('writeSingleValueToPLC', (event, arg1, arg2) => {
    writeSingleValueToPLC(arg1, arg2);
  });
  // cancelWriteToPLC - 取消PLC某个变量的写入
  ipcMain.on('cancelWriteToPLC', (event, arg1) => {
    cancelWriteToPLC(arg1);
  });
  // 定义自定义事件
  ipcMain.on('max-window', (event, arg) => {
    if (arg === 'max-window') {
      return mainWindow.maximize();
    }
    mainWindow.unmaximize();
    mainWindow.setBounds({
      x: 10,
      y: 10,
      width: screen.getPrimaryDisplay().workAreaSize.width - 20,
      height: screen.getPrimaryDisplay().workAreaSize.height - 20
    });
  });
  // 启动plc conPLC
  ipcMain.on('conPLC', (event, arg1, arg2) => {
    if (process.env.NODE_ENV === 'production') {
      conPLC();
    }
    // setInterval(() => {
    //   console.log(writeStrArr.toString());
    // }, 50);
    // sendHeartToPLC()
  });
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('mainWin-max', 'max-window');
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('mainWin-max', 'unmax-window');
  });
  mainWindow.on('close', (e) => {
    closeStatus = true;
    e.preventDefault(); //先阻止一下默认行为，不然直接关了，提示框只会闪一下
    dialog
      .showMessageBox({
        type: 'warning',
        title: '提醒！',
        message: '确认关闭程序吗？',
        buttons: ['关闭程序', '放入托盘', '取消'], //选择按钮，点击确认则下面的idx为0，取消为1
        cancelId: 2 //这个的值是如果直接把提示框×掉返回的值，这里设置成和"取消"按钮一样的值，下面的idx也会是1
      })
      .then((idx) => {
        if (idx.response == 2) {
          e.preventDefault();
        } else if (idx.response == 0) {
          mainWindow = null;
          app.exit();
        } else {
          mainWindow.setSkipTaskbar(true);
          mainWindow.hide();
        }
      });
  });
  if (process.env.NODE_ENV === 'development') {
    let revert = false;
    setInterval(() => {
      if (mainWindow) {
        if (revert) {
          mainWindow.webContents.send(
            'receivedMsg',
            {
              DBW0: 0
            },
            writeStrArr.toString()
          );
        } else {
          mainWindow.webContents.send(
            'receivedMsg',
            {
              DBW0: 1
            },
            writeStrArr.toString()
          );
        }
        revert = !revert;
      }
    }, 500);
  }
  setAppTray();
  if (process.env.NODE_ENV === 'production') {
    try {
      const javaPath = path.join(
        __static,
        './jre',
        'jre1.8.0_251',
        'bin',
        'java'
      );
      const jarPath = path.join(
        __static,
        './jarlib',
        'ccs-disinfection-changzhou-middle.jar'
      );

      // 优化的Java启动参数
      const javaOpts = [
        // 内存设置
        '-Xmx4096m', // 最大堆内存
        '-Xms4096m', // 初始堆内存
        '-XX:MaxMetaspaceSize=512m', // 最大元空间大小
        '-XX:MetaspaceSize=256m', // 初始元空间大小

        // GC设置
        '-XX:+UseG1GC', // 使用G1垃圾收集器
        '-XX:MaxGCPauseMillis=200', // 最大GC停顿时间
        '-XX:+HeapDumpOnOutOfMemoryError', // 内存溢出时导出堆转储
        '-XX:HeapDumpPath=D://wcs_temp_data/dump', // 堆转储文件路径

        // 性能优化
        '-XX:+DisableExplicitGC', // 禁止显式GC调用
        '-XX:+UseStringDeduplication', // 开启字符串去重
        '-XX:+OptimizeStringConcat', // 优化字符串连接

        // 监控和调试
        '-XX:+PrintGCDetails', // 打印GC详细信息
        '-XX:+PrintGCDateStamps', // 打印GC时间戳
        '-Xloggc:D://wcs_temp_data/log/gc.log', // GC日志文件
        '-XX:+HeapDumpBeforeFullGC', // Full GC前生成堆转储
        '-XX:+PrintGCApplicationStoppedTime', // 打印应用暂停时间

        // 错误处理
        '-XX:+ExitOnOutOfMemoryError', // 发生OOM时退出
        '-XX:ErrorFile=D://wcs_temp_data/log/hs_err_%p.log', // JVM错误日志
        // 编码
        '-Dfile.encoding=UTF-8',
        // 应用参数
        '-jar',
        jarPath
      ];
      // 确保日志目录存在
      const logDir = 'D://wcs_temp_data/log';
      const dumpDir = 'D://wcs_temp_data/dump';
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      if (!fs.existsSync(dumpDir)) {
        fs.mkdirSync(dumpDir, { recursive: true });
      }

      logToFile(`启动Java进程，使用参数: ${javaOpts.join(' ')}`);
      const process = spawn(javaPath, javaOpts);

      process.on('error', (err) => {
        logToFile(`Java程序启动错误: ${err.message}`);
      });

      process.on('exit', (code, signal) => {
        logToFile(`Java程序退出，退出码: ${code}, 信号: ${signal}`);
      });
    } catch (error) {
      logToFile(`Java程序启动异常: ${error.message}`);
    }
  }

  // 开发者工具
  globalShortcut.register('CommandOrControl+L', () => {
    mainWindow.webContents.openDevTools();
  });
  globalShortcut.register('CommandOrControl+F11', () => {
    mainWindow.isFullScreen()
      ? mainWindow.setFullScreen(false)
      : mainWindow.setFullScreen(true);
  });
  // 定义自定义事件
  ipcMain.on('full_screen', function () {
    mainWindow.isFullScreen()
      ? mainWindow.setFullScreen(false)
      : mainWindow.setFullScreen(true);
  });
  // 定义自定义事件 - 优化后的日志写入
  ipcMain.on('writeLogToLocal', (event, arg) => {
    writeLogToLocalOptimized(arg);
  });
});

function conPLC() {
  logger.info('开始连接PLC');
  // 查询配置
  HttpUtil.get('/cssConfig/getConfig')
    .then((res) => {
      logger.info(JSON.stringify(res));
      if (!res.data.plcPort) {
        logger.info('配置查询失败');
        // We have an error. Maybe the PLC is not reachable.
        conPLC();
        return false;
      }
      conn.initiateConnection(
        {
          port: Number(res.data.plcPort),
          host: res.data.plcIp,
          rack: 0,
          slot: 1,
          debug: false
        },
        (err) => {
          if (typeof err !== 'undefined') {
            logger.info('连接PLC失败' + JSON.stringify(err));
            // We have an error. Maybe the PLC is not reachable.
            conPLC();
            return false;
            // process.exit();
          }
          conn.setTranslationCB(function (tag) {
            return variables[tag];
          }); // This sets the "translation" to allow us to work with object names
          logger.info('连接PLC成功');

          // --- 添加读取监控点位 (基于读取PLC点位.csv) ---
          // 基础信号
          conn.addItems('DBW0'); // 输送线看门狗心跳
          conn.addItems('DBW2'); // 输送线当前运行状态
          conn.addItems('DBW4'); // 区域报警
          conn.addItems('DBW6'); // 缓存线电机运行信号-1
          conn.addItems('DBW8'); // 缓存线电机运行信号-2
          // 灭菌线电机运行信号
          conn.addItems('DBW10'); // 1\2#灭菌线线电机运行信号--1
          conn.addItems('DBW12'); // 1\2#灭菌线线电机运行信号--2
          conn.addItems('DBW14'); // 1\2#灭菌线线电机运行信号--3
          conn.addItems('DBW16'); // 3\4#灭菌线线电机运行信号--1
          conn.addItems('DBW18'); // 3\4#灭菌线线电机运行信号--2
          conn.addItems('DBW20'); // 3\4#灭菌线线电机运行信号--3
          conn.addItems('DBW22'); // 5\6#灭菌线线电机运行信号--1
          conn.addItems('DBW24'); // 5\6#灭菌线线电机运行信号--2
          conn.addItems('DBW26'); // 5\6#灭菌线线电机运行信号--3
          conn.addItems('DBW28'); // 7\8#灭菌线线电机运行信号--1
          conn.addItems('DBW30'); // 7\8#灭菌线线电机运行信号--2
          conn.addItems('DBW32'); // 7\8#灭菌线线电机运行信号--3
          conn.addItems('DBW34'); // 9\10#灭菌线线电机运行信号--1
          conn.addItems('DBW36'); // 9\10#灭菌线线电机运行信号--2
          conn.addItems('DBW38'); // 9\10#灭菌线线电机运行信号--3
          conn.addItems('DBW40'); // 11\12#灭菌线线电机运行信号--1
          conn.addItems('DBW42'); // 11\12#灭菌线线电机运行信号--2
          conn.addItems('DBW44'); // 11\12#灭菌线线电机运行信号--3
          conn.addItems('DBW46'); // 13\14#灭菌线线电机运行信号--1
          conn.addItems('DBW48'); // 13\14#灭菌线线电机运行信号--2
          conn.addItems('DBW50'); // 13\14#灭菌线线电机运行信号--3
          conn.addItems('DBW52'); // 15#灭菌线和出口线电机运行信号--1
          conn.addItems('DBW54'); // 15#灭菌线和出口线电机运行信号--2
          conn.addItems('DBW56'); // 15#灭菌线和出口线电机运行信号--3
          // RGV
          conn.addItems('DBW58'); // RGV小车位置值
          conn.addItems('DBW60'); // RGV电机运行信号
          // 缓存线占位虚拟ID
          for (let i = 62; i <= 118; i += 2) conn.addItems('DBW' + i);
          for (let i = 1800; i <= 1898; i += 2) conn.addItems('DBW' + i);
          // 灭菌线占位虚拟ID
          for (let i = 120; i <= 178; i += 2) conn.addItems('DBW' + i); // 1\2#
          for (let i = 200; i <= 278; i += 2) conn.addItems('DBW' + i); // 3\4#
          for (let i = 280; i <= 358; i += 2) conn.addItems('DBW' + i); // 5\6#
          for (let i = 360; i <= 438; i += 2) conn.addItems('DBW' + i); // 7\8#
          for (let i = 440; i <= 518; i += 2) conn.addItems('DBW' + i); // 9\10#
          for (let i = 520; i <= 598; i += 2) conn.addItems('DBW' + i); // 11\12#
          for (let i = 600; i <= 678; i += 2) conn.addItems('DBW' + i); // 13\14#
          for (let i = 680; i <= 758; i += 2) conn.addItems('DBW' + i); // 15#
          // 缓存线电机货物目的地
          for (let i = 800; i <= 858; i += 2) conn.addItems('DBW' + i);
          for (let i = 1900; i <= 1960; i += 2) conn.addItems('DBW' + i);
          // 灭菌线电机货物目的地
          for (let i = 860; i <= 938; i += 2) conn.addItems('DBW' + i);
          for (let i = 940; i <= 1008; i += 2) conn.addItems('DBW' + i);
          for (let i = 1020; i <= 1090; i += 2) conn.addItems('DBW' + i);
          for (let i = 1100; i <= 1170; i += 2) conn.addItems('DBW' + i);
          for (let i = 1180; i <= 1250; i += 2) conn.addItems('DBW' + i);
          for (let i = 1260; i <= 1330; i += 2) conn.addItems('DBW' + i);
          for (let i = 1340; i <= 1410; i += 2) conn.addItems('DBW' + i);
          for (let i = 1420; i <= 1496; i += 2) conn.addItems('DBW' + i);
          // 柜内实际数量
          for (let i = 1500; i <= 1528; i += 2) conn.addItems('DBW' + i); // 预热柜
          for (let i = 1530; i <= 1558; i += 2) conn.addItems('DBW' + i); // 灭菌柜
          // 传感器信号
          conn.addItems('DBW1606');
          conn.addItems('DBW1608');
          for (let i = 1610; i <= 1656; i += 2) conn.addItems('DBW' + i);
          // 请求信号
          conn.addItems('DBW1658'); // 上货请求
          conn.addItems('DBW1670'); // 灭菌出货请求1
          conn.addItems('DBW1672'); // 灭菌出货请求2

          setInterval(() => {
            conn.readAllItems(valuesReady);
          }, 200);
          setInterval(() => {
            // nodes7 代码
            conn.writeItems(writeAddArr, writeStrArr, valuesWritten);
          }, 200);
          // 发送心跳
          sendHeartToPLC();
        }
      );
    })
    .catch((err) => {
      logger.info('config error!' + err);
    });
}
let times = 1;
let nowValue = 0;
function sendHeartToPLC() {
  setInterval(() => {
    if (times > 5) {
      times = 1;
      nowValue = 1 - nowValue;
    }
    times++;
    // 使用新的心跳地址 W_DBW0 (DB1001.DBW0)
    writeValuesToPLC('W_DBW0', nowValue);
  }, 200); // 每200毫秒执行一次交替
}

var variables = {
  DBW0: 'DB1000,INT0', // 输送线看门狗心跳 [cite: 1]
  DBW2: 'DB1000,INT2', // 输送线当前运行状态 [cite: 1]
  DBW4: 'DB1000,INT4', // 区域报警 [cite: 1]
  DBW6: 'DB1000,INT6', // 缓存线电机运行信号-1 [cite: 2]
  DBW8: 'DB1000,INT8', // 缓存线电机运行信号-2 [cite: 4]
  DBW10: 'DB1000,INT10', // 1\2#灭菌线线电机运行信号--1 [cite: 6]
  DBW12: 'DB1000,INT12', // 1\2#灭菌线线电机运行信号--2 [cite: 7]
  DBW14: 'DB1000,INT14', // 1\2#灭菌线线电机运行信号--3 [cite: 8]
  DBW16: 'DB1000,INT16', // 3\4#灭菌线线电机运行信号--1 [cite: 9]
  DBW18: 'DB1000,INT18', // 3\4#灭菌线线电机运行信号--2 [cite: 10]
  DBW20: 'DB1000,INT20', // 3\4#灭菌线线电机运行信号--3 [cite: 11]
  DBW22: 'DB1000,INT22', // 5\6#灭菌线线电机运行信号--1 [cite: 12]
  DBW24: 'DB1000,INT24', // 5\6#灭菌线线电机运行信号--2 [cite: 13]
  DBW26: 'DB1000,INT26', // 5\6#灭菌线线电机运行信号--3 [cite: 14]
  DBW28: 'DB1000,INT28', // 7\8#灭菌线线电机运行信号--1 [cite: 15]
  DBW30: 'DB1000,INT30', // 7\8#灭菌线线电机运行信号--2 [cite: 16]
  DBW32: 'DB1000,INT32', // 7\8#灭菌线线电机运行信号--3 [cite: 17]
  DBW34: 'DB1000,INT34', // 9\10#灭菌线线电机运行信号--1 [cite: 18]
  DBW36: 'DB1000,INT36', // 9\10#灭菌线线电机运行信号--2 [cite: 19]
  DBW38: 'DB1000,INT38', // 9\10#灭菌线线电机运行信号--3 [cite: 20]
  DBW40: 'DB1000,INT40', // 11\12#灭菌线线电机运行信号--1 [cite: 21]
  DBW42: 'DB1000,INT42', // 11\12#灭菌线线电机运行信号--2 [cite: 22]
  DBW44: 'DB1000,INT44', // 11\12#灭菌线线电机运行信号--3 [cite: 24]
  DBW46: 'DB1000,INT46', // 13\14#灭菌线线电机运行信号--1 [cite: 25]
  DBW48: 'DB1000,INT48', // 13\14#灭菌线线电机运行信号--2 [cite: 26]
  DBW50: 'DB1000,INT50', // 13\14#灭菌线线电机运行信号--3 [cite: 27]
  DBW52: 'DB1000,INT52', // 15#灭菌线和出口线电机运行信号--1 [cite: 28]
  DBW54: 'DB1000,INT54', // 15#灭菌线和出口线电机运行信号--2 [cite: 29]
  DBW56: 'DB1000,INT56', // 15#灭菌线和出口线电机运行信号--3 [cite: 30]
  DBW58: 'DB1000,INT58', // RGV小车位置值 [cite: 30]
  DBW60: 'DB1000,INT60', // RGV电机运行信号 [cite: 30]
  // 缓存线占位虚拟ID
  ...generateVariables(62, 118, 'DB1000,INT'),
  ...generateVariables(1800, 1898, 'DB1000,INT'),
  // 灭菌线占位虚拟ID
  ...generateVariables(120, 178, 'DB1000,INT'),
  ...generateVariables(200, 278, 'DB1000,INT'),
  ...generateVariables(280, 358, 'DB1000,INT'),
  ...generateVariables(360, 438, 'DB1000,INT'),
  ...generateVariables(440, 518, 'DB1000,INT'),
  ...generateVariables(520, 598, 'DB1000,INT'),
  ...generateVariables(600, 678, 'DB1000,INT'),
  ...generateVariables(680, 758, 'DB1000,INT'),
  // 缓存线电机货物目的地
  ...generateVariables(800, 858, 'DB1000,INT'),
  ...generateVariables(1900, 1960, 'DB1000,INT'),
  // 灭菌线电机货物目的地
  ...generateVariables(860, 938, 'DB1000,INT'),
  ...generateVariables(940, 1008, 'DB1000,INT'),
  ...generateVariables(1020, 1090, 'DB1000,INT'),
  ...generateVariables(1100, 1170, 'DB1000,INT'),
  ...generateVariables(1180, 1250, 'DB1000,INT'),
  ...generateVariables(1260, 1330, 'DB1000,INT'),
  ...generateVariables(1340, 1410, 'DB1000,INT'),
  ...generateVariables(1420, 1496, 'DB1000,INT'),
  // 柜内实际数量
  ...generateVariables(1500, 1528, 'DB1000,INT'),
  ...generateVariables(1530, 1558, 'DB1000,INT'),
  // 传感器信号
  DBW1606: 'DB1000,INT1606', // [cite: 123]
  DBW1608: 'DB1000,INT1608', // [cite: 124]
  ...generateVariables(1610, 1656, 'DB1000,INT'),
  // 请求信号
  DBW1658: 'DB1000,INT1658', // 上货请求读码 [cite: 147]
  DBW1670: 'DB1000,INT1670', // 灭菌出货请求1 [cite: 148]
  DBW1672: 'DB1000,INT1672', // 灭菌出货请求2 [cite: 149]

  // --- 写入 (DB1001) ---
  W_DBW0: 'DB1001,INT0', // WCS看门狗心跳 [cite: 150]
  W_DBW2: 'DB1001,INT2', // WCS-全线启动（系统在线） [cite: 150]
  W_DBW4: 'DB1001,INT4', // WCS-全线停止 [cite: 150]
  W_DBW6: 'DB1001,INT6', // WCS-允许进料 [cite: 150]
  W_DBW8: 'DB1001,INT8', // WCS-故障复位 [cite: 150]
  W_DBW10: 'DB1001,INT10', // WCS上货位写虚拟ID [cite: 150]
  W_DBW12: 'DB1001,INT12', // WCS上货位写目的地 [cite: 150]
  W_DBW14: 'DB1001,INT14', // WCS执行出货预热房编号 [cite: 150]
  W_DBW16: 'DB1001,INT16', // WCS执行进货灭菌柜编号 [cite: 150]
  // DBW18的位定义 - 按物理地址线性顺序展开
  W_DBW18_BIT0: 'DB1001,X18.0',
  W_DBW18_BIT1: 'DB1001,X18.1',
  W_DBW18_BIT2: 'DB1001,X18.2',
  W_DBW18_BIT3: 'DB1001,X18.3',
  W_DBW18_BIT4: 'DB1001,X18.4',
  W_DBW18_BIT5: 'DB1001,X18.5',
  W_DBW18_BIT6: 'DB1001,X18.6',
  W_DBW18_BIT7: 'DB1001,X18.7',
  W_DBW18_BIT8: 'DB1001,X19.0', // 进位到下一个字节
  W_DBW18_BIT9: 'DB1001,X19.1',
  W_DBW18_BIT10: 'DB1001,X19.2',
  W_DBW18_BIT11: 'DB1001,X19.3',
  W_DBW18_BIT12: 'DB1001,X19.4',
  W_DBW18_BIT13: 'DB1001,X19.5',
  W_DBW18_BIT14: 'DB1001,X19.6',
  W_DBW18_BIT15: 'DB1001,X19.7',
  // DBW20的位定义 - 按物理地址线性顺序展开
  W_DBW20_BIT0: 'DB1001,X20.0',
  W_DBW20_BIT1: 'DB1001,X20.1',
  W_DBW20_BIT2: 'DB1001,X20.2',
  W_DBW20_BIT3: 'DB1001,X20.3',
  W_DBW20_BIT4: 'DB1001,X20.4',
  W_DBW20_BIT5: 'DB1001,X20.5',
  W_DBW20_BIT6: 'DB1001,X20.6',
  W_DBW20_BIT7: 'DB1001,X20.7',
  W_DBW20_BIT8: 'DB1001,X21.0', // 进位到下一个字节
  W_DBW20_BIT9: 'DB1001,X21.1',
  W_DBW20_BIT10: 'DB1001,X21.2',
  W_DBW20_BIT11: 'DB1001,X21.3',
  W_DBW20_BIT12: 'DB1001,X21.4',
  W_DBW20_BIT13: 'DB1001,X21.5',
  W_DBW20_BIT14: 'DB1001,X21.6',
  W_DBW20_BIT15: 'DB1001,X21.7',

  W_DBW22: 'DB1001,INT22', // WCS执行小车移栽命令 [cite: 151]
  W_DBW24: 'DB1001,INT24', // WCS修改电机编号 [cite: 151]
  W_DBW26: 'DB1001,INT26', // WCS修改目的地 [cite: 151]
  W_DBW28: 'DB1001,INT28', // WCS下修改模拟ID [cite: 151]
  W_DBW30: 'DB1001,INT30', // WCS下发修改命令 [cite: 151]
  W_DBW32: 'DB1001,INT32', // 系统无码模式切换 [cite: 152]
  W_DBW34: 'DB1001,INT34', // 手自动动切换 [cite: 152]
  W_DBW36: 'DB1001,INT36', // 选定电机编号1 [cite: 152]
  W_DBW38: 'DB1001,INT38', // 选定电机编号2 [cite: 152]
  W_DBW40: 'DB1001,INT40', // 选定电机编号3 [cite: 152]
  W_DBW42: 'DB1001,INT42', // 选定电机编号4 [cite: 152]
  W_DBW44: 'DB1001,INT44', // 电机前进 (PDA1/PDA2) [cite: 152]
  W_DBW46: 'DB1001,INT46', // 电机后退 (PDA1/PDA2) [cite: 152]
  W_DBW48: 'DB1001,INT48', // 顶升上升 (PDA1/PDA2) [cite: 152]
  W_DBW50: 'DB1001,INT50', // 顶升下降 (PDA1/PDA2) [cite: 152]
  W_DBW52: 'DB1001,INT52', // 小车左移 (PDA1/PDA2) [cite: 152]
  W_DBW54: 'DB1001,INT54', // 小车右移 (PDA1/PDA2) [cite: 152]
  W_DBW56: 'DB1001,INT56', // WCS修改目标数量 [cite: 152]
  W_DBW58: 'DB1001,INT58', // 双线单线缓存模式 [cite: 152]
  // 出灭菌柜线链条电机货物目的地
  ...generateVariables(60, 118, 'DB1001,INT', 'W_'),
  // 出灭菌线占位虚拟ID码
  ...generateVariables(120, 178, 'DB1001,INT', 'W_'),
  W_DBW180: 'DB1001,INT180', // 进货错误停止信号 [cite: 253]
  // PDA2 选定电机
  W_DBW182: 'DB1001,INT182', // 选定电机编号5 [cite: 253]
  W_DBW184: 'DB1001,INT184', // 选定电机编号6 [cite: 253]
  W_DBW186: 'DB1001,INT186', // 选定电机编号7 [cite: 253]
  W_DBW188: 'DB1001,INT188' // 选定电机编号8 [cite: 253]
};

// 辅助函数：生成连续变量对象
function generateVariables(start, end, prefix, keyPrefix = '') {
  const vars = {};
  for (let i = start; i <= end; i += 2) {
    vars[keyPrefix + 'DBW' + i] = prefix + i;
  }
  return vars;
}

// 批量写入数组初始化
// 包含了所有主要的控制点位，默认置0
var writeStrArr = [0, 0, 0, 0, 0];
var writeAddArr = ['W_DBW0', 'W_DBW2', 'W_DBW4', 'W_DBW6', 'W_DBW8'];

// 给PLC写值
function writeValuesToPLC(add, values) {
  const index = writeAddArr.indexOf(add);
  if (index !== -1) {
    writeStrArr[index] = values;
  } else {
    console.warn(`Address ${add} not found in writeAddArr.`);
  }
}

// 单独给PLC某个变量写值，通过操作批量写入数组实现，避免写入冲突
function writeSingleValueToPLC(add, values) {
  if (!variables[add]) {
    console.warn(`Address ${add} not found in variables.`);
    return;
  }

  // 查找地址在批量写入数组中的索引
  const index = writeAddArr.indexOf(add);

  if (index !== -1) {
    // 地址已存在，直接更新值（这个操作是原子的）
    writeStrArr[index] = values;
    console.log(`更新PLC地址 ${add} 的值为：${values}`);
  } else {
    // 地址不存在，使用原子性操作添加到批量写入数组
    const newAddArr = [...writeAddArr, add];
    const newStrArr = [...writeStrArr, values];

    // 原子性替换数组内容
    writeAddArr.length = 0;
    writeStrArr.length = 0;
    writeAddArr.push(...newAddArr);
    writeStrArr.push(...newStrArr);

    console.log(`添加PLC地址 ${add} 到批量写入数组，值：${values}`);
  }
}

// 取消PLC某个变量的写入，从批量写入数组中移除
function cancelWriteToPLC(add) {
  // 使用 filter 方法重建数组，避免 splice 的并发问题
  const originalLength = writeAddArr.length;
  const newAddArr = [];
  const newStrArr = [];

  for (let i = 0; i < writeAddArr.length; i++) {
    if (writeAddArr[i] !== add) {
      newAddArr.push(writeAddArr[i]);
      newStrArr.push(writeStrArr[i]);
    }
  }

  // 检查是否找到并移除了地址
  if (newAddArr.length === originalLength) {
    console.warn(`Address ${add} not found in writeAddArr, cannot cancel.`);
    return false;
  }

  // 原子性替换数组内容
  writeAddArr.length = 0;
  writeStrArr.length = 0;
  writeAddArr.push(...newAddArr);
  writeStrArr.push(...newStrArr);

  console.log(`已从批量写入数组中移除PLC地址：${add}`);

  // 验证数组长度一致性
  if (writeAddArr.length !== writeStrArr.length) {
    console.error(
      `数组长度不一致！地址数组长度：${writeAddArr.length}，值数组长度：${writeStrArr.length}`
    );
  }

  return true;
}

function valuesWritten(anythingBad) {
  if (anythingBad) {
    console.log('SOMETHING WENT WRONG WRITING VALUES!!!!');
  }
}

function valuesReady(anythingBad, values) {
  if (anythingBad) {
    console.log('SOMETHING WENT WRONG READING VALUES!!!!');
  }
  // console.log(values)
  mainWindow.webContents.send('receivedMsg', values, writeStrArr.toString());
}

const setAppTray = () => {
  // 系统托盘右键菜单
  var trayMenuTemplate = [
    {
      label: '退出',
      click: function () {
        app.quit();
      }
    }
  ];

  // 系统托盘图标目录
  appTray = new Tray(path.join(__static, './icon.ico'));

  // 图标的上下文菜单
  const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);

  // 设置此托盘图标的悬停提示内容
  appTray.setToolTip('WCS系统');

  // 设置此图标的上下文菜单
  appTray.setContextMenu(contextMenu);

  appTray.on('click', function () {
    //主窗口显示隐藏切换
    if (mainWindow.isVisible()) {
      mainWindow.hide();
      mainWindow.setSkipTaskbar(true);
    } else {
      mainWindow.show();
      mainWindow.setSkipTaskbar(false);
    }
  });
};
