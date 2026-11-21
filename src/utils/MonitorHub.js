const WebSocket = require('ws');

/**
 * 现场包把页面快照广播给监控端。只转发，不解析业务。
 * 按 points / exec / queues 各留最后一帧，新连接先收到这三帧。
 */
class MonitorHub {
  constructor(port) {
    this.port = port;
    this.wss = null;
    this.lastFrames = {
      points: null,
      exec: null,
      queues: null
    };
  }

  start() {
    this.wss = new WebSocket.Server({
      port: this.port,
      host: '0.0.0.0'
    });
    this.wss.on('connection', (socket) => {
      socket.on('error', () => {});
      ['points', 'exec', 'queues'].forEach((key) => {
        const frame = this.lastFrames[key];
        if (frame) {
          this.send(socket, frame);
        }
      });
    });
    this.wss.on('error', (error) => {
      console.error('MonitorHub 错误:', error);
    });
  }

  publish(frame) {
    if (!frame || !frame.type) {
      return;
    }
    if (Object.prototype.hasOwnProperty.call(this.lastFrames, frame.type)) {
      this.lastFrames[frame.type] = frame;
    }
    if (!this.wss) {
      return;
    }
    this.wss.clients.forEach((client) => {
      this.send(client, frame);
    });
  }

  send(socket, frame) {
    if (socket.readyState !== WebSocket.OPEN) {
      return;
    }
    socket.send(JSON.stringify(frame));
  }
}

module.exports = MonitorHub;
