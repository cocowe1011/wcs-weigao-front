<template>
  <div :class="['sm-main', plcStatus ? 'online' : 'offline']" v-drag>
    <el-tooltip
      class="item"
      effect="dark"
      :content="sendStr || '暂无数据'"
      placement="bottom"
      :open-delay="500"
    >
      <div class="inner">
        <i
          :class="plcStatus ? 'el-icon-circle-check' : 'el-icon-circle-close'"
          class="status-icon"
        ></i>
        <span class="status-text">
          {{ plcStatus ? 'PLC 已连接' : 'PLC 断开' }}
        </span>
      </div>
    </el-tooltip>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';

export default {
  name: 'StatusMonitor',
  directives: {
    drag: {
      // 1. 绑定钩子
      bind: function (el) {
        const oDiv = el;

        // 定义 resize 处理函数（命名它，以便稍后解绑）
        const handleResize = () => {
          const clientWidth = document.documentElement.clientWidth;
          const clientHeight = document.documentElement.clientHeight;
          const maxLeft = clientWidth - oDiv.offsetWidth;
          const maxTop = clientHeight - oDiv.offsetHeight;

          if (oDiv._percentX === undefined) {
            // 简单防溢出
            if (oDiv.offsetLeft > maxLeft) oDiv.style.left = maxLeft + 'px';
            if (oDiv.offsetTop > maxTop) oDiv.style.top = maxTop + 'px';
          } else {
            // 比例跟随
            let newLeft = maxLeft * oDiv._percentX;
            let newTop = maxTop * oDiv._percentY;
            oDiv.style.left = newLeft + 'px';
            oDiv.style.top = newTop + 'px';
          }
        };

        // 将函数挂载到元素上，方便 unbind 调用
        el._resizeHandler = handleResize;
        window.addEventListener('resize', handleResize);

        // --- 拖拽逻辑 ---
        const updatePercent = () => {
          const clientWidth = document.documentElement.clientWidth;
          const clientHeight = document.documentElement.clientHeight;
          const maxLeft = clientWidth - oDiv.offsetWidth;
          const maxTop = clientHeight - oDiv.offsetHeight;
          if (maxLeft > 0) oDiv._percentX = oDiv.offsetLeft / maxLeft;
          if (maxTop > 0) oDiv._percentY = oDiv.offsetTop / maxTop;
        };

        oDiv.onmousedown = (e) => {
          const disX = e.clientX - oDiv.offsetLeft;
          const disY = e.clientY - oDiv.offsetTop;

          oDiv.style.cursor = 'grabbing';
          oDiv.style.zIndex = '9999';
          oDiv.style.transition = 'none'; // 性能关键点：关闭过渡

          document.onmousemove = (e) => {
            // 使用 requestAnimationFrame 优化视觉帧率（可选，目前逻辑足够简单也可不用）
            let left = e.clientX - disX;
            let top = e.clientY - disY;

            // 缓存 clientWidth/Height 会更快，但为了代码简洁直接读取也无妨（Electron环境通常性能足够）
            const maxLeft =
              document.documentElement.clientWidth - oDiv.offsetWidth;
            const maxTop =
              document.documentElement.clientHeight - oDiv.offsetHeight;

            if (left < 0) left = 0;
            if (top < 0) top = 0;
            if (left > maxLeft) left = maxLeft;
            if (top > maxTop) top = maxTop;

            oDiv.style.left = left + 'px';
            oDiv.style.top = top + 'px';
          };

          document.onmouseup = () => {
            document.onmousemove = null;
            document.onmouseup = null;
            oDiv.style.cursor = 'grab';
            oDiv.style.transition = 'border-color 0.3s'; // 恢复样式过渡
            updatePercent();
          };
        };
      },
      // 2. 解绑钩子 (防止内存泄漏)
      unbind: function (el) {
        if (el._resizeHandler) {
          window.removeEventListener('resize', el._resizeHandler);
          delete el._resizeHandler;
        }
      }
    }
  },
  data() {
    return {
      watchDog: '0',
      warningTimeOut: null,
      plcStatus: false,
      sendStr: ''
    };
  },
  watch: {
    watchDog: {
      handler(newVal, oldVal) {
        this.plcStatus = true;
        if (this.warningTimeOut) {
          clearTimeout(this.warningTimeOut);
        }
        this.warningTimeOut = setTimeout(() => {
          this.plcStatus = false;
          if (this.$route.path != '/login') {
            this.$message.error('PLC连接中断');
          }
        }, 3000);
      }
    }
  },
  mounted() {
    // 将 listener 保存引用，方便销毁
    this.ipcHandler = (event, values, values2) => {
      this.watchDog = values.DBW0;
      this.sendStr = values2;
    };
    ipcRenderer.on('receivedMsg', this.ipcHandler);
  },
  // 3. 组件销毁清理
  beforeDestroy() {
    if (this.ipcHandler) {
      ipcRenderer.removeListener('receivedMsg', this.ipcHandler);
    }
    if (this.warningTimeOut) {
      clearTimeout(this.warningTimeOut);
    }
  }
};
</script>

<style lang="less" scoped>
/* 样式部分保持不变，因为已经是极简高性能版 */
.sm-main {
  position: absolute;
  right: 25px;
  bottom: 25px;
  height: 40px;
  width: 120px;
  z-index: 4000;
  background-color: #1f2d3d;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  cursor: grab;
  user-select: none;
  overflow: hidden;
  transition: border-color 0.3s;

  .inner {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 10px;
    box-sizing: border-box;
  }

  .status-icon {
    font-size: 16px;
    margin-right: 8px;
  }

  .status-text {
    font-size: 13px;
    color: #e0e0e0;
    font-weight: 500;
  }

  &.online {
    border-left: 4px solid #67c23a;
    .status-icon {
      color: #67c23a;
    }
  }

  &.offline {
    border-left: 4px solid #f56c6c;
    .status-icon {
      color: #f56c6c;
    }
    .status-text {
      color: #bbb;
    }
  }
}

.sm-main:active {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}
</style>
