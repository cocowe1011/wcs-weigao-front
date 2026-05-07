<template>
  <div class="scanner-debug">
    <!-- 01002工位 -->
    <div class="sd-station">
      <div class="sd-station-bar">
        <span class="sd-station-name">01002工位</span>
      </div>
      <div class="sd-scanner-list">
        <div v-for="s in scanners01002" :key="s.ip" class="sd-scanner-row">
          <div class="sd-scanner-header">
            <span class="sd-scanner-ip">{{ s.ip }}</span>
            <span class="sd-status">
              <i class="sd-dot" :class="s.connected ? 'on' : 'off'"></i>
              {{ s.connected ? '已连接' : '未连接' }}
            </span>
          </div>
          <div class="sd-barcode-box">
            <span class="sd-barcode-value">{{ s.barcode || '—' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 01006工位 -->
    <div class="sd-station">
      <div class="sd-station-bar">
        <span class="sd-station-name">01006工位</span>
      </div>
      <div class="sd-scanner-list">
        <div v-for="s in scanners01006" :key="s.ip" class="sd-scanner-row">
          <div class="sd-scanner-header">
            <span class="sd-scanner-ip">{{ s.ip }}</span>
            <span class="sd-status">
              <i class="sd-dot" :class="s.connected ? 'on' : 'off'"></i>
              {{ s.connected ? '已连接' : '未连接' }}
            </span>
          </div>
          <div class="sd-barcode-box">
            <span class="sd-barcode-value">{{ s.barcode || '—' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const net = require('net');

// 扫码枪TCP连接配置
const SCANNER_CONFIG = [
  { station: '01002', ip: '192.168.2.230', port: 55256 },
  { station: '01002', ip: '192.168.2.234', port: 55256 },
  { station: '01006', ip: '192.168.2.238', port: 55256 },
  { station: '01006', ip: '192.168.2.242', port: 55256 }
];

const RECONNECT_DELAY = 3000;

export default {
  name: 'ScannerDebug',
  data() {
    return {
      scanners: SCANNER_CONFIG.map((c) => ({
        station: c.station,
        ip: c.ip,
        port: c.port,
        connected: false,
        barcode: ''
      }))
    };
  },
  computed: {
    scanners01002() {
      return this.scanners.filter((s) => s.station === '01002');
    },
    scanners01006() {
      return this.scanners.filter((s) => s.station === '01006');
    }
  },
  mounted() {
    this._sockets = {};
    this._reconnectTimers = {};
    this._destroyed = false;
    this.connectAll();
  },
  beforeDestroy() {
    this._destroyed = true;
    this.disconnectAll();
  },
  methods: {
    getScannerIndex(ip) {
      return this.scanners.findIndex((s) => s.ip === ip);
    },
    connectAll() {
      this.scanners.forEach((s) => this.connectScanner(s.ip));
    },
    connectScanner(ip) {
      if (this._destroyed) return;
      // 如果已有连接则先关闭
      if (this._sockets[ip]) {
        this._sockets[ip].destroy();
        delete this._sockets[ip];
      }

      const idx = this.getScannerIndex(ip);
      if (idx === -1) return;

      const scanner = this.scanners[idx];
      const socket = new net.Socket();
      socket.setEncoding('utf8');

      socket.on('connect', () => {
        console.log(`[扫码枪] ${ip} 已连接`);
        this.$set(this.scanners[idx], 'connected', true);
      });

      socket.on('data', (data) => {
        const barcode = data.trim();
        if (barcode) {
          console.log(`[扫码枪] ${ip} 收到数据: ${barcode}`);
          this.$set(this.scanners[idx], 'barcode', barcode);
        }
      });

      socket.on('close', () => {
        console.log(`[扫码枪] ${ip} 连接关闭`);
        this.$set(this.scanners[idx], 'connected', false);
        delete this._sockets[ip];
        // 自动重连
        if (!this._destroyed) {
          this._reconnectTimers[ip] = setTimeout(() => {
            this.connectScanner(ip);
          }, RECONNECT_DELAY);
        }
      });

      socket.on('error', (err) => {
        console.error(`[扫码枪] ${ip} 连接错误:`, err.message);
        this.$set(this.scanners[idx], 'connected', false);
      });

      this._sockets[ip] = socket;
      socket.connect(scanner.port, ip);
    },
    disconnectAll() {
      // 清除重连定时器
      Object.keys(this._reconnectTimers).forEach((ip) => {
        clearTimeout(this._reconnectTimers[ip]);
      });
      this._reconnectTimers = {};
      // 关闭所有连接
      Object.values(this._sockets).forEach((socket) => {
        socket.destroy();
      });
      this._sockets = {};
    }
  }
};
</script>

<style lang="less" scoped>
.scanner-debug {
  height: 100%;
  padding: 8px 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;

  // 工位卡片
  .sd-station {
    background: #fff;
    border-radius: 6px;
    border: 1px solid #e8ecf1;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .sd-station-bar {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      border-bottom: 1px solid #f0f2f5;

      .sd-station-name {
        font-size: 15px;
        font-weight: 600;
        color: #1c1c28;
      }
    }

    .sd-scanner-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .sd-scanner-row {
      flex: 1;
      display: flex;
      flex-direction: column;
      border-bottom: 1px solid #f0f2f5;

      &:last-child {
        border-bottom: none;
      }

      .sd-scanner-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 16px;

        .sd-scanner-ip {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
        }

        .sd-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #6b7280;

          .sd-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;

            &.on {
              background: #10b981;
            }

            &.off {
              background: #d1d5db;
            }
          }
        }
      }

      .sd-barcode-box {
        display: flex;
        align-items: flex-start;
        padding: 4px 16px 12px 16px;

        .sd-barcode-value {
          font-size: 18px;
          font-weight: 600;
          color: #1c1c28;
          font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
        }
      }
    }
  }
}
</style>
