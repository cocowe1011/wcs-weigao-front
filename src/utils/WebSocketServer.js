const WebSocket = require('ws');

/**
 * PDA/移动端 WebSocket 服务端：供 PDA 连接电脑端，扫码数据上报、报警推送等
 */
class AlarmWebSocketServer {
  constructor(port = 8081) {
    this.port = port;
    this.wss = null;
    this.clients = new Map(); // 存储连接的客户端信息
    this.isRunning = false;
    this.mainWindow = null; // 存储主窗口引用，用于 IPC 通信

    this.init();
  }

  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }

  init() {
    try {
      this.wss = new WebSocket.Server({
        port: this.port,
        verifyClient: () => true
      });

      this.wss.on('connection', (ws, req) => {
        const clientId = this.generateClientId();
        const clientInfo = {
          id: clientId,
          ws: ws,
          userAgent: req.headers['user-agent'] || 'Unknown',
          ip:
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            'Unknown',
          connectedAt: new Date(),
          lastPing: Date.now()
        };

        this.clients.set(clientId, clientInfo);
        console.log(`移动端客户端连接: ${clientId}, IP: ${clientInfo.ip}`);

        this.sendToClient(clientId, {
          type: 'connected',
          clientId: clientId,
          message: '连接成功'
        });

        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message);
            this.handleClientMessage(clientId, data);
          } catch (error) {
            console.error('解析客户端消息失败:', error);
          }
        });

        ws.on('close', () => {
          console.log(`移动端客户端断开连接: ${clientId}`);
          this.clients.delete(clientId);
        });

        ws.on('error', (error) => {
          console.error(`客户端连接错误 ${clientId}:`, error);
          this.clients.delete(clientId);
        });

        ws.on('pong', () => {
          if (this.clients.has(clientId)) {
            this.clients.get(clientId).lastPing = Date.now();
          }
        });
      });

      this.wss.on('listening', () => {
        console.log(`PDA WebSocket 服务器启动成功，端口: ${this.port}`);
        this.isRunning = true;
      });

      this.wss.on('error', (error) => {
        console.error('WebSocket服务器错误:', error);
        this.isRunning = false;
      });

      this.startHeartbeat();
    } catch (error) {
      console.error('WebSocket服务器初始化失败:', error);
      this.isRunning = false;
    }
  }

  handleClientMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (data.type) {
      case 'register':
        this.sendToClient(clientId, {
          type: 'registered',
          message: '注册成功'
        });
        break;
      case 'ping':
        client.lastPing = Date.now();
        this.sendToClient(clientId, { type: 'pong' });
        break;
      case 'scan_code':
        this.handleScanCodeMessage(clientId, data);
        break;
      case 'tray_data_changed':
        this.handleTrayDataChanged(clientId, data);
        break;
      default:
        console.log(`收到客户端 ${clientId} 未知消息类型:`, data.type);
    }
  }

  /** 扫码地点 -> MainPage 方法名（用于 IPC 后渲染进程调用） */
  handleScanCodeMessage(clientId, data) {
    const { location, trayCode } = data;

    if (!this.mainWindow) {
      this.sendToClient(clientId, {
        type: 'scan_response',
        success: false,
        message: '服务器内部错误'
      });
      return;
    }

    const methodMap = {
      上货区: 'addTrayFromPda'
    };

    const methodName = methodMap[location];
    if (!methodName) {
      this.sendToClient(clientId, {
        type: 'scan_response',
        success: false,
        message: '未知的扫码地点: ' + location
      });
      return;
    }

    this.mainWindow.webContents.send('mobile-scan-code', {
      method: methodName,
      trayCode: trayCode,
      source: 'PDA',
      clientId: clientId
    });

    this.sendToClient(clientId, {
      type: 'scan_response',
      success: true,
      message: '扫码消息已发送到PC端处理'
    });
  }

  sendScanResult(clientId, result) {
    this.sendToClient(clientId, {
      type: 'scan_result',
      success: result.success,
      message: result.message,
      data: result.data
    });
  }

  handleTrayDataChanged(clientId, data) {
    if (!this.mainWindow) return;
    this.mainWindow.webContents.send('mobile-tray-data-changed', {
      clientId: clientId,
      timestamp: data.timestamp
    });
  }

  pushAlarmToMobile(alarmData) {
    if (!this.isRunning) return false;
    const message = {
      type: 'alarm',
      data: alarmData,
      timestamp: new Date().toISOString()
    };
    let sentCount = 0;
    this.clients.forEach((client, id) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        this.sendToClient(id, message);
        sentCount++;
      }
    });
    return sentCount > 0;
  }

  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error(`发送消息给客户端 ${clientId} 失败:`, error);
        this.clients.delete(clientId);
        return false;
      }
    }
    return false;
  }

  generateClientId() {
    return (
      'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    );
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      clientCount: this.clients.size
    };
  }

  getConnectedClients() {
    const clientList = [];
    this.clients.forEach((client, clientId) => {
      clientList.push({
        id: clientId,
        ip: client.ip,
        userAgent: client.userAgent,
        connectedAt: client.connectedAt,
        lastPing: new Date(client.lastPing),
        status: client.ws.readyState === WebSocket.OPEN ? '在线' : '离线'
      });
    });
    return clientList;
  }

  startHeartbeat() {
    setInterval(() => {
      const now = Date.now();
      this.clients.forEach((client, clientId) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          if (now - client.lastPing > 30000) {
            client.ws.terminate();
            this.clients.delete(clientId);
          } else {
            client.ws.ping();
          }
        } else {
          this.clients.delete(clientId);
        }
      });
    }, 15000);
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      this.isRunning = false;
    }
  }
}

module.exports = AlarmWebSocketServer;
