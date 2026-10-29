(() => {
'use strict';

// Rotate real Abuja landmark photographs every 3 seconds. Device local time controls day/night treatment.
(function initAbujaSlideshow(){
  const hero=document.querySelector('.hero');
  const host=document.getElementById('city-slideshow');
  if(!hero||!host)return;
  const landmarks=[
    {name:'Abuja City Gate',url:'https://commons.wikimedia.org/wiki/Special:FilePath/Abuja%20City%20Gate%2001.jpg?width=2000'},
    {name:'National Mosque, Abuja',url:'https://commons.wikimedia.org/wiki/Special:FilePath/The%20National%20Mosque%20In%20Abuja%20Nigeria.jpg?width=2000'},
    {name:'Aso Rock, Abuja',url:'https://commons.wikimedia.org/wiki/Special:FilePath/Aso%20Rock%20Nigeria.jpg?width=2000'},
    {name:'Abuja city landmark',url:'https://commons.wikimedia.org/wiki/Special:FilePath/Abuja%20City%20Gate.jpeg?width=2000'},
    {name:'National Mosque, Abuja',url:'https://commons.wikimedia.org/wiki/Special:FilePath/Nigeria%20National%20Mosque%20-%20Abuja.jpg?width=2000'}
  ];
  const slides=landmarks.map((place,index)=>{const img=document.createElement('img');img.className='city-slide'+(index===0?' active':'');img.alt='';img.setAttribute('aria-hidden','true');img.loading=index===0?'eager':'lazy';img.src=place.url;img.onerror=()=>{img.style.display='none'};host.appendChild(img);return img;});
  let current=0;
  function updateTimeTheme(){const hour=new Date().getHours();const night=hour<6||hour>=18;hero.dataset.time=night?'night':'day';hero.dataset.theme=night?'night':'day';}
  updateTimeTheme();setInterval(updateTimeTheme,60000);
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){setInterval(()=>{slides[current].classList.remove('active');current=(current+1)%slides.length;slides[current].classList.add('active');},3000);}
})();

const planPrices = {
  regular: [{duration:'1 month',price:'₦1,000'},{duration:'3 months',price:'₦2,700'},{duration:'6 months',price:'₦5,000'},{duration:'1 year',price:'₦9,000'}],
  escort: [{duration:'1 month',price:'₦2,000'},{duration:'3 months',price:'₦5,400'},{duration:'6 months',price:'₦10,000'},{duration:'1 year',price:'₦18,000'}]
};
let selectedType='regular', authMode='login', currentUser=null, supabase=null;
const $=s=>document.querySelector(s);
const modal=$('#notice-modal');
function notice(title,body){$('#notice-title').textContent=title;$('#notice-body').textContent=body;if(modal?.showModal)modal.showModal();else alert(`${title}\n\n${body}`)}
function configured(){return window.ABUJA_CONFIG && window.ABUJA_CONFIG.supabaseUrl.startsWith('https://') && !window.ABUJA_CONFIG.supabaseUrl.includes('PASTE_') && window.ABUJA_CONFIG.supabasePublishableKey && !window.ABUJA_CONFIG.supabasePublishableKey.includes('PASTE_') && window.supabase;}
if(configured()) supabase=window.supabase.createClient(window.ABUJA_CONFIG.supabaseUrl,window.ABUJA_CONFIG.supabasePublishableKey);
function renderPrices(){const grid=$('#prices');if(!grid)return;grid.innerHTML=planPrices[selectedType].map((p,i)=>`<article class="price-card ${i===2?'featured':''}"><b>${p.duration}</b><div class="price">${p.price}</div><small>${i===0?'Flexible duration':'Subscription plan'}</small><button class="btn btn-blue" data-plan="${p.duration}">Choose plan</button></article>`).join('');grid.querySelectorAll('[data-plan]').forEach(b=>b.onclick=()=>notice('Subscription selected',`${selectedType==='regular'?'Regular account':'Escort listing'} · ${b.dataset.plan}. Payment activation requires the secure Paystack checkout and server verification to be configured.`));}
function setAuthMode(mode){authMode=mode==='signup'?'signup':'login';document.querySelectorAll('[data-auth-tab]').forEach(b=>{let active=b.dataset.authTab===authMode;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.onclick=()=>setAuthMode(b.dataset.authTab)});$('#signup-fields').hidden=authMode!=='signup';$('#display-name').required=authMode==='signup';$('#age-check').required=authMode==='signup';$('#auth-submit').textContent=authMode==='signup'?'Create account':'Login';$('#auth-password').autocomplete=authMode==='signup'?'new-password':'current-password';$('#auth-switch').innerHTML=authMode==='signup'?'Already have an account? <button type="button" data-auth-tab="login">Login</button>':'Don\'t have an account? <button type="button" data-auth-tab="signup">Sign Up</button>';document.querySelectorAll('[data-auth-tab]').forEach(b=>b.onclick=()=>setAuthMode(b.dataset.authTab));}
function setMessage(text,isError=false){$('#auth-message').textContent=text;$('#auth-message').style.color=isError?'#b4233d':'#16814a';}

const forgotButton=$('#forgot-password');
forgotButton?.addEventListener('click',async()=>{
  const email=$('#auth-email').value.trim();
  if(!email){setMessage('Enter your email address first, then choose Forgot password.',true);$('#auth-email').focus();return;}
  if(!supabase){setMessage('Password reset is unavailable until Supabase is configured.',true);return;}
  forgotButton.disabled=true;
  try{
    const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
    if(error)throw error;
    setMessage('If an account exists for that email, a password-reset link will be sent.');
  }catch(err){setMessage(err.message||'Could not request a password reset.',true);}
  finally{forgotButton.disabled=false;}
});
document.querySelectorAll('[data-social="Google"]').forEach(button=>button.addEventListener('click',async()=>{
  if(!supabase){setMessage('Google sign-in is unavailable until Supabase is configured.',true);return;}
  button.disabled=true;
  try{
    const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin}});
    if(error)throw error;
  }catch(err){setMessage(err.message||'Could not start Google sign-in.',true);button.disabled=false;}
}));

