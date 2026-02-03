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

          // --- 1. 基础信号 ---
          conn.addItems('DBW0'); // 输送线看门狗心跳
          conn.addItems('DBW2'); // 输送线当前运行状态
          conn.addItems('DBW4'); // 区域报警
          conn.addItems('DBW6'); // 缓存线电机运行信号-1
          conn.addItems('DBW8'); // 缓存线电机运行信号-2
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
          conn.addItems('DBW58'); // RGV小车位置值
          conn.addItems('DBW60'); // RGV电机运行信号

          // --- 2. 缓存线各个电机占位虚拟ID码 (DBW62-DBW118) ---
          conn.addItems('DBW62');
          conn.addItems('DBW64');
          conn.addItems('DBW66');
          conn.addItems('DBW68');
          conn.addItems('DBW70');
          conn.addItems('DBW72');
          conn.addItems('DBW74');
          conn.addItems('DBW76');
          conn.addItems('DBW78');
          conn.addItems('DBW80');
          conn.addItems('DBW82');
          conn.addItems('DBW84');
          conn.addItems('DBW86');
          conn.addItems('DBW88');
          conn.addItems('DBW90');
          conn.addItems('DBW92');
          conn.addItems('DBW94');
          conn.addItems('DBW96');
          conn.addItems('DBW98');
          conn.addItems('DBW100');
          conn.addItems('DBW102');
          conn.addItems('DBW104');
          conn.addItems('DBW106');
          conn.addItems('DBW108');
          conn.addItems('DBW110');
          conn.addItems('DBW112');
          conn.addItems('DBW114');
          conn.addItems('DBW116');
          conn.addItems('DBW118');

          // --- 3. 缓存线各个电机占位虚拟ID码 - 续 (DBW1800-DBW1898) ---
          conn.addItems('DBW1800');
          conn.addItems('DBW1802');
          conn.addItems('DBW1804');
          conn.addItems('DBW1806');
          conn.addItems('DBW1808');
          conn.addItems('DBW1810');
          conn.addItems('DBW1812');
          conn.addItems('DBW1814');
          conn.addItems('DBW1816');
          conn.addItems('DBW1818');
          conn.addItems('DBW1820');
          conn.addItems('DBW1822');
          conn.addItems('DBW1824');
          conn.addItems('DBW1826');
          conn.addItems('DBW1828');
          conn.addItems('DBW1830');
          conn.addItems('DBW1832');
          conn.addItems('DBW1834');
          conn.addItems('DBW1836');
          conn.addItems('DBW1838');
          conn.addItems('DBW1840');
          conn.addItems('DBW1842');
          conn.addItems('DBW1844');
          conn.addItems('DBW1846');
          conn.addItems('DBW1848');
          conn.addItems('DBW1850');
          conn.addItems('DBW1852');
          conn.addItems('DBW1854');
          conn.addItems('DBW1856');
          conn.addItems('DBW1858');
          conn.addItems('DBW1860');
          conn.addItems('DBW1862');
          conn.addItems('DBW1864');
          conn.addItems('DBW1866');
          conn.addItems('DBW1868');
          conn.addItems('DBW1870');
          conn.addItems('DBW1872');
          conn.addItems('DBW1874');
          conn.addItems('DBW1876');
          conn.addItems('DBW1878');
          conn.addItems('DBW1880');
          conn.addItems('DBW1882');
          conn.addItems('DBW1884');
          conn.addItems('DBW1886');
          conn.addItems('DBW1888');
          conn.addItems('DBW1890');
          conn.addItems('DBW1892');
          conn.addItems('DBW1894');
          conn.addItems('DBW1896');
          conn.addItems('DBW1898');

          // --- 4. 1\2#预热灭菌线占位虚拟ID码 (DBW120-DBW198) ---
          conn.addItems('DBW120');
          conn.addItems('DBW122');
          conn.addItems('DBW124');
          conn.addItems('DBW126');
          conn.addItems('DBW128');
          conn.addItems('DBW130');
          conn.addItems('DBW132');
          conn.addItems('DBW134');
          conn.addItems('DBW136');
          conn.addItems('DBW138');
          conn.addItems('DBW140');
          conn.addItems('DBW142');
          conn.addItems('DBW144');
          conn.addItems('DBW146');
          conn.addItems('DBW148');
          conn.addItems('DBW150');
          conn.addItems('DBW152');
          conn.addItems('DBW154');
          conn.addItems('DBW156');
          conn.addItems('DBW158');
          conn.addItems('DBW160');
          conn.addItems('DBW162');
          conn.addItems('DBW164');
          conn.addItems('DBW166');
          conn.addItems('DBW168');
          conn.addItems('DBW170');
          conn.addItems('DBW172');
          conn.addItems('DBW174');
          conn.addItems('DBW176');
          conn.addItems('DBW178');
          conn.addItems('DBW180');
          conn.addItems('DBW182');
          conn.addItems('DBW184');
          conn.addItems('DBW186');
          conn.addItems('DBW188');
          conn.addItems('DBW190');
          conn.addItems('DBW192');
          conn.addItems('DBW194');
          conn.addItems('DBW196');
          conn.addItems('DBW198');

          // --- 5. 3\4#灭菌线线占位虚拟ID码 (DBW200-DBW278) ---
          conn.addItems('DBW200');
          conn.addItems('DBW202');
          conn.addItems('DBW204');
          conn.addItems('DBW206');
          conn.addItems('DBW208');
          conn.addItems('DBW210');
          conn.addItems('DBW212');
          conn.addItems('DBW214');
          conn.addItems('DBW216');
          conn.addItems('DBW218');
          conn.addItems('DBW220');
          conn.addItems('DBW222');
          conn.addItems('DBW224');
          conn.addItems('DBW226');
          conn.addItems('DBW228');
          conn.addItems('DBW230');
          conn.addItems('DBW232');
          conn.addItems('DBW234');
          conn.addItems('DBW236');
          conn.addItems('DBW238');
          conn.addItems('DBW240');
          conn.addItems('DBW242');
          conn.addItems('DBW244');
          conn.addItems('DBW246');
          conn.addItems('DBW248');
          conn.addItems('DBW250');
          conn.addItems('DBW252');
          conn.addItems('DBW254');
          conn.addItems('DBW256');
          conn.addItems('DBW258');
          conn.addItems('DBW260');
          conn.addItems('DBW262');
          conn.addItems('DBW264');
          conn.addItems('DBW266');
          conn.addItems('DBW268');
          conn.addItems('DBW270');
          conn.addItems('DBW272');
          conn.addItems('DBW274');
          conn.addItems('DBW276');
          conn.addItems('DBW278');

          // --- 6. 5\6#灭菌线线占位虚拟ID码 (DBW280-DBW358) ---
          conn.addItems('DBW280');
          conn.addItems('DBW282');
          conn.addItems('DBW284');
          conn.addItems('DBW286');
          conn.addItems('DBW288');
          conn.addItems('DBW290');
          conn.addItems('DBW292');
          conn.addItems('DBW294');
          conn.addItems('DBW296');
          conn.addItems('DBW298');
          conn.addItems('DBW300');
          conn.addItems('DBW302');
          conn.addItems('DBW304');
          conn.addItems('DBW306');
          conn.addItems('DBW308');
          conn.addItems('DBW310');
          conn.addItems('DBW312');
          conn.addItems('DBW314');
          conn.addItems('DBW316');
          conn.addItems('DBW318');
          conn.addItems('DBW320');
          conn.addItems('DBW322');
          conn.addItems('DBW324');
          conn.addItems('DBW326');
          conn.addItems('DBW328');
          conn.addItems('DBW330');
          conn.addItems('DBW332');
          conn.addItems('DBW334');
          conn.addItems('DBW336');
          conn.addItems('DBW338');
          conn.addItems('DBW340');
          conn.addItems('DBW342');
          conn.addItems('DBW344');
          conn.addItems('DBW346');
          conn.addItems('DBW348');
          conn.addItems('DBW350');
          conn.addItems('DBW352');
          conn.addItems('DBW354');
          conn.addItems('DBW356');
          conn.addItems('DBW358');

          // --- 7. 7\8#灭菌线线占位虚拟ID码 (DBW360-DBW438) ---
          conn.addItems('DBW360');
          conn.addItems('DBW362');
          conn.addItems('DBW364');
          conn.addItems('DBW366');
          conn.addItems('DBW368');
          conn.addItems('DBW370');
          conn.addItems('DBW372');
          conn.addItems('DBW374');
          conn.addItems('DBW376');
          conn.addItems('DBW378');
          conn.addItems('DBW380');
          conn.addItems('DBW382');
          conn.addItems('DBW384');
          conn.addItems('DBW386');
          conn.addItems('DBW388');
          conn.addItems('DBW390');
          conn.addItems('DBW392');
          conn.addItems('DBW394');
          conn.addItems('DBW396');
          conn.addItems('DBW398');
          conn.addItems('DBW400');
          conn.addItems('DBW402');
          conn.addItems('DBW404');
          conn.addItems('DBW406');
          conn.addItems('DBW408');
          conn.addItems('DBW410');
          conn.addItems('DBW412');
          conn.addItems('DBW414');
          conn.addItems('DBW416');
          conn.addItems('DBW418');
          conn.addItems('DBW420');
          conn.addItems('DBW422');
          conn.addItems('DBW424');
          conn.addItems('DBW426');
          conn.addItems('DBW428');
          conn.addItems('DBW430');
          conn.addItems('DBW432');
          conn.addItems('DBW434');
          conn.addItems('DBW436');
          conn.addItems('DBW438');

          // --- 8. 9\10#灭菌线线占位虚拟ID码 (DBW440-DBW518) ---
          conn.addItems('DBW440');
          conn.addItems('DBW442');
          conn.addItems('DBW444');
          conn.addItems('DBW446');
          conn.addItems('DBW448');
          conn.addItems('DBW450');
          conn.addItems('DBW452');
          conn.addItems('DBW454');
          conn.addItems('DBW456');
          conn.addItems('DBW458');
          conn.addItems('DBW460');
          conn.addItems('DBW462');
          conn.addItems('DBW464');
          conn.addItems('DBW466');
          conn.addItems('DBW468');
          conn.addItems('DBW470');
          conn.addItems('DBW472');
          conn.addItems('DBW474');
          conn.addItems('DBW476');
          conn.addItems('DBW478');
          conn.addItems('DBW480');
          conn.addItems('DBW482');
          conn.addItems('DBW484');
          conn.addItems('DBW486');
          conn.addItems('DBW488');
          conn.addItems('DBW490');
          conn.addItems('DBW492');
          conn.addItems('DBW494');
          conn.addItems('DBW496');
          conn.addItems('DBW498');
          conn.addItems('DBW500');
          conn.addItems('DBW502');
          conn.addItems('DBW504');
          conn.addItems('DBW506');
          conn.addItems('DBW508');
          conn.addItems('DBW510');
          conn.addItems('DBW512');
          conn.addItems('DBW514');
          conn.addItems('DBW516');
          conn.addItems('DBW518');

          // --- 9. 11\12#灭菌线线占位虚拟ID码 (DBW520-DBW598) ---
          conn.addItems('DBW520');
          conn.addItems('DBW522');
          conn.addItems('DBW524');
          conn.addItems('DBW526');
          conn.addItems('DBW528');
          conn.addItems('DBW530');
          conn.addItems('DBW532');
          conn.addItems('DBW534');
          conn.addItems('DBW536');
          conn.addItems('DBW538');
          conn.addItems('DBW540');
          conn.addItems('DBW542');
          conn.addItems('DBW544');
          conn.addItems('DBW546');
          conn.addItems('DBW548');
          conn.addItems('DBW550');
          conn.addItems('DBW552');
          conn.addItems('DBW554');
          conn.addItems('DBW556');
          conn.addItems('DBW558');
          conn.addItems('DBW560');
          conn.addItems('DBW562');
          conn.addItems('DBW564');
          conn.addItems('DBW566');
          conn.addItems('DBW568');
          conn.addItems('DBW570');
          conn.addItems('DBW572');
          conn.addItems('DBW574');
          conn.addItems('DBW576');
          conn.addItems('DBW578');
          conn.addItems('DBW580');
          conn.addItems('DBW582');
          conn.addItems('DBW584');
          conn.addItems('DBW586');
          conn.addItems('DBW588');
          conn.addItems('DBW590');
          conn.addItems('DBW592');
          conn.addItems('DBW594');
          conn.addItems('DBW596');
          conn.addItems('DBW598');

          // --- 10. 13\14#灭菌线线占位虚拟ID码 (DBW600-DBW678) ---
          conn.addItems('DBW600');
          conn.addItems('DBW602');
          conn.addItems('DBW604');
          conn.addItems('DBW606');
          conn.addItems('DBW608');
          conn.addItems('DBW610');
          conn.addItems('DBW612');
          conn.addItems('DBW614');
          conn.addItems('DBW616');
          conn.addItems('DBW618');
          conn.addItems('DBW620');
          conn.addItems('DBW622');
          conn.addItems('DBW624');
          conn.addItems('DBW626');
          conn.addItems('DBW628');
          conn.addItems('DBW630');
          conn.addItems('DBW632');
          conn.addItems('DBW634');
          conn.addItems('DBW636');
          conn.addItems('DBW638');
          conn.addItems('DBW640');
          conn.addItems('DBW642');
          conn.addItems('DBW644');
          conn.addItems('DBW646');
          conn.addItems('DBW648');
          conn.addItems('DBW650');
          conn.addItems('DBW652');
          conn.addItems('DBW654');
          conn.addItems('DBW656');
          conn.addItems('DBW658');
          conn.addItems('DBW660');
          conn.addItems('DBW662');
          conn.addItems('DBW664');
          conn.addItems('DBW666');
          conn.addItems('DBW668');
          conn.addItems('DBW670');
          conn.addItems('DBW672');
          conn.addItems('DBW674');
          conn.addItems('DBW676');
          conn.addItems('DBW678');

          // --- 11. 15#灭菌线和出口线占位虚拟ID码 (DBW680-DBW758) ---
          conn.addItems('DBW680');
          conn.addItems('DBW682');
          conn.addItems('DBW684');
          conn.addItems('DBW686');
          conn.addItems('DBW688');
          conn.addItems('DBW690');
          conn.addItems('DBW692');
          conn.addItems('DBW694');
          conn.addItems('DBW696');
          conn.addItems('DBW698');
          conn.addItems('DBW700');
          conn.addItems('DBW702');
          conn.addItems('DBW704');
          conn.addItems('DBW706');
          conn.addItems('DBW708');
          conn.addItems('DBW710');
          conn.addItems('DBW712');
          conn.addItems('DBW714');
          conn.addItems('DBW716');
          conn.addItems('DBW718');
          conn.addItems('DBW720');
          conn.addItems('DBW722');
          conn.addItems('DBW724');
          conn.addItems('DBW726');
          conn.addItems('DBW728');
          conn.addItems('DBW730');
          conn.addItems('DBW732');
          conn.addItems('DBW734');
          conn.addItems('DBW736');
          conn.addItems('DBW738');
          conn.addItems('DBW740');
          conn.addItems('DBW742');
          conn.addItems('DBW744');
          conn.addItems('DBW746');
          conn.addItems('DBW748');
          conn.addItems('DBW750');
          conn.addItems('DBW752');
          conn.addItems('DBW754');
          conn.addItems('DBW756');
          conn.addItems('DBW758');

          // --- 12. 缓存线各个电机货物目的地 (DBW800-DBW858) ---
          conn.addItems('DBW800');
          conn.addItems('DBW802');
          conn.addItems('DBW804');
          conn.addItems('DBW806');
          conn.addItems('DBW808');
          conn.addItems('DBW810');
          conn.addItems('DBW812');
          conn.addItems('DBW814');
          conn.addItems('DBW816');
          conn.addItems('DBW818');
          conn.addItems('DBW820');
          conn.addItems('DBW822');
          conn.addItems('DBW824');
          conn.addItems('DBW826');
          conn.addItems('DBW828');
          conn.addItems('DBW830');
          conn.addItems('DBW832');
          conn.addItems('DBW834');
          conn.addItems('DBW836');
          conn.addItems('DBW838');
          conn.addItems('DBW840');
          conn.addItems('DBW842');
          conn.addItems('DBW844');
          conn.addItems('DBW846');
          conn.addItems('DBW848');
          conn.addItems('DBW850');
          conn.addItems('DBW852');
          conn.addItems('DBW854');
          conn.addItems('DBW856');
          conn.addItems('DBW858');

          // --- 13. 缓存线各个电机货物目的地 - 续 (DBW1900-DBW1960) ---
          conn.addItems('DBW1900');
          conn.addItems('DBW1902');
          conn.addItems('DBW1904');
          conn.addItems('DBW1906');
          conn.addItems('DBW1908');
          conn.addItems('DBW1910');
          conn.addItems('DBW1912');
          conn.addItems('DBW1914');
          conn.addItems('DBW1916');
          conn.addItems('DBW1918');
          conn.addItems('DBW1920');
          conn.addItems('DBW1922');
          conn.addItems('DBW1924');
          conn.addItems('DBW1926');
          conn.addItems('DBW1928');
          conn.addItems('DBW1930');
          conn.addItems('DBW1932');
          conn.addItems('DBW1934');
          conn.addItems('DBW1936');
          conn.addItems('DBW1938');
          conn.addItems('DBW1940');
          conn.addItems('DBW1942');
          conn.addItems('DBW1944');
          conn.addItems('DBW1946');
          conn.addItems('DBW1948');
          conn.addItems('DBW1950');
          conn.addItems('DBW1952');
          conn.addItems('DBW1954');
          conn.addItems('DBW1956');
          conn.addItems('DBW1958');
          conn.addItems('DBW1960');

          // --- 14. 1\2#灭菌线线电机货物目的地 (DBW860-DBW938) ---
          conn.addItems('DBW860');
          conn.addItems('DBW862');
          conn.addItems('DBW864');
          conn.addItems('DBW866');
          conn.addItems('DBW868');
          conn.addItems('DBW870');
          conn.addItems('DBW872');
          conn.addItems('DBW874');
          conn.addItems('DBW876');
          conn.addItems('DBW878');
          conn.addItems('DBW880');
          conn.addItems('DBW882');
          conn.addItems('DBW884');
          conn.addItems('DBW886');
          conn.addItems('DBW888');
          conn.addItems('DBW890');
          conn.addItems('DBW892');
          conn.addItems('DBW894');
          conn.addItems('DBW896');
          conn.addItems('DBW898');
          conn.addItems('DBW900');
          conn.addItems('DBW902');
          conn.addItems('DBW904');
          conn.addItems('DBW906');
          conn.addItems('DBW908');
          conn.addItems('DBW910');
          conn.addItems('DBW912');
          conn.addItems('DBW914');
          conn.addItems('DBW916');
          conn.addItems('DBW918');
          conn.addItems('DBW920');
          conn.addItems('DBW922');
          conn.addItems('DBW924');
          conn.addItems('DBW926');
          conn.addItems('DBW928');
          conn.addItems('DBW930');
          conn.addItems('DBW932');
          conn.addItems('DBW934');
          conn.addItems('DBW936');
          conn.addItems('DBW938');

          // --- 15. 3\4#灭菌线线电机货物目的地 (DBW940-DBW1008) ---
          conn.addItems('DBW940');
          conn.addItems('DBW942');
          conn.addItems('DBW944');
          conn.addItems('DBW946');
          conn.addItems('DBW948');
          conn.addItems('DBW950');
          conn.addItems('DBW952');
          conn.addItems('DBW954');
          conn.addItems('DBW956');
          conn.addItems('DBW958');
          conn.addItems('DBW960');
          conn.addItems('DBW962');
          conn.addItems('DBW964');
          conn.addItems('DBW966');
          conn.addItems('DBW968');
          conn.addItems('DBW970');
          conn.addItems('DBW972');
          conn.addItems('DBW974');
          conn.addItems('DBW976');
          conn.addItems('DBW978');
          conn.addItems('DBW980');
          conn.addItems('DBW982');
          conn.addItems('DBW984');
          conn.addItems('DBW986');
          conn.addItems('DBW988');
          conn.addItems('DBW990');
          conn.addItems('DBW992');
          conn.addItems('DBW994');
          conn.addItems('DBW996');
          conn.addItems('DBW998');
          conn.addItems('DBW1000');
          conn.addItems('DBW1002');
          conn.addItems('DBW1004');
          conn.addItems('DBW1006');
          conn.addItems('DBW1008');

          // --- 16. 5\6#灭菌线线电机货物目的地 (DBW1020-DBW1098) ---
          conn.addItems('DBW1020');
          conn.addItems('DBW1022');
          conn.addItems('DBW1024');
          conn.addItems('DBW1026');
          conn.addItems('DBW1028');
          conn.addItems('DBW1030');
          conn.addItems('DBW1032');
          conn.addItems('DBW1034');
          conn.addItems('DBW1036');
          conn.addItems('DBW1038');
          conn.addItems('DBW1040');
          conn.addItems('DBW1042');
          conn.addItems('DBW1044');
          conn.addItems('DBW1046');
          conn.addItems('DBW1048');
          conn.addItems('DBW1050');
          conn.addItems('DBW1052');
          conn.addItems('DBW1054');
          conn.addItems('DBW1056');
          conn.addItems('DBW1058');
          conn.addItems('DBW1060');
          conn.addItems('DBW1062');
          conn.addItems('DBW1064');
          conn.addItems('DBW1066');
          conn.addItems('DBW1068');
          conn.addItems('DBW1070');
          conn.addItems('DBW1072');
          conn.addItems('DBW1074');
          conn.addItems('DBW1076');
          conn.addItems('DBW1078');
          conn.addItems('DBW1080');
          conn.addItems('DBW1082');
          conn.addItems('DBW1084');
          conn.addItems('DBW1086');
          conn.addItems('DBW1088');
          conn.addItems('DBW1090');
          conn.addItems('DBW1092');
          conn.addItems('DBW1094');
          conn.addItems('DBW1096');
          conn.addItems('DBW1098');

          // --- 17. 7\8#灭菌线线电机货物目的地 (DBW1100-DBW1178) ---
          conn.addItems('DBW1100');
          conn.addItems('DBW1102');
          conn.addItems('DBW1104');
          conn.addItems('DBW1106');
          conn.addItems('DBW1108');
          conn.addItems('DBW1110');
          conn.addItems('DBW1112');
          conn.addItems('DBW1114');
          conn.addItems('DBW1116');
          conn.addItems('DBW1118');
          conn.addItems('DBW1120');
          conn.addItems('DBW1122');
          conn.addItems('DBW1124');
          conn.addItems('DBW1126');
          conn.addItems('DBW1128');
          conn.addItems('DBW1129'); // Check parity, assume 1128 then 1130
          conn.addItems('DBW1130');
          conn.addItems('DBW1132');
          conn.addItems('DBW1134');
          conn.addItems('DBW1136');
          conn.addItems('DBW1138');
          conn.addItems('DBW1140');
          conn.addItems('DBW1142');
          conn.addItems('DBW1144');
          conn.addItems('DBW1146');
          conn.addItems('DBW1148');
          conn.addItems('DBW1150');
          conn.addItems('DBW1152');
          conn.addItems('DBW1154');
          conn.addItems('DBW1156');
          conn.addItems('DBW1158');
          conn.addItems('DBW1160');
          conn.addItems('DBW1162');
          conn.addItems('DBW1164');
          conn.addItems('DBW1166');
          conn.addItems('DBW1168');
          conn.addItems('DBW1170');
          conn.addItems('DBW1172');
          conn.addItems('DBW1174');
          conn.addItems('DBW1176');
          conn.addItems('DBW1178');

          // --- 18. 9\10#灭菌线线电机货物目的地 (DBW1180-DBW1258) ---
          conn.addItems('DBW1180');
          conn.addItems('DBW1182');
          conn.addItems('DBW1184');
          conn.addItems('DBW1186');
          conn.addItems('DBW1188');
          conn.addItems('DBW1190');
          conn.addItems('DBW1192');
          conn.addItems('DBW1194');
          conn.addItems('DBW1196');
          conn.addItems('DBW1198');
          conn.addItems('DBW1200');
          conn.addItems('DBW1202');
          conn.addItems('DBW1204');
          conn.addItems('DBW1206');
          conn.addItems('DBW1208');
          conn.addItems('DBW1210');
          conn.addItems('DBW1212');
          conn.addItems('DBW1214');
          conn.addItems('DBW1216');
          conn.addItems('DBW1218');
          conn.addItems('DBW1220');
          conn.addItems('DBW1222');
          conn.addItems('DBW1224');
          conn.addItems('DBW1226');
          conn.addItems('DBW1228');
          conn.addItems('DBW1230');
          conn.addItems('DBW1232');
          conn.addItems('DBW1234');
          conn.addItems('DBW1236');
          conn.addItems('DBW1238');
          conn.addItems('DBW1240');
          conn.addItems('DBW1242');
          conn.addItems('DBW1244');
          conn.addItems('DBW1246');
          conn.addItems('DBW1248');
          conn.addItems('DBW1250');
          conn.addItems('DBW1252');
          conn.addItems('DBW1254');
          conn.addItems('DBW1256');
          conn.addItems('DBW1258');

          // --- 19. 11\12#灭菌线线电机货物目的地 (DBW1260-DBW1338) ---
          conn.addItems('DBW1260');
          conn.addItems('DBW1262');
          conn.addItems('DBW1264');
          conn.addItems('DBW1266');
          conn.addItems('DBW1268');
          conn.addItems('DBW1270');
          conn.addItems('DBW1272');
          conn.addItems('DBW1274');
          conn.addItems('DBW1276');
          conn.addItems('DBW1278');
          conn.addItems('DBW1280');
          conn.addItems('DBW1282');
          conn.addItems('DBW1284');
          conn.addItems('DBW1286');
          conn.addItems('DBW1288');
          conn.addItems('DBW1290');
          conn.addItems('DBW1292');
          conn.addItems('DBW1294');
          conn.addItems('DBW1296');
          conn.addItems('DBW1298');
          conn.addItems('DBW1300');
          conn.addItems('DBW1302');
          conn.addItems('DBW1304');
          conn.addItems('DBW1306');
          conn.addItems('DBW1308');
          conn.addItems('DBW1310');
          conn.addItems('DBW1312');
          conn.addItems('DBW1314');
          conn.addItems('DBW1316');
          conn.addItems('DBW1318');
          conn.addItems('DBW1320');
          conn.addItems('DBW1322');
          conn.addItems('DBW1324');
          conn.addItems('DBW1326');
          conn.addItems('DBW1328');
          conn.addItems('DBW1330');
          conn.addItems('DBW1332');
          conn.addItems('DBW1334');
          conn.addItems('DBW1336');
          conn.addItems('DBW1338');

          // --- 20. 13\14#灭菌线线电机货物目的地 (DBW1340-DBW1418) ---
          conn.addItems('DBW1340');
          conn.addItems('DBW1342');
          conn.addItems('DBW1344');
          conn.addItems('DBW1346');
          conn.addItems('DBW1348');
          conn.addItems('DBW1350');
          conn.addItems('DBW1352');
          conn.addItems('DBW1354');
          conn.addItems('DBW1356');
          conn.addItems('DBW1358');
          conn.addItems('DBW1360');
          conn.addItems('DBW1362');
          conn.addItems('DBW1364');
          conn.addItems('DBW1366');
          conn.addItems('DBW1368');
          conn.addItems('DBW1370');
          conn.addItems('DBW1372');
          conn.addItems('DBW1374');
          conn.addItems('DBW1376');
          conn.addItems('DBW1378');
          conn.addItems('DBW1380');
          conn.addItems('DBW1382');
          conn.addItems('DBW1384');
          conn.addItems('DBW1386');
          conn.addItems('DBW1388');
          conn.addItems('DBW1390');
          conn.addItems('DBW1392');
          conn.addItems('DBW1394');
          conn.addItems('DBW1396');
          conn.addItems('DBW1398');
          conn.addItems('DBW1400');
          conn.addItems('DBW1402');
          conn.addItems('DBW1404');
          conn.addItems('DBW1406');
          conn.addItems('DBW1408');
          conn.addItems('DBW1410');
          conn.addItems('DBW1412');
          conn.addItems('DBW1414');
          conn.addItems('DBW1416');
          conn.addItems('DBW1418');

          // --- 21. 15#灭菌线和出口线电机货物目的地 (DBW1420-DBW1498) ---
          conn.addItems('DBW1420');
          conn.addItems('DBW1422');
          conn.addItems('DBW1424');
          conn.addItems('DBW1426');
          conn.addItems('DBW1428');
          conn.addItems('DBW1430');
          conn.addItems('DBW1432');
          conn.addItems('DBW1434');
          conn.addItems('DBW1436');
          conn.addItems('DBW1438');
          conn.addItems('DBW1440');
          conn.addItems('DBW1442');
          conn.addItems('DBW1444');
          conn.addItems('DBW1446');
          conn.addItems('DBW1448');
          conn.addItems('DBW1450');
          conn.addItems('DBW1452');
          conn.addItems('DBW1454');
          conn.addItems('DBW1456');
          conn.addItems('DBW1458');
          conn.addItems('DBW1460');
          conn.addItems('DBW1462');
          conn.addItems('DBW1464');
          conn.addItems('DBW1466');
          conn.addItems('DBW1468');
          conn.addItems('DBW1470');
          conn.addItems('DBW1472');
          conn.addItems('DBW1474');
          conn.addItems('DBW1476');
          conn.addItems('DBW1478');
          conn.addItems('DBW1480');
          conn.addItems('DBW1482');
          conn.addItems('DBW1484');
          conn.addItems('DBW1486');
          conn.addItems('DBW1488');
          conn.addItems('DBW1490');
          conn.addItems('DBW1492');
          conn.addItems('DBW1494');
          conn.addItems('DBW1496');
          conn.addItems('DBW1498');

          // --- 22. 1-15预热柜内实际数量 (DBW1500-DBW1528) ---
          conn.addItems('DBW1500');
          conn.addItems('DBW1502');
          conn.addItems('DBW1504');
          conn.addItems('DBW1506');
          conn.addItems('DBW1508');
          conn.addItems('DBW1510');
          conn.addItems('DBW1512');
          conn.addItems('DBW1514');
          conn.addItems('DBW1516');
          conn.addItems('DBW1518');
          conn.addItems('DBW1520');
          conn.addItems('DBW1522');
          conn.addItems('DBW1524');
          conn.addItems('DBW1526');
          conn.addItems('DBW1528');

          // --- 23. 1-15灭菌柜内实际数量 (DBW1530-DBW1558) ---
          conn.addItems('DBW1530');
          conn.addItems('DBW1532');
          conn.addItems('DBW1534');
          conn.addItems('DBW1536');
          conn.addItems('DBW1538');
          conn.addItems('DBW1540');
          conn.addItems('DBW1542');
          conn.addItems('DBW1544');
          conn.addItems('DBW1546');
          conn.addItems('DBW1548');
          conn.addItems('DBW1550');
          conn.addItems('DBW1552');
          conn.addItems('DBW1554');
          conn.addItems('DBW1556');
          conn.addItems('DBW1558');

          // --- 24. 传感器信号区间 (DBW1606 - DBW1656) ---
          conn.addItems('DBW1606');
          conn.addItems('DBW1608');
          conn.addItems('DBW1610');
          conn.addItems('DBW1612');
          conn.addItems('DBW1614');
          conn.addItems('DBW1616');
          conn.addItems('DBW1618');
          conn.addItems('DBW1620');
          conn.addItems('DBW1622');
          conn.addItems('DBW1624');
          conn.addItems('DBW1626');
          conn.addItems('DBW1628');
          conn.addItems('DBW1630');
          conn.addItems('DBW1632');
          conn.addItems('DBW1634');
          conn.addItems('DBW1636');
          conn.addItems('DBW1638');
          conn.addItems('DBW1640');
          conn.addItems('DBW1642');
          conn.addItems('DBW1644');
          conn.addItems('DBW1646');
          conn.addItems('DBW1648');
          conn.addItems('DBW1650');
          conn.addItems('DBW1652');
          conn.addItems('DBW1654');
          conn.addItems('DBW1656');

          conn.addItems('DBW1658'); // 上货请求读码
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
      logger.info('config error!');
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
    // 使用新的DB1001写入地址 W_DBW0
    writeValuesToPLC('W_DBW0', nowValue);
  }, 200); // 每200毫秒执行一次交替
}

