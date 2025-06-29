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
  sessionNumber: number;
  title: string;
  description: string;
  estimatedDuration: number;
  totalQuestions: number;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercent: number;
  conversationCount: number;
  lastUpdated?: Date;
  userSessionId?: number;
}

@customElement('ourstory-app')
export class OurStoryApp extends LitElement {
  @state() currentRoute: AppRoute = 'login';
  @state() currentUser: User | null = null;
  @state() selectedSessionId: number = 1;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100vh;
      background: var(--color-background);
      color: var(--color-text);
      font-family: var(--font-family);
      overflow: hidden;
    }

    .app-container {
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .main-content {
      flex: 1;
      width: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    }

    .navigation-bar {
      position: relative;
      width: 100%;
      height: 80px;
      background: var(--color-background);
      border-top: 1px solid var(--color-border-light);
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: var(--spacing-2) var(--spacing-3);
      box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
      flex-shrink: 0;
    }

    .nav-button {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-1);
      background: transparent;
      border: none;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      border-radius: var(--radius);
      min-height: 60px;
      gap: 4px;
    }

    .nav-button:hover {
      background: var(--color-surface-hover);
      color: var(--color-text);
    }

    .nav-button.active {
      color: var(--color-primary);
    }

    .nav-button.active .nav-icon {
      stroke: var(--color-primary);
    }

    .nav-icon {
      width: 24px;
      height: 24px;
      stroke-width: 2;
      stroke: currentColor;
    }

    .nav-text {
      font-size: 11px;
      font-weight: 500;
      text-align: center;
      line-height: 1;
    }

    /* 모바일 퍼스트 - 추가 스타일링 */
    @media (max-width: 768px) {
      .nav-icon {
        width: 22px;
        height: 22px;
      }
      
      .nav-text {
        font-size: 10px;
      }
    }

    /* 태블릿 및 데스크톱에서는 센터 정렬 */
    @media (min-width: 769px) {
      :host {
        max-width: 480px;
        margin: 0 auto;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
      }
    }

    /* 아이폰 홈 인디케이터 대응 */
    @supports (padding: max(0px)) {
      .navigation-bar {
        padding-bottom: max(var(--spacing-2), env(safe-area-inset-bottom));
      }
    }
  `;

  constructor() {
    super();
    this.loadUserData();
    
    // 토큰 만료 시 자동 로그아웃 처리
    window.addEventListener('auth-expired', () => {
      console.log('토큰 만료로 인한 자동 로그아웃');
      this.onLogout();
    });
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

  onSelectSession(eventDetail: { sessionId: number; sessionNumber: number; userSessionId?: number }) {
    this.selectedSessionId = eventDetail.sessionNumber; // InterviewScreen은 sessionNumber를 사용
    this.currentRoute = 'interview';
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
            @session-select=${(e: CustomEvent) => this.onSelectSession(e.detail)}>
          </session-list-screen>
        `;
      
      case 'interview':
        return html`
          <interview-screen 
            .sessionId=${this.selectedSessionId}
            .sessionData=${null}
            @navigate-back=${() => this.onNavigate('sessionList')}>
          </interview-screen>
        `;
      
      case 'storyView':
        return html`
          <story-view-screen>
          </story-view-screen>
        `;
      
      case 'autobiography':
        return html`
          <autobiography-screen>
          </autobiography-screen>
        `;
      
      default:
        return html`<div>화면을 찾을 수 없습니다.</div>`;
    }
  }

  render() {
    return html`
      <div class="app-container">
        <div class="main-content">
          ${this.renderCurrentScreen()}
        </div>
        ${this.renderNavigation()}
      </div>
    `;
  }
}