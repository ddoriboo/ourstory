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
      height: 100vh;
      background: var(--color-background);
      color: var(--color-foreground);
      font-family: var(--font-sans);
    }

    .app-container {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .mobile-layout {
      max-width: 480px;
      margin: 0 auto;
      height: 100vh;
      position: relative;
    }

    .navigation-bar {
      position: fixed;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      max-width: 480px;
      background: var(--color-card);
      border-top: 2px solid var(--color-border);
      padding: 12px;
      z-index: 1000;
      display: flex;
      justify-content: space-around;
    }

    .nav-button {
      flex: 1;
      padding: 12px 8px;
      background: transparent;
      border: none;
      color: var(--color-muted-foreground);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border-radius: var(--radius-md);
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .nav-button:hover {
      background: var(--color-muted);
      color: var(--color-foreground);
    }

    .nav-button.active {
      background: var(--color-primary);
      color: var(--color-primary-foreground);
    }

    .nav-icon {
      width: 20px;
      height: 20px;
    }

    .screen-container {
      width: 100%;
      height: 100vh;
      padding-bottom: 80px; /* 네비게이션 바 공간 */
      overflow-y: auto;
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
          <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
          </svg>
          세션 목록
        </button>
        
        <button 
          class="nav-button ${this.currentRoute === 'storyView' ? 'active' : ''}"
          @click=${() => this.onNavigate('storyView')}>
          <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
          내 이야기
        </button>
        
        <button 
          class="nav-button ${this.currentRoute === 'autobiography' ? 'active' : ''}"
          @click=${() => this.onNavigate('autobiography')}>
          <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19Z"/>
          </svg>
          자서전
        </button>
        
        <button 
          class="nav-button"
          @click=${this.onLogout}>
          <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z"/>
          </svg>
          로그아웃
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