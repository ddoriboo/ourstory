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
      padding: var(--spacing-xl) var(--spacing);
      background: var(--color-background);
      min-height: 100vh;
    }

    .header {
      text-align: center;
      margin-bottom: var(--spacing-3xl);
    }

    .header h1 {
      color: var(--color-primary);
      margin-bottom: var(--spacing-sm);
    }

    .header p {
      color: var(--color-text-light);
      font-size: var(--font-size-senior-lg);
      line-height: 1.5;
    }

    .sessions-grid {
      display: grid;
      gap: var(--spacing-lg);
      max-width: 800px;
      margin: 0 auto;
    }

    .session-card {
      background: var(--gradient-surface);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease-in-out;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .session-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-lg);
    }

    .session-card.completed {
      border-color: var(--color-success);
      background: linear-gradient(135deg, var(--color-surface) 0%, #FFFFFF 50%, var(--color-surface) 100%);
    }

    .session-card.completed::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--gradient-primary);
    }

    .session-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--spacing);
    }

    .session-number {
      background: var(--gradient-primary);
      color: var(--color-text-inverse);
      width: 48px;
      height: 48px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: var(--font-size-senior-base);
      box-shadow: var(--shadow);
    }

    .session-number.completed {
      background: var(--gradient-secondary);
    }

    .session-status {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: var(--font-size-sm);
      font-weight: 600;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-full);
      background: var(--color-surface);
    }

    .session-title {
      font-size: var(--font-size-senior-xl);
      font-weight: 600;
      margin-bottom: var(--spacing-sm);
      color: var(--color-text);
      line-height: 1.3;
    }

    .session-description {
      color: var(--color-text-light);
      font-size: var(--font-size-base);
      margin-bottom: var(--spacing);
      line-height: 1.5;
    }

    .session-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      margin-bottom: var(--spacing);
    }

    .conversation-count {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }

    .last-updated {
      font-style: italic;
    }

    .session-actions {
      display: flex;
      gap: var(--spacing-sm);
      margin-top: var(--spacing);
      padding-top: var(--spacing);
      border-top: 1px solid var(--color-border-light);
    }

    .empty-state {
      text-align: center;
      margin-top: var(--spacing-3xl);
      color: var(--color-text-light);
      padding: var(--spacing-2xl);
    }

    .empty-state h3 {
      margin-bottom: var(--spacing);
      color: var(--color-text);
    }

    .empty-state p {
      font-size: var(--font-size-senior-base);
    }

    @media (max-width: 480px) {
      :host {
        padding: var(--spacing) var(--spacing-sm);
      }

      .header {
        margin-bottom: var(--spacing-xl);
      }

      .session-card {
        padding: var(--spacing);
      }

      .session-title {
        font-size: var(--font-size-senior-lg);
      }

      .session-actions {
        flex-direction: column;
        gap: var(--spacing-sm);
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
                  <div class="status-dot ${completed ? 'success' : 'primary'}"></div>
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
                  class="btn btn-primary btn-sm"
                  @click=${(e: Event) => { e.stopPropagation(); this.handleSessionSelect(session.id); }}>
                  ${completed ? '다시 보기' : '시작하기'}
                </button>
                
                ${conversationCount > 0 ? html`
                  <button 
                    class="btn btn-outline btn-sm"
                    @click=${(e: Event) => this.handleSessionReset(session.id, e)}>
                    초기화
                  </button>
                  <button 
                    class="btn btn-ghost btn-sm"
                    style="color: var(--color-error); border-color: var(--color-error);"
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