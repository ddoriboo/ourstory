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
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--color-background);
      padding: var(--spacing-4);
      width: 100%;
    }

    .login-container {
      width: 100%;
      max-width: 1200px;
      padding: var(--spacing-6);
    }

    .logo {
      text-align: center;
      margin-bottom: var(--spacing-24);
    }

    .logo h1 {
      color: var(--color-primary);
      font-size: var(--text-3xl);
      margin-bottom: var(--spacing-3);
      font-weight: 700;
      word-break: keep-all;
      white-space: nowrap;
    }

    .logo p {
      color: var(--color-text-secondary);
      font-size: var(--text-lg);
      line-height: var(--leading-relaxed);
      word-break: keep-all;
      white-space: normal;
    }

    .form-card {
      background: var(--gradient-surface);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-lg);
      padding: var(--spacing-20);
      box-shadow: var(--shadow-lg);
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
    }

    .form-header {
      text-align: center;
      margin-bottom: var(--spacing-20);
    }

    .form-header h2 {
      font-size: var(--text-2xl);
      margin-bottom: var(--spacing-3);
      color: var(--color-text);
      font-weight: 600;
      word-break: keep-all;
      white-space: normal;
    }

    .form-header p {
      color: var(--color-text-secondary);
      font-size: var(--text-base);
      line-height: var(--leading-normal);
      word-break: keep-all;
      white-space: normal;
    }

    .form-group {
      margin-bottom: var(--spacing-16);
    }

    .form-label {
      display: block;
      font-size: var(--text-base);
      font-weight: 600;
      margin-bottom: var(--spacing-3);
      color: var(--color-text);
    }

    .error-message {
      background: var(--color-error);
      color: var(--color-text-inverse);
      padding: var(--spacing-4);
      border-radius: var(--radius);
      margin-bottom: var(--spacing-4);
      font-weight: 600;
      font-size: var(--text-base);
      box-shadow: var(--shadow-sm);
    }

    .toggle-mode {
      text-align: center;
      margin-top: var(--spacing-16);
      color: var(--color-text-secondary);
      font-size: var(--text-base);
    }

    .toggle-link {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 600;
      font-size: var(--text-base);
      transition: all 0.2s ease-in-out;
      display: inline-block;
      padding: var(--spacing-3) var(--spacing-4);
      min-height: 48px;
      min-width: 48px;
      border-radius: var(--radius);
      line-height: 1;
      text-align: center;
      border: 2px solid transparent;
    }

    .toggle-link:hover {
      text-decoration: underline;
      color: var(--color-primary-dark);
      background: var(--color-surface-hover);
      border-color: var(--color-border);
    }
    
    .toggle-link:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3);
      background: var(--color-surface-hover);
    }

    @media (max-width: 768px) {
      .form-card {
        max-width: 100%;
        padding: var(--spacing-16);
      }
    }

    @media (max-width: 480px) {
      :host {
        padding: var(--spacing-3);
      }

      .login-container {
        padding: var(--spacing-4);
      }

      .logo h1 {
        font-size: var(--text-2xl);
        white-space: normal;
      }

      .logo p {
        font-size: var(--text-lg);
        white-space: normal;
      }

      .form-card {
        max-width: 100%;
        padding: var(--spacing-12);
      }
    }
  `;

  private async handleSubmit(e: Event) {
    e.preventDefault();
    this.error = '';

    if (!this.username.trim() || !this.password.trim()) {
      this.error = '아이디와 비밀번호를 모두 입력해주세요.';
      return;
    }

    if (!this.isLogin && this.password !== this.confirmPassword) {
      this.error = '비밀번호가 일치하지 않습니다.';
      return;
    }

    if (!this.isLogin && this.password.length < 4) {
      this.error = '비밀번호는 4자 이상이어야 합니다.';
      return;
    }

    try {
      const { apiService } = await import('../services/api');
      
      if (this.isLogin) {
        // 로그인
        const response = await apiService.login({
          username: this.username,
          password: this.password
        });

        // 로그인 성공
        this.dispatchEvent(new CustomEvent('user-login', {
          detail: response.user
        }));
      } else {
        // 회원가입
        const response = await apiService.register({
          username: this.username,
          password: this.password
        });

        // 회원가입 후 자동 로그인
        this.dispatchEvent(new CustomEvent('user-login', {
          detail: response.user
        }));
      }
    } catch (error) {
      console.error('인증 오류:', error);
      this.error = error.message || '로그인 중 오류가 발생했습니다.';
    }
  }

  private toggleMode() {
    this.isLogin = !this.isLogin;
    this.error = '';
    this.password = '';
    this.confirmPassword = '';
  }

  render() {
    return html`
      <div class="login-container">
        <div class="logo">
          <h1>📖 우리 이야기</h1>
          <p>어르신의 소중한 인생 이야기를<br>아름다운 자서전으로</p>
        </div>

        <div class="form-card">
          <div class="form-header">
            <h2>${this.isLogin ? '로그인' : '회원가입'}</h2>
            <p>${this.isLogin ? '계정에 로그인하여 이야기를 시작하세요' : '새 계정을 만들어 시작하세요'}</p>
          </div>

          ${this.error ? html`
            <div class="error-message">${this.error}</div>
          ` : ''}

          <form @submit=${this.handleSubmit}>
            <div class="form-group">
              <label class="form-label">아이디</label>
              <input
                type="text"
                class="input"
                .value=${this.username}
                @input=${(e: InputEvent) => this.username = (e.target as HTMLInputElement).value}
                placeholder="아이디를 입력하세요"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">비밀번호</label>
              <input
                type="password"
                class="input"
                .value=${this.password}
                @input=${(e: InputEvent) => this.password = (e.target as HTMLInputElement).value}
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            ${!this.isLogin ? html`
              <div class="form-group">
                <label class="form-label">비밀번호 확인</label>
                <input
                  type="password"
                  class="input"
                  .value=${this.confirmPassword}
                  @input=${(e: InputEvent) => this.confirmPassword = (e.target as HTMLInputElement).value}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                />
              </div>
            ` : ''}

            <button type="submit" class="btn btn-primary btn-full btn-lg">
              ${this.isLogin ? '로그인' : '회원가입'}
            </button>
          </form>

          <div class="toggle-mode">
            ${this.isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
            <a href="#" class="toggle-link" @click=${(e: Event) => { e.preventDefault(); this.toggleMode(); }}>
              ${this.isLogin ? '회원가입' : '로그인'}
            </a>
          </div>
        </div>
      </div>
    `;
  }
}