// 自动生成变量映射对象
// 读取点位使用 DBWxx (DB1000)
// 写入点位使用 W_DBWxx (DB1001)
var variables = {
  // --- 读取点位 (DB1000) ---
  DBW0: 'DB1000,INT0', // 输送线看门狗心跳
  DBW2: 'DB1000,INT2', // 输送线当前运行状态
  DBW4: 'DB1000,INT4', // 区域报警
  DBW6: 'DB1000,INT6', // 缓存线电机运行信号-1
  DBW8: 'DB1000,INT8', // 缓存线电机运行信号-2
  DBW10: 'DB1000,INT10', // 1\2#灭菌线线电机运行信号--1
  DBW12: 'DB1000,INT12', // 1\2#灭菌线线电机运行信号--2
  DBW14: 'DB1000,INT14', // 1\2#灭菌线线电机运行信号--3
  DBW16: 'DB1000,INT16', // 3\4#灭菌线线电机运行信号--1
  DBW18: 'DB1000,INT18', // 3\4#灭菌线线电机运行信号--2
  DBW20: 'DB1000,INT20', // 3\4#灭菌线线电机运行信号--3
  DBW22: 'DB1000,INT22', // 5\6#灭菌线线电机运行信号--1
  DBW24: 'DB1000,INT24', // 5\6#灭菌线线电机运行信号--2
  DBW26: 'DB1000,INT26', // 5\6#灭菌线线电机运行信号--3
  DBW28: 'DB1000,INT28', // 7\8#灭菌线线电机运行信号--1
  DBW30: 'DB1000,INT30', // 7\8#灭菌线线电机运行信号--2
  DBW32: 'DB1000,INT32', // 7\8#灭菌线线电机运行信号--3
  DBW34: 'DB1000,INT34', // 9\10#灭菌线线电机运行信号--1
  DBW36: 'DB1000,INT36', // 9\10#灭菌线线电机运行信号--2
  DBW38: 'DB1000,INT38', // 9\10#灭菌线线电机运行信号--3
  DBW40: 'DB1000,INT40', // 11\12#灭菌线线电机运行信号--1
  DBW42: 'DB1000,INT42', // 11\12#灭菌线线电机运行信号--2
  DBW44: 'DB1000,INT44', // 11\12#灭菌线线电机运行信号--3
  DBW46: 'DB1000,INT46', // 13\14#灭菌线线电机运行信号--1
  DBW48: 'DB1000,INT48', // 13\14#灭菌线线电机运行信号--2
  DBW50: 'DB1000,INT50', // 13\14#灭菌线线电机运行信号--3
  DBW52: 'DB1000,INT52', // 15#灭菌线和出口线电机运行信号--1
  DBW54: 'DB1000,INT54', // 15#灭菌线和出口线电机运行信号--2
  DBW56: 'DB1000,INT56', // 15#灭菌线和出口线电机运行信号--3
  DBW58: 'DB1000,INT58', // RGV小车位置值
  DBW60: 'DB1000,INT60', // RGV电机运行信号
  // 展开定义：缓存线各个电机占位虚拟ID码 (DBW62-DBW118)
  DBW62: 'DB1000,INT62', // 01001电机
  DBW64: 'DB1000,INT64', // 01002电机
  DBW66: 'DB1000,INT66', // 01004电机
  DBW68: 'DB1000,INT68', // 01005电机
  DBW70: 'DB1000,INT70', // 01006电机
  DBW72: 'DB1000,INT72', // 01008电机
  DBW74: 'DB1000,INT74', // 01009电机
  DBW76: 'DB1000,INT76', // 01011电机
  DBW78: 'DB1000,INT78', // 01012电机
  DBW80: 'DB1000,INT80', // 01013A电机
  DBW82: 'DB1000,INT82', // 01013B电机
  DBW84: 'DB1000,INT84', // 01014A电机
  DBW86: 'DB1000,INT86', // 01014B电机
  DBW88: 'DB1000,INT88', // 01015A电机
  DBW90: 'DB1000,INT90', // 01015B电机
  DBW92: 'DB1000,INT92', // 01016A电机
  DBW94: 'DB1000,INT94', // 01016B电机
  DBW96: 'DB1000,INT96', // 01017A电机
  DBW98: 'DB1000,INT98', // 01017B电机
  DBW100: 'DB1000,INT100', // 01018A电机
  DBW102: 'DB1000,INT102', // 01018B电机
  DBW104: 'DB1000,INT104', // 01019A电机
  DBW106: 'DB1000,INT106', // 01019B电机
  DBW108: 'DB1000,INT108', // 01020A电机
  DBW110: 'DB1000,INT110', // 01020B电机
  DBW112: 'DB1000,INT112', // 01021A电机
  DBW114: 'DB1000,INT114', // 01021B电机
  DBW116: 'DB1000,INT116', // 01022A电机
  DBW118: 'DB1000,INT118', // 01022B电机

  // 展开定义：缓存线各个电机占位虚拟ID码 - 续 (DBW1800-DBW1898)
  DBW1800: 'DB1000,INT1800', // 01023A电机
  DBW1802: 'DB1000,INT1802', // 01023B电机
  DBW1804: 'DB1000,INT1804', // 01024A电机
  DBW1806: 'DB1000,INT1806', // 01024B电机
  DBW1808: 'DB1000,INT1808', // 01026电机
  DBW1810: 'DB1000,INT1810', // 01027电机
  DBW1812: 'DB1000,INT1812', // 01029电机
  DBW1814: 'DB1000,INT1814', // 01030电机
  DBW1816: 'DB1000,INT1816', // 备用
  DBW1818: 'DB1000,INT1818', // 备用
  DBW1820: 'DB1000,INT1820', // 备用
  DBW1822: 'DB1000,INT1822', // 备用
  DBW1824: 'DB1000,INT1824', // 备用
  DBW1826: 'DB1000,INT1826', // 备用
  DBW1828: 'DB1000,INT1828', // 备用
  DBW1830: 'DB1000,INT1830', // 备用
  DBW1832: 'DB1000,INT1832', // 备用
  DBW1834: 'DB1000,INT1834', // 备用
  DBW1836: 'DB1000,INT1836', // 备用
  DBW1838: 'DB1000,INT1838', // 备用
  DBW1840: 'DB1000,INT1840', // 备用
  DBW1842: 'DB1000,INT1842', // 备用
  DBW1844: 'DB1000,INT1844', // 备用
  DBW1846: 'DB1000,INT1846', // 备用
  DBW1848: 'DB1000,INT1848', // 备用
  DBW1850: 'DB1000,INT1850', // 备用
  DBW1852: 'DB1000,INT1852', // 备用
  DBW1854: 'DB1000,INT1854', // 备用
  DBW1856: 'DB1000,INT1856', // 备用
  DBW1858: 'DB1000,INT1858', // 备用
  DBW1860: 'DB1000,INT1860', // 备用
  DBW1862: 'DB1000,INT1862', // 备用
  DBW1864: 'DB1000,INT1864', // 备用
  DBW1866: 'DB1000,INT1866', // 备用
  DBW1868: 'DB1000,INT1868', // 备用
  DBW1870: 'DB1000,INT1870', // 备用
  DBW1872: 'DB1000,INT1872', // 备用
  DBW1874: 'DB1000,INT1874', // 备用
  DBW1876: 'DB1000,INT1876', // 备用
  DBW1878: 'DB1000,INT1878', // 备用
  DBW1880: 'DB1000,INT1880', // 备用
  DBW1882: 'DB1000,INT1882', // 备用
  DBW1884: 'DB1000,INT1884', // 备用
  DBW1886: 'DB1000,INT1886', // 备用
  DBW1888: 'DB1000,INT1888', // 备用
  DBW1890: 'DB1000,INT1890', // 备用
  DBW1892: 'DB1000,INT1892', // 备用
  DBW1894: 'DB1000,INT1894', // 备用
  DBW1896: 'DB1000,INT1896', // 备用
  DBW1898: 'DB1000,INT1898', // 备用

  // 展开定义：1\2#预热灭菌线占位虚拟ID码 (DBW120-DBW198)
  DBW120: 'DB1000,INT120', // 02009电机
  DBW122: 'DB1000,INT122', // 02011电机
  DBW124: 'DB1000,INT124', // 02012电机
  DBW126: 'DB1000,INT126', // 02014电机
  DBW128: 'DB1000,INT128', // 02015电机
  DBW130: 'DB1000,INT130', // 02016电机
  DBW132: 'DB1000,INT132', // 02018电机
  DBW134: 'DB1000,INT134', // 02019电机
  DBW136: 'DB1000,INT136', // 02021电机
  DBW138: 'DB1000,INT138', // 02022电机
  DBW140: 'DB1000,INT140', // 02023电机
  DBW142: 'DB1000,INT142', // 02025电机
  DBW144: 'DB1000,INT144', // 02026电机
  DBW146: 'DB1000,INT146', // 02028电机
  DBW148: 'DB1000,INT148', // 02029电机
  DBW150: 'DB1000,INT150', // 02030电机
  DBW152: 'DB1000,INT152', // 02032电机
  DBW154: 'DB1000,INT154', // 02033电机
  DBW156: 'DB1000,INT156', // 02035电机
  DBW158: 'DB1000,INT158', // 02036电机
  DBW160: 'DB1000,INT160', // 备用
  DBW162: 'DB1000,INT162', // 备用
  DBW164: 'DB1000,INT164', // 备用
  DBW166: 'DB1000,INT166', // 备用
  DBW168: 'DB1000,INT168', // 备用
  DBW170: 'DB1000,INT170', // 备用
  DBW172: 'DB1000,INT172', // 备用
  DBW174: 'DB1000,INT174', // 备用
  DBW176: 'DB1000,INT176', // 备用
  DBW178: 'DB1000,INT178', // 备用
  DBW180: 'DB1000,INT180', // 备用
  DBW182: 'DB1000,INT182', // 备用
  DBW184: 'DB1000,INT184', // 备用
  DBW186: 'DB1000,INT186', // 备用
  DBW188: 'DB1000,INT188', // 备用
  DBW190: 'DB1000,INT190', // 备用
  DBW192: 'DB1000,INT192', // 备用
  DBW194: 'DB1000,INT194', // 备用
  DBW196: 'DB1000,INT196', // 备用
  DBW198: 'DB1000,INT198', // 备用

  // 展开定义：3\4#灭菌线线占位虚拟ID码 (DBW200-DBW278)
  DBW200: 'DB1000,INT200', // 03009电机
  DBW202: 'DB1000,INT202', // 03011电机
  DBW204: 'DB1000,INT204', // 03012电机
  DBW206: 'DB1000,INT206', // 03014电机
  DBW208: 'DB1000,INT208', // 03015电机
  DBW210: 'DB1000,INT210', // 03016电机
  DBW212: 'DB1000,INT212', // 03018电机
  DBW214: 'DB1000,INT214', // 03019电机
  DBW216: 'DB1000,INT216', // 03021电机
  DBW218: 'DB1000,INT218', // 03022电机
  DBW220: 'DB1000,INT220', // 03023电机
  DBW222: 'DB1000,INT222', // 03025电机
  DBW224: 'DB1000,INT224', // 03026电机
  DBW226: 'DB1000,INT226', // 03028电机
  DBW228: 'DB1000,INT228', // 03029电机
  DBW230: 'DB1000,INT230', // 03030电机
  DBW232: 'DB1000,INT232', // 03032电机
  DBW234: 'DB1000,INT234', // 03033电机
  DBW236: 'DB1000,INT236', // 03035电机
  DBW238: 'DB1000,INT238', // 03036电机
  DBW240: 'DB1000,INT240', // 备用
  DBW242: 'DB1000,INT242', // 备用
  DBW244: 'DB1000,INT244', // 备用
  DBW246: 'DB1000,INT246', // 备用
  DBW248: 'DB1000,INT248', // 备用
  DBW250: 'DB1000,INT250', // 备用
  DBW252: 'DB1000,INT252', // 备用
  DBW254: 'DB1000,INT254', // 备用
  DBW256: 'DB1000,INT256', // 备用
  DBW258: 'DB1000,INT258', // 备用
  DBW260: 'DB1000,INT260', // 备用
  DBW262: 'DB1000,INT262', // 备用
  DBW264: 'DB1000,INT264', // 备用
  DBW266: 'DB1000,INT266', // 备用
  DBW268: 'DB1000,INT268', // 备用
  DBW270: 'DB1000,INT270', // 备用
  DBW272: 'DB1000,INT272', // 备用
  DBW274: 'DB1000,INT274', // 备用
  DBW276: 'DB1000,INT276', // 备用
  DBW278: 'DB1000,INT278', // 备用

  // 展开定义：5\6#灭菌线线占位虚拟ID码 (DBW280-DBW358)
  DBW280: 'DB1000,INT280', // 04009电机
  DBW282: 'DB1000,INT282', // 04011电机
  DBW284: 'DB1000,INT284', // 04012电机
  DBW286: 'DB1000,INT286', // 04014电机
  DBW288: 'DB1000,INT288', // 04015电机
  DBW290: 'DB1000,INT290', // 04016电机
  DBW292: 'DB1000,INT292', // 04018电机
  DBW294: 'DB1000,INT294', // 04019电机
  DBW296: 'DB1000,INT296', // 04021电机
  DBW298: 'DB1000,INT298', // 04022电机
  DBW300: 'DB1000,INT300', // 04023电机
  DBW302: 'DB1000,INT302', // 04025电机
  DBW304: 'DB1000,INT304', // 04026电机
  DBW306: 'DB1000,INT306', // 04028电机
  DBW308: 'DB1000,INT308', // 04029电机
  DBW310: 'DB1000,INT310', // 04030电机
  DBW312: 'DB1000,INT312', // 04032电机
  DBW314: 'DB1000,INT314', // 04033电机
  DBW316: 'DB1000,INT316', // 04035电机
  DBW318: 'DB1000,INT318', // 04036电机
  DBW320: 'DB1000,INT320', // 备用
  DBW322: 'DB1000,INT322', // 备用
  DBW324: 'DB1000,INT324', // 备用
  DBW326: 'DB1000,INT326', // 备用
  DBW328: 'DB1000,INT328', // 备用
  DBW330: 'DB1000,INT330', // 备用
  DBW332: 'DB1000,INT332', // 备用
  DBW334: 'DB1000,INT334', // 备用
  DBW336: 'DB1000,INT336', // 备用
  DBW338: 'DB1000,INT338', // 备用
  DBW340: 'DB1000,INT340', // 备用
  DBW342: 'DB1000,INT342', // 备用
  DBW344: 'DB1000,INT344', // 备用
  DBW346: 'DB1000,INT346', // 备用
  DBW348: 'DB1000,INT348', // 备用
  DBW350: 'DB1000,INT350', // 备用
  DBW352: 'DB1000,INT352', // 备用
  DBW354: 'DB1000,INT354', // 备用
  DBW356: 'DB1000,INT356', // 备用
  DBW358: 'DB1000,INT358', // 备用

  // 展开定义：7\8#灭菌线线占位虚拟ID码 (DBW360-DBW438)
  DBW360: 'DB1000,INT360', // 05009电机
  DBW362: 'DB1000,INT362', // 05011电机
  DBW364: 'DB1000,INT364', // 05012电机
  DBW366: 'DB1000,INT366', // 05014电机
  DBW368: 'DB1000,INT368', // 05015电机
  DBW370: 'DB1000,INT370', // 05016电机
  DBW372: 'DB1000,INT372', // 05018电机
  DBW374: 'DB1000,INT374', // 05019电机
  DBW376: 'DB1000,INT376', // 05021电机
  DBW378: 'DB1000,INT378', // 05022电机
  DBW380: 'DB1000,INT380', // 05023电机
  DBW382: 'DB1000,INT382', // 05025电机
  DBW384: 'DB1000,INT384', // 05026电机
  DBW386: 'DB1000,INT386', // 05028电机
  DBW388: 'DB1000,INT388', // 05029电机
  DBW390: 'DB1000,INT390', // 05030电机
  DBW392: 'DB1000,INT392', // 05032电机
  DBW394: 'DB1000,INT394', // 05033电机
  DBW396: 'DB1000,INT396', // 05035电机
  DBW398: 'DB1000,INT398', // 05036电机
  DBW400: 'DB1000,INT400', // 备用
  DBW402: 'DB1000,INT402', // 备用
  DBW404: 'DB1000,INT404', // 备用
  DBW406: 'DB1000,INT406', // 备用
  DBW408: 'DB1000,INT408', // 备用
  DBW410: 'DB1000,INT410', // 备用
  DBW412: 'DB1000,INT412', // 备用
  DBW414: 'DB1000,INT414', // 备用
  DBW416: 'DB1000,INT416', // 备用
  DBW418: 'DB1000,INT418', // 备用
  DBW420: 'DB1000,INT420', // 备用
  DBW422: 'DB1000,INT422', // 备用
  DBW424: 'DB1000,INT424', // 备用
  DBW426: 'DB1000,INT426', // 备用
  DBW428: 'DB1000,INT428', // 备用
  DBW430: 'DB1000,INT430', // 备用
  DBW432: 'DB1000,INT432', // 备用
  DBW434: 'DB1000,INT434', // 备用
  DBW436: 'DB1000,INT436', // 备用
  DBW438: 'DB1000,INT438', // 备用

  // 展开定义：9\10#灭菌线线占位虚拟ID码 (DBW440-DBW518)
  DBW440: 'DB1000,INT440', // 06009电机
  DBW442: 'DB1000,INT442', // 06011电机
  DBW444: 'DB1000,INT444', // 06012电机
  DBW446: 'DB1000,INT446', // 06014电机
  DBW448: 'DB1000,INT448', // 06015电机
  DBW450: 'DB1000,INT450', // 06016电机
  DBW452: 'DB1000,INT452', // 06018电机
  DBW454: 'DB1000,INT454', // 06019电机
  DBW456: 'DB1000,INT456', // 06021电机
  DBW458: 'DB1000,INT458', // 06022电机
  DBW460: 'DB1000,INT460', // 06023电机
  DBW462: 'DB1000,INT462', // 06025电机
  DBW464: 'DB1000,INT464', // 06026电机
  DBW466: 'DB1000,INT466', // 06028电机
  DBW468: 'DB1000,INT468', // 06029电机
  DBW470: 'DB1000,INT470', // 06030电机
  DBW472: 'DB1000,INT472', // 06032电机
  DBW474: 'DB1000,INT474', // 06033电机
  DBW476: 'DB1000,INT476', // 06035电机
  DBW478: 'DB1000,INT478', // 06036电机
  DBW480: 'DB1000,INT480', // 备用
  DBW482: 'DB1000,INT482', // 备用
  DBW484: 'DB1000,INT484', // 备用
  DBW486: 'DB1000,INT486', // 备用
  DBW488: 'DB1000,INT488', // 备用
  DBW490: 'DB1000,INT490', // 备用
  DBW492: 'DB1000,INT492', // 备用
  DBW494: 'DB1000,INT494', // 备用
  DBW496: 'DB1000,INT496', // 备用
  DBW498: 'DB1000,INT498', // 备用
  DBW500: 'DB1000,INT500', // 备用
  DBW502: 'DB1000,INT502', // 备用
  DBW504: 'DB1000,INT504', // 备用
  DBW506: 'DB1000,INT506', // 备用
  DBW508: 'DB1000,INT508', // 备用
  DBW510: 'DB1000,INT510', // 备用
  DBW512: 'DB1000,INT512', // 备用
  DBW514: 'DB1000,INT514', // 备用
  DBW516: 'DB1000,INT516', // 备用
  DBW518: 'DB1000,INT518', // 备用

  // 展开定义：11\12#灭菌线线占位虚拟ID码 (DBW520-DBW598)
  DBW520: 'DB1000,INT520', // 07009电机
  DBW522: 'DB1000,INT522', // 07011电机
  DBW524: 'DB1000,INT524', // 07012电机
  DBW526: 'DB1000,INT526', // 07014电机
  DBW528: 'DB1000,INT528', // 07015电机
  DBW530: 'DB1000,INT530', // 07016电机
  DBW532: 'DB1000,INT532', // 07018电机
  DBW534: 'DB1000,INT534', // 07019电机
  DBW536: 'DB1000,INT536', // 07021电机
  DBW538: 'DB1000,INT538', // 07022电机
  DBW540: 'DB1000,INT540', // 07023电机
  DBW542: 'DB1000,INT542', // 07025电机
  DBW544: 'DB1000,INT544', // 07026电机
  DBW546: 'DB1000,INT546', // 07028电机
  DBW548: 'DB1000,INT548', // 07029电机
  DBW550: 'DB1000,INT550', // 07030电机
  DBW552: 'DB1000,INT552', // 07032电机
  DBW554: 'DB1000,INT554', // 07033电机
  DBW556: 'DB1000,INT556', // 07035电机
  DBW558: 'DB1000,INT558', // 07036电机
  DBW560: 'DB1000,INT560', // 备用
  DBW562: 'DB1000,INT562', // 备用
  DBW564: 'DB1000,INT564', // 备用
  DBW566: 'DB1000,INT566', // 备用
  DBW568: 'DB1000,INT568', // 备用
  DBW570: 'DB1000,INT570', // 备用
  DBW572: 'DB1000,INT572', // 备用
  DBW574: 'DB1000,INT574', // 备用
  DBW576: 'DB1000,INT576', // 备用
  DBW578: 'DB1000,INT578', // 备用
  DBW580: 'DB1000,INT580', // 备用
  DBW582: 'DB1000,INT582', // 备用
  DBW584: 'DB1000,INT584', // 备用
  DBW586: 'DB1000,INT586', // 备用
  DBW588: 'DB1000,INT588', // 备用
  DBW590: 'DB1000,INT590', // 备用
  DBW592: 'DB1000,INT592', // 备用
  DBW594: 'DB1000,INT594', // 备用
  DBW596: 'DB1000,INT596', // 备用
  DBW598: 'DB1000,INT598', // 备用

  // 展开定义：13\14#灭菌线线占位虚拟ID码 (DBW600-DBW678)
  DBW600: 'DB1000,INT600', // 08009电机
  DBW602: 'DB1000,INT602', // 08011电机
  DBW604: 'DB1000,INT604', // 08012电机
  DBW606: 'DB1000,INT606', // 08014电机
  DBW608: 'DB1000,INT608', // 08015电机
  DBW610: 'DB1000,INT610', // 08016电机
  DBW612: 'DB1000,INT612', // 08018电机
  DBW614: 'DB1000,INT614', // 08019电机
  DBW616: 'DB1000,INT616', // 08021电机
  DBW618: 'DB1000,INT618', // 08022电机
  DBW620: 'DB1000,INT620', // 08023电机
  DBW622: 'DB1000,INT622', // 08025电机
  DBW624: 'DB1000,INT624', // 08026电机
  DBW626: 'DB1000,INT626', // 08028电机
  DBW628: 'DB1000,INT628', // 08029电机
  DBW630: 'DB1000,INT630', // 08030电机
  DBW632: 'DB1000,INT632', // 08032电机
  DBW634: 'DB1000,INT634', // 08033电机
  DBW636: 'DB1000,INT636', // 08035电机
  DBW638: 'DB1000,INT638', // 08036电机
  DBW640: 'DB1000,INT640', // 备用
  DBW642: 'DB1000,INT642', // 备用
  DBW644: 'DB1000,INT644', // 备用
  DBW646: 'DB1000,INT646', // 备用
  DBW648: 'DB1000,INT648', // 备用
  DBW650: 'DB1000,INT650', // 备用
  DBW652: 'DB1000,INT652', // 备用
  DBW654: 'DB1000,INT654', // 备用
  DBW656: 'DB1000,INT656', // 备用
  DBW658: 'DB1000,INT658', // 备用
  DBW660: 'DB1000,INT660', // 备用
  DBW662: 'DB1000,INT662', // 备用
  DBW664: 'DB1000,INT664', // 备用
  DBW666: 'DB1000,INT666', // 备用
  DBW668: 'DB1000,INT668', // 备用
  DBW670: 'DB1000,INT670', // 备用
  DBW672: 'DB1000,INT672', // 备用
  DBW674: 'DB1000,INT674', // 备用
  DBW676: 'DB1000,INT676', // 备用
  DBW678: 'DB1000,INT678', // 备用

  // 展开定义：15#灭菌线和出口线占位虚拟ID码 (DBW680-DBW758)
  DBW680: 'DB1000,INT680', // 09005电机
  DBW682: 'DB1000,INT682', // 09007电机
  DBW684: 'DB1000,INT684', // 09008电机
  DBW686: 'DB1000,INT686', // 09010电机
  DBW688: 'DB1000,INT688', // 09011电机
  DBW690: 'DB1000,INT690', // 09012电机
  DBW692: 'DB1000,INT692', // 09014电机
  DBW694: 'DB1000,INT694', // 09015电机
  DBW696: 'DB1000,INT696', // 09017电机
  DBW698: 'DB1000,INT698', // 09018电机
  DBW700: 'DB1000,INT700', // 09020电机
  DBW702: 'DB1000,INT702', // 09021电机
  DBW704: 'DB1000,INT704', // 09023电机
  DBW706: 'DB1000,INT706', // 09024电机
  DBW708: 'DB1000,INT708', // 09025电机
  DBW710: 'DB1000,INT710', // 09026电机
  DBW712: 'DB1000,INT712', // 09027电机
  DBW714: 'DB1000,INT714', // 09028电机
  DBW716: 'DB1000,INT716', // 09029电机
  DBW718: 'DB1000,INT718', // 09030电机
  DBW720: 'DB1000,INT720', // 09031电机
  DBW722: 'DB1000,INT722', // 09032电机
  DBW724: 'DB1000,INT724', // 09033电机
  DBW726: 'DB1000,INT726', // 09035电机
  DBW728: 'DB1000,INT728', // 09036电机
  DBW730: 'DB1000,INT730', // 09038电机
  DBW732: 'DB1000,INT732', // 09039电机
  DBW734: 'DB1000,INT734', // 备用
  DBW736: 'DB1000,INT736', // 备用
  DBW738: 'DB1000,INT738', // 备用
  DBW740: 'DB1000,INT740', // 备用
  DBW742: 'DB1000,INT742', // 备用
  DBW744: 'DB1000,INT744', // 备用
  DBW746: 'DB1000,INT746', // 备用
  DBW748: 'DB1000,INT748', // 备用
  DBW750: 'DB1000,INT750', // 备用
  DBW752: 'DB1000,INT752', // 备用
  DBW754: 'DB1000,INT754', // 备用
  DBW756: 'DB1000,INT756', // 备用
  DBW758: 'DB1000,INT758', // 备用

  // 展开定义：缓存线各个电机货物目的地 (DBW800-DBW858)
  DBW800: 'DB1000,INT800', // 01001电机
  DBW802: 'DB1000,INT802', // 01002电机
  DBW804: 'DB1000,INT804', // 01004电机
  DBW806: 'DB1000,INT806', // 01005电机
  DBW808: 'DB1000,INT808', // 01006电机
  DBW810: 'DB1000,INT810', // 01008电机
  DBW812: 'DB1000,INT812', // 01009电机
  DBW814: 'DB1000,INT814', // 01011电机
  DBW816: 'DB1000,INT816', // 01012电机
  DBW818: 'DB1000,INT818', // 01013A电机
  DBW820: 'DB1000,INT820', // 01013B电机
  DBW822: 'DB1000,INT822', // 01014A电机
  DBW824: 'DB1000,INT824', // 01014B电机
  DBW826: 'DB1000,INT826', // 01015A电机
  DBW828: 'DB1000,INT828', // 01015B电机
  DBW830: 'DB1000,INT830', // 01016A电机
  DBW832: 'DB1000,INT832', // 01016B电机
  DBW834: 'DB1000,INT834', // 01017A电机
  DBW836: 'DB1000,INT836', // 01017B电机
  DBW838: 'DB1000,INT838', // 01018A电机
  DBW840: 'DB1000,INT840', // 01018B电机
  DBW842: 'DB1000,INT842', // 01019A电机
  DBW844: 'DB1000,INT844', // 01019B电机
  DBW846: 'DB1000,INT846', // 01020A电机
  DBW848: 'DB1000,INT848', // 01020B电机
  DBW850: 'DB1000,INT850', // 备用 (根据规律补充)
  DBW852: 'DB1000,INT852', // 备用 (根据规律补充)
  DBW854: 'DB1000,INT854', // 备用 (根据规律补充)
  DBW856: 'DB1000,INT856', // 备用 (根据规律补充)
  DBW858: 'DB1000,INT858', // 备用 (根据规律补充)

  // 展开定义：缓存线各个电机货物目的地 - 续 (DBW1900-DBW1960)
  DBW1900: 'DB1000,INT1900', // 01021A电机
  DBW1902: 'DB1000,INT1902', // 01021B电机
  DBW1904: 'DB1000,INT1904', // 01022A电机
  DBW1906: 'DB1000,INT1906', // 01022B电机
  DBW1908: 'DB1000,INT1908', // 01023A电机
  DBW1910: 'DB1000,INT1910', // 01023B电机
  DBW1912: 'DB1000,INT1912', // 01024A电机
  DBW1914: 'DB1000,INT1914', // 01024B电机
  DBW1916: 'DB1000,INT1916', // 01026电机
  DBW1918: 'DB1000,INT1918', // 01027电机
  DBW1920: 'DB1000,INT1920', // 01029电机
  DBW1922: 'DB1000,INT1922', // 01030电机
  DBW1924: 'DB1000,INT1924', // 备用
  DBW1926: 'DB1000,INT1926', // 备用
  DBW1928: 'DB1000,INT1928', // 备用
  DBW1930: 'DB1000,INT1930', // 备用
  DBW1932: 'DB1000,INT1932', // 备用
  DBW1934: 'DB1000,INT1934', // 备用
  DBW1936: 'DB1000,INT1936', // 备用
  DBW1938: 'DB1000,INT1938', // 备用
  DBW1940: 'DB1000,INT1940', // 备用
  DBW1942: 'DB1000,INT1942', // 备用
  DBW1944: 'DB1000,INT1944', // 备用
  DBW1946: 'DB1000,INT1946', // 备用
  DBW1948: 'DB1000,INT1948', // 备用
  DBW1950: 'DB1000,INT1950', // 备用
  DBW1952: 'DB1000,INT1952', // 备用
  DBW1954: 'DB1000,INT1954', // 备用
  DBW1956: 'DB1000,INT1956', // 备用
  DBW1958: 'DB1000,INT1958', // 备用
  DBW1960: 'DB1000,INT1960', // 备用

  // 展开定义：1\2#灭菌线线电机货物目的地 (DBW860-DBW938)
  DBW860: 'DB1000,INT860', // 02009电机
  DBW862: 'DB1000,INT862', // 02011电机
  DBW864: 'DB1000,INT864', // 02012电机
  DBW866: 'DB1000,INT866', // 02014电机
  DBW868: 'DB1000,INT868', // 02015电机
  DBW870: 'DB1000,INT870', // 02016电机
  DBW872: 'DB1000,INT872', // 02018电机
  DBW874: 'DB1000,INT874', // 02019电机
  DBW876: 'DB1000,INT876', // 02021电机
  DBW878: 'DB1000,INT878', // 02022电机
  DBW880: 'DB1000,INT880', // 02023电机
  DBW882: 'DB1000,INT882', // 02025电机
  DBW884: 'DB1000,INT884', // 02026电机
  DBW886: 'DB1000,INT886', // 02028电机
  DBW888: 'DB1000,INT888', // 02029电机
  DBW890: 'DB1000,INT890', // 02030电机
  DBW892: 'DB1000,INT892', // 02032电机
  DBW894: 'DB1000,INT894', // 02033电机
  DBW896: 'DB1000,INT896', // 02035电机
  DBW898: 'DB1000,INT898', // 02036电机
  DBW900: 'DB1000,INT900', // 备用
  DBW902: 'DB1000,INT902', // 备用
  DBW904: 'DB1000,INT904', // 备用
  DBW906: 'DB1000,INT906', // 备用
  DBW908: 'DB1000,INT908', // 备用
  DBW910: 'DB1000,INT910', // 备用
  DBW912: 'DB1000,INT912', // 备用
  DBW914: 'DB1000,INT914', // 备用
  DBW916: 'DB1000,INT916', // 备用
  DBW918: 'DB1000,INT918', // 备用
  DBW920: 'DB1000,INT920', // 备用
  DBW922: 'DB1000,INT922', // 备用
  DBW924: 'DB1000,INT924', // 备用
  DBW926: 'DB1000,INT926', // 备用
  DBW928: 'DB1000,INT928', // 备用
  DBW930: 'DB1000,INT930', // 备用
  DBW932: 'DB1000,INT932', // 备用 (根据规律补充)
  DBW934: 'DB1000,INT934', // 备用 (根据规律补充)
  DBW936: 'DB1000,INT936', // 备用 (根据规律补充)
  DBW938: 'DB1000,INT938', // 备用 (根据规律补充)

  // 展开定义：3\4#灭菌线线电机货物目的地 (DBW940-DBW1008)
  DBW940: 'DB1000,INT940', // 03009电机
  DBW942: 'DB1000,INT942', // 03011电机
  DBW944: 'DB1000,INT944', // 03012电机
  DBW946: 'DB1000,INT946', // 03014电机
  DBW948: 'DB1000,INT948', // 03015电机
  DBW950: 'DB1000,INT950', // 03016电机
  DBW952: 'DB1000,INT952', // 03018电机
  DBW954: 'DB1000,INT954', // 03019电机
  DBW956: 'DB1000,INT956', // 03021电机
  DBW958: 'DB1000,INT958', // 03022电机
  DBW960: 'DB1000,INT960', // 03023电机
  DBW962: 'DB1000,INT962', // 03025电机
  DBW964: 'DB1000,INT964', // 03026电机
  DBW966: 'DB1000,INT966', // 03028电机
  DBW968: 'DB1000,INT968', // 03029电机
  DBW970: 'DB1000,INT970', // 03030电机
  DBW972: 'DB1000,INT972', // 03032电机
  DBW974: 'DB1000,INT974', // 03033电机
  DBW976: 'DB1000,INT976', // 03035电机
  DBW978: 'DB1000,INT978', // 03036电机
  DBW980: 'DB1000,INT980', // 备用
  DBW982: 'DB1000,INT982', // 备用
  DBW984: 'DB1000,INT984', // 备用
  DBW986: 'DB1000,INT986', // 备用
  DBW988: 'DB1000,INT988', // 备用
  DBW990: 'DB1000,INT990', // 备用
  DBW992: 'DB1000,INT992', // 备用
  DBW994: 'DB1000,INT994', // 备用
  DBW996: 'DB1000,INT996', // 备用
  DBW998: 'DB1000,INT998', // 备用
  DBW1000: 'DB1000,INT1000', // 备用
  DBW1002: 'DB1000,INT1002', // 备用
  DBW1004: 'DB1000,INT1004', // 备用
  DBW1006: 'DB1000,INT1006', // 备用
  DBW1008: 'DB1000,INT1008', // 备用

  // 展开定义：5\6#灭菌线线电机货物目的地 (DBW1020-DBW1098)
  DBW1020: 'DB1000,INT1020', // 04009电机
  DBW1022: 'DB1000,INT1022', // 04011电机
  DBW1024: 'DB1000,INT1024', // 04012电机
  DBW1026: 'DB1000,INT1026', // 04014电机
  DBW1028: 'DB1000,INT1028', // 04015电机
  DBW1030: 'DB1000,INT1030', // 04016电机
  DBW1032: 'DB1000,INT1032', // 04018电机
  DBW1034: 'DB1000,INT1034', // 04019电机
  DBW1036: 'DB1000,INT1036', // 04021电机
  DBW1038: 'DB1000,INT1038', // 04022电机
  DBW1040: 'DB1000,INT1040', // 04023电机
  DBW1042: 'DB1000,INT1042', // 04025电机
  DBW1044: 'DB1000,INT1044', // 04026电机
  DBW1046: 'DB1000,INT1046', // 04028电机
  DBW1048: 'DB1000,INT1048', // 04029电机
  DBW1050: 'DB1000,INT1050', // 04030电机
  DBW1052: 'DB1000,INT1052', // 04032电机
  DBW1054: 'DB1000,INT1054', // 04033电机
  DBW1056: 'DB1000,INT1056', // 04035电机
  DBW1058: 'DB1000,INT1058', // 04036电机
  DBW1060: 'DB1000,INT1060', // 备用
  DBW1062: 'DB1000,INT1062', // 备用
  DBW1064: 'DB1000,INT1064', // 备用
  DBW1066: 'DB1000,INT1066', // 备用
  DBW1068: 'DB1000,INT1068', // 备用
  DBW1070: 'DB1000,INT1070', // 备用
  DBW1072: 'DB1000,INT1072', // 备用
  DBW1074: 'DB1000,INT1074', // 备用
  DBW1076: 'DB1000,INT1076', // 备用
  DBW1078: 'DB1000,INT1078', // 备用
  DBW1080: 'DB1000,INT1080', // 备用
  DBW1082: 'DB1000,INT1082', // 备用
  DBW1084: 'DB1000,INT1084', // 备用
  DBW1086: 'DB1000,INT1086', // 备用
  DBW1088: 'DB1000,INT1088', // 备用
  DBW1090: 'DB1000,INT1090', // 备用
  DBW1092: 'DB1000,INT1092', // 备用 (根据规律补充)
  DBW1094: 'DB1000,INT1094', // 备用 (根据规律补充)
  DBW1096: 'DB1000,INT1096', // 备用 (根据规律补充)
  DBW1098: 'DB1000,INT1098', // 备用 (根据规律补充)

  // 展开定义：7\8#灭菌线线电机货物目的地 (DBW1100-DBW1178)
  DBW1100: 'DB1000,INT1100', // 05009电机
  DBW1102: 'DB1000,INT1102', // 05011电机
  DBW1104: 'DB1000,INT1104', // 05012电机
  DBW1106: 'DB1000,INT1106', // 05014电机
  DBW1108: 'DB1000,INT1108', // 05015电机
  DBW1110: 'DB1000,INT1110', // 05016电机
  DBW1112: 'DB1000,INT1112', // 05018电机
  DBW1114: 'DB1000,INT1114', // 05019电机
  DBW1116: 'DB1000,INT1116', // 05021电机
  DBW1118: 'DB1000,INT1118', // 05022电机
  DBW1120: 'DB1000,INT1120', // 05023电机
  DBW1122: 'DB1000,INT1122', // 05025电机
  DBW1124: 'DB1000,INT1124', // 05026电机
  DBW1126: 'DB1000,INT1126', // 05028电机
  DBW1128: 'DB1000,INT1128', // 05029电机
  DBW1130: 'DB1000,INT1130', // 05030电机
  DBW1132: 'DB1000,INT1132', // 05032电机
  DBW1134: 'DB1000,INT1134', // 05033电机
  DBW1136: 'DB1000,INT1136', // 05035电机
  DBW1138: 'DB1000,INT1138', // 05036电机
  DBW1140: 'DB1000,INT1140', // 备用
  DBW1142: 'DB1000,INT1142', // 备用
  DBW1144: 'DB1000,INT1144', // 备用
  DBW1146: 'DB1000,INT1146', // 备用
  DBW1148: 'DB1000,INT1148', // 备用
  DBW1150: 'DB1000,INT1150', // 备用
  DBW1152: 'DB1000,INT1152', // 备用
  DBW1154: 'DB1000,INT1154', // 备用
  DBW1156: 'DB1000,INT1156', // 备用
  DBW1158: 'DB1000,INT1158', // 备用
  DBW1160: 'DB1000,INT1160', // 备用
  DBW1162: 'DB1000,INT1162', // 备用
  DBW1164: 'DB1000,INT1164', // 备用
  DBW1166: 'DB1000,INT1166', // 备用
  DBW1168: 'DB1000,INT1168', // 备用
  DBW1170: 'DB1000,INT1170', // 备用
  DBW1172: 'DB1000,INT1172', // 备用 (根据规律补充)
  DBW1174: 'DB1000,INT1174', // 备用 (根据规律补充)
  DBW1176: 'DB1000,INT1176', // 备用 (根据规律补充)
  DBW1178: 'DB1000,INT1178', // 备用 (根据规律补充)

  // 展开定义：9\10#灭菌线线电机货物目的地 (DBW1180-DBW1258)
  DBW1180: 'DB1000,INT1180', // 06009电机
  DBW1182: 'DB1000,INT1182', // 06011电机
  DBW1184: 'DB1000,INT1184', // 06012电机
  DBW1186: 'DB1000,INT1186', // 06014电机
  DBW1188: 'DB1000,INT1188', // 06015电机
  DBW1190: 'DB1000,INT1190', // 06016电机
  DBW1192: 'DB1000,INT1192', // 06018电机
  DBW1194: 'DB1000,INT1194', // 06019电机
  DBW1196: 'DB1000,INT1196', // 06021电机
  DBW1198: 'DB1000,INT1198', // 06022电机
  DBW1200: 'DB1000,INT1200', // 06023电机
  DBW1202: 'DB1000,INT1202', // 06025电机
  DBW1204: 'DB1000,INT1204', // 06026电机
  DBW1206: 'DB1000,INT1206', // 06028电机
  DBW1208: 'DB1000,INT1208', // 06029电机
  DBW1210: 'DB1000,INT1210', // 06030电机
  DBW1212: 'DB1000,INT1212', // 06032电机
  DBW1214: 'DB1000,INT1214', // 06033电机
  DBW1216: 'DB1000,INT1216', // 06035电机
  DBW1218: 'DB1000,INT1218', // 06036电机
  DBW1220: 'DB1000,INT1220', // 备用
  DBW1222: 'DB1000,INT1222', // 备用
  DBW1224: 'DB1000,INT1224', // 备用
  DBW1226: 'DB1000,INT1226', // 备用
  DBW1228: 'DB1000,INT1228', // 备用
  DBW1230: 'DB1000,INT1230', // 备用
  DBW1232: 'DB1000,INT1232', // 备用
  DBW1234: 'DB1000,INT1234', // 备用
  DBW1236: 'DB1000,INT1236', // 备用
  DBW1238: 'DB1000,INT1238', // 备用
  DBW1240: 'DB1000,INT1240', // 备用
  DBW1242: 'DB1000,INT1242', // 备用
  DBW1244: 'DB1000,INT1244', // 备用
  DBW1246: 'DB1000,INT1246', // 备用
  DBW1248: 'DB1000,INT1248', // 备用
  DBW1250: 'DB1000,INT1250', // 备用
  DBW1252: 'DB1000,INT1252', // 备用 (根据规律补充)
  DBW1254: 'DB1000,INT1254', // 备用 (根据规律补充)
  DBW1256: 'DB1000,INT1256', // 备用 (根据规律补充)
  DBW1258: 'DB1000,INT1258', // 备用 (根据规律补充)

  // 展开定义：11\12#灭菌线线电机货物目的地 (DBW1260-DBW1338)
  DBW1260: 'DB1000,INT1260', // 07009电机
  DBW1262: 'DB1000,INT1262', // 07011电机
  DBW1264: 'DB1000,INT1264', // 07012电机
  DBW1266: 'DB1000,INT1266', // 07014电机
  DBW1268: 'DB1000,INT1268', // 07015电机
  DBW1270: 'DB1000,INT1270', // 07016电机
  DBW1272: 'DB1000,INT1272', // 07018电机
  DBW1274: 'DB1000,INT1274', // 07019电机
  DBW1276: 'DB1000,INT1276', // 07021电机
  DBW1278: 'DB1000,INT1278', // 07022电机
  DBW1280: 'DB1000,INT1280', // 07023电机
  DBW1282: 'DB1000,INT1282', // 07025电机
  DBW1284: 'DB1000,INT1284', // 07026电机
  DBW1286: 'DB1000,INT1286', // 07028电机
  DBW1288: 'DB1000,INT1288', // 07029电机
  DBW1290: 'DB1000,INT1290', // 07030电机
  DBW1292: 'DB1000,INT1292', // 07032电机
  DBW1294: 'DB1000,INT1294', // 07033电机
  DBW1296: 'DB1000,INT1296', // 07035电机
  DBW1298: 'DB1000,INT1298', // 07036电机
  DBW1300: 'DB1000,INT1300', // 备用
  DBW1302: 'DB1000,INT1302', // 备用
  DBW1304: 'DB1000,INT1304', // 备用
  DBW1306: 'DB1000,INT1306', // 备用
  DBW1308: 'DB1000,INT1308', // 备用
  DBW1310: 'DB1000,INT1310', // 备用
  DBW1312: 'DB1000,INT1312', // 备用
  DBW1314: 'DB1000,INT1314', // 备用
  DBW1316: 'DB1000,INT1316', // 备用
  DBW1318: 'DB1000,INT1318', // 备用
  DBW1320: 'DB1000,INT1320', // 备用
  DBW1322: 'DB1000,INT1322', // 备用
  DBW1324: 'DB1000,INT1324', // 备用
  DBW1326: 'DB1000,INT1326', // 备用
  DBW1328: 'DB1000,INT1328', // 备用
  DBW1330: 'DB1000,INT1330', // 备用
  DBW1332: 'DB1000,INT1332', // 备用 (根据规律补充)
  DBW1334: 'DB1000,INT1334', // 备用 (根据规律补充)
  DBW1336: 'DB1000,INT1336', // 备用 (根据规律补充)
  DBW1338: 'DB1000,INT1338', // 备用 (根据规律补充)

  // 展开定义：13\14#灭菌线线电机货物目的地 (DBW1340-DBW1418)
  DBW1340: 'DB1000,INT1340', // 08009电机
  DBW1342: 'DB1000,INT1342', // 08011电机
  DBW1344: 'DB1000,INT1344', // 08012电机
  DBW1346: 'DB1000,INT1346', // 08014电机
  DBW1348: 'DB1000,INT1348', // 08015电机
  DBW1350: 'DB1000,INT1350', // 08016电机
  DBW1352: 'DB1000,INT1352', // 08018电机
  DBW1354: 'DB1000,INT1354', // 08019电机
  DBW1356: 'DB1000,INT1356', // 08021电机
  DBW1358: 'DB1000,INT1358', // 08022电机
  DBW1360: 'DB1000,INT1360', // 08023电机
  DBW1362: 'DB1000,INT1362', // 08025电机
  DBW1364: 'DB1000,INT1364', // 08026电机
  DBW1366: 'DB1000,INT1366', // 08028电机
  DBW1368: 'DB1000,INT1368', // 08029电机
  DBW1370: 'DB1000,INT1370', // 08030电机
  DBW1372: 'DB1000,INT1372', // 08032电机
  DBW1374: 'DB1000,INT1374', // 08033电机
  DBW1376: 'DB1000,INT1376', // 08035电机
  DBW1378: 'DB1000,INT1378', // 08036电机
  DBW1380: 'DB1000,INT1380', // 备用
  DBW1382: 'DB1000,INT1382', // 备用
  DBW1384: 'DB1000,INT1384', // 备用
  DBW1386: 'DB1000,INT1386', // 备用
  DBW1388: 'DB1000,INT1388', // 备用
  DBW1390: 'DB1000,INT1390', // 备用
  DBW1392: 'DB1000,INT1392', // 备用
  DBW1394: 'DB1000,INT1394', // 备用
  DBW1396: 'DB1000,INT1396', // 备用
  DBW1398: 'DB1000,INT1398', // 备用
  DBW1400: 'DB1000,INT1400', // 备用
  DBW1402: 'DB1000,INT1402', // 备用
  DBW1404: 'DB1000,INT1404', // 备用
  DBW1406: 'DB1000,INT1406', // 备用
  DBW1408: 'DB1000,INT1408', // 备用
  DBW1410: 'DB1000,INT1410', // 备用
  DBW1412: 'DB1000,INT1412', // 备用 (根据规律补充)
  DBW1414: 'DB1000,INT1414', // 备用 (根据规律补充)
  DBW1416: 'DB1000,INT1416', // 备用 (根据规律补充)
  DBW1418: 'DB1000,INT1418', // 备用 (根据规律补充)

  // 展开定义：15#灭菌线和出口线电机货物目的地 (DBW1420-DBW1498)
  DBW1420: 'DB1000,INT1420', // 09005电机
  DBW1422: 'DB1000,INT1422', // 09007电机
  DBW1424: 'DB1000,INT1424', // 09008电机
  DBW1426: 'DB1000,INT1426', // 09010电机
  DBW1428: 'DB1000,INT1428', // 09011电机
  DBW1430: 'DB1000,INT1430', // 09012电机
  DBW1432: 'DB1000,INT1432', // 09014电机
  DBW1434: 'DB1000,INT1434', // 09015电机
  DBW1436: 'DB1000,INT1436', // 09017电机
  DBW1438: 'DB1000,INT1438', // 09018电机
  DBW1440: 'DB1000,INT1440', // 09020电机
  DBW1442: 'DB1000,INT1442', // 09021电机
  DBW1444: 'DB1000,INT1444', // 09023电机
  DBW1446: 'DB1000,INT1446', // 09024电机
  DBW1448: 'DB1000,INT1448', // 09025电机
  DBW1450: 'DB1000,INT1450', // 09026电机
  DBW1452: 'DB1000,INT1452', // 09027电机
  DBW1454: 'DB1000,INT1454', // 09028电机
  DBW1456: 'DB1000,INT1456', // 09029电机
  DBW1458: 'DB1000,INT1458', // 09030电机
  DBW1460: 'DB1000,INT1460', // 09031电机
  DBW1462: 'DB1000,INT1462', // 09032电机
  DBW1464: 'DB1000,INT1464', // 09033电机
  DBW1466: 'DB1000,INT1466', // 09035电机
  DBW1468: 'DB1000,INT1468', // 09036电机
  DBW1470: 'DB1000,INT1470', // 09038电机
  DBW1472: 'DB1000,INT1472', // 09039电机
  DBW1474: 'DB1000,INT1474', // 备用
  DBW1476: 'DB1000,INT1476', // 备用
  DBW1478: 'DB1000,INT1478', // 备用
  DBW1480: 'DB1000,INT1480', // 备用
  DBW1482: 'DB1000,INT1482', // 备用
  DBW1484: 'DB1000,INT1484', // 备用
  DBW1486: 'DB1000,INT1486', // 备用
  DBW1488: 'DB1000,INT1488', // 备用
  DBW1490: 'DB1000,INT1490', // 备用
  DBW1492: 'DB1000,INT1492', // 备用
  DBW1494: 'DB1000,INT1494', // 备用
  DBW1496: 'DB1000,INT1496', // 备用
  DBW1498: 'DB1000,INT1498', // 备用

  // 展开定义：1-15预热柜内实际数量 (DBW1500-DBW1528)
  DBW1500: 'DB1000,INT1500', // 预热柜1内实际数量
  DBW1502: 'DB1000,INT1502', // 预热柜2内实际数量
  DBW1504: 'DB1000,INT1504', // 预热柜3内实际数量
  DBW1506: 'DB1000,INT1506', // 预热柜4内实际数量
  DBW1508: 'DB1000,INT1508', // 预热柜5内实际数量
  DBW1510: 'DB1000,INT1510', // 预热柜6内实际数量
  DBW1512: 'DB1000,INT1512', // 预热柜7内实际数量
  DBW1514: 'DB1000,INT1514', // 预热柜8内实际数量
  DBW1516: 'DB1000,INT1516', // 预热柜9内实际数量
  DBW1518: 'DB1000,INT1518', // 预热柜10内实际数量
  DBW1520: 'DB1000,INT1520', // 预热柜11内实际数量
  DBW1522: 'DB1000,INT1522', // 预热柜12内实际数量
  DBW1524: 'DB1000,INT1524', // 预热柜13内实际数量
  DBW1526: 'DB1000,INT1526', // 预热柜14内实际数量
  DBW1528: 'DB1000,INT1528', // 预热柜15内实际数量

  // 展开定义：1-15灭菌柜内实际数量 (DBW1530-DBW1558)
  DBW1530: 'DB1000,INT1530', // 灭菌柜1内实际数量
  DBW1532: 'DB1000,INT1532', // 灭菌柜2内实际数量
  DBW1534: 'DB1000,INT1534', // 灭菌柜3内实际数量
  DBW1536: 'DB1000,INT1536', // 灭菌柜4内实际数量
  DBW1538: 'DB1000,INT1538', // 灭菌柜5内实际数量
  DBW1540: 'DB1000,INT1540', // 灭菌柜6内实际数量
  DBW1542: 'DB1000,INT1542', // 灭菌柜7内实际数量
  DBW1544: 'DB1000,INT1544', // 灭菌柜8内实际数量
  DBW1546: 'DB1000,INT1546', // 灭菌柜9内实际数量
  DBW1548: 'DB1000,INT1548', // 灭菌柜10内实际数量
  DBW1550: 'DB1000,INT1550', // 灭菌柜11内实际数量
  DBW1552: 'DB1000,INT1552', // 灭菌柜12内实际数量
  DBW1554: 'DB1000,INT1554', // 灭菌柜13内实际数量
  DBW1556: 'DB1000,INT1556', // 灭菌柜14内实际数量
  DBW1558: 'DB1000,INT1558', // 灭菌柜15内实际数量

  // 展开定义：传感器信号区间 (DBW1606 - DBW1656)
  DBW1606: 'DB1000,INT1606', // 缓存线传感器信号-1
  DBW1608: 'DB1000,INT1608', // 缓存线传感器信号-2
  DBW1610: 'DB1000,INT1610', // 1\2#灭菌线线传感器信号--1
  DBW1612: 'DB1000,INT1612', // 1\2#灭菌线线传感器信号--2
  DBW1614: 'DB1000,INT1614', // 1\2#灭菌线线传感器信号--3
  DBW1616: 'DB1000,INT1616', // 3\4#灭菌线线传感器信号--1
  DBW1618: 'DB1000,INT1618', // 3\4#灭菌线线传感器信号--2
  DBW1620: 'DB1000,INT1620', // 3\4#灭菌线线传感器信号--3
  DBW1622: 'DB1000,INT1622', // 5\6#灭菌线线传感器信号--1
  DBW1624: 'DB1000,INT1624', // 5\6#灭菌线线传感器信号--2
  DBW1626: 'DB1000,INT1626', // 5\6#灭菌线线传感器信号--3
  DBW1628: 'DB1000,INT1628', // 7\8#灭菌线线传感器信号--1
  DBW1630: 'DB1000,INT1630', // 7\8#灭菌线线传感器信号--2
  DBW1632: 'DB1000,INT1632', // 7\8#灭菌线线传感器信号--3
  DBW1634: 'DB1000,INT1634', // 9\10#灭菌线线传感器信号--1
  DBW1636: 'DB1000,INT1636', // 9\10#灭菌线线传感器信号--2
  DBW1638: 'DB1000,INT1638', // 9\10#灭菌线线传感器信号--3
  DBW1640: 'DB1000,INT1640', // 11\12#灭菌线线传感器信号--1
  DBW1642: 'DB1000,INT1642', // 11\12#灭菌线线传感器信号--2
  DBW1644: 'DB1000,INT1644', // 11\12#灭菌线线传感器信号--3
  DBW1646: 'DB1000,INT1646', // 13\14#灭菌线线传感器信号--1
  DBW1648: 'DB1000,INT1648', // 13\14#灭菌线线传感器信号--2
  DBW1650: 'DB1000,INT1650', // 13\14#灭菌线线传感器信号--3
  DBW1652: 'DB1000,INT1652', // 15#灭菌线和出口线传感器信号--1
  DBW1654: 'DB1000,INT1654', // 15#灭菌线和出口线传感器信号--2
  DBW1656: 'DB1000,INT1656', // 15#灭菌线和出口线传感器信号--3
  DBW1658: 'DB1000,INT1658', // 上货请求读码、指定托盘ID和目的地
  DBW1670: 'DB1000,INT1670', // 灭菌出货请求指定托盘ID和目的地1
  DBW1672: 'DB1000,INT1672', // 灭菌出货请求指定托盘ID和目的地2

  // --- 写入点位 (DB1001) 使用前缀 W_ 防止冲突 ---
  W_DBW0: 'DB1001,INT0', // WCS看门狗心跳 (一直写)
  W_DBW2: 'DB1001,INT2', // WCS-全线启动 (一直写)
  W_DBW4: 'DB1001,INT4', // WCS-全线停止 (一直写)
  W_DBW6: 'DB1001,INT6', // WCS-允许进料 (一直写)
  W_DBW8: 'DB1001,INT8', // WCS-故障复位 (一直写)
  W_DBW10: 'DB1001,INT10', // WCS上货位写虚拟ID
  W_DBW12: 'DB1001,INT12', // WCS上货位写目的地
  W_DBW14: 'DB1001,INT14', // WCS执行出货预热房编号
  W_DBW16: 'DB1001,INT16', // WCS执行进货灭菌柜编号

  // W_DBW18 WCS执行预热房出货命令 (Bit位定义)
  // 注意：W_DBW18为INT类型，西门子为大端字节序。
  // BIT0通常指最低位(LSB, Value=1)，对应低位字节(Byte 19)的第0位。
  W_DBW18_BIT0: 'DB1001,X18.0', // 3201预热进货
  W_DBW18_BIT1: 'DB1001,X18.1', // 3202预热进货
  W_DBW18_BIT2: 'DB1001,X18.2', // 3203预热进货
  W_DBW18_BIT3: 'DB1001,X18.3', // 3204预热进货
  W_DBW18_BIT4: 'DB1001,X18.4', // 3205预热进货
  W_DBW18_BIT5: 'DB1001,X18.5', // 3206预热进货
  W_DBW18_BIT6: 'DB1001,X18.6', // 3207预热进货
  W_DBW18_BIT7: 'DB1001,X18.7', // 3208预热进货
  W_DBW18_BIT8: 'DB1001,X19.0', // 3209预热进货
  W_DBW18_BIT9: 'DB1001,X19.1', // 3210预热进货
  W_DBW18_BIT10: 'DB1001,X19.2', // 3211预热进货
  W_DBW18_BIT11: 'DB1001,X19.3', // 3212预热进货
  W_DBW18_BIT12: 'DB1001,X19.4', // 3213预热进货
  W_DBW18_BIT13: 'DB1001,X19.5', // 3214预热进货
  W_DBW18_BIT14: 'DB1001,X19.6', // 3215预热进货
  W_DBW18_BIT15: 'DB1001,X19.7', // 备用

  // W_DBW20 WCS执行进货灭菌柜出货命令 (Bit位定义)
  // 同样采用LSB顺序：BIT0 -> Byte 21.0
  W_DBW20_BIT0: 'DB1001,X20.0', // 3201灭菌进货
  W_DBW20_BIT1: 'DB1001,X20.1', // 3202灭菌进货
  W_DBW20_BIT2: 'DB1001,X20.2', // 3203灭菌进货
  W_DBW20_BIT3: 'DB1001,X20.3', // 3204灭菌进货
  W_DBW20_BIT4: 'DB1001,X20.4', // 3205灭菌进货
  W_DBW20_BIT5: 'DB1001,X20.5', // 3206灭菌进货
  W_DBW20_BIT6: 'DB1001,X20.6', // 3207灭菌进货
  W_DBW20_BIT7: 'DB1001,X20.7', // 3208灭菌进货
  W_DBW20_BIT8: 'DB1001,X21.0', // 3209灭菌进货
  W_DBW20_BIT9: 'DB1001,X21.1', // 3210灭菌进货
  W_DBW20_BIT10: 'DB1001,X21.2', // 3211灭菌进货
  W_DBW20_BIT11: 'DB1001,X21.3', // 3212灭菌进货
  W_DBW20_BIT12: 'DB1001,X21.4', // 3213灭菌进货
  W_DBW20_BIT13: 'DB1001,X21.5', // 3214灭菌进货
  W_DBW20_BIT14: 'DB1001,X21.6', // 3215灭菌进货
  W_DBW20_BIT15: 'DB1001,X21.7', // 备用

  W_DBW22: 'DB1001,INT22', // WCS执行小车移栽命令
  W_DBW24: 'DB1001,INT24', // WCS修改电机编号
  W_DBW26: 'DB1001,INT26', // WCS修改目的地
  W_DBW28: 'DB1001,INT28', // WCS下修改模拟ID
  W_DBW30: 'DB1001,INT30', // WCS下发修改命令
  W_DBW32: 'DB1001,INT32', // 系统无码模式切换
  W_DBW34: 'DB1001,INT34', // 手自动动切换
  W_DBW36: 'DB1001,INT36', // 选定电机编号1
  W_DBW38: 'DB1001,INT38', // 选定电机编号2
  W_DBW40: 'DB1001,INT40', // 选定电机编号3
  W_DBW42: 'DB1001,INT42', // 选定电机编号4
  W_DBW44: 'DB1001,INT44', // 电机前进
  W_DBW46: 'DB1001,INT46', // 电机后退
  W_DBW48: 'DB1001,INT48', // 顶升上升
  W_DBW50: 'DB1001,INT50', // 顶升下降
  W_DBW52: 'DB1001,INT52', // 小车左移
  W_DBW54: 'DB1001,INT54', // 小车右移
  W_DBW56: 'DB1001,INT56', // WCS修改目标数量
  W_DBW58: 'DB1001,INT58', // 双线单线缓存模式

  // 展开定义：出灭菌柜线链条电机货物目的地 (DB1001.DBW60-DBW118)
  W_DBW60: 'DB1001,INT60', // 02026电机（出口链条机）
  W_DBW62: 'DB1001,INT62', // 02029电机（出口链条机）
  W_DBW64: 'DB1001,INT64', // 02033电机（出口链条机）
  W_DBW66: 'DB1001,INT66', // 02036电机（出口链条机）
  W_DBW68: 'DB1001,INT68', // 03026电机（出口链条机）
  W_DBW70: 'DB1001,INT70', // 03029电机（出口链条机）
  W_DBW72: 'DB1001,INT72', // 03033电机（出口链条机）
  W_DBW74: 'DB1001,INT74', // 03036电机（出口链条机）
  W_DBW76: 'DB1001,INT76', // 04026电机（出口链条机）
  W_DBW78: 'DB1001,INT78', // 04029电机（出口链条机）
  W_DBW80: 'DB1001,INT80', // 04033电机（出口链条机）
  W_DBW82: 'DB1001,INT82', // 04036电机（出口链条机）
  W_DBW84: 'DB1001,INT84', // 05026电机（出口链条机）
  W_DBW86: 'DB1001,INT86', // 05029电机（出口链条机）
  W_DBW88: 'DB1001,INT88', // 05033电机（出口链条机）
  W_DBW90: 'DB1001,INT90', // 05036电机（出口链条机）
  W_DBW92: 'DB1001,INT92', // 06026电机（出口链条机）
  W_DBW94: 'DB1001,INT94', // 06029电机（出口链条机）
  W_DBW96: 'DB1001,INT96', // 06033电机（出口链条机）
  W_DBW98: 'DB1001,INT98', // 06036电机（出口链条机）
  W_DBW100: 'DB1001,INT100', // 07026电机（出口链条机）
  W_DBW102: 'DB1001,INT102', // 07029电机（出口链条机）
  W_DBW104: 'DB1001,INT104', // 07033电机（出口链条机）
  W_DBW106: 'DB1001,INT106', // 07036电机（出口链条机）
  W_DBW108: 'DB1001,INT108', // 08026电机（出口链条机）
  W_DBW110: 'DB1001,INT110', // 08029电机（出口链条机）
  W_DBW112: 'DB1001,INT112', // 08033电机（出口链条机）
  W_DBW114: 'DB1001,INT114', // 08036电机（出口链条机）
  W_DBW116: 'DB1001,INT116', // 09015电机（出口链条机）
  W_DBW118: 'DB1001,INT118', // 09018电机（出口链条机）

  // 展开定义：出灭菌线占位虚拟ID码 (DB1001.DBW120-DBW178)
  W_DBW120: 'DB1001,INT120', // 02026电机（出口链条机）
  W_DBW122: 'DB1001,INT122', // 02029电机（出口链条机）
  W_DBW124: 'DB1001,INT124', // 02033电机（出口链条机）
  W_DBW126: 'DB1001,INT126', // 02036电机（出口链条机）
  W_DBW128: 'DB1001,INT128', // 03026电机（出口链条机）
  W_DBW130: 'DB1001,INT130', // 03029电机（出口链条机）
  W_DBW132: 'DB1001,INT132', // 03033电机（出口链条机）
  W_DBW134: 'DB1001,INT134', // 03036电机（出口链条机）
  W_DBW136: 'DB1001,INT136', // 04026电机（出口链条机）
  W_DBW138: 'DB1001,INT138', // 04029电机（出口链条机）
  W_DBW140: 'DB1001,INT140', // 04033电机（出口链条机）
  W_DBW142: 'DB1001,INT142', // 04036电机（出口链条机）
  W_DBW144: 'DB1001,INT144', // 05026电机（出口链条机）
  W_DBW146: 'DB1001,INT146', // 05029电机（出口链条机）
  W_DBW148: 'DB1001,INT148', // 05033电机（出口链条机）
  W_DBW150: 'DB1001,INT150', // 05036电机（出口链条机）
  W_DBW152: 'DB1001,INT152', // 06026电机（出口链条机）
  W_DBW154: 'DB1001,INT154', // 06029电机（出口链条机）
  W_DBW156: 'DB1001,INT156', // 06033电机（出口链条机）
  W_DBW158: 'DB1001,INT158', // 06036电机（出口链条机）
  W_DBW160: 'DB1001,INT160', // 07026电机（出口链条机）
  W_DBW162: 'DB1001,INT162', // 07029电机（出口链条机）
  W_DBW164: 'DB1001,INT164', // 07033电机（出口链条机）
  W_DBW166: 'DB1001,INT166', // 07036电机（出口链条机）
  W_DBW168: 'DB1001,INT168', // 08026电机（出口链条机）
  W_DBW170: 'DB1001,INT170', // 08029电机（出口链条机）
  W_DBW172: 'DB1001,INT172', // 08033电机（出口链条机）
  W_DBW174: 'DB1001,INT174', // 08036电机（出口链条机）
  W_DBW176: 'DB1001,INT176', // 09015电机（出口链条机）
  W_DBW178: 'DB1001,INT178', // 09018电机（出口链条机）

  W_DBW180: 'DB1001,INT180', // 进货错误停止信号
  W_DBW182: 'DB1001,INT182', // 选定电机编号5
  W_DBW184: 'DB1001,INT184', // 选定电机编号6
  W_DBW186: 'DB1001,INT186', // 选定电机编号7
  W_DBW188: 'DB1001,INT188' // 选定电机编号8
};

// 批量写入数组 - 仅包含 "是否一直写" 为 "是" 的点位
var writeStrArr = [0, 0, 0, 0, 0];
var writeAddArr = [
  'W_DBW0', // WCS看门狗心跳
  'W_DBW2', // WCS-全线启动
  'W_DBW4', // WCS-全线停止
  'W_DBW6', // WCS-允许进料
  'W_DBW8' // WCS-故障复位
];

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
