<template>
  <section
    v-if="message"
    class="loading-fail-alert"
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
    tabindex="0"
    :title="message"
  >
    <div ref="viewport" class="alarm-message-viewport">
      <span
        :key="message"
        ref="text"
        class="alarm-message"
        :class="{ 'is-scrolling': marqueeActive }"
        :style="{
          '--alarm-distance': -scrollDistance + 'px',
          '--alarm-duration': scrollDuration + 's'
        }"
        >{{ message }}</span
      >
    </div>
  </section>
</template>

<script>
export default {
  name: 'LoadingFailAlert',
  props: {
    message: { type: String, default: '' }
  },
  data() {
    return {
      marqueeActive: false,
      scrollDistance: 0,
      scrollDuration: 8
    };
  },
  watch: {
    message() {
      this.marqueeActive = false;
      this.$nextTick(this.measureMarquee);
    }
  },
  mounted() {
    this._observedBox = null;
    this._resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(this.measureMarquee);
    window.addEventListener('resize', this.measureMarquee);
    this.$nextTick(this.measureMarquee);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.measureMarquee);
    if (this._resizeObserver) this._resizeObserver.disconnect();
  },
  methods: {
    measureMarquee() {
      if (this._isDestroyed || this._isBeingDestroyed) return;
      const box = this.$refs.viewport;
      const text = this.$refs.text;
      if (this._resizeObserver && this._observedBox !== box) {
        this._resizeObserver.disconnect();
        this._observedBox = box;
        if (box) this._resizeObserver.observe(box);
      }
      if (!box || !text) {
        this.marqueeActive = false;
        this.scrollDistance = 0;
        return;
      }
      const distance = Math.max(0, text.scrollWidth - box.clientWidth);
      this.scrollDistance = distance;
      this.scrollDuration = Math.max(8, Math.round(distance / 30) + 2);
      this.marqueeActive = distance > 2;
    }
  }
};
</script>

<style scoped>
.loading-fail-alert {
  position: fixed;
  z-index: 1800;
  top: 64px;
  left: 24px;
  width: calc(100vw - 48px);
  box-sizing: border-box;
  padding: 12px 16px;
  border: 1px solid #e1a4a4;
  border-radius: 2px;
  background: #fff;
  color: #d40000;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  cursor: default;
}
.alarm-message-viewport {
  overflow: hidden;
  width: 100%;
}
.alarm-message {
  display: inline-block;
  white-space: nowrap;
  color: #d40000;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.5;
}
.alarm-message.is-scrolling {
  will-change: transform;
  animation: loading-alarm-scroll var(--alarm-duration, 8s) linear infinite
    alternate;
}
.loading-fail-alert:hover .is-scrolling,
.loading-fail-alert:focus .is-scrolling {
  animation-play-state: paused;
}
.loading-fail-alert:focus-visible {
  outline: 2px solid #d40000;
  outline-offset: 2px;
}
@keyframes loading-alarm-scroll {
  0%,
  10% {
    transform: translateX(0);
  }
  90%,
  100% {
    transform: translateX(var(--alarm-distance, 0px));
  }
}
@media (max-width: 600px) {
  .loading-fail-alert {
    left: 12px;
    width: calc(100vw - 24px);
    padding: 6px 10px;
  }
  .alarm-message {
    font-size: 18px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .alarm-message.is-scrolling {
    animation: none;
    transform: none;
    will-change: auto;
  }
  .alarm-message {
    white-space: normal;
    overflow-wrap: anywhere;
  }
}
</style>
