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
            <span class="sd-header-right">
              <span class="sd-status">
                <i class="sd-dot" :class="s.connected ? 'on' : 'off'"></i>
                {{ s.connected ? '已连接' : '未连接' }}
              </span>
              <button
                class="sd-trigger-btn"
                :disabled="!s.connected"
                @click="triggerScanner(s.ip)"
              >
                TRIGGER
              </button>
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
            <span class="sd-header-right">
              <span class="sd-status">
                <i class="sd-dot" :class="s.connected ? 'on' : 'off'"></i>
                {{ s.connected ? '已连接' : '未连接' }}
              </span>
              <button
                class="sd-trigger-btn"
                :disabled="!s.connected"
                @click="triggerScanner(s.ip)"
              >
                TRIGGER
              </button>
            </span>
          </div>
          <div class="sd-barcode-box">
            <span class="sd-barcode-value">{{ s.barcode || '—' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 调试日志面板 -->
    <div class="sd-debug-panel">
      <div class="sd-debug-bar">
        <span class="sd-debug-title">原始数据调试日志</span>
        <span class="sd-debug-actions">
          <button class="sd-clear-btn" @click="clearLogs">清空</button>
        </span>
      </div>
      <div ref="debugLogBox" class="sd-debug-log">
        <div v-for="(log, i) in debugLogs" :key="i" class="sd-log-entry">
          <div class="sd-log-time">{{ log.time }}</div>
          <div class="sd-log-ip">[{{ log.station }}] {{ log.ip }}</div>
          <div class="sd-log-section">
            <span class="sd-log-label">原始:</span>
            <span class="sd-log-raw">{{ log.rawDisplay }}</span>
          </div>
          <div class="sd-log-section">
            <span class="sd-log-label">HEX:</span>
            <span class="sd-log-hex">{{ log.hex }}</span>
          </div>
          <div
            v-for="(strategy, si) in log.strategies"
            :key="si"
            class="sd-log-section"
          >
            <span class="sd-log-label"
              >{{ strategy.name }}({{ strategy.items.length }}条):</span
            >
            <span
              v-for="(item, ii) in strategy.items"
              :key="ii"
              class="sd-log-parsed"
              :class="{ 'sd-log-empty-item': !item }"
            >
              [{{ ii }}] {{ item || '(空)' }}
            </span>
          </div>
          <div class="sd-log-section">
            <span class="sd-log-label">cleanBarcode结果:</span>
            <span
              v-for="(line, li) in log.cleaned"
              :key="'c' + li"
              class="sd-log-cleaned"
            >
              [{{ li }}] {{ line || '(空)' }}
            </span>
          </div>
        </div>
        <div v-if="debugLogs.length === 0" class="sd-log-empty">
          暂无数据，等待扫码枪返回...
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
const MAX_DEBUG_LOGS = 50;

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
      })),
      debugLogs: []
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
    /**
     * 将字符串转为可见的转义显示（\r \n \t 等）
     */
    toVisibleEscape(str) {
      return str
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t');
    },
    /**
     * 将字符串转为 hex 空格分隔
     */
    toHex(str) {
      return Array.from(Buffer.from(str, 'utf8'))
        .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
        .join(' ');
    },
    /**
     * cleanBarcode 与 MainPage 一致
     */
    cleanBarcode(code) {
      if (!code) return '';
      return String(code)
        .replace(/[^a-zA-Z0-9]/g, '')
        .trim();
    },
    /**
     * 记录调试日志：展示多种分割策略的对比结果
     */
    addDebugLog(station, ip, rawData) {
      const rawStr = String(rawData);
      const trim = (s) => s.trim().replace(/^\|+|\|+$/g, '');

      // 定义所有分割策略
      const strategies = [
        {
          name: '按\\r\\n拆分',
          items: rawStr
            .split(/[\r\n]+/)
            .filter(Boolean)
            .map(trim)
        },
        {
          name: '按|拆分',
          items: rawStr.split(/\|+/).filter(Boolean).map(trim)
        },
        {
          name: '按多空格拆分',
          items: rawStr
            .split(/\s{2,}/)
            .filter(Boolean)
            .map(trim)
        },
        {
          name: '按Tab拆分',
          items: rawStr.split(/\t+/).filter(Boolean).map(trim)
        },
        {
          name: '按分号;拆分',
          items: rawStr.split(/;+/).filter(Boolean).map(trim)
        },
        {
          name: '按逗号,拆分',
          items: rawStr.split(/,+/).filter(Boolean).map(trim)
        },
        {
          name: '不拆分(整条)',
          items: [trim(rawStr)]
        }
      ];

      // cleanBarcode 用默认策略(\r\n)的结果
      const defaultLines = strategies[0].items;
      const cleaned = defaultLines.map((l) => this.cleanBarcode(l));

      const now = new Date();
      const time =
        [now.getHours(), now.getMinutes(), now.getSeconds()]
          .map((n) => String(n).padStart(2, '0'))
          .join(':') +
        '.' +
        String(now.getMilliseconds()).padStart(3, '0');

      this.debugLogs.unshift({
        time,
        station,
        ip,
        rawDisplay: this.toVisibleEscape(rawStr),
        hex: this.toHex(rawStr),
        strategies,
        cleaned
      });

      // 限制日志数量
      if (this.debugLogs.length > MAX_DEBUG_LOGS) {
        this.debugLogs.splice(MAX_DEBUG_LOGS);
      }

      // 自动滚动到顶部
      this.$nextTick(() => {
        if (this.$refs.debugLogBox) {
          this.$refs.debugLogBox.scrollTop = 0;
        }
      });
    },
    clearLogs() {
      this.debugLogs = [];
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
        // 记录调试日志（不管是否有内容都记录）
        this.addDebugLog(scanner.station, ip, data);
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
    triggerScanner(ip) {
      const socket = this._sockets[ip];
      if (socket && !socket.destroyed) {
        socket.write('TRIGGER');
        console.log(`[扫码枪] ${ip} 已发送 TRIGGER`);
      }
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
    flex-shrink: 0;
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

        .sd-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sd-trigger-btn {
          padding: 2px 10px;
          font-size: 12px;
          font-weight: 500;
          color: #fff;
          background: #3b82f6;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          line-height: 22px;

          &:hover:not(:disabled) {
            background: #2563eb;
          }

          &:disabled {
            background: #c4c9d4;
            cursor: not-allowed;
          }
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

  // 调试日志面板
  .sd-debug-panel {
    background: #1e1e2e;
    border-radius: 6px;
    border: 1px solid #383850;
    flex: 1;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .sd-debug-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      border-bottom: 1px solid #383850;

      .sd-debug-title {
        font-size: 13px;
        font-weight: 600;
        color: #cdd6f4;
      }

      .sd-clear-btn {
        padding: 2px 10px;
        font-size: 12px;
        color: #cdd6f4;
        background: #45475a;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        line-height: 20px;

        &:hover {
          background: #585b70;
        }
      }
    }

    .sd-debug-log {
      flex: 1;
      overflow-y: auto;
      padding: 8px;

      .sd-log-empty {
        color: #6c7086;
        font-size: 13px;
        text-align: center;
        padding: 24px 0;
      }

      .sd-log-entry {
        padding: 8px 10px;
        margin-bottom: 8px;
        background: #181825;
        border-radius: 4px;
        border-left: 3px solid #89b4fa;

        .sd-log-time {
          font-size: 11px;
          color: #6c7086;
          font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
          display: inline;
        }

        .sd-log-ip {
          font-size: 12px;
          color: #89b4fa;
          font-weight: 500;
          display: inline;
          margin-left: 8px;
        }

        .sd-log-section {
          margin-top: 4px;
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 4px;

          .sd-log-label {
            font-size: 11px;
            color: #a6adc8;
            font-weight: 500;
            flex-shrink: 0;
          }

          .sd-log-raw {
            font-size: 12px;
            color: #f9e2af;
            font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
            word-break: break-all;
          }

          .sd-log-hex {
            font-size: 11px;
            color: #6c7086;
            font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
            word-break: break-all;
          }

          .sd-log-parsed,
          .sd-log-cleaned {
            font-size: 12px;
            font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
            word-break: break-all;
            margin-right: 8px;
          }

          .sd-log-parsed {
            color: #a6e3a1;
          }

          .sd-log-parsed.sd-log-empty-item {
            color: #6c7086;
            font-style: italic;
          }

          .sd-log-cleaned {
            color: #f38ba8;
          }
        }
      }
    }
  }
}
</style>
