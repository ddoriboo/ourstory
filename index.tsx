/* tslint:disable */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {GoogleGenAI, LiveServerMessage, Modality, Session} from '@google/genai';
import {LitElement, css, html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {createBlob, decode, decodeAudioData} from './utils';
import './visual-3d';
import {interviewConfig} from './interviewConfig';

@customElement('gdm-live-audio')
export class GdmLiveAudio extends LitElement {
  @state() isRecording = false;
  @state() status = '';
  @state() error = '';
  @state() currentSessionId = 1;
  @state() currentQuestionIndex = 0;
  @state() conversationHistory: {speaker: 'ai' | 'user', text: string, timestamp: Date}[] = [];
  @state() isSessionConnected = false;

  private client: GoogleGenAI;
  private session: Session | null = null;
  private inputAudioContext = new (window.AudioContext ||
    window.webkitAudioContext)({
      sampleRate: 16000,
      latencyHint: 'interactive'
    });
  private outputAudioContext = new (window.AudioContext ||
    window.webkitAudioContext)({
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
    #status {
      position: absolute;
      bottom: 5vh;
      left: 0;
      right: 0;
      z-index: 10;
      text-align: center;
    }

    .session-info {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 10;
      color: white;
      background: rgba(0, 0, 0, 0.5);
      padding: 20px;
      border-radius: 10px;
      max-width: 400px;
    }

    .session-info h3 {
      margin: 0 0 10px 0;
      font-size: 18px;
    }

    .session-info p {
      margin: 0;
      font-size: 14px;
      opacity: 0.8;
    }

    .session-controls {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 10;
      display: flex;
      gap: 10px;
    }

    .session-controls button {
      padding: 8px 16px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }

    .session-controls button:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .session-controls button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .conversation-panel {
      position: fixed;
      left: 20px;
      bottom: 20vh;
      top: 120px;
      width: 400px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      border-radius: 10px;
      padding: 20px;
      overflow-y: auto;
      z-index: 5;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .conversation-panel h4 {
      margin: 0 0 15px 0;
      color: #4CAF50;
      font-size: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      padding-bottom: 10px;
    }

    .message {
      margin-bottom: 15px;
      padding: 10px;
      border-radius: 8px;
      line-height: 1.4;
      font-size: 14px;
    }

    .message.ai {
      background: rgba(76, 175, 80, 0.2);
      border-left: 3px solid #4CAF50;
    }

    .message.user {
      background: rgba(33, 150, 243, 0.2);
      border-left: 3px solid #2196F3;
    }

    .message-header {
      font-size: 12px;
      opacity: 0.7;
      margin-bottom: 5px;
      font-weight: bold;
    }

    .message-text {
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .timestamp {
      font-size: 10px;
      opacity: 0.5;
      margin-top: 5px;
    }

    .controls {
      z-index: 10;
      position: absolute;
      bottom: 10vh;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 10px;

      button {
        outline: none;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.1);
        width: 64px;
        height: 64px;
        cursor: pointer;
        font-size: 24px;
        padding: 0;
        margin: 0;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }

      button[disabled] {
        display: none;
      }
    }
  `;

  constructor() {
    super();
    this.initClient();
    this.initSpeechRecognition();
  }

  private initAudio() {
    this.nextStartTime = this.outputAudioContext.currentTime;
  }

  private initSpeechRecognition() {
    // Web Speech API 지원 확인
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
            console.log('사용자 음성 인식:', transcript);
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
    } else {
      console.warn('Web Speech API not supported');
    }
  }

  private async initClient() {
    this.initAudio();

    // 다양한 방법으로 API 키 확인
    const apiKey = process.env.GEMINI_API_KEY || 
                  process.env.VITE_GEMINI_API_KEY || 
                  (import.meta as any)?.env?.VITE_GEMINI_API_KEY ||
                  'AIzaSyBn158ydMQWCNHWxy2HSPHDZC3Snms2n0w'; // 새로운 API 키로 폴백
    
    console.log('환경 변수들:', {
      'process.env.GEMINI_API_KEY': process.env.GEMINI_API_KEY ? 'defined' : 'undefined',
      'process.env.VITE_GEMINI_API_KEY': process.env.VITE_GEMINI_API_KEY ? 'defined' : 'undefined',
      'import.meta.env.VITE_GEMINI_API_KEY': (import.meta as any)?.env?.VITE_GEMINI_API_KEY ? 'defined' : 'undefined',
      'final apiKey': apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined'
    });
    
    if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
      this.updateError('API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요.');
      return;
    }

    this.client = new GoogleGenAI({
      apiKey: apiKey,
    });

    this.outputNode.connect(this.outputAudioContext.destination);

    this.initSession();
  }

  private async initSession() {
    const model = 'gemini-2.5-flash-preview-native-audio-dialog';
    
    // 초기화 시 연결 상태를 false로 설정
    this.isSessionConnected = false;

    try {
      this.session = await this.client.live.connect({
        model: model,
        callbacks: {
          onopen: () => {
            this.isSessionConnected = true;
            this.updateStatus('🎤 녹음 버튼을 눌러 대화를 시작하세요.');
          },
          onmessage: async (message: LiveServerMessage) => {
            // 텍스트 응답 처리
            const textPart = message.serverContent?.modelTurn?.parts?.find(
              part => part.text && part.text.trim()
            );
            if (textPart?.text) {
              this.addToConversation('ai', textPart.text);
            }

            // 오디오 응답 처리
            const audio =
              message.serverContent?.modelTurn?.parts[0]?.inlineData;

            if (audio) {
              try {
                // 더 부드러운 오디오 재생을 위한 시간 계산
                this.nextStartTime = Math.max(
                  this.nextStartTime,
                  this.outputAudioContext.currentTime + 0.01, // 약간의 버퍼 시간 추가
                );

                const audioBuffer = await decodeAudioData(
                  decode(audio.data),
                  this.outputAudioContext,
                  24000,
                  1,
                );
                
                const source = this.outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                
                // 더 나은 오디오 품질을 위한 gain 조정
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
            console.error('Session error:', e);
          },
          onclose: (e: CloseEvent) => {
            this.isSessionConnected = false;
            this.updateStatus(`연결이 종료되었습니다: ${e.reason}`);
            console.log('Session closed:', e.reason);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO, Modality.TEXT],
          systemInstruction: interviewConfig.systemInstruction + this.getCurrentSessionPrompt(),
          speechConfig: {
            voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Leda'}},
            languageCode: 'ko-KR'
          },
        },
      });
    } catch (e) {
      this.isSessionConnected = false;
      this.session = null;
      console.error('세션 초기화 실패:', e);
      this.updateError(`세션 연결에 실패했습니다: ${e.message}`);
    }
  }

  private updateStatus(msg: string) {
    this.status = msg;
  }

  private updateError(msg: string) {
    this.error = msg;
  }

  private async startRecording() {
    if (this.isRecording) {
      return;
    }

    this.inputAudioContext.resume();

    this.updateStatus('Requesting microphone access...');

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.updateStatus('Microphone access granted. Starting capture...');

      this.sourceNode = this.inputAudioContext.createMediaStreamSource(
        this.mediaStream,
      );
      this.sourceNode.connect(this.inputNode);

      const bufferSize = 512; // 더 큰 버퍼 크기로 안정성 향상
      this.scriptProcessorNode = this.inputAudioContext.createScriptProcessor(
        bufferSize,
        1,
        1,
      );

      this.scriptProcessorNode.onaudioprocess = (audioProcessingEvent) => {
        if (!this.isRecording) return;
        
        // 세션 유효성 검사
        if (!this.isSessionValid()) {
          console.warn('세션이 유효하지 않아 오디오 전송을 중단합니다.');
          this.stopRecording();
          return;
        }

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
      this.updateStatus('🔴 Recording... Capturing PCM chunks.');
      
      // 음성 인식 시작
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
      this.updateStatus(`Error: ${err.message}`);
      this.stopRecording();
    }
  }

  private getCurrentSessionPrompt() {
    const currentSession = interviewConfig.sessions[this.currentSessionId];
    if (!currentSession) return '';
    
    return `\n\n### 현재 세션: ${currentSession.title}\n\n` +
           `현재 진행 중인 세션의 주요 질문들:\n` +
           currentSession.questions.map((q, i) => `${i + 1}. ${q}`).join('\n') +
           `\n\n**중요:** 세션이 시작되면 즉시 다음과 같이 인사해주세요: "안녕하세요, 어르신의 소중한 인생 이야기를 귀담아듣고 아름다운 자서전으로 기록해 드릴 '기억의 안내자'입니다. 제가 곁에서 길잡이가 되어드릴 테니, 그저 오랜 친구에게 이야기하듯 편안한 마음으로 함께해 주시면 됩니다. 오늘은 '${currentSession.title}'에 대해 이야기를 나눠보고자 합니다. 준비되셨을 때 편하게 말씀해주세요." 그리고 첫 번째 질문부터 시작해주세요.`;
  }



  private isSessionValid(): boolean {
    return this.session !== null && this.isSessionConnected;
  }

  private addToConversation(speaker: 'ai' | 'user', text: string) {
    this.conversationHistory = [
      ...this.conversationHistory,
      {
        speaker,
        text: text.trim(),
        timestamp: new Date()
      }
    ];
    
    // 대화가 추가된 후 스크롤을 맨 아래로
    this.updateComplete.then(() => {
      const conversationPanel = this.shadowRoot?.querySelector('.conversation-panel');
      if (conversationPanel) {
        conversationPanel.scrollTop = conversationPanel.scrollHeight;
      }
    });
  }

  private stopRecording() {
    if (!this.isRecording && !this.mediaStream && !this.inputAudioContext)
      return;

    this.updateStatus('Stopping recording...');

    this.isRecording = false;

    if (this.scriptProcessorNode && this.sourceNode && this.inputAudioContext) {
      this.scriptProcessorNode.disconnect();
      this.sourceNode.disconnect();
    }

    this.scriptProcessorNode = null;
    this.sourceNode = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.updateStatus('Recording stopped. Click Start to begin again.');
    
    // 음성 인식 중지
    if (this.speechRecognition && this.isTranscribing) {
      try {
        this.speechRecognition.stop();
        this.isTranscribing = false;
      } catch (e) {
        console.error('Speech recognition stop error:', e);
      }
    }
  }

  private async reset() {
    try {
      // 먼저 녹음 중지
      if (this.isRecording) {
        this.stopRecording();
      }
      
      // 세션 닫기
      if (this.session) {
        this.isSessionConnected = false;
        this.session.close();
        this.session = null;
      }
      
      this.conversationHistory = []; // 대화 기록 초기화
      this.updateStatus('세션을 재시작하는 중...');
      
      // 잠시 대기 후 재연결
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.initSession();
      
      this.updateStatus('세션이 재시작되었습니다.');
    } catch (e) {
      console.error('Reset error:', e);
      this.updateError(`세션 재시작에 실패했습니다: ${e.message}`);
    }
  }

  private async nextSession() {
    if (this.currentSessionId < 12) {
      this.currentSessionId++;
      this.currentQuestionIndex = 0;
      this.updateStatus(`세션 ${this.currentSessionId}로 이동 중...`);
      await this.reset();
      this.updateStatus(`세션 ${this.currentSessionId}: ${interviewConfig.sessions[this.currentSessionId]?.title || ''}`);
    }
  }

  private async previousSession() {
    if (this.currentSessionId > 1) {
      this.currentSessionId--;
      this.currentQuestionIndex = 0;
      this.updateStatus(`세션 ${this.currentSessionId}로 이동 중...`);
      await this.reset();
      this.updateStatus(`세션 ${this.currentSessionId}: ${interviewConfig.sessions[this.currentSessionId]?.title || ''}`);
    }
  }

  render() {
    const currentSession = interviewConfig.sessions[this.currentSessionId];
    
    return html`
      <div>
        <div class="session-info">
          <h3>세션 ${this.currentSessionId}: ${currentSession?.title || ''}</h3>
          <p>질문 ${this.currentQuestionIndex + 1} / ${currentSession?.questions.length || 0}</p>
          <p style="font-size: 12px; color: ${this.isSessionConnected ? '#4CAF50' : '#f44336'};">
            ${this.isSessionConnected ? '🟢 연결됨' : '🔴 연결 끊어짐'}
          </p>
        </div>
        
        <div class="session-controls">
          <button @click=${this.previousSession} ?disabled=${this.currentSessionId <= 1}>
            이전 세션
          </button>
          <button @click=${this.nextSession} ?disabled=${this.currentSessionId >= 12}>
            다음 세션
          </button>
        </div>
        
        <div class="conversation-panel">
          <h4>🗣️ 대화 기록</h4>
          ${this.conversationHistory.map(message => html`
            <div class="message ${message.speaker}">
              <div class="message-header">
                ${message.speaker === 'ai' ? '🤖 기억의 안내자' : '👤 어르신'}
              </div>
              <div class="message-text">${message.text}</div>
              <div class="timestamp">
                ${message.timestamp.toLocaleTimeString('ko-KR')}
              </div>
            </div>
          `)}
        </div>
        
        <div class="controls">
          <button
            id="resetButton"
            @click=${this.reset}
            ?disabled=${this.isRecording}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="40px"
              viewBox="0 -960 960 960"
              width="40px"
              fill="#ffffff">
              <path
                d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
            </svg>
          </button>
          <button
            id="startButton"
            @click=${this.startRecording}
            ?disabled=${this.isRecording || !this.isSessionConnected}>
            <svg
              viewBox="0 0 100 100"
              width="32px"
              height="32px"
              fill="#c80000"
              xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="50" />
            </svg>
          </button>
          <button
            id="stopButton"
            @click=${this.stopRecording}
            ?disabled=${!this.isRecording}>
            <svg
              viewBox="0 0 100 100"
              width="32px"
              height="32px"
              fill="#000000"
              xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="100" height="100" rx="15" />
            </svg>
          </button>
        </div>

        <div id="status"> ${this.error || this.status} </div>
        <gdm-live-audio-visuals-3d
          .inputNode=${this.inputNode}
          .outputNode=${this.outputNode}></gdm-live-audio-visuals-3d>
      </div>
    `;
  }
}
