<template>
  <div class="sterilization-monitor">
    <!-- Header -->
    <header class="monitor-header">
      <div class="header-content">
        <div class="header-left">
          <div class="logo-icon">
            <img src="@/assets/fengke-logo.jpg" alt="logo" class="logo-img" />
          </div>
          <div>
            <h1 class="main-title">威高灭菌中心</h1>
            <p class="sub-title">智能监控系统 v1.0</p>
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
      <div class="status-panel">
        <div class="status-grid">
          <div class="status-left">
            <div class="status-card">
              <div class="card-label">当前货物批次信息：</div>
              <div class="card-value card-value-cyan">{{ batchNo }}</div>
            </div>
            <div class="status-card">
              <div class="card-label">当前货物产品信息：</div>
              <div class="card-value card-value-cyan">
                {{ productInfoText }}
              </div>
            </div>
            <div class="status-card">
              <div class="card-label">当前货物待加工数量：</div>
              <div class="card-value card-value-orange">
                {{ pendingGoodsCount }}
              </div>
            </div>
            <div class="status-card">
              <div class="card-label">当前指定预热柜：</div>
              <div class="card-value card-value-cyan">
                {{ destinationCabinetText }}
              </div>
            </div>
          </div>
          <div class="status-right">
            <div class="batch-title">批次灭菌数量监控</div>
            <div class="batch-status">
              <div
                v-for="(status, index) in batchStatus"
                :key="index"
                :class="[
                  'batch-item',
                  status ? 'batch-has-tray' : 'batch-empty'
                ]"
              >
                <img
                  v-if="status"
                  src="@/assets/weigao-img/tray-daping.png"
                  alt="托盘"
                  class="tray-img"
                />
              </div>
            </div>
            <div class="batch-info">
              已完成: {{ batchCompletedCount }}/{{ batchTotalCount }} | 进行中:
              {{ batchInProgressCount }} | 预热柜: {{ destinationCabinetText }}
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
        class="workstation-card"
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
          <div class="product-info-card">
            <div class="info-label">当前货物信息</div>
            <div class="info-text">{{ station.productInfo }}</div>
          </div>

          <div class="quantity-grid">
            <div class="quantity-card quantity-card-blue">
              <div class="quantity-label">目标数量</div>
              <input
                type="number"
                :value="station.targetQty"
                readonly
                class="quantity-input quantity-input-cyan"
              />
            </div>
            <div class="quantity-card quantity-card-green">
              <div class="quantity-label">已扫描数量</div>
              <div class="quantity-value quantity-value-green">
                {{ station.scannedQty }}
              </div>
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
                <span class="stat-failed">✗ {{ getFailedCount(station) }}</span>
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
                <div class="item-code" :title="item.code">{{ item.code }}</div>
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
    </div>

    <!-- Footer -->
    <footer class="monitor-footer">
      <div class="footer-content">
        <div class="footer-left">
          <div class="system-status">
            <div class="status-pulse"></div>
            <span class="status-label">系统状态：</span>
            <span class="status-value">服务器运行正常</span>
          </div>
        </div>
        <div class="footer-right">
          <div class="footer-item">
            <i class="el-icon-connection"></i>
            <span>网络正常</span>
          </div>
          <div class="footer-item">最后更新: {{ footerTime }}</div>
          <div class="footer-item">© 2025 威高灭菌中心</div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import HttpUtil from '@/utils/HttpUtil';

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
  },
  {
    id: 'C',
    name: 'C工位',
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
      currentTime: '',
      currentDate: '',
      footerTime: '',
      timer: null,
      pollTimer: null,
      // 状态面板左侧卡片数据
      batchNo: '--',
      productInfoText: '--',
      pendingGoodsCount: 0,
      destinationCabinetText: '--',
      // 批次灭菌数量统计
      batchCompletedCount: 0,
      batchInProgressCount: 0,
      batchTotalCount: 0,
      // 工位数据（A/*1、B/*2、C/*3目的地，框架固定三个）
      workstations: EMPTY_WORKSTATIONS.map((s) => ({ ...s })),
      // 32格托盘状态
      batchStatus: Array(32).fill(false)
    };
  },
  methods: {
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
          const { batch, pallets } = batchRes.data;

          this.batchNo = batch.batchNo || '--';

          const allGoods = (pallets || []).flatMap((p) => p.goods || []);
          this.productInfoText =
            allGoods.length > 0 ? allGoods[0].productName || '--' : '--';
          this.pendingGoodsCount = allGoods.filter(
            (g) => g.scanStatus === '0'
          ).length;

          // 批次统计与32格状态
          const palletList = pallets || [];
          this.batchTotalCount = palletList.length;
          this.batchCompletedCount = palletList.filter(
            (p) => p.trayStatus === '2'
          ).length;
          this.batchInProgressCount = palletList.filter(
            (p) => p.loadStatus === '1' && p.trayStatus !== '2'
          ).length;
          this.batchStatus = Array(32)
            .fill(false)
            .map(
              (_, i) =>
                i < palletList.length && palletList[i].loadStatus === '1'
            );

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

          // A工位=01002最新一个已分配虚拟ID的托盘
          const latestByVirtualId = () => {
            const matches = palletList.filter(
              (p) => p.virtualId && p.loadStatus === '1'
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
            const matches = palletList.filter(
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
          // C工位=最新一个发送999目的地的托盘
          const latest999 = () => {
            const matches = palletList.filter(
              (p) => p.sendDestinationCode === '999'
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
            buildStation('B', 'B工位（02006）', latestNon999()),
            buildStation('C', 'C工位（异常）', latest999())
          ];
        } else {
          this.batchNo = '--';
          this.productInfoText = '--';
          this.pendingGoodsCount = 0;
          this.destinationCabinetText = '--';
          this.batchStatus = Array(32).fill(false);
          this.batchCompletedCount = 0;
          this.batchInProgressCount = 0;
          this.batchTotalCount = 0;
          this.workstations = EMPTY_WORKSTATIONS.map((s) => ({ ...s }));
        }
      } catch (e) {
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
    }
  },
  mounted() {
    this.updateTime();
    this.timer = setInterval(this.updateTime, 1000);
    this.pollData();
    this.pollTimer = setInterval(this.pollData, 2000);
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }
};
</script>

<style lang="less" scoped>
.sterilization-monitor {
  height: 100%;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  color: #f1f5f9;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  // Header Styles
  .monitor-header {
    height: 70px;
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
          width: 44px;
          height: 44px;
          border-radius: 8px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(8, 145, 178, 0.15);
          border: 1px solid rgba(34, 211, 238, 0.3);
          position: relative;
          overflow: hidden;

          .logo-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            position: relative;
            z-index: 1;
          }
        }

        .main-title {
          font-size: 22px;
          font-weight: bold;
          background: linear-gradient(90deg, #22d3ee 0%, #60a5fa 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }

        .sub-title {
          font-size: 12px;
          color: #94a3b8;
          margin: 4px 0 0 0;
        }
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 24px;

        .time-display {
          text-align: right;

          .current-time {
            font-size: 24px;
            font-weight: bold;
            color: #22d3ee;
          }

          .current-date {
            font-size: 14px;
            color: #94a3b8;
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
      border-radius: 12px;
      border: 1px solid rgba(6, 182, 212, 0.3);
      background: linear-gradient(
        135deg,
        rgba(15, 23, 42, 0.8) 0%,
        rgba(30, 41, 59, 0.6) 100%
      );
      padding: 16px;
      position: relative;

      .status-grid {
        display: grid;
        grid-template-columns: 2fr 3fr;
        gap: 12px;
        align-items: stretch;

        .status-left {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: 12px;
          align-content: stretch;

          .status-card {
            display: flex;
            flex-direction: column;
            background: linear-gradient(
              135deg,
              rgba(30, 41, 59, 0.8) 0%,
              rgba(15, 23, 42, 0.6) 100%
            );
            border-radius: 10px;
            padding: 12px;
            border: 1px solid rgba(34, 211, 238, 0.2);
            border-left: 2px solid rgba(34, 211, 238, 0.6);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;

            &::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              width: 2px;
              height: 100%;
              background: linear-gradient(180deg, #22d3ee 0%, #3b82f6 100%);
              opacity: 0.8;
              transition: all 0.3s ease;
            }

            &:hover {
              transform: translateY(-2px);
              border-color: rgba(34, 211, 238, 0.4);
              border-left-color: rgba(34, 211, 238, 1);
              box-shadow: 0 4px 16px rgba(34, 211, 238, 0.08);

              &::before {
                opacity: 1;
                width: 3px;
                box-shadow: 0 0 6px rgba(34, 211, 238, 0.2);
              }
            }

            .card-label {
              font-size: 12px;
              color: #94a3b8;
              margin-bottom: 6px;
              font-weight: 500;
              letter-spacing: 0.5px;
            }

            .card-value {
              flex: 1;
              display: flex;
              align-items: center;
              font-size: 16px;
              font-weight: 700;
              line-height: 1.2;

              &.card-value-cyan {
                color: #22d3ee;
                text-shadow: 0 0 8px rgba(34, 211, 238, 0.3);
              }

              &.card-value-orange {
                font-size: 18px;
                font-weight: 800;
                color: #fb923c;
                text-shadow: 0 0 8px rgba(251, 146, 60, 0.3);
              }
            }
          }
        }

        .status-right {
          background: linear-gradient(
            135deg,
            rgba(30, 41, 59, 0.6) 0%,
            rgba(15, 23, 42, 0.4) 100%
          );
          border-radius: 10px;
          padding: 12px;
          border: 1px solid rgba(34, 211, 238, 0.2);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

          .batch-title {
            font-size: 13px;
            color: #e2e8f0;
            margin-bottom: 10px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-align: center;
          }

          .batch-status {
            display: grid;
            grid-template-columns: repeat(16, 1fr);
            grid-template-rows: repeat(2, 1fr);
            gap: 5px;
            margin-bottom: 10px;

            .batch-item {
              width: 26px;
              height: 26px;
              border-radius: 5px;
              border: 1px solid rgba(71, 85, 105, 0.3);
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              position: relative;

              &::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border-radius: 6px;
                background: linear-gradient(
                  135deg,
                  rgba(34, 211, 238, 0.1) 0%,
                  rgba(59, 130, 246, 0.05) 100%
                );
                opacity: 0;
                transition: opacity 0.3s ease;
              }

              &:hover::before {
                opacity: 1;
              }

              &.batch-has-tray {
                border-color: rgba(16, 185, 129, 0.5);
                background: linear-gradient(
                  135deg,
                  rgba(16, 185, 129, 0.15) 0%,
                  rgba(34, 197, 94, 0.1) 100%
                );
                box-shadow: 0 1px 4px rgba(16, 185, 129, 0.1);

                &:hover {
                  transform: scale(1.1);
                  border-color: rgba(16, 185, 129, 0.7);
                  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
                }

                .tray-img {
                  width: 100%;
                  height: 100%;
                  object-fit: contain;
                  filter: brightness(1.1);
                }
              }

              &.batch-empty {
                border-color: rgba(71, 85, 105, 0.2);
                background: rgba(30, 41, 59, 0.3);

                &:hover {
                  border-color: rgba(71, 85, 105, 0.4);
                  background: rgba(30, 41, 59, 0.5);
                }
              }
            }
          }

          .batch-info {
            margin-top: 12px;
            font-size: 13px;
            color: #94a3b8;
            text-align: center;
            padding: 8px 12px;
            background: rgba(15, 23, 42, 0.5);
            border-radius: 8px;
            border: 1px solid rgba(71, 85, 105, 0.2);
            font-weight: 500;
          }
        }
      }
    }
  }

  // Workstations
  .workstations-container {
    padding: 0 12px 12px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    flex: 1;
    overflow: hidden;
    min-height: 0;

    .workstation-card {
      border-radius: 10px;
      border: 1px solid rgba(6, 182, 212, 0.3);
      background: rgba(15, 23, 42, 0.5);
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
      transition: box-shadow 0.3s;
      display: flex;
      flex-direction: column;
      min-height: 0;

      &:hover {
        box-shadow: 0 2px 12px rgba(6, 182, 212, 0.1);
      }

      .workstation-header {
        background: linear-gradient(90deg, #1e293b 0%, #0f172a 100%);
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

        .product-info-card {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 8px;
          padding: 8px;
          border: 1px solid rgba(71, 85, 105, 0.5);
          margin-bottom: 8px;
          flex-shrink: 0;

          .info-label {
            font-size: 12px;
            color: #94a3b8;
            margin-bottom: 4px;
          }

          .info-text {
            font-size: 14px;
            color: #e2e8f0;
          }
        }

        .quantity-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
          margin-bottom: 8px;
          flex-shrink: 0;

          .quantity-card {
            background: rgba(30, 41, 59, 0.3);
            border-radius: 6px;
            padding: 4px 6px;
            border: 1px solid rgba(71, 85, 105, 0.2);
            transition: all 0.2s ease;

            &:hover {
              background: rgba(30, 41, 59, 0.4);
              border-color: rgba(71, 85, 105, 0.4);
            }

            &.quantity-card-blue {
              border-color: rgba(34, 211, 238, 0.2);
              background: rgba(34, 211, 238, 0.05);

              &:hover {
                border-color: rgba(34, 211, 238, 0.4);
                background: rgba(34, 211, 238, 0.1);
              }
            }

            &.quantity-card-green {
              border-color: rgba(16, 185, 129, 0.2);
              background: rgba(16, 185, 129, 0.05);

              &:hover {
                border-color: rgba(16, 185, 129, 0.4);
                background: rgba(16, 185, 129, 0.1);
              }
            }

            .quantity-label {
              font-size: 10px;
              color: #94a3b8;
              margin-bottom: 2px;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .quantity-input {
              width: 100%;
              background: transparent;
              border: none;
              border-radius: 4px;
              padding: 2px 4px;
              font-family: 'Courier New', monospace;
              font-size: 14px;
              text-align: center;
              font-weight: 600;
              outline: none;

              &.quantity-input-cyan {
                color: #22d3ee;
              }
            }

            .quantity-value {
              width: 100%;
              background: transparent;
              border: none;
              border-radius: 4px;
              padding: 2px 4px;
              font-family: 'Courier New', monospace;
              font-size: 14px;
              text-align: center;
              font-weight: 600;

              &.quantity-value-green {
                color: #10b981;
              }
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
  }

  // Footer
  .monitor-footer {
    height: 48px;
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
        .system-status {
          display: flex;
          align-items: center;
          gap: 8px;

          .status-pulse {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #10b981;
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.25);
          }

          .status-label {
            font-size: 14px;
            color: #cbd5e1;
          }

          .status-value {
            font-size: 14px;
            color: #10b981;
            font-weight: 600;
          }
        }
      }

      .footer-right {
        display: flex;
        align-items: center;
        gap: 24px;
        font-size: 12px;
        color: #94a3b8;

        .footer-item {
          display: flex;
          align-items: center;
          gap: 8px;

          i {
            font-size: 16px;
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
}
</style>
