

/* ══ STORAGE HELPERS ══ */
const DB_KEY = 'safehome_users';
const SESSION_KEY = 'safehome_session';

function getUsers() {
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || []; }
  catch { return []; }
}
function saveUsers(users) {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}
function saveSession(user) {
  const s = { email: user.email, firstname: user.firstname, lastname: user.lastname, ts: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  return s;
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/* ══ VALIDATION HELPERS ══ */
function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}
function isValidPhone(v) {
  if (!v.trim()) return true; // optional
  return /^[\+\d\s\-\(\)]{8,20}$/.test(v.trim());
}

// Password rules
const RULES = {
  length:  v => v.length >= 8,
  upper:   v => /[A-Z]/.test(v),
  number:  v => /\d/.test(v),
  special: v => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(v),
};

function getPasswordScore(pw) {
  return Object.values(RULES).filter(fn => fn(pw)).length;
}

/* ══ PASSWORD STRENGTH UI ══ */
function checkPasswordStrength(pw) {
  const bars   = [1,2,3,4].map(i => document.getElementById('pw-b' + i));
  const label  = document.getElementById('pw-label');
  const score  = getPasswordScore(pw);

  const states = [
    { cls: '', text: 'Entrez un mot de passe' },
    { cls: 'active-weak',   text: 'Très faible 😟' },
    { cls: 'active-fair',   text: 'Faible' },
    { cls: 'active-good',   text: 'Correct' },
    { cls: 'active-strong', text: 'Fort 💪' },
  ];

  bars.forEach((b, i) => {
    b.className = 'pw-bar';
    if (pw.length > 0 && i < score) b.classList.add(states[score].cls);
  });
  if (label) label.textContent = pw.length === 0 ? states[0].text : states[score].text;
  if (label) label.style.color = ['', 'var(--bad)', 'var(--medium)', '#eab308', 'var(--good)'][pw.length ? score : 0];

  // Update rule indicators
  const ruleMap = { length: 'rule-length', upper: 'rule-upper', number: 'rule-number', special: 'rule-special' };
  Object.entries(ruleMap).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('ok', RULES[key](pw));
  });
}

/* ══ TOGGLE PASSWORD VISIBILITY ══ */
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  btn.textContent = isText ? '👁' : '🙈';
}

/* ══ FIELD VALIDATION UI ══ */
function setFieldError(inputId, errId, msg) {
  const input = document.getElementById(inputId);
  const err   = document.getElementById(errId);
  if (input) { input.classList.toggle('error', !!msg); input.classList.toggle('valid', !msg && input.value.trim() !== ''); }
  if (err)   err.textContent = msg ? '⚠ ' + msg : '';
}
function clearFieldError(inputId, errId) {
  setFieldError(inputId, errId, '');
}

/* ══ FORM SHOW / HIDE ══ */
function showLogin() {
  document.getElementById('form-login').style.display    = '';
  document.getElementById('form-register').style.display = 'none';
  document.getElementById('form-forgot').style.display   = 'none';
  document.getElementById('auth-success').style.display  = 'none';
  document.getElementById('btn-login').classList.add('active');
  document.getElementById('btn-register').classList.remove('active');
  document.getElementById('auth-mode-toggle') && null; // already toggled above
  clearLoginErrors();
}

function showRegister() {
  document.getElementById('form-login').style.display    = 'none';
  document.getElementById('form-register').style.display = '';
  document.getElementById('form-forgot').style.display   = 'none';
  document.getElementById('auth-success').style.display  = 'none';
  document.getElementById('btn-register').classList.add('active');
  document.getElementById('btn-login').classList.remove('active');
  clearRegisterErrors();
}

function showForgot() {
  document.getElementById('form-login').style.display    = 'none';
  document.getElementById('form-register').style.display = 'none';
  document.getElementById('form-forgot').style.display   = '';
  document.getElementById('auth-success').style.display  = 'none';
  document.querySelectorAll('.auth-mode-btn').forEach(b => b.classList.remove('active'));
}

function clearLoginErrors() {
  clearFieldError('login-email', 'login-email-err');
  clearFieldError('login-password', 'login-password-err');
  const g = document.getElementById('login-global-err');
  if (g) g.textContent = '';
}
function clearRegisterErrors() {
  ['reg-firstname','reg-lastname','reg-email','reg-password','reg-confirm','reg-phone'].forEach(id => {
    const errId = id + '-err';
    clearFieldError(id, errId);
  });
  const g = document.getElementById('reg-global-err');
  if (g) g.textContent = '';
}

/* ══ LOADING STATE ══ */
function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const label  = btn.querySelector('.btn-label');
  const loader = btn.querySelector('.btn-loader');
  btn.disabled = loading;
  if (label)  label.style.display  = loading ? 'none' : '';
  if (loader) loader.style.display = loading ? '' : 'none';
}

