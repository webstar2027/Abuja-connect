(() => {
'use strict';

// The login background is intentionally static: the supplied reference uses a calm, cinematic image.

const planPrices = {
  regular: [{duration:'1 month',price:'₦1,000'},{duration:'3 months',price:'₦2,700'},{duration:'6 months',price:'₦5,000'},{duration:'1 year',price:'₦9,000'}],
  escort: [{duration:'1 month',price:'₦2,000'},{duration:'3 months',price:'₦5,400'},{duration:'6 months',price:'₦10,000'},{duration:'1 year',price:'₦18,000'}]
};
let selectedType='regular', authMode='login', currentUser=null, supabase=null;
const $=s=>document.querySelector(s);
const modal=$('#notice-modal');
function notice(title,body){$('#notice-title').textContent=title;$('#notice-body').textContent=body;if(modal?.showModal)modal.showModal();else alert(`${title}

${body}`)}
function configured(){return window.ABUJA_CONFIG && window.ABUJA_CONFIG.supabaseUrl.startsWith('https://') && !window.ABUJA_CONFIG.supabaseUrl.includes('PASTE_') && window.ABUJA_CONFIG.supabasePublishableKey && !window.ABUJA_CONFIG.supabasePublishableKey.includes('PASTE_') && window.supabase;}
if(configured()) supabase=window.supabase.createClient(window.ABUJA_CONFIG.supabaseUrl,window.ABUJA_CONFIG.supabasePublishableKey);
function renderPrices(){const grid=$('#prices');if(!grid)return;grid.innerHTML=planPrices[selectedType].map((p,i)=>`<article class="price-card ${i===2?'featured':''}"><b>${p.duration}</b><div class="price">${p.price}</div><small>${i===0?'Flexible duration':'Subscription plan'}</small><button class="btn btn-blue" data-plan="${p.duration}">Choose plan</button></article>`).join('');grid.querySelectorAll('[data-plan]').forEach(b=>b.onclick=()=>startCheckout(selectedType,b.dataset.plan,b));}
function setAuthMode(mode){authMode=mode==='signup'?'signup':'login';document.querySelectorAll('[data-auth-tab]').forEach(b=>{let active=b.dataset.authTab===authMode;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.onclick=()=>setAuthMode(b.dataset.authTab)});$('#signup-fields').hidden=authMode!=='signup';$('#display-name').required=authMode==='signup';$('#signup-gender').required=authMode==='signup';$('#age-check').required=authMode==='signup';$('#auth-password').minLength=authMode==='signup'?8:0;$('#auth-submit').textContent=authMode==='signup'?'Create account':'Login';$('#auth-password').autocomplete=authMode==='signup'?'new-password':'current-password';$('#auth-switch').innerHTML=authMode==='signup'?'Already have an account? <button type="button" data-auth-tab="login">Login</button>':'Don\'t have an account? <button type="button" data-auth-tab="signup">Sign Up</button>';document.querySelectorAll('[data-auth-tab]').forEach(b=>b.onclick=()=>setAuthMode(b.dataset.authTab));}
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
// Google OAuth removed: Abuja Connect uses email and password authentication only.
let activeDashboardView='discover', selectedMatch=null, memberProfile=null;
function renderAuthState(){
  const authenticated=!!currentUser;
  document.body.classList.toggle('is-authenticated',authenticated);
  $('#member-dashboard').hidden=true;
  $('#profile-onboarding').hidden=true;
  $('#auth-card').closest('.hero').hidden=authenticated;
  document.querySelector('.site-header').hidden=!authenticated;
  if(currentUser){
    const name=currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || 'member';
    $('#member-name').textContent=name;
    $('#sidebar-member-name').textContent=name;
    $('#member-email').textContent=currentUser.email || '';
    $('#member-message').textContent='';
  }
}
function showDashboardView(view){
  const allowed=['dashboard','discover','encounters','matches','messages','profile','premium'];
  activeDashboardView=allowed.includes(view)?view:'dashboard';
  document.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==activeDashboardView);
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===activeDashboardView));
  const titles={dashboard:'Dashboard',discover:'Discover people',encounters:'Encounters',matches:'My matches',messages:'Messages',profile:'My profile',premium:'Premium membership'};
  $('#dashboard-title').textContent=titles[activeDashboardView];
  if(!currentUser)return;
  if(activeDashboardView==='discover')loadProfiles('#discover-profiles');
  if(activeDashboardView==='encounters')loadEncounters();
  if(activeDashboardView==='dashboard')loadProfiles('#dashboard-profiles');
  if(activeDashboardView==='matches')loadMatches();
  if(activeDashboardView==='messages')loadConversations();
  if(activeDashboardView==='profile')loadMyProfile();
  if(activeDashboardView==='premium'){renderPrices();const label=$('#premium-account-label');if(label)label.textContent=selectedType==='escort'?'Escort listing subscription plans':'Regular account subscription plans';}
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showDashboardView(b.dataset.view)));
$('#sign-out')?.addEventListener('click',doSignOut);$('#header-logout')?.addEventListener('click',doSignOut);
async function doSignOut(){if(!supabase)return;const {error}=await supabase.auth.signOut();if(error){$('#member-message').textContent=error.message;return;}currentUser=null;selectedMatch=null;memberProfile=null;$('#member-dashboard').hidden=true;$('#profile-onboarding').hidden=true;$('#subscription-gate').hidden=true;$('#auth-card').closest('.hero').hidden=false;document.querySelector('.site-header').hidden=true;document.body.classList.remove('is-authenticated');setAuthMode('login');setMessage('You have logged out successfully.');window.scrollTo({top:0,behavior:'smooth'});}
function showOnboarding(){
  $('#subscription-gate').hidden=true;
  renderAuthState();
  $('#profile-onboarding').hidden=false;
  document.querySelector('.site-header').hidden=true;
  $('#onboard-display-name').value=currentUser?.user_metadata?.display_name||currentUser?.email?.split('@')[0]||'';
  $('#onboard-gender').value=currentUser?.user_metadata?.gender||'';
  $('#onboard-city').value='Abuja';
  window.scrollTo({top:0,behavior:'smooth'});
}
async function enterDashboard(){
  $('#subscription-gate').hidden=true;
  document.querySelector('.site-header').hidden=false;
  $('#profile-onboarding').hidden=true;
  $('#member-dashboard').hidden=false;
  renderAuthState();
  $('#member-dashboard').hidden=false;
  activeDashboardView='discover';
  showDashboardView('discover');
  await loadProfiles('#discover-profiles');
  window.scrollTo({top:0,behavior:'smooth'});
}
const planCodes={'1 month':'1_month','3 months':'3_months','6 months':'6_months','1 year':'1_year'};
async function apiRequest(path,body=null){
  const {data}=await supabase.auth.getSession();const token=data?.session?.access_token;if(!token)throw new Error('Please log in again.');
  const response=await fetch(path,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  const payload=await response.json().catch(()=>({error:'Unexpected server response'}));if(!response.ok)throw new Error(payload.error||'Request failed');return payload;
}
async function subscriptionStatus(){return await apiRequest('/api/payments/status');}
function showPremiumMessagingLock(message='Messaging is a Premium feature. Subscribe to unlock conversations and send messages.'){
  const list=$('#conversation-list');
  if(list)list.innerHTML='<div class="premium-chat-sidebar-lock"><div class="premium-lock-badge">🔒</div><strong>Premium messaging</strong><p>Chat is unlocked with an active subscription.</p><button type="button" class="btn btn-blue" data-premium-plans>Subscribe to Premium</button><button type="button" class="btn btn-outline" data-premium-retry>Retry access check</button></div>';
  const empty=$('#conversation-empty');
  const content=$('#conversation-content');
  if(empty){
    empty.hidden=false;
    empty.innerHTML='<div class="premium-chat-screen"><div class="premium-chat-top"><div class="premium-chat-avatar">💬</div><div><strong>Messages</strong><small>Premium conversations</small></div><span class="premium-chat-lock-pill">LOCKED</span></div><div class="premium-chat-center"><div class="premium-chat-lock-art"><span>🔒</span></div><h3>Unlock messaging with Premium</h3><p>'+escapeHtml(message)+'</p><button type="button" class="btn btn-blue premium-subscribe-btn" data-premium-plans><span>♛</span> Subscribe to Premium</button><p class="premium-chat-footnote">Subscribe to start conversations with your matches.</p></div><div class="premium-chat-composer-preview"><button type="button" class="composer-plus" data-premium-plans aria-label="Subscribe to unlock">＋</button><button type="button" class="composer-placeholder" data-premium-plans>Message…</button><button type="button" class="composer-icon" data-premium-plans aria-label="Locked emoji">☺</button><button type="button" class="composer-send-locked" data-premium-plans aria-label="Subscribe to send"><span>🔒</span></button></div></div>';
  }
  if(content)content.hidden=true;
  
  document.querySelectorAll('[data-premium-retry]').forEach(b=>b.onclick=()=>loadConversations());
}
function showSubscriptionGate(){
  $('#subscription-gate').hidden=false;$('#member-dashboard').hidden=true;$('#profile-onboarding').hidden=true;
  document.querySelector('.site-header').hidden=false;renderAuthState();$('#subscription-gate').scrollIntoView({behavior:'smooth',block:'start'});
}
async function startCheckout(accountType,duration,button){
  if(!currentUser||!supabase){notice('Sign in first','Create your Abuja Connect account or log in, then choose a subscription plan.');$('#auth-card').closest('.hero').hidden=false;$('#auth-card').scrollIntoView({behavior:'smooth',block:'center'});setAuthMode('login');return;}
  const code=planCodes[duration];if(!code)return;
  if(button){button.disabled=true;button.textContent='Preparing checkout…';}
  try{const init=await apiRequest('/api/payments/initialize',{accountType,planCode:code});if(!init.authorization_url)throw new Error('Checkout link was not returned.');window.location.assign(init.authorization_url);}
  catch(err){notice('Could not start payment',err.message||'Please try again.');}
  finally{if(button){button.disabled=false;button.textContent='Choose plan';}}
}
async function handlePaymentReturn(){
  const url=new URL(window.location.href);if(url.pathname!=='/payment-return')return;
  const reference=url.searchParams.get('reference')||url.searchParams.get('trxref');
  if(!reference){notice('Payment check','No payment reference was returned. Please select a plan and try again.');return;}
  if(!currentUser){setMessage('Payment completed or attempted. Log in with the account used to pay to verify your subscription.');return;}
  try{notice('Checking payment','Please wait while Abuja Connect verifies your payment securely.');const result=await apiRequest('/api/payments/verify',{reference});modal?.close?.();if(result.verified){notice('Subscription activated','Your payment was verified. Your subscription is now active.');const {data}=await supabase.from('profiles').select('id,display_name,gender,city,bio,interests,account_type,avatar_url,additional_photo_urls').eq('id',currentUser.id).maybeSingle();memberProfile=data||null;if(!data||!data.avatar_url){showOnboarding();}else await enterDashboard();}else notice('Payment not verified',result.error||'Payment is still pending.');}
  catch(err){modal?.close?.();notice('Payment verification failed',err.message||'If you completed payment, try logging in again shortly.');}
  finally{url.searchParams.delete('reference');url.searchParams.delete('trxref');history.replaceState({},'',url.pathname+url.search+url.hash);}
}
async function routeAuthenticatedUser(isNewSignup=false){
  if(!currentUser)return;
  const {data,error}=await supabase.from('profiles').select('id,display_name,gender,city,bio,interests,account_type,avatar_url,additional_photo_urls').eq('id',currentUser.id).maybeSingle();
  if(error){setMessage(error.message,true);return;}
  memberProfile=data||null;
  selectedType=(data?.account_type||currentUser.user_metadata?.account_type||'regular');
  document.querySelectorAll('[data-type]').forEach(x=>x.classList.toggle('active',x.dataset.type===selectedType));
  if(isNewSignup||!data){renderPrices();showOnboarding();return;}
  renderPrices();
  // Core social access is free; subscriptions are reserved for optional premium features.
  const name=data.display_name||currentUser.user_metadata?.display_name||'member';
  $('#member-name').textContent=name;$('#sidebar-member-name').textContent=name;$('#member-email').textContent=currentUser.email||'';
  $('#profile-display-name').value=data.display_name||'';$('#profile-gender').value=data.gender||'';$('#profile-city').value=data.city||'Abuja';$('#profile-bio').value=data.bio||'';$('#profile-interests').value=(data.interests||[]).join(', ');if(data.avatar_url)$('#sidebar-avatar').src=safeUrl(data.avatar_url);
  await enterDashboard();
}
async function refreshSession(){
  if(!supabase){setMessage('Setup required: add your Supabase Project URL and publishable key in Render environment settings.',true);return;}
  const {data,error}=await supabase.auth.getSession();if(error){setMessage(error.message,true);return;}
  currentUser=data.session?.user||null;
  if(currentUser)await routeAuthenticatedUser(false);else{renderAuthState();setMessage('Enter your email and password to log in, or choose Sign Up to create an account.');}
}
$('#auth-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.currentTarget;
  const submit=$('#auth-submit');
  if(submit.disabled)return;
  const creating=authMode==='signup';
  const email=$('#auth-email').value.trim();
  const password=$('#auth-password').value;
  const displayName=$('#display-name').value.trim();

  // Explicit validation keeps mobile browsers from silently blocking the submit event.
  if(!email || !$('#auth-email').checkValidity()){
    setMessage('Please enter a valid email address.',true);$('#auth-email').focus();return;
  }
  if(!password || (creating && password.length<8)){
    setMessage(creating?'Your password must be at least 8 characters.':'Please enter your password.',true);$('#auth-password').focus();return;
  }
  if(creating && !displayName){
    setMessage('Please enter your display name.',true);$('#display-name').focus();return;
  }
  if(creating&&!$('#signup-gender').value){
    setMessage('Please select your gender.',true);$('#signup-gender').focus();return;
  }
  if(creating&&!$('#age-check').checked){
    setMessage('Please confirm you are 18 or older.',true);$('#age-check').focus();return;
  }
  if(!supabase){
    setMessage('Supabase is not configured. Check SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in Render.',true);return;
  }

  submit.disabled=true;
  submit.textContent=creating?'Creating account…':'Signing in…';
  setMessage(creating?'Creating your account…':'Signing in…');
  try{
    let result;
    if(creating){
      result=await supabase.auth.signUp({
        email,password,
        options:{data:{
          display_name:displayName,
          gender:$('#signup-gender').value,
          account_type:$('#account-type').value,
          age_confirmed:true
        }}
      });
    }else{
      result=await supabase.auth.signInWithPassword({email,password});
    }
    if(result.error)throw result.error;
    if(creating && result.data.user && !result.data.session){
      setMessage('Your account has been created. Check your email to confirm it, then log in.');
      return;
    }
    currentUser=result.data.user;
    if(!currentUser)throw new Error('Authentication did not return a user. Please try again.');
    await routeAuthenticatedUser(creating);if(!creating)await handlePaymentReturn();
  }catch(err){
    setMessage(err?.message||'Could not complete your request. Please try again.',true);
  }finally{
    submit.disabled=false;
    submit.textContent=creating?'Create account':'Login';
  }
});
async function uploadProfileImages(mainFile, extraFiles, existingAvatar=null){
  if(!supabase||!currentUser)throw new Error('Please sign in before uploading profile photos.');
  const bucket='profile-photos';
  const uploadOne=async(file,label)=>{
    if(!file)return null;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Please use JPG, PNG or WebP photos.');
    if(file.size>8*1024*1024)throw new Error('Each photo must be 8 MB or smaller.');
    const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
    const path=`${currentUser.id}/${label}-${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const {error}=await supabase.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type});
    if(error)throw error;
    const {data}=supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };
  const avatar=mainFile?await uploadOne(mainFile,'main'):existingAvatar;
  const extras=[];
  for(let i=0;i<Math.min(extraFiles.length,3);i++)extras.push(await uploadOne(extraFiles[i],`extra-${i+1}`));
  return {avatar_url:avatar,additional_photo_urls:extras};
}
function showLocalPreview(input, target){
  const file=input?.files?.[0];if(!file||!target)return;
  if(!file.type.startsWith('image/'))return;
  const url=URL.createObjectURL(file);target.style.backgroundImage=`url("${url}")`;target.classList.add('has-photo');target.textContent='';
}
$('#onboard-avatar')?.addEventListener('change',()=>showLocalPreview($('#onboard-avatar'),$('#onboard-avatar-preview')));
$('#profile-avatar')?.addEventListener('change',()=>showLocalPreview($('#profile-avatar'),$('#profile-avatar-preview')));
$('#onboarding-form')?.addEventListener('submit',async e=>{
  e.preventDefault();if(!supabase||!currentUser)return;
  const button=$('#onboarding-submit');const mainPhoto=$('#onboard-avatar')?.files?.[0];const extraPhotos=Array.from($('#onboard-extra-photos')?.files||[]);if(!mainPhoto){$('#onboarding-message').textContent='Please add your main profile photo to continue.';return;}if(extraPhotos.length>3){$('#onboarding-message').textContent='You can add up to 3 additional photos.';return;}button.disabled=true;$('#onboarding-message').textContent='Uploading photos and saving your profile…';
  const values={id:currentUser.id,display_name:$('#onboard-display-name').value.trim(),gender:$('#onboard-gender').value,city:$('#onboard-city').value.trim(),bio:$('#onboard-bio').value.trim(),interests:$('#onboard-interests').value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,20),account_type:currentUser.user_metadata?.account_type||'regular',age_confirmed:true,updated_at:new Date().toISOString()};
  try{const photos=await uploadProfileImages(mainPhoto,extraPhotos);Object.assign(values,photos);const {error}=await supabase.from('profiles').upsert(values,{onConflict:'id'});if(error)throw error;memberProfile=values;$('#sidebar-avatar').src=safeUrl(values.avatar_url);$('#member-name').textContent=values.display_name;$('#sidebar-member-name').textContent=values.display_name;await enterDashboard();}
  catch(err){$('#onboarding-message').textContent=err.message||'Could not save your profile. Please try again.';}
  finally{button.disabled=false;}
});
$('#toggle-password').addEventListener('click',()=>{let input=$('#auth-password'),show=input.type==='password';input.type=show?'text':'password';$('#toggle-password').setAttribute('aria-label',show?'Hide password':'Show password');});
document.querySelectorAll('[data-auth]').forEach(b=>b.addEventListener('click',()=>{if(currentUser){showDashboardView('dashboard');window.scrollTo({top:0,behavior:'smooth'});return;}setAuthMode(b.dataset.auth);$('#auth-card').scrollIntoView({behavior:'smooth',block:'center'});}));
document.querySelectorAll('[data-type]').forEach(b=>b.addEventListener('click',()=>{selectedType=b.dataset.type;document.querySelectorAll('[data-type]').forEach(x=>x.classList.toggle('active',x===b));renderPrices();}));
document.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-choice]').forEach(x=>x.classList.toggle('selected',x===b));selectedType=b.dataset.choice==='Escort listing'?'escort':'regular';document.querySelectorAll('[data-type]').forEach(x=>x.classList.toggle('active',x.dataset.type===selectedType));renderPrices();}));
async function loadProfiles(target='#discover-profiles'){
 if(!supabase||!currentUser)return;const container=$(target);if(!container)return;container.innerHTML='<p class="empty-state">Loading profiles…</p>';
 const {data,error}=await supabase.from('profiles').select('id,display_name,account_type,city,bio,interests,avatar_url').neq('id',currentUser.id).eq('is_banned',false).limit(24);
 if(error){container.innerHTML=`<p class="empty-state">Could not load profiles: ${escapeHtml(error.message)}</p>`;return;}
 if(!data?.length){container.innerHTML='<p class="empty-state">No other profiles are available yet. Invite people to join Abuja Connect, and check back soon.</p>';return;}
 container.innerHTML=data.map(p=>`<article class="profile-card"><div class="profile-photo" style="background-image:${p.avatar_url?`url('${safeUrl(p.avatar_url)}')`:'linear-gradient(140deg,#d9e7fa,#7d9bc7)'}"><span class="sample-tag">${escapeHtml(p.account_type==='escort'?'Escort listing':'Member profile')}</span></div><div class="profile-info"><div class="profile-name">${escapeHtml(p.display_name||'Abuja Connect member')}</div><p>${escapeHtml(p.city||'Abuja')}</p><p class="bio">${escapeHtml(p.bio||'Open to making new connections.')}</p><div class="interest-tags">${(p.interests||[]).slice(0,3).map(t=>`<span>${escapeHtml(t)}</span>`).join('')}</div><div class="profile-actions"><button class="btn btn-blue" data-like="${p.id}">♥ Like</button><button class="btn btn-outline" data-pass="${p.id}">Pass</button></div></div></article>`).join('');
 container.querySelectorAll('[data-like]').forEach(b=>b.onclick=()=>likeProfile(b.dataset.like,b));container.querySelectorAll('[data-pass]').forEach(b=>b.onclick=()=>b.closest('.profile-card').remove());
}
async function loadEncounters(){
 if(!supabase||!currentUser)return;const box=$('#encounters-card');if(!box)return;box.innerHTML='<p class=\"empty-state\">Finding people…</p>';
 const {data,error}=await supabase.from('profiles').select('id,display_name,account_type,city,bio,interests,avatar_url').neq('id',currentUser.id).eq('is_banned',false).limit(60);
 if(error){box.innerHTML=`<p class=\"empty-state\">Could not load Encounters: ${escapeHtml(error.message)}</p>`;return;}
 const candidates=(data||[]).sort(()=>Math.random()-0.5);if(!candidates.length){box.innerHTML='<p class=\"empty-state\">No profiles available yet. Come back later.</p>';return;}
 const render=(i)=>{const p=candidates[i%candidates.length];box.innerHTML=`<article class=\"encounter-card profile-card\"><div class=\"profile-photo encounter-photo\" style=\"background-image:${p.avatar_url?`url('${safeUrl(p.avatar_url)}')`:'linear-gradient(140deg,#d9e7fa,#7d9bc7)'}\"></div><div class=\"profile-info\"><h2>${escapeHtml(p.display_name||'Abuja Connect member')}</h2><p>${escapeHtml(p.city||'Abuja')} · ${escapeHtml(p.account_type==='escort'?'Listing':'Member')}</p><p class=\"bio\">${escapeHtml(p.bio||'Open to making new connections.')}</p><div class=\"interest-tags\">${(p.interests||[]).slice(0,4).map(t=>`<span>${escapeHtml(t)}</span>`).join('')}</div><div class=\"profile-actions encounter-actions\"><button class=\"btn btn-outline\" id=\"encounter-pass\" type=\"button\">✕ Pass</button><button class=\"btn btn-blue\" id=\"encounter-like\" type=\"button\">♥ Like</button></div></div></article>`;
 $('#encounter-pass').onclick=()=>render(i+1);$('#encounter-info').onclick=()=>box.querySelector('.encounter-card')?.classList.toggle('info-open');$('#encounter-like').onclick=async()=>{const b=$('#encounter-like');await likeProfile(p.id,b);render(i+1);};};render(0);
}
async function loadMyProfile(){if(!supabase||!currentUser)return;const {data,error}=await supabase.from('profiles').select('display_name,gender,city,bio,interests,account_type,avatar_url,additional_photo_urls').eq('id',currentUser.id).maybeSingle();if(error){$('#profile-message').textContent=error.message;return;}memberProfile=data||{};$('#profile-display-name').value=memberProfile.display_name||currentUser.user_metadata?.display_name||'';$('#profile-gender').value=memberProfile.gender||currentUser.user_metadata?.gender||'';$('#profile-city').value=memberProfile.city||'Abuja';$('#profile-bio').value=memberProfile.bio||'';$('#profile-interests').value=(memberProfile.interests||[]).join(', ');if(memberProfile.avatar_url)$('#sidebar-avatar').src=safeUrl(memberProfile.avatar_url);const preview=$('#profile-avatar-preview');if(preview&&memberProfile.avatar_url){preview.style.backgroundImage=`url("${safeUrl(memberProfile.avatar_url)}")`;preview.classList.add('has-photo');preview.textContent='';}const gallery=$('#profile-photo-gallery');if(gallery)gallery.innerHTML=(memberProfile.additional_photo_urls||[]).map(url=>`<img src="${safeUrl(url)}" alt="Additional profile photo" loading="lazy">`).join('');}
$('#profile-form')?.addEventListener('submit',async e=>{e.preventDefault();if(!supabase||!currentUser)return;const button=e.submitter;button.disabled=true;$('#profile-message').textContent='Saving…';const values={id:currentUser.id,display_name:$('#profile-display-name').value.trim(),gender:$('#profile-gender').value||null,city:$('#profile-city').value.trim(),bio:$('#profile-bio').value.trim(),interests:$('#profile-interests').value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,20),account_type:memberProfile?.account_type||currentUser.user_metadata?.account_type||'regular',age_confirmed:true,updated_at:new Date().toISOString()};const mainPhoto=$('#profile-avatar')?.files?.[0];const extraPhotos=Array.from($('#profile-extra-photos')?.files||[]);if(extraPhotos.length>3){$('#profile-message').textContent='You can add up to 3 additional photos.';button.disabled=false;return;}try{const photos=await uploadProfileImages(mainPhoto,extraPhotos,memberProfile?.avatar_url||null);Object.assign(values,photos);if(!values.avatar_url)throw new Error('Please upload your main profile photo.');const {error}=await supabase.from('profiles').upsert(values,{onConflict:'id'});if(error)throw error;memberProfile=values;$('#sidebar-avatar').src=safeUrl(values.avatar_url);$('#profile-message').textContent='Profile saved successfully.';$('#member-name').textContent=values.display_name;$('#sidebar-member-name').textContent=values.display_name;}catch(err){$('#profile-message').textContent=err.message||'Could not save profile.';}finally{button.disabled=false;}});
async function loadMatches(){if(!supabase||!currentUser)return;const list=$('#matches-list');list.innerHTML='<p class="empty-state">Loading matches…</p>';const {data,error}=await supabase.from('matches').select('id,user_one,user_two,created_at').or(`user_one.eq.${currentUser.id},user_two.eq.${currentUser.id}`).order('created_at',{ascending:false});if(error){list.innerHTML=`<p class="empty-state">Could not load matches: ${escapeHtml(error.message)}</p>`;return;}if(!data?.length){list.innerHTML='<p class="empty-state">No matches yet. Visit Discover and like profiles to get started.</p>';$('#stat-matches').textContent='0';return;}const ids=[...new Set(data.map(m=>m.user_one===currentUser.id?m.user_two:m.user_one))];const {data:profiles}=await supabase.from('profiles').select('id,display_name,city').in('id',ids);const byId=Object.fromEntries((profiles||[]).map(p=>[p.id,p]));list.innerHTML=data.map(m=>{const id=m.user_one===currentUser.id?m.user_two:m.user_one,p=byId[id]||{};return `<article class="match-card"><div><h3>${escapeHtml(p.display_name||'Abuja Connect member')}</h3><p>${escapeHtml(p.city||'Abuja')} · Matched ${new Date(m.created_at).toLocaleDateString()}</p></div><button class="btn btn-blue" data-chat-match="${m.id}" data-other="${id}" data-name="${escapeHtml(p.display_name||'Member')}">Message</button></article>`}).join('');list.querySelectorAll('[data-chat-match]').forEach(b=>b.onclick=()=>{selectedMatch={id:b.dataset.chatMatch,other:b.dataset.other,name:b.dataset.name};showDashboardView('messages');});$('#stat-matches').textContent=String(data.length);}
async function loadConversations(){if(!supabase||!currentUser)return;const list=$('#conversation-list');list.innerHTML='<p class="empty-state">Checking Premium access…</p>';try{const status=await subscriptionStatus();if(!status.active){showPremiumMessagingLock();$('#stat-messages').textContent='🔒';return;}}catch(err){showPremiumMessagingLock('We could not verify your Premium status. Please try again, or check your subscription.');notice('Premium status unavailable',err.message||'Please try again shortly.');return;}list.innerHTML='<p class="empty-state">Loading matches…</p>';const {data,error}=await supabase.from('matches').select('id,user_one,user_two,created_at').or(`user_one.eq.${currentUser.id},user_two.eq.${currentUser.id}`).order('created_at',{ascending:false});if(error){list.innerHTML=`<p class="empty-state">Could not load conversations: ${escapeHtml(error.message)}</p>`;return;}if(!data?.length){list.innerHTML='<p class="empty-state">You need a mutual match before starting a conversation.</p>';$('#conversation-empty').hidden=false;$('#conversation-content').hidden=true;return;}const ids=[...new Set(data.map(m=>m.user_one===currentUser.id?m.user_two:m.user_one))];const {data:profiles}=await supabase.from('profiles').select('id,display_name').in('id',ids);const byId=Object.fromEntries((profiles||[]).map(p=>[p.id,p]));list.innerHTML=data.map(m=>{const other=m.user_one===currentUser.id?m.user_two:m.user_one,p=byId[other]||{};return `<button class="conversation-choice ${selectedMatch?.id===m.id?'active':''}" data-open-match="${m.id}" data-other="${other}" data-name="${escapeHtml(p.display_name||'Member')}">${escapeHtml(p.display_name||'Member')}<small>Open conversation</small></button>`}).join('');list.querySelectorAll('[data-open-match]').forEach(b=>b.onclick=()=>{selectedMatch={id:b.dataset.openMatch,other:b.dataset.other,name:b.dataset.name};loadMessages();});if(selectedMatch&&data.some(m=>m.id===selectedMatch.id)){loadMessages();}else{selectedMatch=null;$('#conversation-empty').hidden=false;$('#conversation-content').hidden=true;}const {count}=await supabase.from('messages').select('id',{count:'exact',head:true}).or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`);$('#stat-messages').textContent=String(count||0);}
async function loadMessages(){if(!supabase||!currentUser||!selectedMatch)return;try{const status=await subscriptionStatus();if(!status.active){showPremiumMessagingLock();return;}}catch(err){showPremiumMessagingLock('Premium access could not be verified. Try again in a moment.');return;}$('#conversation-empty').hidden=true;$('#conversation-content').hidden=false;$('#conversation-heading').textContent=selectedMatch.name;const box=$('#message-list');box.innerHTML='<p class="empty-state">Loading messages…</p>';const {data,error}=await supabase.from('messages').select('id,sender_id,recipient_id,body,created_at').eq('match_id',selectedMatch.id).order('created_at',{ascending:true}).limit(100);if(error){box.innerHTML=`<p class="empty-state">Could not load messages: ${escapeHtml(error.message)}. Messaging may require an active subscription.</p>`;return;}if(!data?.length){box.innerHTML='<p class="empty-state">No messages yet. Say hello when your account has messaging access.</p>';return;}box.innerHTML=data.map(m=>`<div class="chat-bubble ${m.sender_id===currentUser.id?'mine':''}">${escapeHtml(m.body)}<small>${new Date(m.created_at).toLocaleString()}</small></div>`).join('');box.scrollTop=box.scrollHeight;}
$('#message-form')?.addEventListener('submit',async e=>{e.preventDefault();if(!supabase||!currentUser||!selectedMatch)return;const input=$('#message-input'),body=input.value.trim();if(!body)return;const button=e.submitter;button.disabled=true;try{const status=await subscriptionStatus();if(!status.active){showPremiumMessagingLock();throw new Error('Sending messages requires an active Premium subscription.');}const {error}=await supabase.from('messages').insert({match_id:selectedMatch.id,sender_id:currentUser.id,recipient_id:selectedMatch.other,body});if(error)throw error;input.value='';await loadMessages();}catch(err){notice('Message not sent',(err.message||'').toLowerCase().includes('active subscriber')?'Sending messages requires an active Premium subscription.':err.message||'Please try again.');}finally{button.disabled=false;}});
$('#refresh-discover')?.addEventListener('click',()=>loadProfiles('#discover-profiles'));$('#refresh-matches')?.addEventListener('click',loadMatches);
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeUrl(v){try{const u=new URL(v);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
async function likeProfile(id,button){if(!supabase||!currentUser){notice('Sign in required','Please sign in to express interest in a profile.');return;}button.disabled=true;try{const {error}=await supabase.from('likes').upsert({from_user:currentUser.id,to_user:id},{onConflict:'from_user,to_user'});if(error)throw error;button.textContent='♥ Liked';button.classList.remove('btn-blue');button.classList.add('btn-outline');const {count}=await supabase.from('likes').select('id',{count:'exact',head:true}).eq('from_user',currentUser.id);$('#stat-likes').textContent=String(count||0);notice('Interest sent','Your interest was saved. A match is created only if the other person also likes your profile.');}catch(e){notice('Could not like profile',e.message||'Please try again.');button.disabled=false;}}
function openPremiumPlans(){if(!currentUser){notice('Sign in first','Log in before choosing a subscription.');return;}showDashboardView('premium');window.scrollTo({top:0,behavior:'smooth'});}
function closePremiumPlans(){showDashboardView('messages');window.scrollTo({top:0,behavior:'smooth'});}
$('#subscription-choose-plan')?.addEventListener('click',openPremiumPlans);
$('#premium-back')?.addEventListener('click',closePremiumPlans);
document.addEventListener('click',e=>{const cta=e.target.closest('[data-premium-plans]');if(cta){e.preventDefault();openPremiumPlans();}});
$('#menu')?.addEventListener('click',()=>{const n=$('#nav'),open=n.classList.toggle('open');$('#menu').setAttribute('aria-expanded',String(open));});document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>{$('#nav').classList.remove('open');$('#menu').setAttribute('aria-expanded','false');}));$('#close-modal')?.addEventListener('click',()=>modal.close());$('#notice-ok')?.addEventListener('click',()=>modal.close());$('#year').textContent=new Date().getFullYear();renderPrices();setAuthMode('login');if(supabase)supabase.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;if(!currentUser){$('#member-dashboard').hidden=true;$('#profile-onboarding').hidden=true;$('#subscription-gate').hidden=true;$('#auth-card').closest('.hero').hidden=false;document.querySelector('.site-header').hidden=true;document.body.classList.remove('is-authenticated');}});refreshSession().then(()=>handlePaymentReturn());


})();
