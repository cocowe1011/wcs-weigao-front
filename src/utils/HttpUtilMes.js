import axios from 'axios';

/**
 * MSE 查询订单信息 HTTP 客户端
 * - 开发环境 baseURL：http://localhost:7005（Java 后端 mock）
 * - 生产环境 baseURL：https://mes-prod.weigaogroup.com（真实 MSE）
 * - 超时时间：2s
 */
const HttpUtilMes = axios.create({
  baseURL: process.env.VUE_APP_BASE_URL_MES,
  timeout: 10000
});

HttpUtilMes.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default HttpUtilMes;
