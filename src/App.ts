import {LitElement, css, html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import './components/LoginScreen';
import './components/SessionListScreen';
import './components/InterviewScreen';
import './components/StoryViewScreen';
import './components/AutobiographyScreen';

export type AppRoute = 'login' | 'sessionList' | 'interview' | 'storyView' | 'autobiography';

export interface User {
  id: string;
  username: string;
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
      max-width: 80px;
      padding: var(--spacing-sm);
      background: transparent;
      border: none;
      color: var(--color-text-light);
      font-size: var(--font-size-xs);
      font-weight: 600;
      cursor: pointer;
      border-radius: var(--radius);
      transition: all 0.2s ease-in-out;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-xs);
      min-height: 60px;
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
      width: 24px;
      height: 24px;
      stroke-width: 2;
    }

    .nav-text {
      font-size: var(--font-size-xs);
      font-weight: 600;
      text-align: center;
      line-height: 1.2;
    }

    /* 화면별 안전 영역 확보 */
    @media (max-width: 480px) {
      .screen-container {
        padding-bottom: 110px; /* 모바일에서 더 넉넉한 공간 */
      }
      
      .navigation-bar {
        padding: var(--spacing-sm);
      }
      
      .nav-button {
        min-height: 56px;
        padding: var(--spacing-xs);
      }
      
      .nav-icon {
        width: 20px;
        height: 20px;
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

  private loadUserData() {
    const savedUser = localStorage.getItem('ourstory_user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.currentRoute = 'sessionList';
    }

    const savedSessions = localStorage.getItem('ourstory_sessions');
    if (savedSessions) {
      this.sessionData = JSON.parse(savedSessions);
    }
  }

  private saveUserData() {
    if (this.currentUser) {
      localStorage.setItem('ourstory_user', JSON.stringify(this.currentUser));
    }
    localStorage.setItem('ourstory_sessions', JSON.stringify(this.sessionData));
  }

  onLogin(user: User) {
    this.currentUser = user;
    this.currentRoute = 'sessionList';
    this.saveUserData();
  }

  onLogout() {
    this.currentUser = null;
    this.currentRoute = 'login';
    localStorage.removeItem('ourstory_user');
  }

  onNavigate(route: AppRoute) {
    this.currentRoute = route;
  }

  onSelectSession(sessionId: number) {
    this.selectedSessionId = sessionId;
    this.currentRoute = 'interview';
  }

  onUpdateSessionData(sessionId: number, data: Partial<SessionData>) {
    if (!this.sessionData[sessionId]) {
      this.sessionData[sessionId] = {
        sessionId,
        title: `세션 ${sessionId}`,
        completed: false,
        conversations: []
      };
    }
    
    this.sessionData[sessionId] = {
      ...this.sessionData[sessionId],
      ...data,
      lastUpdated: new Date()
    };
    
    this.saveUserData();
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