async function refreshSession(){if(!supabase){setMessage('Setup required: add your Supabase Project URL and publishable key in public/config.js.',true);return;}const {data,error}=await supabase.auth.getSession();if(error){setMessage(error.message,true);return;}currentUser=data.session?.user||null;if(currentUser){setMessage(`Signed in as ${currentUser.email}.`);await loadProfiles();}else setMessage('Supabase connected. Log in or create an account.');}
$('#auth-form').addEventListener('submit',async e=>{e.preventDefault();if(!supabase){setMessage('Supabase is not configured yet. Add the Project URL and publishable key in public/config.js, then redeploy.',true);return;}if(authMode==='signup'&&!$('#age-check').checked){setMessage('Please confirm you are 18 or older.',true);return;}const email=$('#auth-email').value.trim(),password=$('#auth-password').value;$('#auth-submit').disabled=true;setMessage(authMode==='signup'?'Creating your account…':'Signing in…');try{let result;if(authMode==='signup'){result=await supabase.auth.signUp({email,password,options:{data:{display_name:$('#display-name').value.trim(),account_type:$('#account-type').value,age_confirmed:true}}});if(!result.error&&result.data.user&&!result.data.session){setMessage('Account created. Check your email to confirm your account, then log in.');return;}}else result=await supabase.auth.signInWithPassword({email,password});if(result.error)throw result.error;currentUser=result.data.user;setMessage(authMode==='signup'?'Account created successfully.':'You are signed in.');await loadProfiles();}catch(err){setMessage(err.message||'Could not complete request.',true);}finally{$('#auth-submit').disabled=false;}});
$('#toggle-password').addEventListener('click',()=>{let input=$('#auth-password'),show=input.type==='password';input.type=show?'text':'password';$('#toggle-password').setAttribute('aria-label',show?'Hide password':'Show password');});
document.querySelectorAll('[data-auth]').forEach(b=>b.addEventListener('click',()=>{setAuthMode(b.dataset.auth);$('#auth-card').scrollIntoView({behavior:'smooth',block:'center'});}));
document.querySelectorAll('[data-type]').forEach(b=>b.addEventListener('click',()=>{selectedType=b.dataset.type;document.querySelectorAll('[data-type]').forEach(x=>x.classList.toggle('active',x===b));renderPrices();}));
document.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-choice]').forEach(x=>x.classList.toggle('selected',x===b));selectedType=b.dataset.choice==='Escort listing'?'escort':'regular';document.querySelectorAll('[data-type]').forEach(x=>x.classList.toggle('active',x.dataset.type===selectedType));renderPrices();}));
async function loadProfiles(){if(!supabase||!currentUser)return;const container=$('.profile-grid');if(!container)return;const {data,error}=await supabase.from('profiles').select('id,display_name,account_type,city,bio,interests,avatar_url').neq('id',currentUser.id).limit(12);if(error){console.warn(error);return;}if(!data?.length){container.innerHTML='<p class="preview-note">Your account is connected. No other profiles are available yet.</p>';return;}container.innerHTML=data.map((p,i)=>`<article class="profile-card"><div class="profile-photo" style="background-image:${p.avatar_url?`url('${safeUrl(p.avatar_url)}')`:'linear-gradient(140deg,#d9e7fa,#7d9bc7)'}"><span class="sample-tag">${escapeHtml(p.account_type==='escort'?'Escort listing':'Member profile')}</span></div><div class="profile-info"><div class="profile-name">${escapeHtml(p.display_name||'Abuja Connect member')}</div><p>${escapeHtml(p.city||'Nigeria')}</p><p class="bio">${escapeHtml(p.bio||'Open to making new connections.')}</p><div class="interest-tags">${(p.interests||[]).slice(0,3).map(t=>`<span>${escapeHtml(t)}</span>`).join('')}</div><div class="profile-actions"><button class="btn btn-blue" data-like="${p.id}">♥ Like</button><button class="btn btn-outline" data-pass="${p.id}">Pass</button></div></div></article>`).join('');container.querySelectorAll('[data-like]').forEach(b=>b.onclick=()=>likeProfile(b.dataset.like,b));container.querySelectorAll('[data-pass]').forEach(b=>b.onclick=()=>{b.closest('.profile-card').remove();});}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeUrl(v){try{const u=new URL(v);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
async function likeProfile(id,button){if(!supabase||!currentUser){notice('Sign in required','Please sign in to express interest in a profile.');return;}button.disabled=true;try{const {error}=await supabase.from('likes').upsert({from_user:currentUser.id,to_user:id},{onConflict:'from_user,to_user'});if(error)throw error;button.textContent='♥ Liked';button.classList.remove('btn-blue');button.classList.add('btn-outline');notice('Interest sent','Your interest was saved. A match is created only if the other person also likes your profile.');}catch(e){notice('Could not like profile',e.message||'Please try again.');button.disabled=false;}}
$('#menu')?.addEventListener('click',()=>{const n=$('#nav'),open=n.classList.toggle('open');$('#menu').setAttribute('aria-expanded',String(open));});document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>{$('#nav').classList.remove('open');$('#menu').setAttribute('aria-expanded','false');}));$('#close-modal')?.addEventListener('click',()=>modal.close());$('#notice-ok')?.addEventListener('click',()=>modal.close());$('#year').textContent=new Date().getFullYear();renderPrices();setAuthMode('login');refreshSession();


})();
