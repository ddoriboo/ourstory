import {LitElement, css, html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {Session, UserSession, apiService} from '../services/api';

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

@customElement('session-list-screen')
export class SessionListScreen extends LitElement {
  @state() private sessions: SessionData[] = [];
  @state() private loading = true;
  @state() private error = '';

  connectedCallback() {
    super.connectedCallback();
    this.loadSessions();
  }

  private async loadSessions() {
    try {
      this.loading = true;
      this.error = '';

      // 1. 모든 세션 템플릿 가져오기
      const allSessions = await apiService.getSessions();
      
      // 2. 사용자의 진행상황 가져오기 (인증된 경우만)
      let userSessions: UserSession[] = [];
      if (apiService.isAuthenticated()) {
        try {
          userSessions = await apiService.getUserSessions();
        } catch (userError) {
          console.warn('사용자 세션 데이터를 가져올 수 없습니다:', userError);
        }
      }

      // 3. 세션 데이터 병합
      this.sessions = allSessions
        .sort((a, b) => a.session_number - b.session_number)
        .map(session => {
          const userSession = userSessions.find(us => us.session_id === session.id);
          
          return {
            sessionId: session.id,
            sessionNumber: session.session_number,
            title: session.title,
            description: session.description || '',
            estimatedDuration: session.estimated_duration || 45,
            totalQuestions: Array.isArray(session.questions) ? session.questions.length : 0,
            status: userSession?.status || 'not_started',
            progressPercent: userSession?.progress_percent || 0,
            conversationCount: 0, // 대화 개수는 별도로 계산 필요시 추가
            lastUpdated: userSession?.last_updated ? new Date(userSession.last_updated) : undefined,
            userSessionId: userSession?.id
          } as SessionData;
        });

      this.loading = false;
    } catch (error) {
      console.error('세션 로드 실패:', error);
      this.error = '세션을 불러오는데 실패했습니다. 다시 시도해주세요.';
      this.loading = false;
    }
  }

  static styles = css`
    :host {
      display: block;
      height: 100%;
      background: var(--color-background);
      overflow: hidden;
    }

    .container {
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: var(--spacing-3);
    }

    .header {
      flex-shrink: 0;
      text-align: center;
      padding: var(--spacing-4) 0;
      margin-bottom: var(--spacing-3);
    }

    .header h1 {
      font-size: var(--text-2xl);
      color: var(--color-primary);
      margin: 0 0 var(--spacing-2) 0;
      font-weight: 700;
    }

    .header p {
      color: var(--color-text-secondary);
      font-size: var(--text-base);
      margin: 0;
      line-height: var(--leading-relaxed);
    }

    .sessions-container {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    .sessions-grid {
      display: grid;
      gap: var(--spacing-3);
      grid-template-columns: 1fr;
      padding-bottom: var(--spacing-4);
    }

    .session-card {
      background: var(--gradient-surface);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-lg);
      padding: var(--spacing-4);
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease-in-out;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      min-height: 120px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .session-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .session-card:active {
      transform: translateY(0);
      box-shadow: var(--shadow);
    }

    .session-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-3);
    }

    .session-title {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
      line-height: var(--leading-tight);
      flex: 1;
    }

    .session-status {
      padding: var(--spacing-1) var(--spacing-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      flex-shrink: 0;
      margin-left: var(--spacing-2);
    }

    .session-status.completed {
      background: var(--color-success);
      color: white;
    }

    .session-status.in_progress {
      background: var(--color-warning);
      color: white;
    }

    .session-status.not_started {
      background: var(--color-border);
      color: var(--color-text-secondary);
    }

    .session-description {
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
      line-height: var(--leading-normal);
      margin-bottom: var(--spacing-3);
      flex: 1;
    }

    .session-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: var(--spacing-2);
      border-top: 1px solid var(--color-border-light);
    }

    .conversation-count {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      gap: var(--spacing-1);
    }

    .last-updated {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
    }

    .session-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: var(--color-primary);
      transition: width 0.3s ease-in-out;
    }

    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: var(--spacing-8);
    }

    .empty-icon {
      width: 64px;
      height: 64px;
      margin-bottom: var(--spacing-4);
      opacity: 0.5;
    }

    .empty-title {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: var(--spacing-2);
    }

    .empty-description {
      color: var(--color-text-secondary);
      font-size: var(--text-base);
      line-height: var(--leading-relaxed);
      max-width: 280px;
    }

    .loading-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-8);
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-border);
      border-top: 3px solid var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: var(--spacing-4);
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-text {
      color: var(--color-text-secondary);
      font-size: var(--text-base);
    }

    .error-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-8);
      text-align: center;
    }

    .error-message {
      color: var(--color-error);
      font-size: var(--text-base);
      margin-bottom: var(--spacing-4);
      max-width: 400px;
      line-height: var(--leading-relaxed);
    }

    .retry-button {
      background: var(--color-primary);
      color: white;
      border: none;
      padding: var(--spacing-2) var(--spacing-4);
      border-radius: var(--radius);
      font-size: var(--text-sm);
      cursor: pointer;
      transition: all 0.2s ease-in-out;
    }

    .retry-button:hover {
      background: var(--color-primary-dark);
    }

    .session-duration {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      gap: var(--spacing-1);
    }

    /* 태블릿에서는 2열 그리드 */
    @media (min-width: 769px) and (max-width: 1024px) {
      .sessions-grid {
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-4);
      }
    }

    /* 데스크톱에서는 3열 그리드 */
    @media (min-width: 1025px) {
      .sessions-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: var(--spacing-4);
      }
    }

    /* 작은 화면에서 패딩 조정 */
    @media (max-width: 480px) {
      .container {
        padding: var(--spacing-2);
      }
      
      .session-card {
        padding: var(--spacing-3);
        min-height: 100px;
      }
    }
  `;

  private handleSessionSelect(session: SessionData) {
    this.dispatchEvent(new CustomEvent('session-select', {
      detail: { 
        sessionId: session.sessionId, 
        sessionNumber: session.sessionNumber,
        userSessionId: session.userSessionId 
      },
      bubbles: true,
      composed: true
    }));
  }

  private formatLastUpdated(session: SessionData): string {
    if (session.status === 'not_started') return '시작하지 않음';
    if (!session.lastUpdated) return '시작하지 않음';
    
    const now = new Date();
    const diffMs = now.getTime() - session.lastUpdated.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '1일 전';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    return `${Math.floor(diffDays / 30)}개월 전`;
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'completed': return '완료';
      case 'in_progress': return '진행중';
      case 'not_started': return '시작하기';
      default: return '시작하기';
    }
  }

  private formatDuration(minutes: number): string {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`;
    }
    return `${minutes}분`;
  }

  private renderEmptyState() {
    return html`
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
        <h3 class="empty-title">세션이 없습니다</h3>
        <p class="empty-description">
          첫 번째 인터뷰 세션을 시작해보세요. 당신의 소중한 이야기를 들려주세요.
        </p>
      </div>
    `;
  }

  private renderSessionCard(session: SessionData) {
    return html`
      <div class="session-card" @click=${() => this.handleSessionSelect(session)}>
        <div class="session-header">
          <h3 class="session-title">세션 ${session.sessionNumber}. ${session.title}</h3>
          <div class="session-status ${session.status}">
            ${this.getStatusText(session.status)}
          </div>
        </div>
        
        <p class="session-description">
          ${session.description}
        </p>
        
        <div class="session-footer">
          <div class="session-duration">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            약 ${this.formatDuration(session.estimatedDuration)}
          </div>
          <div class="conversation-count">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            ${session.totalQuestions}개 질문
          </div>
          <div class="last-updated">
            ${this.formatLastUpdated(session)}
          </div>
        </div>
        
        <div class="session-progress" style="width: ${session.progressPercent}%"></div>
      </div>
    `;
  }

  private renderLoadingState() {
    return html`
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">세션을 불러오는 중...</div>
      </div>
    `;
  }

  private renderErrorState() {
    return html`
      <div class="error-container">
        <div class="error-message">${this.error}</div>
        <button class="retry-button" @click=${this.loadSessions}>
          다시 시도
        </button>
      </div>
    `;
  }

  render() {
    return html`
      <div class="container">
        <div class="header">
          <h1>나의 이야기 세션</h1>
          <p>당신의 소중한 경험과 추억을 나누어주세요</p>
        </div>
        
        ${this.loading 
          ? this.renderLoadingState()
          : this.error 
          ? this.renderErrorState()
          : this.sessions.length > 0 
          ? html`
            <div class="sessions-container">
              <div class="sessions-grid">
                ${this.sessions.map(session => this.renderSessionCard(session))}
              </div>
            </div>
          `
          : this.renderEmptyState()
        }
      </div>
    `;
  }
}