/* ══ ENTER APP ══ */
function enterApp() {
  const session = getSession();
  // Update nav avatar & profile
  if (session) {
    const initials = (session.firstname[0] + (session.lastname ? session.lastname[0] : '')).toUpperCase();
    const avatar = document.querySelector('.nav-avatar');
    if (avatar) avatar.textContent = initials;
    const pName = document.querySelector('.profile-name');
    const pEmail = document.querySelector('.profile-email');
    const pAva = document.querySelector('.profile-ava');
    if (pName)  pName.textContent = session.firstname + ' ' + session.lastname;
    if (pEmail) pEmail.textContent = session.email;
    if (pAva)  pAva.textContent = initials;
  }

  // Show app, hide auth
  document.getElementById('auth-screen').style.display   = 'none';
  document.getElementById('app-wrapper').style.display   = '';

  // Animate in
  document.getElementById('app-wrapper').style.animation = 'fadeUp .4s ease';
}

/* ══ SOCIAL LOGIN (mock) ══ */
function socialLogin(provider) {
  const btn = event.target.closest('.social-btn');
  if (btn) { btn.textContent = '⏳ Connexion...'; btn.disabled = true; }
  setTimeout(() => {
    const mockUser = { email: 'user@' + provider.toLowerCase() + '.com', firstname: provider, lastname: 'User', password: '' };
    const users = getUsers();
    if (!users.find(u => u.email === mockUser.email)) {
      users.push(mockUser);
      saveUsers(users);
    }
    saveSession(mockUser);
    enterApp();
  }, 1200);
}

/* ══ LOGIN FORM SUBMIT ══ */
document.getElementById('form-login').addEventListener('submit', function(e) {
  e.preventDefault();
  clearLoginErrors();

  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  let valid = true;

  if (!email) {
    setFieldError('login-email', 'login-email-err', 'L\'email est requis');
    valid = false;
  } else if (!isValidEmail(email)) {
    setFieldError('login-email', 'login-email-err', 'Format d\'email invalide');
    valid = false;
  }
  if (!pass) {
    setFieldError('login-password', 'login-password-err', 'Le mot de passe est requis');
    valid = false;
  }
  if (!valid) return;

  setLoading('login-submit-btn', true);

  // Simulate async (network delay)
  setTimeout(() => {
    const users = getUsers();
    const user  = users.find(u => u.email === email && u.password === pass);

    if (!user) {
      setLoading('login-submit-btn', false);
      const globalErr = document.getElementById('login-global-err');
      if (globalErr) globalErr.textContent = 'Email ou mot de passe incorrect. Vérifiez vos informations.';
      setFieldError('login-email', 'login-email-err', '');
      setFieldError('login-password', 'login-password-err', '');
      document.getElementById('login-email').classList.add('error');
      document.getElementById('login-password').classList.add('error');
      // Shake animation
      document.getElementById('form-login').style.animation = 'shake .3s ease';
      setTimeout(() => document.getElementById('form-login').style.animation = '', 300);
      return;
    }

    const remember = document.getElementById('login-remember').checked;
    if (!remember) {
      // session storage only (simulate)
    }
    saveSession(user);
    setLoading('login-submit-btn', false);
    enterApp();
  }, 900);
});

