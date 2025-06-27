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
      padding: 2rem 1rem;
      background: var(--color-background);
      min-height: 100vh;
    }

    .header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .header h1 {
      color: var(--color-primary);
      margin-bottom: 0.5rem;
    }

    .header p {
      color: var(--color-muted-foreground);
      font-size: 1.25rem;
    }

    .sessions-grid {
      display: grid;
      gap: 1.5rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .session-card {
      background: var(--color-card);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow);
      transition: all 0.2s;
      cursor: pointer;
      position: relative;
    }

    .session-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .session-card.completed {
      border-color: var(--color-primary);
      background: linear-gradient(135deg, var(--color-card) 0%, var(--color-muted) 100%);
    }

    .session-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .session-number {
      background: var(--color-primary);
      color: var(--color-primary-foreground);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.125rem;
    }

    .session-number.completed {
      background: var(--color-accent);
    }

    .session-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .status-dot.completed {
      background: var(--color-accent);
    }

    .status-dot.pending {
      background: var(--color-muted-foreground);
    }

    .session-title {
      font-size: 1.375rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: var(--color-foreground);
      line-height: 1.3;
    }

    .session-description {
      color: var(--color-muted-foreground);
      font-size: 1rem;
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .session-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
      color: var(--color-muted-foreground);
    }

    .conversation-count {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .last-updated {
      font-style: italic;
    }

    .session-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
    }

    .action-button {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      background: var(--color-background);
      color: var(--color-foreground);
    }

    .action-button:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    .action-button.primary {
      background: var(--color-primary);
      color: var(--color-primary-foreground);
      border-color: var(--color-primary);
    }

    .action-button.secondary {
      background: var(--color-secondary);
      color: var(--color-secondary-foreground);
      border-color: var(--color-secondary);
    }

    .action-button.destructive {
      background: var(--color-destructive);
      color: var(--color-destructive-foreground);
      border-color: var(--color-destructive);
    }

    .empty-state {
      text-align: center;
      margin-top: 4rem;
      color: var(--color-muted-foreground);
    }

    .empty-state h3 {
      margin-bottom: 1rem;
    }

    .empty-state p {
      font-size: 1.125rem;
    }

    @media (max-width: 480px) {
      :host {
        padding: 1rem 0.5rem;
      }

      .header {
        margin-bottom: 2rem;
      }

      .session-card {
        padding: 1.25rem;
      }

      .session-title {
        font-size: 1.25rem;
      }

      .session-actions {
        flex-direction: column;
        gap: 0.5rem;
      }

      .action-button {
        min-height: 44px;
      }
    }
  `;

  private getSessionDescription(sessionId: number): string {
    const session = interviewConfig.sessions[sessionId];
    if (!session) return '';
    
    const questionCount = session.questions.length;
    return `${questionCount}개의 질문으로 구성된 인터뷰 세션입니다.`;
  }

  private isSessionCompleted(sessionId: number): boolean {
    const data = this.sessionData[sessionId];
    return data?.completed || false;
  }

  private getConversationCount(sessionId: number): number {
    const data = this.sessionData[sessionId];
    return data?.conversations?.length || 0;
  }

  private getLastUpdated(sessionId: number): string {
    const data = this.sessionData[sessionId];
    if (!data?.lastUpdated) return '';
    
    const date = new Date(data.lastUpdated);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private handleSessionSelect(sessionId: number) {
    this.dispatchEvent(new CustomEvent('session-select', {
      detail: { sessionId }
    }));
  }

  private handleSessionReset(sessionId: number, e: Event) {
    e.stopPropagation();
    
    if (confirm('이 세션의 모든 대화 내용이 삭제됩니다. 정말 초기화하시겠습니까?')) {
      this.dispatchEvent(new CustomEvent('session-update', {
        detail: {
          sessionId,
          data: {
            completed: false,
            conversations: [],
            lastUpdated: new Date()
          }
        }
      }));
    }
  }

  private handleSessionDelete(sessionId: number, e: Event) {
    e.stopPropagation();
    
    if (confirm('이 세션을 완전히 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.')) {
      this.dispatchEvent(new CustomEvent('session-update', {
        detail: {
          sessionId,
          data: null // null로 전달하면 삭제로 처리
        }
      }));
    }
  }

  render() {
    const sessions = Object.entries(interviewConfig.sessions).map(([id, config]) => ({
      id: parseInt(id),
      ...config
    }));

    return html`
      <div class="header">
        <h1>나의 인생 이야기</h1>
        <p>12개의 세션을 통해 소중한 추억들을<br>차근차근 기록해보세요</p>
      </div>

      <div class="sessions-grid">
        ${sessions.map(session => {
          const completed = this.isSessionCompleted(session.id);
          const conversationCount = this.getConversationCount(session.id);
          const lastUpdated = this.getLastUpdated(session.id);

          return html`
            <div 
              class="session-card ${completed ? 'completed' : ''}"
              @click=${() => this.handleSessionSelect(session.id)}>
              
              <div class="session-header">
                <div class="session-number ${completed ? 'completed' : ''}">${session.id}</div>
                <div class="session-status">
                  <div class="status-dot ${completed ? 'completed' : 'pending'}"></div>
                  ${completed ? '완료' : '진행 중'}
                </div>
              </div>

              <h3 class="session-title">${session.title}</h3>
              <p class="session-description">${this.getSessionDescription(session.id)}</p>

              <div class="session-meta">
                <div class="conversation-count">
                  💬 ${conversationCount}개 대화
                </div>
                ${lastUpdated ? html`
                  <div class="last-updated">${lastUpdated}</div>
                ` : ''}
              </div>

              <div class="session-actions">
                <button 
                  class="action-button primary"
                  @click=${(e: Event) => { e.stopPropagation(); this.handleSessionSelect(session.id); }}>
                  ${completed ? '다시 보기' : '시작하기'}
                </button>
                
                ${conversationCount > 0 ? html`
                  <button 
                    class="action-button secondary"
                    @click=${(e: Event) => this.handleSessionReset(session.id, e)}>
                    초기화
                  </button>
                  <button 
                    class="action-button destructive"
                    @click=${(e: Event) => this.handleSessionDelete(session.id, e)}>
                    삭제
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }
}