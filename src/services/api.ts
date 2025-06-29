/**
 * API 서비스 클래스
 * 백엔드 API와 통신하는 모든 기능을 담당합니다.
 */

export interface User {
  id: number;
  username: string;
  full_name?: string;
  birth_year?: number;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface Session {
  id: number;
  session_number: number;
  title: string;
  description: string;
  questions: string[];
  estimated_duration: number;
}

export interface UserSession {
  id: number;
  session_id: number;
  status: 'not_started' | 'in_progress' | 'completed';
  started_at?: string;
  completed_at?: string;
  progress_percent: number;
  last_updated: string;
  session_number: number;
  title: string;
  description: string;
  questions: string[];
  estimated_duration: number;
}

export interface Conversation {
  id: number;
  speaker: 'ai' | 'user';
  message_text: string;
  message_timestamp: string;
  question_index?: number;
  created_at: string;
}

export interface Autobiography {
  id: number;
  title: string;
  content?: string;
  generated_at: string;
  status: 'draft' | 'final' | 'archived';
  word_count: number;
  character_count: number;
  api_provider: string;
  model_version?: string;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    // 개발 환경과 프로덕션 환경 구분
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 
                   (window.location.hostname === 'localhost' ? 'http://localhost:3002' : '');
    
    // 저장된 토큰 로드
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // 토큰 관리
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // ==================
  // 인증 API
  // ==================
  
  async register(userData: {
    username: string;
    password: string;
    full_name?: string;
    birth_year?: number;
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    this.setToken(response.token);
    return response;
  }

  async login(credentials: {
    username: string;
    password: string;
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    this.setToken(response.token);
    return response;
  }

  logout(): void {
    this.clearToken();
  }

  // ==================
  // 세션 API
  // ==================
  
  async getSessions(): Promise<Session[]> {
    const response = await this.request<{ sessions: Session[] }>('/sessions');
    return response.sessions;
  }

  async getUserSessions(): Promise<UserSession[]> {
    const response = await this.request<{ userSessions: UserSession[] }>('/user-sessions');
    return response.userSessions;
  }

  async startSession(sessionNumber: number): Promise<UserSession> {
    const response = await this.request<{ userSession: UserSession }>(`/user-sessions/${sessionNumber}/start`, {
      method: 'POST',
    });
    return response.userSession;
  }

  // ==================
  // 대화 API
  // ==================
  
  async getConversations(userSessionId: number): Promise<Conversation[]> {
    const response = await this.request<{ conversations: Conversation[] }>(`/conversations/${userSessionId}`);
    return response.conversations;
  }

  async saveConversation(conversationData: {
    userSessionId: number;
    speaker: 'ai' | 'user';
    messageText: string;
    questionIndex?: number;
  }): Promise<Conversation> {
    const response = await this.request<{ conversation: Conversation }>('/conversations', {
      method: 'POST',
      body: JSON.stringify(conversationData),
    });
    return response.conversation;
  }

  // ==================
  // 자서전 API
  // ==================
  
  async getAutobiographies(): Promise<Autobiography[]> {
    const response = await this.request<{ autobiographies: Autobiography[] }>('/autobiographies');
    return response.autobiographies;
  }

  async createAutobiography(autobiographyData: {
    title?: string;
    content: string;
    apiProvider?: string;
    modelVersion?: string;
  }): Promise<Autobiography> {
    const response = await this.request<{ autobiography: Autobiography }>('/autobiographies', {
      method: 'POST',
      body: JSON.stringify(autobiographyData),
    });
    return response.autobiography;
  }

  // ==================
  // 헬스체크 API
  // ==================
  
  async healthCheck(): Promise<{ status: string; timestamp: string; database: string }> {
    return await this.request<{ status: string; timestamp: string; database: string }>('/health');
  }
}

// 싱글톤 인스턴스 생성
export const apiService = new ApiService();

// 기본 export
export default apiService;