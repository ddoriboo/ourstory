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

@customElement('autobiography-screen')
export class AutobiographyScreen extends LitElement {
  @property({ type: Object }) sessionData: Record<number, SessionData> = {};
  @state() isGenerating = false;
  @state() generatedAutobiography = '';
  @state() error = '';
  @state() hasGeneratedBefore = false;

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
      margin-bottom: var(--spacing-4);
    }

    .header h1 {
      color: var(--color-primary);
      margin-bottom: var(--spacing-2);
      font-size: var(--text-3xl);
    }

    .header p {
      color: var(--color-text-secondary);
      font-size: var(--text-lg);
      line-height: var(--leading-relaxed);
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    .stats-section {
      background: var(--gradient-surface);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-6);
      margin-bottom: var(--spacing-6);
      box-shadow: var(--shadow);
    }

    .stats-title {
      font-size: var(--text-xl);
      font-weight: 600;
      margin-bottom: var(--spacing-4);
      color: var(--color-text);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-4);
    }

    .stat-item {
      text-align: center;
      padding: var(--spacing-4);
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: var(--text-base);
      color: var(--color-muted-foreground);
      font-weight: 600;
    }

    .generation-section {
      background: var(--color-card);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: var(--shadow);
    }

    .generation-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .generation-header h2 {
      margin-bottom: 0.5rem;
    }

    .generation-header p {
      color: var(--color-muted-foreground);
      font-size: var(--text-lg);
    }

    .generate-button {
      width: 100%;
      background: var(--color-primary);
      color: var(--color-primary-foreground);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 2rem;
      font-size: var(--text-xl);
      font-weight: 600;
      cursor: pointer;
      box-shadow: var(--shadow);
      transition: all 0.2s;
      margin-bottom: 1rem;
      min-height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }

    .generate-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .generate-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--color-primary-foreground);
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .api-key-section {
      background: var(--color-secondary);
      color: var(--color-secondary-foreground);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    .api-key-title {
      font-size: var(--text-lg);
      font-weight: 600;
      margin-bottom: 0.75rem;
    }

    .api-key-input {
      width: 100%;
      padding: 1.25rem;
      font-size: var(--text-lg);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-background);
      color: var(--color-foreground);
      margin-bottom: 0.5rem;
      min-height: 72px;
    }

    .api-key-help {
      font-size: var(--text-base);
      opacity: 0.8;
      line-height: 1.4;
    }

    .result-section {
      background: var(--color-card);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 2rem;
      box-shadow: var(--shadow);
    }

    .result-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .result-title {
      font-size: var(--text-2xl);
      font-weight: 600;
      color: var(--color-foreground);
    }

    .result-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-button {
      padding: 1rem 1.5rem;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-background);
      color: var(--color-foreground);
      font-size: var(--text-base);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      min-height: 60px;
      min-width: 60px;
    }

    .action-button:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    .autobiography-content {
      font-size: var(--text-lg);
      line-height: 1.8;
      color: var(--color-foreground);
      background: var(--color-muted);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 2rem;
      white-space: pre-wrap;
      max-height: 600px;
      overflow-y: auto;
    }

    .error-message {
      background: var(--color-destructive);
      color: var(--color-destructive-foreground);
      padding: 1rem;
      border-radius: var(--radius-lg);
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--color-muted-foreground);
    }

    .empty-state h3 {
      margin-bottom: 1rem;
    }

    @media (max-width: 480px) {
      :host {
        padding: 1rem 0.5rem;
      }

      .stats-grid {
        grid-template-columns: 1fr 1fr;
      }

      .generation-section,
      .result-section {
        padding: 1.5rem;
      }

      .result-actions {
        flex-direction: column;
      }

      .autobiography-content {
        font-size: var(--text-base);
        padding: 1.5rem;
      }
      
      .action-button {
        padding: 1.25rem;
        font-size: var(--text-lg);
        min-height: 72px;
      }
    }
  `;

  @state() chatgptApiKey = '';

  constructor() {
    super();
    this.loadSavedData();
  }

  private loadSavedData() {
    const savedApiKey = localStorage.getItem('chatgpt_api_key');
    if (savedApiKey) {
      this.chatgptApiKey = savedApiKey;
    }

    const savedAutobiography = localStorage.getItem('generated_autobiography');
    if (savedAutobiography) {
      this.generatedAutobiography = savedAutobiography;
      this.hasGeneratedBefore = true;
    }
  }

  private saveApiKey() {
    if (this.chatgptApiKey.trim()) {
      localStorage.setItem('chatgpt_api_key', this.chatgptApiKey.trim());
    }
  }

  private getStats() {
    const sessionsWithData = Object.values(this.sessionData).filter(data => data.conversations.length > 0);
    const totalConversations = sessionsWithData.reduce((sum, data) => sum + data.conversations.length, 0);
    const userMessages = sessionsWithData.reduce((sum, data) => 
      sum + data.conversations.filter(conv => conv.speaker === 'user').length, 0);
    const totalWords = sessionsWithData.reduce((sum, data) => 
      sum + data.conversations
        .filter(conv => conv.speaker === 'user')
        .reduce((wordSum, conv) => wordSum + conv.text.split(/\s+/).length, 0), 0);

    return {
      completedSessions: sessionsWithData.length,
      totalConversations,
      userMessages,
      totalWords
    };
  }

  private async generateAutobiography() {
    if (!this.chatgptApiKey.trim()) {
      this.error = 'ChatGPT API 키를 입력해주세요.';
      return;
    }

    const stats = this.getStats();
    if (stats.userMessages === 0) {
      this.error = '자서전을 생성할 대화 내용이 없습니다. 먼저 인터뷰를 진행해주세요.';
      return;
    }

    this.isGenerating = true;
    this.error = '';
    this.saveApiKey();

    try {
      // 모든 대화 내용을 시간순으로 정렬하여 수집
      const allConversations: Array<{
        sessionId: number;
        sessionTitle: string;
        speaker: string;
        text: string;
        timestamp: Date;
      }> = [];

      Object.values(this.sessionData).forEach(sessionData => {
        if (sessionData.conversations.length > 0) {
          const sessionConfig = interviewConfig.sessions[sessionData.sessionId];
          sessionData.conversations
            .filter(conv => conv.speaker === 'user') // 사용자 답변만 포함
            .forEach(conv => {
              allConversations.push({
                sessionId: sessionData.sessionId,
                sessionTitle: sessionConfig?.title || `세션 ${sessionData.sessionId}`,
                speaker: conv.speaker,
                text: conv.text,
                timestamp: new Date(conv.timestamp)
              });
            });
        }
      });

      // 시간순으로 정렬
      allConversations.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // 프롬프트 생성
      const interviewContent = allConversations.map(conv => 
        `[${conv.sessionTitle}] ${conv.text}`
      ).join('\n\n');

      const prompt = `너는 따뜻한 문체를 가진 자서전 작가야. 다음은 한 사람의 인생 인터뷰 기록이야. 이 기록을 바탕으로, 시간의 흐름에 따라 자연스럽게 연결되는 한 편의 자서전 초고를 1인칭 시점('나는 ~했다')으로 작성해 줘.

