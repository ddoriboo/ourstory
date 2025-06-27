import {LitElement, css, html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
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

@customElement('story-view-screen')
export class StoryViewScreen extends LitElement {
  @property({ type: Object }) sessionData: Record<number, SessionData> = {};
  @state() selectedSessionId: number | null = null;
  @state() viewMode: 'overview' | 'detail' = 'overview';

  static styles = css`
    :host {
      display: block;
      background: var(--color-background);
      min-height: 100vh;
      padding: 1rem;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .header h1 {
      color: var(--color-primary);
      margin-bottom: 0.5rem;
    }

    .header p {
      color: var(--color-muted-foreground);
      font-size: 1.125rem;
    }

    .view-toggle {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      justify-content: center;
    }

    .toggle-button {
      padding: 0.75rem 1.5rem;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-background);
      color: var(--color-foreground);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .toggle-button:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    .toggle-button.active {
      background: var(--color-primary);
      color: var(--color-primary-foreground);
      border-color: var(--color-primary);
    }

    .overview-grid {
      display: grid;
      gap: 1.5rem;
    }

    .session-summary {
      background: var(--color-card);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow);
      cursor: pointer;
      transition: all 0.2s;
    }

    .session-summary:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .session-summary.completed {
      border-color: var(--color-primary);
      background: linear-gradient(135deg, var(--color-card) 0%, var(--color-muted) 100%);
    }

    .summary-header {
      display: flex;
      align-items: center;
      justify-content: between;
      margin-bottom: 1rem;
    }

    .session-number {
      background: var(--color-primary);
      color: var(--color-primary-foreground);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      margin-right: 0.75rem;
    }

    .session-number.completed {
      background: var(--color-accent);
    }

    .session-info {
      flex: 1;
    }

    .session-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
      color: var(--color-foreground);
    }

    .session-meta {
      font-size: 0.875rem;
      color: var(--color-muted-foreground);
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .story-preview {
      margin-top: 1rem;
      padding: 1rem;
      background: var(--color-muted);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
    }

    .preview-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-muted-foreground);
      margin-bottom: 0.5rem;
    }

    .preview-text {
      font-size: 1rem;
      line-height: 1.5;
      color: var(--color-foreground);
    }

    .detail-view {
      background: var(--color-card);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 2rem;
      box-shadow: var(--shadow);
    }

    .detail-header {
      display: flex;
      align-items: center;
      margin-bottom: 2rem;
    }

    .back-button {
      background: transparent;
      border: none;
      color: var(--color-primary);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.5rem;
      margin-right: 1rem;
    }

    .detail-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-foreground);
    }

    .conversation-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .conversation-message {
      padding: 1rem 1.25rem;
      border-radius: 1rem;
      max-width: 85%;
    }

    .conversation-message.ai {
      align-self: flex-start;
      background: var(--color-muted);
      border: 1px solid var(--color-border);
    }

    .conversation-message.user {
      align-self: flex-end;
      background: var(--color-primary);
      color: var(--color-primary-foreground);
    }

    .message-header {
      font-size: 0.75rem;
      font-weight: 600;
      opacity: 0.7;
      margin-bottom: 0.25rem;
    }

    .message-content {
      font-size: 1rem;
      line-height: 1.5;
    }

    .message-timestamp {
      font-size: 0.75rem;
      opacity: 0.6;
      margin-top: 0.5rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--color-muted-foreground);
    }

    .empty-state h3 {
      margin-bottom: 1rem;
    }

    .export-button {
      background: var(--color-accent);
      color: var(--color-accent-foreground);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 1rem 2rem;
      font-size: 1.125rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: var(--shadow);
      transition: all 0.2s;
      margin-top: 1rem;
    }

    .export-button:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    @media (max-width: 480px) {
      :host {
        padding: 1rem 0.5rem;
      }

      .view-toggle {
        flex-direction: column;
      }

      .toggle-button {
        padding: 0.875rem 1rem;
      }

      .session-summary {
        padding: 1.25rem;
      }

      .detail-view {
        padding: 1.5rem;
      }

      .conversation-message {
        padding: 1rem;
        font-size: 0.95rem;
      }
    }
  `;

  private getSessionSummary(sessionId: number): string {
    const data = this.sessionData[sessionId];
    if (!data?.conversations?.length) return '아직 대화가 없습니다.';

    const userMessages = data.conversations.filter(conv => conv.speaker === 'user');
    if (userMessages.length === 0) return '아직 대화가 없습니다.';

    // 첫 번째 사용자 메시지의 일부를 미리보기로 표시
    const firstMessage = userMessages[0].text;
    return firstMessage.length > 100 ? firstMessage.substring(0, 100) + '...' : firstMessage;
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

  private isSessionCompleted(sessionId: number): boolean {
    const data = this.sessionData[sessionId];
    return data?.completed || false;
  }

  private viewSessionDetail(sessionId: number) {
    this.selectedSessionId = sessionId;
    this.viewMode = 'detail';
  }

  private backToOverview() {
    this.selectedSessionId = null;
    this.viewMode = 'overview';
  }

  private exportConversation() {
    if (!this.selectedSessionId) return;

    const data = this.sessionData[this.selectedSessionId];
    if (!data?.conversations?.length) return;

    const sessionConfig = interviewConfig.sessions[this.selectedSessionId];
    let exportText = `세션 ${this.selectedSessionId}: ${sessionConfig?.title || ''}\n`;
    exportText += `대화 날짜: ${data.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString('ko-KR') : ''}\n\n`;
    
    data.conversations.forEach((conv, index) => {
      const speaker = conv.speaker === 'ai' ? '기억의 안내자' : '어르신';
      const timestamp = new Date(conv.timestamp).toLocaleTimeString('ko-KR');
      exportText += `[${timestamp}] ${speaker}: ${conv.text}\n\n`;
    });

    // 텍스트 파일로 다운로드
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `세션${this.selectedSessionId}_대화기록.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private renderOverview() {
    const sessionsWithData = Object.entries(interviewConfig.sessions)
      .map(([id, config]) => ({
        id: parseInt(id),
        ...config,
        hasData: this.getConversationCount(parseInt(id)) > 0
      }))
      .filter(session => session.hasData);

    if (sessionsWithData.length === 0) {
      return html`
        <div class="empty-state">
          <h3>아직 저장된 이야기가 없습니다</h3>
          <p>세션을 시작하여 소중한 이야기를 기록해보세요.</p>
        </div>
      `;
    }

    return html`
      <div class="overview-grid">
        ${sessionsWithData.map(session => {
          const completed = this.isSessionCompleted(session.id);
          const conversationCount = this.getConversationCount(session.id);
          const lastUpdated = this.getLastUpdated(session.id);
          const summary = this.getSessionSummary(session.id);

          return html`
            <div 
              class="session-summary ${completed ? 'completed' : ''}"
              @click=${() => this.viewSessionDetail(session.id)}>
              
              <div class="summary-header">
                <div class="session-number ${completed ? 'completed' : ''}">${session.id}</div>
                <div class="session-info">
                  <div class="session-title">${session.title}</div>
                  <div class="session-meta">
                    <span>💬 ${conversationCount}개 대화</span>
                    ${lastUpdated ? html`<span>📅 ${lastUpdated}</span>` : ''}
                  </div>
                </div>
              </div>

              <div class="story-preview">
                <div class="preview-label">이야기 미리보기</div>
                <div class="preview-text">${summary}</div>
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }

  private renderDetail() {
    if (!this.selectedSessionId) return '';

    const sessionData = this.sessionData[this.selectedSessionId];
    const sessionConfig = interviewConfig.sessions[this.selectedSessionId];

    if (!sessionData?.conversations?.length) {
      return html`
        <div class="detail-view">
          <div class="detail-header">
            <button class="back-button" @click=${this.backToOverview}>←</button>
            <div class="detail-title">세션 ${this.selectedSessionId}: ${sessionConfig?.title}</div>
          </div>
          <div class="empty-state">
            <h3>대화 기록이 없습니다</h3>
            <p>이 세션에는 아직 대화가 기록되지 않았습니다.</p>
          </div>
        </div>
      `;
    }

    return html`
      <div class="detail-view">
        <div class="detail-header">
          <button class="back-button" @click=${this.backToOverview}>←</button>
          <div class="detail-title">세션 ${this.selectedSessionId}: ${sessionConfig?.title}</div>
        </div>

        <div class="conversation-list">
          ${sessionData.conversations.map(conv => html`
            <div class="conversation-message ${conv.speaker}">
              <div class="message-header">
                ${conv.speaker === 'ai' ? '🤖 기억의 안내자' : '👤 어르신'}
              </div>
              <div class="message-content">${conv.text}</div>
              <div class="message-timestamp">
                ${new Date(conv.timestamp).toLocaleString('ko-KR')}
              </div>
            </div>
          `)}
        </div>

        <button class="export-button" @click=${this.exportConversation}>
          📄 대화 내용 텍스트로 내보내기
        </button>
      </div>
    `;
  }

  render() {
    return html`
      <div class="container">
        <div class="header">
          <h1>내 이야기</h1>
          <p>지금까지 기록된 소중한 이야기들을 확인해보세요</p>
        </div>

        <div class="view-toggle">
          <button 
            class="toggle-button ${this.viewMode === 'overview' ? 'active' : ''}"
            @click=${() => { this.viewMode = 'overview'; this.selectedSessionId = null; }}>
            📋 전체 보기
          </button>
          ${this.selectedSessionId ? html`
            <button 
              class="toggle-button ${this.viewMode === 'detail' ? 'active' : ''}"
              @click=${() => this.viewMode = 'detail'}>
              📖 상세 보기
            </button>
          ` : ''}
        </div>

        ${this.viewMode === 'overview' ? this.renderOverview() : this.renderDetail()}
      </div>
    `;
  }
}