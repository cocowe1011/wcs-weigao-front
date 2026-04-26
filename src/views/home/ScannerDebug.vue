<template>
  <div class="scanner-debug">
    <!-- 01002工位 -->
    <div class="sd-station">
      <div class="sd-station-bar">
        <span class="sd-station-name">01002工位</span>
        <span class="sd-status">
          <i class="sd-dot" :class="isConnected01002 ? 'on' : 'off'"></i>
          {{ isConnected01002 ? '已连接' : '未连接' }}
        </span>
      </div>
      <div class="sd-barcode-box">
        <span class="sd-barcode-value">{{ barcode01002 || '—' }}</span>
      </div>
    </div>

    <!-- 01006工位 -->
    <div class="sd-station">
      <div class="sd-station-bar">
        <span class="sd-station-name">01006工位</span>
        <span class="sd-status">
          <i class="sd-dot" :class="isConnected01006 ? 'on' : 'off'"></i>
          {{ isConnected01006 ? '已连接' : '未连接' }}
        </span>
      </div>
      <div class="sd-barcode-box">
        <span class="sd-barcode-value">{{ barcode01006 || '—' }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ScannerDebug',
  data() {
    return {
      isConnected01002: false,
      isConnected01006: false,
      barcode01002: '',
      barcode01006: ''
    };
  },
  mounted() {
    // 后续将在这里添加WebSocket连接逻辑
  },
  beforeDestroy() {
    // 后续将在这里添加WebSocket断开连接逻辑
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
      justify-content: space-between;
      padding: 10px 16px;
      border-bottom: 1px solid #f0f2f5;

      .sd-station-name {
        font-size: 15px;
        font-weight: 600;
        color: #1c1c28;
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
      align-content: flex-start;
      padding: 16px;
      flex: 1;
      flex-wrap: wrap;

      .sd-barcode-value {
        font-size: 18px;
        font-weight: 600;
        color: #1c1c28;
        font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
      }
    }
  }
}
</style>
