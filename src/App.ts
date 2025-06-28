import {LitElement, css, html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import './components/LoginScreen';
import './components/SessionListScreen';
import './components/InterviewScreen';
import './components/StoryViewScreen';
import './components/AutobiographyScreen';

export type AppRoute = 'login' | 'sessionList' | 'interview' | 'storyView' | 'autobiography';

export interface User {
  id: number;
  username: string;
  full_name?: string;
  birth_year?: number;
}

export interface SessionData {
  sessionId: number;
  title: string;
  completed: boolean;
  conversations: Array<{
    speaker: 'ai' | 'user';
    text: string;
    timestamp: Date;
  }>;
  lastUpdated?: Date;
}

@customElement('ourstory-app')
export class OurStoryApp extends LitElement {
  @state() currentRoute: AppRoute = 'login';
  @state() currentUser: User | null = null;
  @state() selectedSessionId: number = 1;
  @state() sessionData: Record<number, SessionData> = {};

  static styles = css`
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      background: var(--color-background);
      color: var(--color-text);
      font-family: var(--font-family);
    }

    .app-container {
      width: 100%;
      min-height: 100vh;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .mobile-layout {
      max-width: 480px;
      margin: 0 auto;
      width: 100%;
      min-height: 100vh;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .screen-container {
      flex: 1;
      width: 100%;
      padding-bottom: 100px; /* 네비게이션 바 공간 확보 */
      overflow-y: auto;
      overflow-x: hidden;
    }

    .navigation-bar {
      position: fixed;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      max-width: 480px;
      background: var(--gradient-surface);
      border-top: 2px solid var(--color-border-light);
      padding: var(--spacing-sm) var(--spacing);
      z-index: var(--z-fixed);
      display: flex;
      justify-content: space-around;
      box-shadow: var(--shadow-lg);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    .nav-button {
      flex: 1;
      max-width: 100px;
      padding: var(--spacing-3);
      background: transparent;
      border: none;
      color: var(--color-text-secondary);
      font-size: var(--text-xs);
      font-weight: 600;
      cursor: pointer;
      border-radius: var(--radius);
      transition: all 0.2s ease-in-out;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-2);
      min-height: 80px;
    }

    .nav-button:hover {
      background: var(--color-surface-hover);
      color: var(--color-text);
      transform: translateY(-1px);
    }

    .nav-button.active {
      background: var(--gradient-primary);
      color: var(--color-text-inverse);
      box-shadow: var(--shadow);
      transform: translateY(-2px);
    }

    .nav-icon {
      width: 36px;
      height: 36px;
      stroke-width: 2.5;
    }

    .nav-text {
      font-size: var(--text-xs);
      font-weight: 600;
      text-align: center;
      line-height: var(--leading-tight);
    }

    /* 화면별 안전 영역 확보 */
    @media (max-width: 480px) {
      .screen-container {
        padding-bottom: 110px; /* 모바일에서 더 넉넉한 공간 */
      }
      
      .navigation-bar {
        padding: var(--spacing-3);
      }
      
      .nav-button {
        min-height: 72px;
        padding: var(--spacing-2);
      }
      
      .nav-icon {
        width: 32px;
        height: 32px;
      }
    }

    /* 아이폰 홈 인디케이터 대응 */
    @supports (padding: max(0px)) {
      .navigation-bar {
        padding-bottom: max(var(--spacing-sm), env(safe-area-inset-bottom));
      }
    }
  `;

  constructor() {
    super();
    this.loadUserData();
  }

  private async loadUserData() {
    // 기존 사용자 정보 로드 (API 토큰 기반)
    try {
      const { apiService } = await import('./services/api');
      
      if (apiService.isAuthenticated()) {
        // 토큰이 있으면 세션 리스트로 이동
        this.currentRoute = 'sessionList';
        
        // 세션 데이터 로드
        await this.loadSessionsFromAPI();
      }
    } catch (error) {
      console.error('사용자 데이터 로드 실패:', error);
      // 토큰이 유효하지 않으면 로그아웃 처리
      this.onLogout();
    }
  }

  private async loadSessionsFromAPI() {
    try {
      const { apiService } = await import('./services/api');
      const userSessions = await apiService.getUserSessions();
      
      // API 데이터를 기존 SessionData 형태로 변환
      this.sessionData = {};
      userSessions.forEach(us => {
        this.sessionData[us.session_number] = {
          sessionId: us.session_number,
          title: us.title,
          completed: us.status === 'completed',
          conversations: [], // 대화는 필요할 때 별도로 로드
          lastUpdated: new Date(us.last_updated)
        };
      });
    } catch (error) {
      console.error('세션 데이터 로드 실패:', error);
    }
  }

  private async saveUserData() {
    // API 기반에서는 데이터가 자동으로 서버에 저장됨
    // 필요시 여기서 추가 로직 구현
  }

  onLogin(user: User) {
    this.currentUser = user;
    this.currentRoute = 'sessionList';
    this.saveUserData();
  }

  async onLogout() {
    try {
      const { apiService } = await import('./services/api');
      apiService.logout();
    } catch (error) {
      console.error('로그아웃 처리 오류:', error);
    }
    
    this.currentUser = null;
    this.currentRoute = 'login';
    this.sessionData = {};
  }

  onNavigate(route: AppRoute) {
    this.currentRoute = route;
  }

  onSelectSession(sessionId: number) {
    this.selectedSessionId = sessionId;
    this.currentRoute = 'interview';
  }

  async onUpdateSessionData(sessionId: number, data: Partial<SessionData>) {
    if (!this.sessionData[sessionId]) {
      this.sessionData[sessionId] = {
        sessionId,
        title: `세션 ${sessionId}`,
        completed: false,
        conversations: []
      };
    }
    
    // 로컬 상태 업데이트
    this.sessionData[sessionId] = {
      ...this.sessionData[sessionId],
      ...data,
      lastUpdated: new Date()
    };
    
    // API로 대화 데이터 저장 (conversations가 있는 경우)
    if (data.conversations && data.conversations.length > 0) {
      try {
        const { apiService } = await import('./services/api');
        
        // 새로운 대화만 저장 (기존에 없던 것들)
        const existingConversations = this.sessionData[sessionId].conversations || [];
        const newConversations = data.conversations.slice(existingConversations.length);
        
        for (const conversation of newConversations) {
          await apiService.saveConversation({
            userSessionId: sessionId, // 임시로 sessionId 사용
            speaker: conversation.speaker,
            messageText: conversation.text,
            questionIndex: 0 // 임시값
          });
        }
      } catch (error) {
        console.error('대화 저장 실패:', error);
      }
    }
    
    this.requestUpdate();
  }

  private renderNavigation() {
    if (this.currentRoute === 'login') return '';

    return html`
      <div class="navigation-bar">
        <button 
          class="nav-button ${this.currentRoute === 'sessionList' ? 'active' : ''}"
          @click=${() => this.onNavigate('sessionList')}>
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span class="nav-text">세션</span>
        </button>
        
        <button 
          class="nav-button ${this.currentRoute === 'storyView' ? 'active' : ''}"
          @click=${() => this.onNavigate('storyView')}>
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
          <span class="nav-text">내 이야기</span>
        </button>
        
        <button 
          class="nav-button ${this.currentRoute === 'autobiography' ? 'active' : ''}"
          @click=${() => this.onNavigate('autobiography')}>
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            <path d="M8 7h8"/>
            <path d="M8 11h8"/>
            <path d="M8 15h6"/>
          </svg>
          <span class="nav-text">자서전</span>
        </button>
        
        <button 
          class="nav-button"
          @click=${this.onLogout}>
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span class="nav-text">로그아웃</span>
        </button>
      </div>
    `;
  }

  private renderCurrentScreen() {
    switch (this.currentRoute) {
      case 'login':
        return html`
          <login-screen 
            @user-login=${(e: CustomEvent) => this.onLogin(e.detail)}>
          </login-screen>
        `;
      
      case 'sessionList':
        return html`
          <session-list-screen 
            .sessionData=${this.sessionData}
            @session-select=${(e: CustomEvent) => this.onSelectSession(e.detail.sessionId)}
            @session-update=${(e: CustomEvent) => this.onUpdateSessionData(e.detail.sessionId, e.detail.data)}>
          </session-list-screen>
        `;
      
      case 'interview':
        return html`
          <interview-screen 
            .sessionId=${this.selectedSessionId}
            .sessionData=${this.sessionData[this.selectedSessionId]}
            @session-update=${(e: CustomEvent) => this.onUpdateSessionData(this.selectedSessionId, e.detail.data)}
            @navigate-back=${() => this.onNavigate('sessionList')}>
          </interview-screen>
        `;
      
      case 'storyView':
        return html`
          <story-view-screen 
            .sessionData=${this.sessionData}>
          </story-view-screen>
        `;
      
      case 'autobiography':
        return html`
          <autobiography-screen 
            .sessionData=${this.sessionData}>
          </autobiography-screen>
        `;
      
      default:
        return html`<div>화면을 찾을 수 없습니다.</div>`;
    }
  }

  render() {
    return html`
      <div class="app-container">
        <div class="mobile-layout">
          <div class="screen-container">
            ${this.renderCurrentScreen()}
          </div>
          ${this.renderNavigation()}
        </div>
      </div>
    `;
  }
}