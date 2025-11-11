/**
 * API 类型定义
 * 与后端 API 保持一致
 */

// ==================== 请求类型 ====================

/**
 * 咨询类型
 */
export type ConsultationType = 'health' | 'nutrition' | 'behavior' | 'general';

/**
 * 紧急程度
 */
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'emergency';

/**
 * 咨询请求
 */
export interface ConsultationRequest {
  // 猫咪基本信息
  catName?: string;
  age?: number;
  ageInWeeks?: number;
  weight?: number;
  breed?: string;

  // 图片信息
  imageBase64?: string;
  imageUrl?: string;

  // 症状和咨询
  symptoms?: string[];
  symptomsDuration?: string;
  behaviorChanges?: string;
  consultationType: ConsultationType;
  additionalNotes?: string;
}

// ==================== 响应类型 ====================

/**
 * 基础咨询响应
 */
export interface ConsultationResponse {
  success: boolean;
  consultationId?: string;
  report?: ConsultationReport;
  error?: string;
}

/**
 * 简单咨询报告
 */
export interface ConsultationReport {
  text: string;
  timestamp: string;
}

/**
 * Workflow 咨询响应
 */
export interface WorkflowConsultationResponse {
  success: boolean;
  consultationId?: string;
  report?: WorkflowConsultationReport;
  error?: string;
}

/**
 * Workflow 咨询报告
 */
export interface WorkflowConsultationReport {
  consultationId: string;
  timestamp: string;
  catInfo: {
    name?: string;
    age?: number;
    weight?: number;
    breed?: string;
  };
  imageAnalysis?: {
    breedIdentification?: string;
    healthObservations?: string;
    confidence?: string;
  };
  emergencyAssessment?: {
    isEmergency: boolean;
    urgencyLevel: UrgencyLevel;
    immediateActions?: string[];
    criticalSymptoms?: string[];
  };
  recommendations?: string[];
  disclaimer?: string;
}

/**
 * 健康检查响应
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
}

// ==================== 聊天消息类型 ====================

/**
 * 消息角色
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * 聊天消息
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  imageUrl?: string;  // 用户消息可能包含图片
}

/**
 * 创建消息的参数
 */
export interface CreateMessageParams {
  role: MessageRole;
  content: string;
  imageUrl?: string;
}
