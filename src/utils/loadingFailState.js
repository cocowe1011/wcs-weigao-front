import Vue from 'vue';

// 跨主控室页签保留报警，显示和清除只由原有的大屏推送入口驱动。
export const loadingFailState = Vue.observable({ message: '' });

export function setLoadingFailMessage(message) {
  loadingFailState.message = message ? String(message) : '';
}
