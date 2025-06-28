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
      min-height: 100vh;
      background: var(--color-background);
      padding: var(--spacing-4);
      width: 100%;
    }

    .header {
      text-align: center;
      margin-bottom: var(--spacing-8);
      max-width: 1024px;
      margin-left: auto;
      margin-right: auto;
    }

    .header h1 {
      font-size: var(--text-3xl);
      color: var(--color-primary);
      margin-bottom: var(--spacing-3);
      font-weight: 700;
      word-break: keep-all;
      white-space: normal;
    }

    .header p {
      color: var(--color-text-secondary);
      font-size: var(--text-lg);
      line-height: var(--leading-relaxed);
      word-break: keep-all;
      white-space: normal;
    }

    .sessions-grid {
      display: grid;
      gap: var(--spacing-4);
      width: 100%;
      max-width: 1024px;
      margin: 0 auto;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      padding: 0 var(--spacing-3);
    }

    .session-card {
      background: var(--gradient-surface);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-lg);
      padding: var(--spacing-6);
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease-in-out;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      width: 100%;
      min-height: 200px;
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
      margin-bottom: var(--spacing-4);
    }

    .session-number {
      background: var(--gradient-primary);
      color: var(--color-text-inverse);
      width: 80px;
      height: 80px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: var(--text-2xl);
      box-shadow: var(--shadow);
    }

    .session-number.completed {
      background: var(--gradient-secondary);
    }

    .session-status {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      font-size: var(--text-base);
      font-weight: 600;
      padding: var(--spacing-3) var(--spacing-4);
      border-radius: var(--radius-full);
      background: var(--color-surface);
    }

    .session-title {
      font-size: var(--text-xl);
      font-weight: 600;
      margin-bottom: var(--spacing-3);
      color: var(--color-text);
      line-height: var(--leading-tight);
      word-break: keep-all;
      white-space: normal;
    }

    .session-description {
      color: var(--color-text-secondary);
      font-size: var(--text-base);
      margin-bottom: var(--spacing-4);
      line-height: var(--leading-normal);
      word-break: keep-all;
      white-space: normal;
    }

    .session-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--text-base);
      color: var(--color-text-muted);
      margin-bottom: var(--spacing-4);
    }

    .conversation-count {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
    }

    .last-updated {
      font-style: italic;
    }
    
    .status-dot {
      width: 20px;
      height: 20px;
      border-radius: var(--radius-full);
      display: inline-block;
    }
    
    .status-dot.success {
      background: var(--color-success);
    }
    
    .status-dot.primary {
      background: var(--color-primary);
    }

    .session-actions {
      display: flex;
      gap: var(--spacing-3);
      margin-top: var(--spacing-4);
      padding-top: var(--spacing-4);
      border-top: 1px solid var(--color-border-light);
    }

    .empty-state {
      text-align: center;
      margin-top: var(--spacing-24);
      color: var(--color-text-secondary);
      padding: var(--spacing-20);
    }

    .empty-state h3 {
      font-size: var(--text-xl);
      margin-bottom: var(--spacing-4);
      color: var(--color-text);
    }

    .empty-state p {
      font-size: var(--text-base);
    }

    @media (max-width: 768px) {
      .sessions-grid {
        grid-template-columns: 1fr;
        gap: var(--spacing-8);
        padding: 0;
      }
      
      .session-card {
        padding: var(--spacing-16);
        min-height: 280px;
      }
    }

    @media (max-width: 480px) {
      :host {
        padding: var(--spacing-4);
      }

      .header {
        margin-bottom: var(--spacing-16);
      }

      .sessions-grid {
        grid-template-columns: 1fr;
        gap: var(--spacing-6);
        padding: 0;
      }

      .session-card {
        padding: var(--spacing-12);
        min-height: 260px;
      }

      .session-title {
        font-size: var(--text-xl);
      }

      .session-actions {
        flex-direction: column;
        gap: var(--spacing-4);
      }
      
      .session-number {
        width: 80px;
        height: 80px;
        font-size: var(--text-xl);
      }
      
      .session-status {
        font-size: var(--text-base);
        padding: var(--spacing-3) var(--spacing-4);
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