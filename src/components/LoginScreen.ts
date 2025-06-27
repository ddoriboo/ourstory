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
      padding: 2rem;
      background: var(--color-background);
    }

    .login-container {
      width: 100%;
      max-width: 400px;
    }

    .logo {
      text-align: center;
      margin-bottom: 3rem;
    }

    .logo h1 {
      color: var(--color-primary);
      font-size: 3rem;
      margin-bottom: 0.5rem;
    }

    .logo p {
      color: var(--color-muted-foreground);
      font-size: 1.25rem;
    }

    .form-card {
      background: var(--color-card);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 2rem;
      box-shadow: var(--shadow-lg);
    }

    .form-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .form-header h2 {
      margin-bottom: 0.5rem;
    }

    .form-header p {
      color: var(--color-muted-foreground);
      font-size: 1rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--color-foreground);
    }

    .form-input {
      width: 100%;
      padding: 1rem;
      font-size: 1.125rem;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-background);
      color: var(--color-foreground);
      box-shadow: var(--shadow-sm);
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: var(--shadow-md);
    }

    .submit-button {
      width: 100%;
      background: var(--color-primary);
      color: var(--color-primary-foreground);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 1.25rem 2rem;
      font-size: 1.25rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: var(--shadow);
      transition: all 0.2s;
      margin-bottom: 1rem;
    }

    .submit-button:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .submit-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .toggle-mode {
      text-align: center;
      margin-top: 1.5rem;
    }

    .toggle-link {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 600;
      font-size: 1.125rem;
    }

    .toggle-link:hover {
      text-decoration: underline;
    }

    .error-message {
      background: var(--color-destructive);
      color: var(--color-destructive-foreground);
      padding: 1rem;
      border-radius: var(--radius-lg);
      margin-bottom: 1rem;
      font-weight: 600;
    }

    @media (max-width: 480px) {
      :host {
        padding: 1rem;
      }

      .logo h1 {
        font-size: 2.5rem;
      }

      .logo p {
        font-size: 1.125rem;
      }

      .form-card {
        padding: 1.5rem;
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
                class="form-input"
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
                class="form-input"
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
                  class="form-input"
                  .value=${this.confirmPassword}
                  @input=${(e: InputEvent) => this.confirmPassword = (e.target as HTMLInputElement).value}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                />
              </div>
            ` : ''}

            <button type="submit" class="submit-button">
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