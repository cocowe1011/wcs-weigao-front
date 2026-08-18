<template>
  <div class="monitor-viewport">
    <div class="monitor-stage" :style="stageStyle">
      <div class="sterilization-monitor">
        <!-- 右上角关闭按钮区域 -->
        <div
          class="close-area"
          @mouseenter="showCloseBtn = true"
          @mouseleave="showCloseBtn = false"
        >
          <button
            v-show="showCloseBtn"
            class="close-btn"
            @click="closeApplication"
          >
            <i class="el-icon-switch-button"></i>
            <span>退出</span>
          </button>
        </div>

        <!-- Header -->
        <header class="monitor-header">
          <div class="header-content">
            <div class="header-left">
              <div class="logo-icon">
                <img
                  src="@/assets/fengke-logo.jpg"
                  alt="logo"
                  class="logo-img"
                />
              </div>
              <div>
                <h1 class="main-title">威高灭菌中心</h1>
                <p class="sub-title">灭菌监控</p>
              </div>
            </div>
            <div class="header-right">
              <div class="time-display">
                <div class="current-time">{{ currentTime }}</div>
                <div class="current-date">{{ currentDate }}</div>
              </div>
            </div>
          </div>
        </header>

        <!-- Status Panel -->
        <div class="status-panel-container">
          <div class="status-panel flow-border">
            <div class="status-info">
              <div class="info-item">
                <span class="info-label">当前货物批次信息</span>
                <span class="info-value cyan" :title="batchNo">{{
                  batchNo
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">当前货物产品信息</span>
                <span class="info-value cyan" :title="productInfoText">{{
                  productInfoText
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">规格型号</span>
                <span class="info-value cyan" :title="specText">{{
                  specText
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">产品货号</span>
                <span class="info-value cyan" :title="productCodeText">{{
                  productCodeText
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">工艺方案</span>
                <span class="info-value cyan" :title="processPlanText">{{
                  processPlanText
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">当前指定预热柜</span>
                <span class="info-value cyan">{{
                  destinationCabinetText
                }}</span>
              </div>
            </div>
            <div class="status-divider"></div>
            <div class="status-stats">
              <div class="batch-stats">
                <div class="stat-big">
                  <div class="stat-big-value stat-green">
                    {{ trayLoadedCount }}
                  </div>
                  <div class="stat-big-total">/ {{ batchTotalCount }}</div>
                  <div class="stat-big-label">已完成/总托盘</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Workstations -->
        <div class="workstations-container">
          <div
            v-for="station in workstations"
            :key="station.id"
            class="workstation-card flow-border"
          >
            <div class="workstation-header">
              <div class="workstation-header-left">
                <div class="station-badge">{{ station.name }}</div>
                <div class="station-status">
                  <div class="status-dot"></div>
                  <span>运行中</span>
                </div>
              </div>
              <button class="refresh-button">
                <i class="el-icon-refresh"></i>
              </button>
            </div>

            <div class="workstation-body">
              <div class="station-meta">
                <div class="meta-item meta-product">
                  <span class="meta-label">当前货物信息</span>
                  <span class="meta-value" :title="station.productInfo">{{
                    station.productInfo
                  }}</span>
                </div>
                <div class="meta-item meta-qty">
                  <span class="meta-label">目标数量</span>
                  <span class="meta-value cyan">{{ station.targetQty }}</span>
                </div>
                <div class="meta-item meta-qty">
                  <span class="meta-label">已扫描数量</span>
                  <span class="meta-value green">{{ station.scannedQty }}</span>
                </div>
              </div>

              <div class="items-card">
                <div class="items-header">
                  <div class="items-title">产品编号列表</div>
                  <div class="items-stats">
                    <span class="stat-success"
                      >✓ {{ getSuccessCount(station) }}</span
                    >
                    /
                    <span class="stat-failed"
                      >✗ {{ getFailedCount(station) }}</span
                    >
                    /
                    <span class="stat-pending"
                      >○ {{ getPendingCount(station) }}</span
                    >
                  </div>
                </div>
                <div class="items-grid">
                  <div
                    v-for="item in station.items"
                    :key="item.id"
                    :class="['item-box', getItemStatusClass(item.status)]"
                  >
                    <div class="item-code" :title="item.code">
                      {{ item.code }}
                    </div>
                  </div>
                </div>
                <div class="items-tip">
                  <div class="tip-icon">
                    <i class="el-icon-warning-outline"></i>
                  </div>
                  <div>
                    扫码成功显示绿色边框，扫码失败显示红色边框，未扫描显示灰色
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧面板：托盘信息 + 故障日志 -->
          <div class="side-panel flow-border">
            <div class="tray-panel">
              <div class="panel-header">
                <span class="panel-title">托盘信息</span>
                <span class="panel-extra"
                  >已上货 {{ trayLoadedCount }}/{{ batchStatus.length }}</span
                >
              </div>
              <div class="tray-grid">
                <div
                  v-for="(loaded, index) in batchStatus"
                  :key="index"
                  :class="['tray-item', loaded ? 'tray-loaded' : 'tray-empty']"
                >
                  <img
                    src="@/assets/weigao-img/tray-daping.png"
                    alt="托盘"
                    class="tray-img"
                  />
                </div>
              </div>
            </div>

            <div class="fault-panel">
              <div class="panel-header">
                <span class="panel-title">故障日志</span>
              </div>
              <div class="fault-list">
                <div v-if="faultLogs.length === 0" class="fault-empty">
                  暂无故障
                </div>
                <div
                  v-for="(log, index) in faultLogs"
                  :key="log.id || index"
                  :class="['fault-item', 'fault-' + log.level]"
                >
                  <span class="fault-time">{{ log.time }}</span>
                  <span class="fault-level">{{ log.levelText }}</span>
                  <span class="fault-message" :title="log.message">{{
                    log.message
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <footer class="monitor-footer">
          <div class="footer-content">
            <div class="footer-left">
              <div
                class="system-status"
                :class="{ disconnected: !apiConnected }"
              >
                <div class="status-pulse"></div>
                <span class="status-label">接口状态：</span>
                <span class="status-value">{{
                  apiConnected ? '正常' : '异常'
                }}</span>
              </div>
              <div
                class="system-status"
                :class="{ disconnected: !wsConnected }"
              >
                <div class="status-pulse"></div>
                <span class="status-label">Socket状态：</span>
                <span class="status-value">{{
                  wsConnected ? '已连接' : '重连中'
                }}</span>
              </div>
            </div>
            <div class="footer-right">
              <div class="footer-item">最后更新: {{ footerTime }}</div>
              <div class="footer-item">© 2025 威高灭菌中心</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';
import HttpUtil from '@/utils/HttpUtil';
import AlarmWebSocketClient from '@/utils/AlarmWebSocketClient';

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

const EMPTY_WORKSTATIONS = [
  {
    id: 'A',
    name: 'A工位',
    productInfo: '--',
    targetQty: 0,
    scannedQty: 0,
    items: []
  },
  {
    id: 'B',
    name: 'B工位',
    productInfo: '--',
    targetQty: 0,
    scannedQty: 0,
    items: []
  }
];

export default {
  name: 'SterilizationMonitor',
  data() {
    return {
      showCloseBtn: false, // 控制关闭按钮显示
      currentTime: '',
      currentDate: '',
      footerTime: '',
      timer: null,
      pollTimer: null,
      // 状态面板左侧卡片数据
      batchNo: '--',
      productInfoText: '--',
      specText: '--',
      productCodeText: '--',
      processPlanText: '--',
      destinationCabinetText: '--',
      // 批次灭菌数量统计
      batchTotalCount: 0,
      // 工位数据（A/B 两个工位）
      workstations: EMPTY_WORKSTATIONS.map((s) => ({ ...s })),
      // 托盘格子状态：长度=托盘总数，元素表示该托盘是否已上货
      batchStatus: [],
      faultLogs: [],
      wsClient: null,
      wsConnected: false,
      apiConnected: false,
      scaleX: 1,
      scaleY: 1
    };
  },
  computed: {
    trayLoadedCount() {
      return this.batchStatus.filter(Boolean).length;
    },
    stageStyle() {
      return {
        transform: `scale(${this.scaleX}, ${this.scaleY})`
      };
    }
  },
  methods: {
    updateScale() {
      this.scaleX = window.innerWidth / DESIGN_WIDTH;
      this.scaleY = window.innerHeight / DESIGN_HEIGHT;
    },
    formatTime(date) {
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    formatDate(date) {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    },
    updateTime() {
      const now = new Date();
      this.currentTime = this.formatTime(now);
      this.currentDate = this.formatDate(now);
      this.footerTime = this.formatTime(now);
    },
    async pollData() {
      try {
        const batchRes = await HttpUtil.get(
          '/produce_batch/getCurrentExecuting'
        );
        if (batchRes && batchRes.data) {
          this.apiConnected = true;
          const { batch, pallets } = batchRes.data;

          this.batchNo = batch.batchNo || '--';

          const allGoods = (pallets || []).flatMap((p) => p.goods || []);
          const firstGood = allGoods.length > 0 ? allGoods[0] : null;
          this.productInfoText = (firstGood && firstGood.productName) || '--';
          this.specText = (firstGood && firstGood.spec) || '--';
          this.productCodeText = (firstGood && firstGood.productCode) || '--';
          this.processPlanText = batch.processPlanNameCode || '--';

          // 批次统计与托盘格子状态
          const palletList = pallets || [];
          this.batchTotalCount = palletList.length;
          this.batchStatus = palletList.map((p) => p.loadStatus === '1');

          // 目的地（预热柜）
          try {
            const destRes = await HttpUtil.get(
              `/produce_batch_destination/current?batchId=${batch.id}`
            );
            if (destRes && destRes.data && destRes.data.destinationCode) {
              const code = destRes.data.destinationCode;
              const cabNum = parseInt(code, 10) - 3200;
              this.destinationCabinetText = cabNum > 0 ? `${cabNum}号柜` : code;
            } else {
              this.destinationCabinetText = '--';
            }
          } catch (e) {
            this.destinationCabinetText = '--';
          }

          // 关联上货区托盘队列：仅展示上货区中仍存在的托盘
          let loadingPalletIds = null;
          try {
            const queueRes = await HttpUtil.post(
              '/queue_info/queryQueueList',
              {}
            );
            if (queueRes && queueRes.data) {
              const loadingQueue = queueRes.data.find((q) => q.id === 1);
              if (loadingQueue && loadingQueue.trayInfo) {
                const trayInfo = JSON.parse(loadingQueue.trayInfo);
                loadingPalletIds = new Set(
                  (Array.isArray(trayInfo) ? trayInfo : []).map((t) =>
                    String(t.palletId)
                  )
                );
              }
            }
          } catch (e) {
            console.error('获取上货区队列失败:', e);
          }
          // AB工位展示用托盘列表：关联上货区队列过滤已删除的托盘
          const displayPallets = loadingPalletIds
            ? palletList.filter((p) => loadingPalletIds.has(String(p.id)))
            : palletList;

          // A工位=01002最新一个已分配虚拟ID且未发送目的地的托盘
          const latestByVirtualId = () => {
            const matches = displayPallets.filter(
              (p) =>
                p.virtualId && p.loadStatus === '1' && !p.sendDestinationCode
            );
            if (!matches.length) return null;
            return matches.sort((a, b) => {
              const ta = a.loadTime ? new Date(a.loadTime).getTime() : 0;
              const tb = b.loadTime ? new Date(b.loadTime).getTime() : 0;
              return tb - ta;
            })[0];
          };
          // B工位=02006最新一个发送非999目的地的托盘
          const latestNon999 = () => {
            const matches = displayPallets.filter(
              (p) =>
                p.sendDestinationCode && String(p.sendDestinationCode) !== '999'
            );
            if (!matches.length) return null;
            return matches.sort((a, b) => {
              const ta = a.sendTime ? new Date(a.sendTime).getTime() : 0;
              const tb = b.sendTime ? new Date(b.sendTime).getTime() : 0;
              return tb - ta;
            })[0];
          };
          const buildStation = (id, name, pallet) => {
            if (!pallet)
              return {
                id,
                name,
                productInfo: '--',
                targetQty: 0,
                scannedQty: 0,
                items: []
              };
            const goods = pallet.goods || [];
            const firstGood = goods[0];
            return {
              id,
              name,
              productInfo: firstGood
                ? `${firstGood.productName || ''} - 批次 ${
                    pallet.palletNo || ''
                  }`
                : `托盘 ${pallet.palletNo || '--'}`,
              targetQty: goods.length,
              scannedQty: goods.filter((g) => g.scanStatus === '1').length,
              items: goods.map((g) => ({
                id: g.id,
                code: g.uid || '--',
                status: g.scanStatus === '1' ? 'success' : 'pending'
              }))
            };
          };
          this.workstations = [
            buildStation('A', 'A工位（01002）', latestByVirtualId()),
            buildStation('B', 'B工位（01006）', latestNon999())
          ];
        } else {
          this.apiConnected = true;
          this.batchNo = '--';
          this.productInfoText = '--';
          this.specText = '--';
          this.productCodeText = '--';
          this.processPlanText = '--';
          this.destinationCabinetText = '--';
          this.batchStatus = [];
          this.batchTotalCount = 0;
          this.workstations = EMPTY_WORKSTATIONS.map((s) => ({ ...s }));
        }
      } catch (e) {
        this.apiConnected = false;
        console.error('灭菌监控数据轮询失败:', e);
      }
    },
    getItemStatusClass(status) {
      switch (status) {
        case 'success':
          return 'item-success';
        case 'failed':
          return 'item-failed';
        default:
          return 'item-pending';
      }
    },
    getSuccessCount(station) {
      return station.items.filter((i) => i.status === 'success').length;
    },
    getFailedCount(station) {
      return station.items.filter((i) => i.status === 'failed').length;
    },
    getPendingCount(station) {
      return station.items.filter((i) => i.status === 'pending').length;
    },
    closeApplication() {
      ipcRenderer.send('close-window');
    },
    initWebSocket() {
      this.wsClient = new AlarmWebSocketClient({
        onConnected: () => {
          this.wsConnected = true;
        },
        onDisconnected: () => {
          this.wsConnected = false;
        },
        onError: () => {
          this.wsConnected = false;
        },
        onAlarmReceived: this.onAlarmReceived
      });
      this.wsClient.start();
    },
    onAlarmReceived(alarmLog) {
      const log = {
        id: alarmLog.id,
        time: this.formatAlarmTime(alarmLog.timestamp),
        level: 'error',
        levelText: '错误',
        message: alarmLog.message || '--'
      };
      this.faultLogs.unshift(log);
      if (this.faultLogs.length > 100) {
        this.faultLogs.pop();
      }
    },
    formatAlarmTime(timestamp) {
      if (!timestamp) return '--';
      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) return '--';
      return this.formatTime(date);
    }
  },
  mounted() {
    this.updateScale();
    window.addEventListener('resize', this.updateScale);
    this.updateTime();
    this.timer = setInterval(this.updateTime, 1000);
    this.pollData();
    this.pollTimer = setInterval(this.pollData, 2000);
    this.initWebSocket();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateScale);
    if (this.timer) {
      clearInterval(this.timer);
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
    if (this.wsClient) {
      this.wsClient.disconnect();
      this.wsClient = null;
    }
  }
};
</script>

<style lang="less" scoped>
@property --flow-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.monitor-viewport {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0f172a;
  cursor: none;
}

.monitor-stage {
  width: 1920px;
  height: 1080px;
  transform-origin: 0 0;
  overflow: hidden;
}

.sterilization-monitor {
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  color: #f1f5f9;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  // Header Styles
  .monitor-header {
    height: 56px;
    border-bottom: 1px solid rgba(6, 182, 212, 0.3);
    background: rgba(15, 23, 42, 0.8);

    .header-content {
      height: 100%;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .logo-icon {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;

          .logo-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
        }

        .main-title {
          font-size: 18px;
          font-weight: 700;
          color: #e2e8f0;
          margin: 0;
          line-height: 1.2;
        }

        .sub-title {
          font-size: 12px;
          color: #94a3b8;
          margin: 2px 0 0 0;
        }
      }

      .header-right {
        display: flex;
        align-items: center;

        .time-display {
          text-align: right;

          .current-time {
            font-size: 22px;
            font-weight: 700;
            color: #22d3ee;
            line-height: 1.2;
            font-family: 'Courier New', monospace;
          }

          .current-date {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 2px;
          }
        }
      }
    }
  }

  // Status Panel
  .status-panel-container {
    padding: 12px;
    flex-shrink: 0;

    .status-panel {
      border-radius: 10px;
      border: 1px solid rgba(6, 182, 212, 0.3);
      background: rgba(15, 23, 42, 0.6);
      padding: 14px 24px;
      display: flex;
      align-items: center;
      overflow: hidden;

      .status-info {
        flex: 1;
        display: flex;
        align-items: center;
        min-width: 0;

        .info-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
          min-width: 0;
          padding-left: 20px;
          border-left: 1px solid rgba(71, 85, 105, 0.3);

          &:first-child {
            padding-left: 0;
            border-left: none;
          }

          .info-label {
            font-size: 12px;
            color: #94a3b8;
            font-weight: 500;
            letter-spacing: 0.5px;
            white-space: nowrap;
          }

          .info-value {
            font-size: 17px;
            font-weight: 700;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            &.cyan {
              color: #22d3ee;
            }
          }
        }
      }

      .status-divider {
        width: 1px;
        height: 44px;
        background: rgba(71, 85, 105, 0.4);
        margin: 0 28px;
        flex-shrink: 0;
      }

      .status-stats {
        flex-shrink: 0;
        width: 280px;

        .batch-stats {
          display: flex;
          align-items: center;
          justify-content: center;

          .stat-big {
            display: flex;
            align-items: baseline;
            gap: 8px;

            .stat-big-value {
              font-size: 38px;
              font-weight: 800;
              line-height: 1.1;
              font-family: 'Courier New', monospace;

              &.stat-green {
                color: #10b981;
              }
            }

            .stat-big-total {
              font-size: 20px;
              font-weight: 700;
              color: #64748b;
              font-family: 'Courier New', monospace;
            }

            .stat-big-label {
              margin-left: 6px;
              font-size: 13px;
              color: #94a3b8;
              font-weight: 600;
              letter-spacing: 2px;
            }
          }
        }
      }
    }
  }

  // Workstations
  .workstations-container {
    padding: 0 12px 12px;
    display: grid;
    grid-template-columns: 1.35fr 1.35fr 1fr;
    gap: 12px;
    flex: 1;
    overflow: hidden;
    min-height: 0;

    .workstation-card {
      border-radius: 10px;
      border: 1px solid rgba(6, 182, 212, 0.3);
      background: rgba(15, 23, 42, 0.5);
      overflow: hidden;
      transition: border-color 0.3s;
      display: flex;
      flex-direction: column;
      min-height: 0;

      &:hover {
        border-color: rgba(6, 182, 212, 0.5);
      }

      .workstation-header {
        background: #1e293b;
        padding: 12px;
        border-bottom: 1px solid rgba(6, 182, 212, 0.3);
        display: flex;
        align-items: center;
        justify-content: space-between;

        .workstation-header-left {
          display: flex;
          align-items: center;
          gap: 12px;

          .station-badge {
            padding: 3px 10px;
            border-radius: 16px;
            background: rgba(34, 211, 238, 0.2);
            border: 1px solid rgba(34, 211, 238, 0.5);
            color: #22d3ee;
            font-size: 13px;
            font-weight: 600;
          }

          .station-status {
            display: flex;
            align-items: center;
            gap: 4px;

            .status-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #10b981;
              animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }

            span {
              font-size: 12px;
              color: #94a3b8;
            }
          }
        }

        .refresh-button {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          background: #1e293b;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.3s;

          &:hover {
            background: #334155;
          }

          i {
            font-size: 16px;
            color: #94a3b8;
          }
        }
      }

      .workstation-body {
        padding: 10px;
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;

        .station-meta {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          flex-shrink: 0;
          background: rgba(30, 41, 59, 0.5);
          border-radius: 8px;
          border: 1px solid rgba(71, 85, 105, 0.5);
          padding: 8px 10px;

          .meta-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 0;

            .meta-label {
              font-size: 12px;
              color: #94a3b8;
            }

            .meta-value {
              font-size: 14px;
              color: #e2e8f0;
              font-weight: 600;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;

              &.cyan {
                color: #22d3ee;
                font-family: 'Courier New', monospace;
              }

              &.green {
                color: #10b981;
                font-family: 'Courier New', monospace;
              }
            }

            &.meta-product {
              flex: 1;
              padding-right: 12px;
            }

            &.meta-qty {
              flex-shrink: 0;
              padding-left: 12px;
              border-left: 1px solid rgba(71, 85, 105, 0.4);
              min-width: 80px;
              text-align: center;
              align-items: center;
            }
          }
        }

        .items-card {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 8px;
          padding: 8px;
          border: 1px solid rgba(71, 85, 105, 0.5);
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-height: 0;

          .items-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;

            .items-title {
              font-size: 12px;
              color: #94a3b8;
            }

            .items-stats {
              font-size: 12px;

              .stat-success {
                color: #10b981;
              }

              .stat-failed {
                color: #f43f5e;
                margin-left: 4px;
              }

              .stat-pending {
                color: #64748b;
                margin-left: 4px;
              }
            }
          }

          .items-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 8px;
            flex: 1;
            overflow-y: auto;
            min-height: 0;
            align-content: start;

            // 自定义滚动条样式
            &::-webkit-scrollbar {
              width: 6px;
            }

            &::-webkit-scrollbar-track {
              background: rgba(15, 23, 42, 0.5);
              border-radius: 3px;
            }

            &::-webkit-scrollbar-thumb {
              background: rgba(6, 182, 212, 0.4);
              border-radius: 3px;
              transition: background 0.3s;

              &:hover {
                background: rgba(6, 182, 212, 0.6);
              }
            }

            .item-box {
              border-radius: 4px;
              border: 1px solid;
              padding: 4px 6px;
              text-align: center;
              transition: all 0.2s;
              min-width: 0;

              &.item-success {
                border-color: #10b981;
                background: rgba(16, 185, 129, 0.1);
              }

              &.item-failed {
                border-color: #f43f5e;
                background: rgba(244, 63, 94, 0.1);
              }

              &.item-pending {
                border-color: #475569;
                background: rgba(30, 41, 59, 0.3);
              }

              .item-code {
                box-sizing: border-box;
                width: 100%;
                max-width: 100%;
                min-width: 0;
                margin: 0 auto;
                font-size: 11px;
                font-family: 'Courier New', monospace;
                color: #cbd5e1;
                word-break: break-all;
                line-height: 1.3;
              }
            }
          }

          .items-tip {
            margin-top: 8px;
            font-size: 12px;
            color: #94a3b8;
            display: flex;
            align-items: flex-start;
            gap: 8px;
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 4px;
            padding: 8px;
            flex-shrink: 0;

            .tip-icon {
              color: #60a5fa;
              margin-top: 2px;
            }
          }
        }
      }
    }

    // 右侧面板：托盘信息 + 故障日志
    .side-panel {
      border-radius: 10px;
      border: 1px solid rgba(6, 182, 212, 0.3);
      background: rgba(15, 23, 42, 0.5);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 0;

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        border-bottom: 1px solid rgba(6, 182, 212, 0.2);
        background: #1e293b;
        flex-shrink: 0;

        .panel-title {
          font-size: 13px;
          color: #e2e8f0;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .panel-extra {
          font-size: 12px;
          color: #22d3ee;
          font-family: 'Courier New', monospace;
          font-weight: 600;
        }
      }

      .tray-panel {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        border-bottom: 1px solid rgba(6, 182, 212, 0.2);

        .tray-grid {
          padding: 10px 12px 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-content: flex-start;

          .tray-item {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;

            .tray-img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }

            &.tray-loaded .tray-img {
              opacity: 1;
            }

            &.tray-empty .tray-img {
              opacity: 0.18;
              filter: grayscale(1);
            }
          }
        }
      }

      .fault-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;

        .fault-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 0;

          &::-webkit-scrollbar {
            width: 6px;
          }

          &::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.5);
            border-radius: 3px;
          }

          &::-webkit-scrollbar-thumb {
            background: rgba(6, 182, 212, 0.4);
            border-radius: 3px;

            &:hover {
              background: rgba(6, 182, 212, 0.6);
            }
          }

          .fault-empty {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #64748b;
            font-size: 13px;
          }

          .fault-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 7px 10px;
            border-radius: 6px;
            background: rgba(30, 41, 59, 0.4);
            border: 1px solid rgba(71, 85, 105, 0.2);
            font-size: 12px;

            .fault-time {
              font-family: 'Courier New', monospace;
              color: #64748b;
              flex-shrink: 0;
            }

            .fault-level {
              flex-shrink: 0;
              font-size: 11px;
              font-weight: 600;
              color: #94a3b8;
            }

            .fault-message {
              color: #cbd5e1;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              min-width: 0;
            }
          }
        }
      }
    }
  }

  // Footer
  .monitor-footer {
    height: 32px;
    border-top: 1px solid rgba(6, 182, 212, 0.3);
    background: rgba(15, 23, 42, 0.8);
    flex-shrink: 0;

    .footer-content {
      height: 100%;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .footer-left {
        display: flex;
        align-items: center;
        gap: 24px;

        .system-status {
          display: flex;
          align-items: center;
          gap: 6px;

          .status-pulse {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #10b981;
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }

          .status-label {
            font-size: 12px;
            color: #cbd5e1;
          }

          .status-value {
            font-size: 12px;
            color: #10b981;
            font-weight: 600;
          }

          &.disconnected {
            .status-pulse {
              background: #f59e0b;
            }

            .status-value {
              color: #f59e0b;
            }
          }
        }
      }

      .footer-right {
        display: flex;
        align-items: center;
        gap: 20px;
        font-size: 12px;
        color: #94a3b8;

        .footer-item {
          display: flex;
          align-items: center;
          gap: 6px;

          i {
            font-size: 14px;
          }

          &.disconnected {
            color: #f59e0b;
          }
        }
      }
    }
  }

  // Animations
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes flow-border-spin {
    to {
      --flow-angle: 360deg;
    }
  }

  .flow-border {
    position: relative;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1px;
      background: conic-gradient(
        from var(--flow-angle),
        transparent 0deg,
        transparent 300deg,
        rgba(34, 211, 238, 0.08) 322deg,
        rgba(34, 211, 238, 0.5) 342deg,
        rgba(186, 230, 253, 0.7) 351deg,
        rgba(34, 211, 238, 0.5) 360deg
      );
      -webkit-mask: linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      z-index: 4;
      animation: flow-border-spin 6.5s linear infinite;
    }
  }

  .status-panel.flow-border::after {
    animation-duration: 8s;
  }

  .workstation-card:nth-child(2).flow-border::after {
    animation-delay: -2.2s;
  }

  .side-panel.flow-border::after {
    animation-delay: -4s;
  }

  // 关闭按钮样式 - 低调简洁风格
  .close-area {
    position: absolute;
    top: 0;
    right: 0;
    width: 80px;
    height: 40px;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: none;

    &:hover {
      cursor: default;
    }

    .close-btn {
      padding: 6px 12px;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      color: rgba(255, 255, 255, 0.4);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;

      &:hover {
        background: rgba(248, 99, 95, 0.15);
        border-color: rgba(248, 99, 95, 0.5);
        color: rgba(248, 99, 95, 0.9);
      }

      i {
        font-size: 14px;
      }
    }
  }
}
</style>
