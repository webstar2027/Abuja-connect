const planPrices = {
  regular: [
    { duration: '1 month', price: '₦1,000', note: 'Flexible duration' },
    { duration: '3 months', price: '₦2,700', note: 'Save 10%' },
    { duration: '6 months', price: '₦5,000', note: 'Save 17%' },
    { duration: '1 year', price: '₦9,000', note: 'Save 25%' }
  ],
  escort: [
    { duration: '1 month', price: '₦2,000', note: 'Flexible duration' },
    { duration: '3 months', price: '₦5,400', note: 'Save 10%' },
    { duration: '6 months', price: '₦10,000', note: 'Save 17%' },
    { duration: '1 year', price: '₦18,000', note: 'Save 25%' }
  ]
};

let selectedType = 'regular';
const pricesGrid = document.querySelector('#prices');
const authForm = document.querySelector('#auth-form');
const modal = document.querySelector('#notice-modal');
const authMessage = document.querySelector('#auth-message');
let authMode = 'login';

function showNotice(title, body) {
  document.querySelector('#notice-title').textContent = title;
  document.querySelector('#notice-body').textContent = body;
  if (typeof modal.showModal === 'function') modal.showModal();
  else window.alert(`${title}\n\n${body}`);
}

function renderPrices() {
  if (!pricesGrid) return;
  pricesGrid.innerHTML = planPrices[selectedType].map((plan, index) => `
    <article class="price-card ${index === 2 ? 'featured' : ''}">
      <span class="duration">${plan.duration}</span>
      <div class="price">${plan.price}</div>
      <span class="saving">${plan.note === 'Flexible duration' ? '&nbsp;' : plan.note}</span>
      <span class="plan-detail">${selectedType === 'regular' ? 'Regular account' : 'Escort listing'} subscription</span>
      <button class="btn btn-blue" type="button" data-plan="${plan.duration}">Choose plan</button>
    </article>
  `).join('');
  pricesGrid.querySelectorAll('[data-plan]').forEach(button => {
    button.addEventListener('click', () => {
      showNotice('Subscription preview', `You selected ${selectedType === 'regular' ? 'Regular account' : 'Escort listing'} · ${button.dataset.plan}. Paystack is not connected yet, so no payment has been taken.`);
    });
  });
}

function setAuthMode(mode) {
  authMode = mode === 'signup' ? 'signup' : 'login';
  document.querySelectorAll('[data-auth-tab]').forEach(button => {
    const active = button.dataset.authTab === authMode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  const signupFields = document.querySelector('#signup-fields');
  signupFields.hidden = authMode !== 'signup';
  document.querySelector('#display-name').required = authMode === 'signup';
  document.querySelector('#age-check').required = authMode === 'signup';
  document.querySelector('#auth-submit').textContent = authMode === 'signup' ? 'Create account' : 'Login';
  document.querySelector('#auth-password').autocomplete = authMode === 'signup' ? 'new-password' : 'current-password';
  document.querySelector('#auth-switch').innerHTML = authMode === 'signup'
    ? 'Already have an account? <button type="button" data-auth-tab="login">Login</button>'
    : 'Don\\'t have an account? <button type="button" data-auth-tab="signup">Sign Up</button>';
  document.querySelectorAll('[data-auth-tab]').forEach(button => {
    button.onclick = () => setAuthMode(button.dataset.authTab);
  });
  authMessage.textContent = 'Preview only: accounts are not connected yet.';
}

document.querySelectorAll('[data-auth]').forEach(button => {
  button.addEventListener('click', () => {
    setAuthMode(button.dataset.auth || 'signup');
    document.querySelector('#auth-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.querySelector('#auth-email').focus({ preventScroll: true });
  });
});
document.querySelectorAll('[data-auth-tab]').forEach(button => button.addEventListener('click', () => setAuthMode(button.dataset.authTab)));

document.querySelectorAll('[data-type]').forEach(button => {
  button.addEventListener('click', () => {
    selectedType = button.dataset.type;
    document.querySelectorAll('[data-type]').forEach(item => item.classList.toggle('active', item === button));
    renderPrices();
  });
});

document.querySelector('#toggle-password').addEventListener('click', () => {
  const input = document.querySelector('#auth-password');
  const reveal = input.type === 'password';
  input.type = reveal ? 'text' : 'password';
  document.querySelector('#toggle-password').setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
});

authForm.addEventListener('submit', event => {
  event.preventDefault();
  if (authMode === 'signup' && !document.querySelector('#age-check').checked) {
    authMessage.textContent = 'Please confirm that you are 18 or older.';
    return;
  }
  authMessage.textContent = authMode === 'signup'
    ? 'Preview only: your details were not sent or saved. Supabase registration must be connected before launch.'
    : 'Preview only: login is not connected yet. No credentials were sent or saved.';
});

document.querySelector('#menu').addEventListener('click', () => {
  const nav = document.querySelector('#nav');
  const isOpen = nav.classList.toggle('open');
  document.querySelector('#menu').setAttribute('aria-expanded', String(isOpen));
});
document.querySelectorAll('#nav a').forEach(link => link.addEventListener('click', () => {
  document.querySelector('#nav').classList.remove('open');
  document.querySelector('#menu').setAttribute('aria-expanded', 'false');
}));

document.querySelectorAll('.demo-action').forEach(button => button.addEventListener('click', () => {
  showNotice('Sample profile', 'This is an illustrative design preview. Real profile likes, passes, and mutual matching will work after the database and authentication are connected.');
}));
document.querySelectorAll('.filter-pills button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.filter-pills button').forEach(item => item.classList.toggle('selected', item === button));
  showNotice('Discovery filter', `${button.textContent} is shown as a visual interaction in this preview. Real filters will use live profile data after Supabase is connected.`);
}));
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-view]').forEach(item => item.classList.toggle('active', item === button));
  document.querySelector('#dashboard-title').textContent = ({
    home: 'Discover your next connection', discover: 'Discover people', matches: 'Your mutual matches',
    messages: 'Your conversations', profile: 'Your profile', settings: 'Account settings'
  })[button.dataset.view] || 'Abuja Connect';
  if (window.matchMedia('(max-width: 760px)').matches) {
    showNotice(button.textContent.trim(), 'This is a layout preview. Real account data and navigation will be connected in the next development step.');
  }
}));
document.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-choice]').forEach(item => item.classList.toggle('selected', item === button));
  selectedType = button.dataset.choice === 'Escort listing' ? 'escort' : 'regular';
  document.querySelectorAll('[data-type]').forEach(item => item.classList.toggle('active', item.dataset.type === selectedType));
  renderPrices();
}));
document.querySelector('#sample-send').addEventListener('click', () => showNotice('Chat preview', 'Messages are examples only. Real chat will be limited to mutually matched users with an active subscription.'));
document.querySelector('#close-modal').addEventListener('click', () => modal.close());
document.querySelector('#notice-ok').addEventListener('click', () => modal.close());
document.querySelector('#year').textContent = new Date().getFullYear();
renderPrices();
setAuthMode('login');
