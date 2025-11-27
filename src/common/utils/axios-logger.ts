/**
 * Axios Logger - Debug logging for outgoing HTTP requests
 * 
 * Adds request/response interceptors to log all external service calls:
 * - Airline service
 * - Hotel service
 * - Bank service
 */

import { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const COLORS = {
  AIRLINE: '✈️',
  HOTEL: '🏨',
  BANK: '🏦',
  DEFAULT: '🌐',
};

export function setupAxiosLogger(
  axiosInstance: AxiosInstance,
  serviceName: 'AIRLINE' | 'HOTEL' | 'BANK' | string
): void {
  const icon = COLORS[serviceName as keyof typeof COLORS] || COLORS.DEFAULT;
  const tag = `[${serviceName}]`;

  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const requestId = `OUT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      (config as any).__requestId = requestId;
      (config as any).__startTime = Date.now();

      console.log(`\n${icon} ${tag} ═══════════════════════════════════════════════`);
      console.log(`${icon} ${tag} [${requestId}] → ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      
      if (config.params && Object.keys(config.params).length > 0) {
        console.log(`${icon} ${tag} [${requestId}] Params:`, JSON.stringify(config.params));
      }
      
      if (config.data) {
        const dataStr = typeof config.data === 'string' ? config.data : JSON.stringify(config.data);
        const truncated = dataStr.substring(0, 800);
        console.log(`${icon} ${tag} [${requestId}] Body: ${truncated}${dataStr.length > 800 ? '...' : ''}`);
      }

      return config;
    },
    (error: AxiosError) => {
      console.error(`${icon} ${tag} ❌ Request Error:`, error.message);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      const config = response.config as any;
      const requestId = config.__requestId || 'UNKNOWN';
      const duration = config.__startTime ? Date.now() - config.__startTime : 0;

      console.log(`${icon} ${tag} [${requestId}] ← ${response.status} ${response.statusText} (${duration}ms)`);
      
      if (response.data) {
        const dataStr = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        const truncated = dataStr.substring(0, 1000);
        console.log(`${icon} ${tag} [${requestId}] Response: ${truncated}${dataStr.length > 1000 ? '...' : ''}`);
      }
      
      console.log(`${icon} ${tag} ═══════════════════════════════════════════════\n`);

      return response;
    },
    (error: AxiosError) => {
      const config = error.config as any;
      const requestId = config?.__requestId || 'UNKNOWN';
      const duration = config?.__startTime ? Date.now() - config.__startTime : 0;

      console.error(`${icon} ${tag} [${requestId}] ← ❌ ERROR (${duration}ms)`);
      console.error(`${icon} ${tag} [${requestId}] Status: ${error.response?.status || 'NO_RESPONSE'}`);
      console.error(`${icon} ${tag} [${requestId}] Message: ${error.message}`);
      
      if (error.response?.data) {
        const dataStr = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data);
        console.error(`${icon} ${tag} [${requestId}] Error Body: ${dataStr.substring(0, 500)}`);
      }
      
      console.log(`${icon} ${tag} ═══════════════════════════════════════════════\n`);

      return Promise.reject(error);
    }
  );
}


