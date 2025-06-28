import {LitElement, css, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {interviewConfig} from '../../interviewConfig';

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

@customElement('session-list-screen')
export class SessionListScreen extends LitElement {
  @property({ type: Object }) sessionData: Record<number, SessionData> = {};

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

    .session-status.in-progress {
      background: var(--color-warning);
      color: white;
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

  private handleSessionSelect(sessionId: number) {
    this.dispatchEvent(new CustomEvent('session-select', {
      detail: { sessionId },
      bubbles: true,
      composed: true
    }));
  }

  private formatLastUpdated(date?: Date): string {
    if (!date) return '시작하지 않음';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '1일 전';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    return `${Math.floor(diffDays / 30)}개월 전`;
  }

  private getProgressPercentage(session: SessionData): number {
    const totalQuestions = interviewConfig.sessions.find(s => s.id === session.sessionId)?.questions.length || 1;
    const answeredQuestions = session.conversations.filter(c => c.speaker === 'user').length;
    return Math.min((answeredQuestions / totalQuestions) * 100, 100);
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
    const config = interviewConfig.sessions.find(s => s.id === session.sessionId);
    const progressPercentage = this.getProgressPercentage(session);
    
    return html`
      <div class="session-card" @click=${() => this.handleSessionSelect(session.sessionId)}>
        <div class="session-header">
          <h3 class="session-title">${session.title}</h3>
          <div class="session-status ${session.completed ? 'completed' : 'in-progress'}">
            ${session.completed ? '완료' : '진행중'}
          </div>
        </div>
        
        <p class="session-description">
          ${config?.description || '인터뷰 세션에 참여하여 당신의 이야기를 들려주세요.'}
        </p>
        
        <div class="session-footer">
          <div class="conversation-count">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            ${session.conversations.length}개 대화
          </div>
          <div class="last-updated">
            ${this.formatLastUpdated(session.lastUpdated)}
          </div>
        </div>
        
        <div class="session-progress" style="width: ${progressPercentage}%"></div>
      </div>
    `;
  }

  render() {
    const sessions = Object.values(this.sessionData);
    const hasSessions = sessions.length > 0;

    return html`
      <div class="container">
        <div class="header">
          <h1>나의 이야기 세션</h1>
          <p>당신의 소중한 경험과 추억을 나누어주세요</p>
        </div>
        
        ${hasSessions ? html`
          <div class="sessions-container">
            <div class="sessions-grid">
              ${sessions.map(session => this.renderSessionCard(session))}
            </div>
          </div>
        ` : this.renderEmptyState()}
      </div>
    `;
  }
}