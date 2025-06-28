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
      padding: var(--spacing-20);
      background: var(--color-background);
    }

    .login-container {
      width: 100%;
      max-width: 400px;
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
    }

    .logo p {
      color: var(--color-text-secondary);
      font-size: var(--text-lg);
      line-height: var(--leading-relaxed);
    }

    .form-card {
      background: var(--gradient-surface);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-lg);
      padding: var(--spacing-20);
      box-shadow: var(--shadow-lg);
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
    }

    .form-header p {
      color: var(--color-text-secondary);
      font-size: var(--text-base);
      line-height: var(--leading-normal);
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
    }

    .toggle-link:hover {
      text-decoration: underline;
      color: var(--color-primary-dark);
    }

    @media (max-width: 480px) {
      :host {
        padding: var(--spacing-4);
      }

      .logo h1 {
        font-size: var(--text-2xl);
      }

      .logo p {
        font-size: var(--text-base);
      }

      .form-card {
        padding: var(--spacing-16);
      }
    }
  `;

  private handleSubmit(e: Event) {
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

    // 간단한 로컬스토리지 기반 인증
    if (this.isLogin) {
      const savedUser = localStorage.getItem(`user_${this.username}`);
      if (!savedUser) {
        this.error = '존재하지 않는 계정입니다.';
        return;
      }

      const userData = JSON.parse(savedUser);
      if (userData.password !== this.password) {
        this.error = '비밀번호가 올바르지 않습니다.';
        return;
      }

      // 로그인 성공
      this.dispatchEvent(new CustomEvent('user-login', {
        detail: { id: this.username, username: this.username }
      }));
    } else {
      // 회원가입
      const existingUser = localStorage.getItem(`user_${this.username}`);
      if (existingUser) {
        this.error = '이미 존재하는 아이디입니다.';
        return;
      }

      // 사용자 저장
      localStorage.setItem(`user_${this.username}`, JSON.stringify({
        username: this.username,
        password: this.password,
        createdAt: new Date().toISOString()
      }));

      // 자동 로그인
      this.dispatchEvent(new CustomEvent('user-login', {
        detail: { id: this.username, username: this.username }
      }));
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