/* ══ REGISTER FORM SUBMIT ══ */
document.getElementById('form-register').addEventListener('submit', function(e) {
  e.preventDefault();
  clearRegisterErrors();

  const firstname = document.getElementById('reg-firstname').value.trim();
  const lastname  = document.getElementById('reg-lastname').value.trim();
  const email     = document.getElementById('reg-email').value.trim();
  const password  = document.getElementById('reg-password').value;
  const confirm   = document.getElementById('reg-confirm').value;
  const phone     = document.getElementById('reg-phone').value.trim();
  const cgu       = document.getElementById('reg-cgu').checked;
  let valid = true;

  if (!firstname) {
    setFieldError('reg-firstname', 'reg-firstname-err', 'Prénom requis');
    valid = false;
  }
  if (!lastname) {
    setFieldError('reg-lastname', 'reg-lastname-err', 'Nom requis');
    valid = false;
  }
  if (!email) {
    setFieldError('reg-email', 'reg-email-err', 'Email requis');
    valid = false;
  } else if (!isValidEmail(email)) {
    setFieldError('reg-email', 'reg-email-err', 'Format d\'email invalide');
    valid = false;
  }
  if (!password) {
    setFieldError('reg-password', 'reg-password-err', 'Mot de passe requis');
    valid = false;
  } else if (getPasswordScore(password) < 2) {
    setFieldError('reg-password', 'reg-password-err', 'Mot de passe trop faible (min. 8 car., 1 majuscule, 1 chiffre)');
    valid = false;
  }
  if (!confirm) {
    setFieldError('reg-confirm', 'reg-confirm-err', 'Veuillez confirmer le mot de passe');
    valid = false;
  } else if (password !== confirm) {
    setFieldError('reg-confirm', 'reg-confirm-err', 'Les mots de passe ne correspondent pas');
    valid = false;
  }
  if (phone && !isValidPhone(phone)) {
    setFieldError('reg-phone', 'reg-phone-err', 'Format de téléphone invalide');
    valid = false;
  }
  if (!cgu) {
    const g = document.getElementById('reg-global-err');
    if (g) g.textContent = 'Vous devez accepter les conditions générales d\'utilisation';
    valid = false;
  }
  if (!valid) return;

  setLoading('reg-submit-btn', true);

  setTimeout(() => {
    const users = getUsers();

    // Check if email already exists
    if (users.find(u => u.email === email)) {
      setLoading('reg-submit-btn', false);
      setFieldError('reg-email', 'reg-email-err', 'Un compte existe déjà avec cet email');
      document.getElementById('reg-email').classList.add('error');
      return;
    }

    // Create user
    const newUser = { email, password, firstname, lastname, phone, createdAt: new Date().toISOString() };
    users.push(newUser);
    saveUsers(users);
    saveSession(newUser);

    setLoading('reg-submit-btn', false);

    // Show success
    document.getElementById('form-register').style.display = 'none';
    document.getElementById('auth-success').style.display  = '';
    document.getElementById('success-email').textContent   = email;
    document.querySelectorAll('.auth-mode-btn').forEach(b => b.classList.remove('active'));
  }, 1100);
});

/* ══ FORGOT PASSWORD SUBMIT ══ */
document.getElementById('form-forgot').addEventListener('submit', function(e) {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value.trim();
  const err   = document.getElementById('forgot-email-err');
  const global = document.getElementById('forgot-global-err');

  if (!email) { setFieldError('forgot-email', 'forgot-email-err', 'Email requis'); return; }
  if (!isValidEmail(email)) { setFieldError('forgot-email', 'forgot-email-err', 'Format invalide'); return; }

  const btn = this.querySelector('.auth-submit-btn');
  const label  = btn.querySelector('.btn-label');
  const loader = btn.querySelector('.btn-loader');
  btn.disabled = true;
  if (label)  label.style.display = 'none';
  if (loader) loader.style.display = '';

  setTimeout(() => {
    btn.disabled = false;
    if (label)  label.style.display = '';
    if (loader) loader.style.display = 'none';
    // Always show success (no user enumeration)
    if (global) {
      global.style.color = 'var(--good)';
      global.style.background = 'var(--good-bg)';
      global.style.borderColor = 'rgba(22,163,74,.2)';
      global.textContent = '✅ Un email de réinitialisation a été envoyé à ' + email;
    }
    document.getElementById('forgot-email').disabled = true;
    btn.disabled = true;
    btn.style.opacity = '0.5';
  }, 1000);
});

/* ══ REAL-TIME INLINE VALIDATION ══ */
// Email fields
['login-email','reg-email','forgot-email'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('blur', function() {
    const errId = id + '-err';
    if (!this.value.trim()) return;
    if (!isValidEmail(this.value.trim())) {
      setFieldError(id, errId, 'Format d\'email invalide');
    } else {
      clearFieldError(id, errId);
    }
  });
  el.addEventListener('input', function() {
    if (this.classList.contains('error') && isValidEmail(this.value.trim())) {
      clearFieldError(id, id + '-err');
    }
  });
});

// Confirm password
document.getElementById('reg-confirm').addEventListener('input', function() {
  const pw = document.getElementById('reg-password').value;
  if (this.classList.contains('error') && this.value === pw) {
    clearFieldError('reg-confirm', 'reg-confirm-err');
  }
});

/* ══ SHAKE KEYFRAME ══ */
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%,100%{transform:translateX(0);}
    20%{transform:translateX(-8px);}
    40%{transform:translateX(8px);}
    60%{transform:translateX(-5px);}
    80%{transform:translateX(5px);}
  }
`;
document.head.appendChild(shakeStyle);

/* ══ AUTO-LOGIN if session exists ══ */
(function checkExistingSession() {
  const session = getSession();
  if (session) {
    // Session found — go straight to app
    enterApp();
  }
})();

/* ══ LOGOUT ══ */
function logOut() {
  clearSession();
  // Reset forms
  document.getElementById('form-login').reset();
  document.getElementById('form-register').reset();
  // Reset password strength UI
  checkPasswordStrength('');
  // Show auth screen
  document.getElementById('app-wrapper').style.display = 'none';
  document.getElementById('auth-screen').style.display = '';
  showLogin();
}
