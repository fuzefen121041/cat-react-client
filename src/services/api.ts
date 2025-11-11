/**
 * API 服务层
 * 封装所有与后端的通信
 */

import type {
  ConsultationRequest,
  ConsultationResponse,
  WorkflowConsultationResponse,
  HealthCheckResponse,
} from '../types/api';

// API 基础 URL - 从环境变量读取
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://cat-consultation-ai.fuzefen121.workers.dev';

// 请求超时时间（毫秒）
const REQUEST_TIMEOUT = 60000; // 60 秒

/**
 * 通用的 fetch 封装，带超时和错误处理
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout = REQUEST_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试');
    }
    throw error;
  }
}

/**
 * 健康检查
 */
export async function checkHealth(): Promise<HealthCheckResponse> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/health`, {
      method: 'GET',
    }, 10000); // 10秒超时

    if (!response.ok) {
      throw new Error(`健康检查失败: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('健康检查错误:', error);
    throw error;
  }
}

/**
 * 简单咨询
 */
export async function simpleConsultation(request: ConsultationRequest): Promise<ConsultationResponse> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/consultation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data: ConsultationResponse = await response.json();

    // 即使 HTTP 状态码是 200，也要检查业务层面的 success 字段
    if (!data.success && data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error('咨询请求错误:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('咨询请求失败，请稍后重试');
  }
}

/**
 * Workflow 咨询（完整流程）
 */
export async function workflowConsultation(request: ConsultationRequest): Promise<WorkflowConsultationResponse> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/consultation/workflow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data: WorkflowConsultationResponse = await response.json();

    if (!data.success && data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error('Workflow 咨询错误:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('咨询请求失败，请稍后重试');
  }
}

/**
 * 将文件转换为 base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 压缩图片（可选功能）
 */
export async function compressImage(file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('无法创建 canvas 上下文'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      // 计算新尺寸
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // 绘制图片
      ctx.drawImage(img, 0, 0, width, height);

      // 转换为 Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('图片压缩失败'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * 验证图片文件
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '仅支持 JPG、PNG、WebP 格式的图片',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: '图片大小不能超过 5MB',
    };
  }

  return { valid: true };
}

/**
 * 导出 API 配置，方便调试
 */
export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
} as const;
