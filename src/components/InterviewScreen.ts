import {LitElement, css, html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {GoogleGenAI, LiveServerMessage, Modality, Session} from '@google/genai';
import {createBlob, decode, decodeAudioData} from '../../utils';
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

@customElement('interview-screen')
export class InterviewScreen extends LitElement {
  @property({ type: Number }) sessionId = 1;
  @property({ type: Object }) sessionData: SessionData | null = null;

  @state() isRecording = false;
  @state() status = '대화를 시작할 준비가 되었습니다';
  @state() error = '';
  @state() currentQuestionIndex = 0;
  @state() conversationHistory: Array<{speaker: 'ai' | 'user', text: string, timestamp: Date}> = [];
  @state() isSessionConnected = false;
  @state() isInitializing = false;

  private client: GoogleGenAI;
  private session: Session | null = null;
  private inputAudioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: 16000,
    latencyHint: 'interactive'
  });
  private outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: 24000,
    latencyHint: 'interactive'
  });
  @state() inputNode = this.inputAudioContext.createGain();
  @state() outputNode = this.outputAudioContext.createGain();
  private nextStartTime = 0;
  private mediaStream: MediaStream;
  private sourceNode: AudioBufferSourceNode;
  private scriptProcessorNode: ScriptProcessorNode;
  private sources = new Set<AudioBufferSourceNode>();
  private speechRecognition: any;
  private isTranscribing = false;

  static styles = css`
    :host {
      display: block;
      background: var(--color-background);
      min-height: 100vh;
    }

    .interview-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      max-width: 480px;
      margin: 0 auto;
      position: relative;
    }

    .header {
      background: var(--gradient-surface);
      border-bottom: 1px solid var(--color-border-light);
      padding: var(--spacing-4);
      position: sticky;
      top: 0;
      z-index: var(--z-sticky);
      box-shadow: var(--shadow-sm);
    }

    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--spacing-3);
    }

    .back-button {
      background: transparent;
      border: none;
      color: var(--color-primary);
      font-size: var(--text-2xl);
      cursor: pointer;
      padding: var(--spacing-3);
      border-radius: var(--radius);
      transition: all 0.2s ease-in-out;
      min-height: 48px;
      min-width: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .back-button:hover {
      background: var(--color-surface-hover);
      transform: translateX(-2px);
    }

    .session-title {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--color-text);
      text-align: center;
      flex: 1;
    }

    .connection-status {
      font-size: var(--text-sm);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      padding: var(--spacing-2) var(--spacing-3);
      border-radius: var(--radius-full);
      background: var(--color-surface);
    }

    .current-question {
      background: var(--color-surface);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius);
      padding: var(--spacing-4);
      margin-top: var(--spacing-3);
      box-shadow: var(--shadow-sm);
    }

    .question-label {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--color-text-muted);
      margin-bottom: var(--spacing-3);
    }

    .question-text {
      font-size: var(--text-base);
      font-weight: 500;
      color: var(--color-text);
      line-height: var(--leading-normal);
    }

    .conversation-area {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-4);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-4);
      background: var(--color-background);
    }

    .message {
      max-width: 85%;
      padding: var(--spacing-4) var(--spacing-6);
      border-radius: var(--radius-lg);
      font-size: var(--text-base);
      line-height: var(--leading-relaxed);
      box-shadow: var(--shadow-sm);
      position: relative;
    }

    .message.ai {
      align-self: flex-start;
      background: var(--gradient-surface);
      border: 1px solid var(--color-border-light);
      color: var(--color-text);
    }

    .message.user {
      align-self: flex-end;
      background: var(--gradient-primary);
      color: var(--color-text-inverse);
    }

    .message-header {
      font-size: var(--text-xs);
      font-weight: 600;
      opacity: 0.8;
      margin-bottom: var(--spacing-2);
    }

    .message-timestamp {
      font-size: var(--text-xs);
      opacity: 0.7;
      margin-top: var(--spacing-3);
    }

    .controls-area {
      background: var(--gradient-surface);
      border-top: 1px solid var(--color-border-light);
      padding: var(--spacing-16);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-4);
      box-shadow: var(--shadow-md);
    }

    .main-control {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-4);
    }

    .record-button {
      width: 120px;
      height: 120px;
      border-radius: var(--radius-full);
      border: none;
      background: var(--gradient-primary);
      color: var(--color-text-inverse);
      font-size: var(--text-5xl);
      cursor: pointer;
      box-shadow: var(--shadow-lg);
      transition: all 0.2s ease-in-out;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .record-button:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: var(--shadow-xl);
    }

    .record-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .record-button.recording {
      background: var(--color-error);
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { 
        transform: scale(1);
        box-shadow: var(--shadow-lg);
      }
      50% { 
        transform: scale(1.1);
        box-shadow: var(--shadow-xl);
      }
    }

    .secondary-controls {
      display: flex;
      gap: var(--spacing-3);
      flex-wrap: wrap;
      justify-content: center;
    }

    .status-message {
      text-align: center;
      font-size: var(--text-base);
      color: var(--color-text-secondary);
      font-weight: 500;
      max-width: 300px;
      line-height: var(--leading-normal);
    }

    .error-message {
      background: var(--color-error);
      color: var(--color-text-inverse);
      padding: var(--spacing-4);
      border-radius: var(--radius);
      margin: var(--spacing-4);
      font-weight: 600;
      text-align: center;
      font-size: var(--text-base);
      box-shadow: var(--shadow-sm);
    }

    @media (max-width: 480px) {
      .interview-container {
        max-width: 100%;
      }

      .header {
        padding: var(--spacing-3);
      }

      .session-title {
        font-size: var(--text-base);
      }

      .conversation-area {
        padding: var(--spacing-3);
      }

      .message {
        font-size: var(--text-sm);
        padding: var(--spacing-3) var(--spacing-4);
      }

      .record-button {
        width: 100px;
        height: 100px;
        font-size: var(--text-4xl);
      }

      .secondary-controls {
        gap: var(--spacing-2);
      }
    }
  `;

  constructor() {
    super();
    this.initSpeechRecognition();
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadConversationHistory();
    this.initClient();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanup();
  }

  private loadConversationHistory() {
    if (this.sessionData?.conversations) {
      this.conversationHistory = this.sessionData.conversations.map(conv => ({
        ...conv,
        timestamp: new Date(conv.timestamp)
      }));
    }
  }

  private initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = false;
      this.speechRecognition.lang = 'ko-KR';
      
      this.speechRecognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript;
            this.addToConversation('user', transcript);
          }
        }
      };
      
      this.speechRecognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };
      
      this.speechRecognition.onend = () => {
        this.isTranscribing = false;
      };
    }
  }

  private async initClient() {
    this.isInitializing = true;
    this.initAudio();

    const apiKey = process.env.GEMINI_API_KEY || 
                  process.env.VITE_GEMINI_API_KEY || 
                  (import.meta as any)?.env?.VITE_GEMINI_API_KEY ||
                  'AIzaSyBn158ydMQWCNHWxy2HSPHDZC3Snms2n0w';
    
    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
      this.updateError('API 키가 설정되지 않았습니다.');
      this.isInitializing = false;
      return;
    }

    this.client = new GoogleGenAI({
      apiKey: apiKey,
    });

    this.outputNode.connect(this.outputAudioContext.destination);
    await this.initSession();
    this.isInitializing = false;
  }

  private initAudio() {
    this.nextStartTime = this.outputAudioContext.currentTime;
  }

  private async initSession() {
    const model = 'gemini-2.5-flash-preview-native-audio-dialog';
    this.isSessionConnected = false;

    try {
      this.session = await this.client.live.connect({
        model: model,
        callbacks: {
          onopen: () => {
            this.isSessionConnected = true;
            this.updateStatus('AI가 인사를 준비하고 있습니다...');
            
            setTimeout(() => {
              if (this.session && this.isSessionConnected) {
                this.session.sendRealtimeInput({
                  text: "안녕하세요. 지금부터 인터뷰를 시작하겠습니다. 먼저 인사를 해주세요."
                });
                this.updateStatus('🎤 AI가 인사를 시작했습니다. 녹음 버튼을 눌러 응답해주세요.');
              }
            }, 1000);
          },
          onmessage: async (message: LiveServerMessage) => {
            const textPart = message.serverContent?.modelTurn?.parts?.find(
              part => part.text && part.text.trim()
            );
            if (textPart?.text) {
              this.addToConversation('ai', textPart.text);
            }

            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData;
            if (audio) {
              try {
                this.nextStartTime = Math.max(
                  this.nextStartTime,
                  this.outputAudioContext.currentTime + 0.01,
                );

                const audioBuffer = await decodeAudioData(
                  decode(audio.data),
                  this.outputAudioContext,
                  24000,
                  1,
                );
                
                const source = this.outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                
                const gainNode = this.outputAudioContext.createGain();
                gainNode.gain.value = 1.0;
                source.connect(gainNode);
                gainNode.connect(this.outputNode);
                
                source.addEventListener('ended', () => {
                  this.sources.delete(source);
                });

                source.start(this.nextStartTime);
                this.nextStartTime = this.nextStartTime + audioBuffer.duration;
                this.sources.add(source);
              } catch (audioError) {
                console.error('Audio processing error:', audioError);
              }
            }

            const interrupted = message.serverContent?.interrupted;
            if(interrupted) {
              for(const source of this.sources.values()) {
                source.stop();
                this.sources.delete(source);
              }
              this.nextStartTime = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            this.isSessionConnected = false;
            this.updateError(`연결 오류: ${e.message}`);
          },
          onclose: (e: CloseEvent) => {
            this.isSessionConnected = false;
            this.updateStatus(`연결이 종료되었습니다: ${e.reason}`);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Leda',
              }
            }
          },
          systemInstruction: {
            parts: [{
              text: interviewConfig.systemInstruction + this.getCurrentSessionPrompt()
            }]
          },
        },
      });
    } catch (e) {
      this.isSessionConnected = false;
      this.session = null;
      this.updateError(`세션 연결에 실패했습니다: ${e.message}`);
    }
  }

  private getCurrentSessionPrompt() {
    const currentSession = interviewConfig.sessions[this.sessionId];
    if (!currentSession) return '';
    
    const currentQuestion = currentSession.questions[this.currentQuestionIndex];
    
    return `

### 현재 세션: ${currentSession.title}

**현재 진행해야 할 질문 (${this.currentQuestionIndex + 1}/${currentSession.questions.length}):**
${currentQuestion}

**세션의 모든 질문 목록 (참고용):**
${currentSession.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

**핵심 진행 원칙:**
- 당신은 인터뷰를 주도하는 인터뷰어입니다. 어르신의 답변을 기다리되, 대화의 흐름을 적극적으로 이끌어야 합니다.
- 매 응답마다 충분한 길이(3-6문장)로 말하세요. 너무 짧게 답하지 마세요.
- 어르신이 침묵하거나 답변을 주저하시면 격려하고 다시 질문하세요.

**현재 진행 단계:**
${this.currentQuestionIndex === 0 ? '⭐ 세션 시작 단계' : `✨ 질문 ${this.currentQuestionIndex + 1} 단계`}

**즉시 해야 할 행동:**
${this.currentQuestionIndex === 0 ? 
  `1. 따뜻한 인사: "안녕하세요, 어르신! 어르신의 소중한 인생 이야기를 귀담아듣고 아름다운 자서전으로 기록해 드릴 '기억의 안내자'입니다. 오늘은 '${currentSession.title}'에 대해 이야기를 나눠보려 합니다. 편안한 마음으로 함께해 주시면 됩니다."
2. 첫 번째 질문 즉시 시작: "${currentQuestion}"` :
  `현재 질문에 집중: "${currentQuestion}"`
}

**대화 진행 가이드:**
- 어르신의 답변에 3-4문장으로 충분히 반응하고 공감하세요
- 1-2개의 구체적인 꼬리 질문으로 더 깊은 이야기를 이끌어내세요
- 한 질문당 5-10분 정도 충분히 대화한 후 다음으로 넘어가세요
- 자연스럽게 다음 질문으로 전환할 때: "정말 소중한 이야기 감사합니다. 이제 다음 질문을 드려볼게요."
`;
  }

  private updateStatus(msg: string) {
    this.status = msg;
  }

  private updateError(msg: string) {
    this.error = msg;
  }

  private addToConversation(speaker: 'ai' | 'user', text: string) {
    const newMessage = {
      speaker,
      text: text.trim(),
      timestamp: new Date()
    };
    
    this.conversationHistory = [...this.conversationHistory, newMessage];
    
    // 세션 데이터 업데이트
    this.dispatchEvent(new CustomEvent('session-update', {
      detail: {
        data: {
          conversations: this.conversationHistory,
          lastUpdated: new Date()
        }
      }
    }));
    
    // 대화가 추가된 후 스크롤을 맨 아래로
    this.updateComplete.then(() => {
      const conversationArea = this.shadowRoot?.querySelector('.conversation-area');
      if (conversationArea) {
        conversationArea.scrollTop = conversationArea.scrollHeight;
      }
    });
  }

  private async startRecording() {
    if (this.isRecording || !this.isSessionConnected) return;

    this.inputAudioContext.resume();
    this.updateStatus('마이크 권한을 요청하고 있습니다...');

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.updateStatus('녹음을 시작합니다...');

      this.sourceNode = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.inputNode);

      const bufferSize = 512;
      this.scriptProcessorNode = this.inputAudioContext.createScriptProcessor(bufferSize, 1, 1);

      this.scriptProcessorNode.onaudioprocess = (audioProcessingEvent) => {
        if (!this.isRecording || !this.isSessionValid()) return;
        
        const inputBuffer = audioProcessingEvent.inputBuffer;
        const pcmData = inputBuffer.getChannelData(0);

        try {
          this.session.sendRealtimeInput({media: createBlob(pcmData)});
        } catch (error) {
          console.error('오디오 전송 오류:', error);
          this.stopRecording();
          this.updateError('오디오 전송 중 오류가 발생했습니다.');
        }
      };

      this.sourceNode.connect(this.scriptProcessorNode);
      this.scriptProcessorNode.connect(this.inputAudioContext.destination);

      this.isRecording = true;
      this.updateStatus('🎤 녹음 중... 말씀해주세요.');
      
      if (this.speechRecognition && !this.isTranscribing) {
        try {
          this.speechRecognition.start();
          this.isTranscribing = true;
        } catch (e) {
          console.error('Speech recognition start error:', e);
        }
      }
    } catch (err) {
      console.error('Error starting recording:', err);
      this.updateError(`마이크 접근 오류: ${err.message}`);
      this.stopRecording();
    }
  }

  private stopRecording() {
    if (!this.isRecording) return;

    this.updateStatus('녹음을 중지합니다...');
    this.isRecording = false;

    if (this.scriptProcessorNode && this.sourceNode) {
      this.scriptProcessorNode.disconnect();
      this.sourceNode.disconnect();
    }

    this.scriptProcessorNode = null;
    this.sourceNode = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.updateStatus('녹음이 완료되었습니다. 다시 녹음하려면 버튼을 눌러주세요.');
    
    if (this.speechRecognition && this.isTranscribing) {
      try {
        this.speechRecognition.stop();
        this.isTranscribing = false;
      } catch (e) {
        console.error('Speech recognition stop error:', e);
      }
    }
  }

  private isSessionValid(): boolean {
    return this.session !== null && this.isSessionConnected;
  }

  private nextQuestion() {
    const currentSession = interviewConfig.sessions[this.sessionId];
    if (currentSession && this.currentQuestionIndex < currentSession.questions.length - 1) {
      this.currentQuestionIndex++;
      
      if (this.session && this.isSessionConnected) {
        const newQuestion = currentSession.questions[this.currentQuestionIndex];
        this.session.sendRealtimeInput({
          text: `이제 다음 질문으로 넘어가세요. 질문 ${this.currentQuestionIndex + 1}번: "${newQuestion}"을 어르신께 해주세요.`
        });
      }
    }
  }

  private previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      
      if (this.session && this.isSessionConnected) {
        const currentSession = interviewConfig.sessions[this.sessionId];
        const newQuestion = currentSession.questions[this.currentQuestionIndex];
        this.session.sendRealtimeInput({
          text: `이전 질문으로 돌아가겠습니다. 질문 ${this.currentQuestionIndex + 1}번: "${newQuestion}"에 대해 다시 이야기해보세요.`
        });
      }
    }
  }

  private async resetSession() {
    try {
      if (this.isRecording) {
        this.stopRecording();
      }
      
      if (this.session) {
        this.isSessionConnected = false;
        this.session.close();
        this.session = null;
      }
      
      this.updateStatus('세션을 재시작하는 중...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.initSession();
      
      this.updateStatus('세션이 재시작되었습니다.');
    } catch (e) {
      console.error('Reset error:', e);
      this.updateError(`세션 재시작에 실패했습니다: ${e.message}`);
    }
  }

  private goBack() {
    this.cleanup();
    this.dispatchEvent(new CustomEvent('navigate-back'));
  }

  private cleanup() {
    if (this.isRecording) {
      this.stopRecording();
    }
    
    if (this.session) {
      this.session.close();
      this.session = null;
    }
    
    this.isSessionConnected = false;
  }

  render() {
    const currentSession = interviewConfig.sessions[this.sessionId];
    const currentQuestion = currentSession?.questions[this.currentQuestionIndex];

    return html`
      <div class="interview-container">
        <div class="header">
          <div class="header-top">
            <button class="back-button" @click=${this.goBack}>
              ←
            </button>
            <div class="session-title">세션 ${this.sessionId}: ${currentSession?.title}</div>
            <div class="connection-status">
              <div class="status-dot ${this.isSessionConnected ? 'success' : 'error'}"></div>
              ${this.isSessionConnected ? '연결됨' : '연결 끊어짐'}
            </div>
          </div>

          ${currentQuestion ? html`
            <div class="current-question">
              <div class="question-label">질문 ${this.currentQuestionIndex + 1}/${currentSession.questions.length}</div>
              <div class="question-text">${currentQuestion}</div>
            </div>
          ` : ''}
        </div>

        ${this.error ? html`
          <div class="error-message">${this.error}</div>
        ` : ''}

        <div class="conversation-area">
          ${this.conversationHistory.map(message => html`
            <div class="message ${message.speaker}">
              <div class="message-header">
                ${message.speaker === 'ai' ? '🤖 기억의 안내자' : '👤 어르신'}
              </div>
              <div>${message.text}</div>
              <div class="message-timestamp">
                ${message.timestamp.toLocaleTimeString('ko-KR')}
              </div>
            </div>
          `)}
        </div>

        <div class="controls-area">
          <div class="main-control">
            <button
              class="record-button ${this.isRecording ? 'recording' : ''}"
              @click=${this.isRecording ? this.stopRecording : this.startRecording}
              ?disabled=${!this.isSessionConnected || this.isInitializing}>
              ${this.isRecording ? '⏹️' : '🎤'}
            </button>
          </div>

          <div class="secondary-controls">
            <button 
              class="btn btn-outline btn-sm"
              @click=${this.previousQuestion}
              ?disabled=${this.currentQuestionIndex <= 0}>
              이전 질문
            </button>
            <button 
              class="btn btn-ghost btn-sm"
              @click=${this.resetSession}
              ?disabled=${this.isRecording}>
              재시작
            </button>
            <button 
              class="btn btn-outline btn-sm"
              @click=${this.nextQuestion}
              ?disabled=${this.currentQuestionIndex >= (currentSession?.questions.length || 1) - 1}>
              다음 질문
            </button>
          </div>

          <div class="status-message">
            ${this.isInitializing ? html`
              <div style="display: flex; align-items: center; gap: var(--spacing-sm); justify-content: center;">
                <div class="spinner"></div>
                초기화 중...
              </div>
            ` : this.status}
          </div>
        </div>
      </div>
    `;
  }
}