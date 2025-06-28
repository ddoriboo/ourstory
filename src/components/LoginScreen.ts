import {LitElement, css, html} from 'lit';
import {customElement, state} from 'lit/decorators.js';

@customElement('login-screen')
export class LoginScreen extends LitElement {
  @state() isLogin = true;
  @state() username = '';
  @state() password = '';
  @state() confirmPassword = '';
  @state() error = '';

  static styles = css`
    :host {
      display: block;
      height: 100%;
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      overflow: hidden;
    }

    .container {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: var(--spacing-4);
      position: relative;
    }

    .logo-section {
      text-align: center;
      margin-bottom: var(--spacing-8);
      color: white;
    }

    .logo-section h1 {
      font-size: var(--text-3xl);
      font-weight: 700;
      margin: 0 0 var(--spacing-2) 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .logo-section p {
      font-size: var(--text-lg);
      opacity: 0.9;
      margin: 0;
      line-height: var(--leading-relaxed);
    }

    .form-container {
      width: 100%;
      max-width: 360px;
      background: var(--color-background);
      border-radius: var(--radius-xl);
      padding: var(--spacing-6);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      margin-bottom: var(--spacing-4);
    }

    .form-header {
      text-align: center;
      margin-bottom: var(--spacing-6);
    }

    .form-header h2 {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--color-text);
      margin: 0 0 var(--spacing-2) 0;
    }

    .form-header p {
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
      margin: 0;
    }

    .form-toggle {
      display: flex;
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: var(--spacing-1);
      margin-bottom: var(--spacing-6);
    }

    .toggle-button {
      flex: 1;
      padding: var(--spacing-2) var(--spacing-3);
      text-align: center;
      border: none;
      background: transparent;
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
      font-weight: 500;
      border-radius: var(--radius);
      transition: all 0.2s ease-in-out;
      cursor: pointer;
    }

    .toggle-button.active {
      background: var(--color-background);
      color: var(--color-primary);
      box-shadow: var(--shadow-sm);
    }

    .form-group {
      margin-bottom: var(--spacing-4);
    }

    .form-group label {
      display: block;
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--color-text);
      margin-bottom: var(--spacing-1);
    }

    .form-group input {
      width: 100%;
      padding: var(--spacing-3);
      font-size: var(--text-base);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-background);
      color: var(--color-text);
      transition: all 0.2s ease-in-out;
      min-height: 48px;
      box-sizing: border-box;
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .error-message {
      color: var(--color-error);
      font-size: var(--text-sm);
      margin-top: var(--spacing-2);
      text-align: center;
      padding: var(--spacing-2);
      background: rgba(220, 38, 38, 0.1);
      border-radius: var(--radius);
    }

    .submit-button {
      width: 100%;
      background: var(--gradient-primary);
      color: white;
      border: none;
      padding: var(--spacing-4);
      font-size: var(--text-base);
      font-weight: 600;
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      min-height: 56px;
      margin-top: var(--spacing-2);
    }

    .submit-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 16px rgba(37, 99, 235, 0.3);
    }

    .submit-button:active {
      transform: translateY(0);
    }

    .bottom-section {
      position: absolute;
      bottom: var(--spacing-4);
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      color: rgba(255, 255, 255, 0.8);
      font-size: var(--text-xs);
    }

    /* 작은 화면 최적화 */
    @media (max-width: 480px) {
      .container {
        padding: var(--spacing-3);
      }
      
      .form-container {
        padding: var(--spacing-4);
      }
      
      .logo-section {
        margin-bottom: var(--spacing-6);
      }
      
      .logo-section h1 {
        font-size: var(--text-2xl);
      }
    }

    /* 매우 작은 화면 */
    @media (max-height: 600px) {
      .container {
        justify-content: flex-start;
        padding-top: var(--spacing-8);
      }
      
      .logo-section {
        margin-bottom: var(--spacing-4);
      }
      
      .bottom-section {
        position: relative;
        bottom: auto;
        left: auto;
        transform: none;
        margin-top: var(--spacing-4);
      }
    }
  `;

  private async handleSubmit(e: Event) {
    e.preventDefault();
    this.error = '';

    if (!this.username.trim() || !this.password.trim()) {
      this.error = '사용자명과 비밀번호를 입력해주세요.';
      return;
    }

    if (!this.isLogin && this.password !== this.confirmPassword) {
      this.error = '비밀번호가 일치하지 않습니다.';
      return;
    }

    try {
      const { apiService } = await import('../services/api');
      
      if (this.isLogin) {
        await apiService.login(this.username, this.password);
      } else {
        await apiService.register(this.username, this.password);
      }

      // 로그인 성공 이벤트 발생
      this.dispatchEvent(new CustomEvent('user-login', {
        detail: {
          id: 1,
          username: this.username,
          full_name: this.username
        },
        bubbles: true,
        composed: true
      }));
    } catch (error: any) {
      this.error = error.message || '로그인에 실패했습니다.';
    }
  }

  private toggleMode() {
    this.isLogin = !this.isLogin;
    this.error = '';
    this.confirmPassword = '';
  }

  render() {
    return html`
      <div class="container">
        <div class="logo-section">
          <h1>우리의 이야기</h1>
          <p>당신의 소중한 추억을 간직하세요</p>
        </div>

        <div class="form-container">
          <div class="form-header">
            <h2>${this.isLogin ? '로그인' : '회원가입'}</h2>
            <p>${this.isLogin ? '계정에 로그인하세요' : '새 계정을 만들어보세요'}</p>
          </div>

          <div class="form-toggle">
            <button 
              class="toggle-button ${this.isLogin ? 'active' : ''}"
              @click=${() => this.isLogin || this.toggleMode()}>
              로그인
            </button>
            <button 
              class="toggle-button ${!this.isLogin ? 'active' : ''}"
              @click=${() => !this.isLogin || this.toggleMode()}>
              회원가입
            </button>
          </div>

          <form @submit=${this.handleSubmit}>
            <div class="form-group">
              <label for="username">사용자명</label>
              <input
                type="text"
                id="username"
                .value=${this.username}
                @input=${(e: Event) => this.username = (e.target as HTMLInputElement).value}
                placeholder="사용자명을 입력하세요"
                required
              />
            </div>

            <div class="form-group">
              <label for="password">비밀번호</label>
              <input
                type="password"
                id="password"
                .value=${this.password}
                @input=${(e: Event) => this.password = (e.target as HTMLInputElement).value}
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            ${!this.isLogin ? html`
              <div class="form-group">
                <label for="confirmPassword">비밀번호 확인</label>
                <input
                  type="password"
                  id="confirmPassword"
                  .value=${this.confirmPassword}
                  @input=${(e: Event) => this.confirmPassword = (e.target as HTMLInputElement).value}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                />
              </div>
            ` : ''}

            ${this.error ? html`
              <div class="error-message">${this.error}</div>
            ` : ''}

            <button type="submit" class="submit-button">
              ${this.isLogin ? '로그인' : '회원가입'}
            </button>
          </form>
        </div>

        <div class="bottom-section">
          © 2024 우리의 이야기. 모든 권리 보유.
        </div>
      </div>
    `;
  }
}