자서전 작성 가이드라인:
1. 시간 순서대로 인생의 여정을 서술해줘
2. 감정적이고 따뜻한 문체를 사용해줘
3. 구체적인 에피소드와 감정을 포함해줘
4. 각 인생 단계별로 장(章)으로 나누어 구성해줘
5. 전체적으로 일관된 스토리텔링을 유지해줘

인터뷰 기록:
${interviewContent}

위 내용을 바탕으로 자서전 초고를 작성해줘.`;

      // ChatGPT API 호출
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.chatgptApiKey.trim()}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API 오류: ${response.status}`);
      }

      const data = await response.json();
      this.generatedAutobiography = data.choices[0]?.message?.content || '자서전 생성에 실패했습니다.';
      this.hasGeneratedBefore = true;

      // 생성된 자서전 저장
      localStorage.setItem('generated_autobiography', this.generatedAutobiography);

    } catch (error) {
      console.error('자서전 생성 오류:', error);
      this.error = `자서전 생성 중 오류가 발생했습니다: ${error.message}`;
    } finally {
      this.isGenerating = false;
    }
  }

  private copyToClipboard() {
    navigator.clipboard.writeText(this.generatedAutobiography).then(() => {
      // 간단한 피드백 표시
      const button = this.shadowRoot?.querySelector('.copy-button') as HTMLElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = '복사됨!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    }).catch(err => {
      console.error('클립보드 복사 실패:', err);
      this.error = '클립보드 복사에 실패했습니다.';
    });
  }

  private downloadAutobiography() {
    const blob = new Blob([this.generatedAutobiography], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `나의_자서전_초고_${new Date().toLocaleDateString('ko-KR')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private clearGenerated() {
    if (confirm('생성된 자서전을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      this.generatedAutobiography = '';
      this.hasGeneratedBefore = false;
      localStorage.removeItem('generated_autobiography');
    }
  }

  render() {
    const stats = this.getStats();

    if (stats.completedSessions === 0) {
      return html`
        <div class="container">
          <div class="header">
            <h1>나의 자서전</h1>
            <p>소중한 이야기들을 하나의 아름다운 자서전으로 만들어보세요</p>
          </div>

          <div class="main-content">
            <div class="empty-state">
              <h3>아직 자서전을 생성할 수 없습니다</h3>
              <p>먼저 인터뷰 세션을 진행하여 이야기를 기록해주세요.</p>
            </div>
          </div>
        </div>
      `;
    }

    return html`
      <div class="container">
        <div class="header">
          <h1>나의 자서전</h1>
          <p>지금까지 기록된 ${stats.completedSessions}개 세션의 이야기를<br>하나의 아름다운 자서전으로 만들어보세요</p>
        </div>

        <div class="main-content">
          <div class="stats-section">
          <div class="stats-title">이야기 통계</div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">${stats.completedSessions}</div>
              <div class="stat-label">완료된 세션</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${stats.userMessages}</div>
              <div class="stat-label">나의 답변</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${stats.totalWords.toLocaleString()}</div>
              <div class="stat-label">총 단어 수</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${stats.totalConversations}</div>
              <div class="stat-label">전체 대화</div>
            </div>
          </div>
        </div>

        <div class="generation-section">
          <div class="generation-header">
            <h2>🤖 AI 자서전 초고 생성</h2>
            <p>ChatGPT를 사용하여 지금까지의 이야기를 자서전 초고로 변환합니다</p>
          </div>

          ${this.error ? html`
            <div class="error-message">${this.error}</div>
          ` : ''}

          <div class="api-key-section">
            <div class="api-key-title">ChatGPT API 키</div>
            <input
              type="password"
              class="api-key-input"
              placeholder="ChatGPT API 키를 입력하세요"
              .value=${this.chatgptApiKey}
              @input=${(e: InputEvent) => this.chatgptApiKey = (e.target as HTMLInputElement).value}
            />
            <div class="api-key-help">
              API 키는 OpenAI 웹사이트에서 발급받을 수 있습니다. 입력한 키는 브라우저에 안전하게 저장됩니다.
            </div>
          </div>

          <button 
            class="generate-button"
            @click=${this.generateAutobiography}
            ?disabled=${this.isGenerating || !this.chatgptApiKey.trim()}>
            ${this.isGenerating ? html`
              <div class="loading-spinner"></div>
              자서전 생성 중...
            ` : html`
              ✨ ${this.hasGeneratedBefore ? '자서전 다시 생성하기' : '자서전 생성하기'}
            `}
          </button>
        </div>

        ${this.generatedAutobiography ? html`
          <div class="result-section">
            <div class="result-header">
              <div class="result-title">📖 생성된 자서전 초고</div>
              <div class="result-actions">
                <button class="action-button copy-button" @click=${this.copyToClipboard}>
                  📋 복사
                </button>
                <button class="action-button" @click=${this.downloadAutobiography}>
                  💾 다운로드
                </button>
                <button class="action-button" @click=${this.clearGenerated}>
                  🗑️ 삭제
                </button>
              </div>
            </div>
            
            <div class="autobiography-content">
              ${this.generatedAutobiography}
            </div>
          </div>
        ` : ''}
        </div>
      </div>
    `;
  }
}