<template>
  <div class="sterilization-monitor">
    <!-- Header -->
    <header class="monitor-header">
      <div class="header-content">
        <div class="header-left">
          <div class="logo-icon">
            <i class="el-icon-data-line"></i>
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
              <div class="card-value card-value-cyan">WG-2025-1017-A</div>
            </div>
            <div class="status-card">
              <div class="card-label">当前货物产品信息：</div>
              <div class="card-value card-value-cyan">混合医疗器材</div>
            </div>
            <div class="status-card">
              <div class="card-label">当前货物待加工数量：</div>
              <div class="card-value card-value-orange">360</div>
            </div>
            <div class="status-card">
              <div class="card-label">当前指定预热柜：</div>
              <div class="card-value card-value-cyan">3号柜</div>
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
              已完成: 8/16 | 进行中: 4 | 预热柜: 3号柜
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
                <div class="item-icon">
                  <i :class="getItemIcon(item.status)"></i>
                </div>
                <div class="item-code">{{ item.code }}</div>
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
export default {
  name: 'SterilizationMonitor',
  data() {
    return {
      currentTime: '',
      currentDate: '',
      footerTime: '',
      timer: null,
      workstations: [
        {
          id: 'A',
          name: 'A工位',
          productInfo: '医用敷料包 - 批次 A2025001',
          targetQty: 120,
          scannedQty: 87,
          items: Array(24)
            .fill(null)
            .map((_, i) => ({
              id: `A-${i}`,
              code: `MD-${2025000 + i}`,
              status: i < 12 ? 'success' : i < 18 ? 'failed' : 'pending'
            }))
        },
        {
          id: 'B',
          name: 'B工位',
          productInfo: '手术器械包 - 批次 B2025002',
          targetQty: 96,
          scannedQty: 64,
          items: Array(24)
            .fill(null)
            .map((_, i) => ({
              id: `B-${i}`,
              code: `SI-${2025000 + i}`,
              status: i < 10 ? 'success' : i < 14 ? 'failed' : 'pending'
            }))
        },
        {
          id: 'C',
          name: 'C工位',
          productInfo: '输液器材包 - 批次 C2025003',
          targetQty: 144,
          scannedQty: 102,
          items: Array(24)
            .fill(null)
            .map((_, i) => ({
              id: `C-${i}`,
              code: `IV-${2025000 + i}`,
              status: i < 15 ? 'success' : i < 17 ? 'failed' : 'pending'
            }))
        }
      ],
      batchStatus: Array(32)
        .fill(null)
        .map((_, i) => i < 16) // 前16个有货，后16个没有
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
    getItemIcon(status) {
      switch (status) {
        case 'success':
          return 'el-icon-success';
        case 'failed':
          return 'el-icon-error';
        default:
          return 'el-icon-remove-outline';
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
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
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
    height: 80px;
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
        gap: 16px;

        .logo-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.5);

          i {
            font-size: 24px;
            color: white;
          }
        }

        .main-title {
          font-size: 24px;
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
            font-size: 28px;
            font-family: 'Courier New', monospace;
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
    padding: 20px 24px;
    flex-shrink: 0;

    .status-panel {
      border-radius: 16px;
      border: 1px solid rgba(6, 182, 212, 0.3);
      background: linear-gradient(
        135deg,
        rgba(15, 23, 42, 0.8) 0%,
        rgba(30, 41, 59, 0.6) 100%
      );
      padding: 20px;
      position: relative;

      .status-grid {
        display: grid;
        grid-template-columns: 2fr 3fr;
        gap: 28px;
        align-items: start;

        .status-left {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: 16px;

          .status-card {
            background: linear-gradient(
              135deg,
              rgba(30, 41, 59, 0.8) 0%,
              rgba(15, 23, 42, 0.6) 100%
            );
            border-radius: 12px;
            padding: 16px;
            border: 1px solid rgba(34, 211, 238, 0.2);
            border-left: 2px solid rgba(34, 211, 238, 0.6);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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
              box-shadow: 0 8px 24px rgba(34, 211, 238, 0.15);

              &::before {
                opacity: 1;
                width: 3px;
                box-shadow: 0 0 8px rgba(34, 211, 238, 0.4);
              }
            }

            .card-label {
              font-size: 13px;
              color: #94a3b8;
              margin-bottom: 8px;
              font-weight: 500;
              letter-spacing: 0.5px;
            }

            .card-value {
              font-size: 18px;
              font-weight: 700;
              line-height: 1.2;

              &.card-value-cyan {
                color: #22d3ee;
                text-shadow: 0 0 8px rgba(34, 211, 238, 0.3);
              }

              &.card-value-orange {
                font-size: 20px;
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
          border-radius: 12px;
          padding: 16px;
          border: 1px solid rgba(34, 211, 238, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

          .batch-title {
            font-size: 15px;
            color: #e2e8f0;
            margin-bottom: 16px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-align: center;
          }

          .batch-status {
            display: grid;
            grid-template-columns: repeat(16, 1fr);
            grid-template-rows: repeat(2, 1fr);
            gap: 6px;
            margin-bottom: 16px;

            .batch-item {
              width: 28px;
              height: 28px;
              border-radius: 6px;
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
                box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);

                &:hover {
                  transform: scale(1.1);
                  border-color: rgba(16, 185, 129, 0.7);
                  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
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
    padding: 0 24px 16px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    flex: 1;
    overflow: hidden;
    min-height: 0;

    .workstation-card {
      border-radius: 12px;
      border: 1px solid rgba(6, 182, 212, 0.3);
      background: rgba(15, 23, 42, 0.5);
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      transition: box-shadow 0.3s;
      display: flex;
      flex-direction: column;
      min-height: 0;

      &:hover {
        box-shadow: 0 4px 20px rgba(6, 182, 212, 0.2);
      }

      .workstation-header {
        background: linear-gradient(90deg, #1e293b 0%, #0f172a 100%);
        padding: 16px;
        border-bottom: 1px solid rgba(6, 182, 212, 0.3);
        display: flex;
        align-items: center;
        justify-content: space-between;

        .workstation-header-left {
          display: flex;
          align-items: center;
          gap: 12px;

          .station-badge {
            padding: 4px 12px;
            border-radius: 20px;
            background: rgba(34, 211, 238, 0.2);
            border: 1px solid rgba(34, 211, 238, 0.5);
            color: #22d3ee;
            font-size: 14px;
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
          width: 32px;
          height: 32px;
          border-radius: 8px;
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
        padding: 16px;
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;

        .product-info-card {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 8px;
          padding: 12px;
          border: 1px solid rgba(71, 85, 105, 0.5);
          margin-bottom: 12px;
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
          gap: 8px;
          margin-bottom: 12px;
          flex-shrink: 0;

          .quantity-card {
            background: rgba(30, 41, 59, 0.3);
            border-radius: 6px;
            padding: 8px;
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
              font-size: 11px;
              color: #94a3b8;
              margin-bottom: 6px;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .quantity-input {
              width: 100%;
              background: transparent;
              border: none;
              border-radius: 4px;
              padding: 6px 8px;
              font-family: 'Courier New', monospace;
              font-size: 16px;
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
              padding: 6px 8px;
              font-family: 'Courier New', monospace;
              font-size: 16px;
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
          padding: 12px;
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
            margin-bottom: 12px;

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
            grid-template-columns: repeat(4, 1fr);
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
              border: 2px solid;
              padding: 8px;
              text-align: center;
              transition: all 0.2s;

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

              .item-icon {
                display: flex;
                justify-content: center;
                margin-bottom: 4px;

                i {
                  font-size: 16px;
                }
              }

              .item-success .item-icon i {
                color: #10b981;
              }

              .item-failed .item-icon i {
                color: #f43f5e;
              }

              .item-pending .item-icon i {
                color: #64748b;
              }

              .item-code {
                font-size: 12px;
                font-family: 'Courier New', monospace;
                color: #cbd5e1;
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
    height: 56px;
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
            box-shadow: 0 0 12px rgba(16, 185, 129, 0.5);
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
