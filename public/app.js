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
let activeDashboardView='dashboard', selectedMatch=null, memberProfile=null;
function renderAuthState(){
  const authenticated=!!currentUser;
  document.body.classList.toggle('is-authenticated',authenticated);
  const dashboard=$('#member-dashboard'); if(dashboard) dashboard.hidden=!authenticated;
  if(currentUser){
    const name=currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || 'member';
    $('#member-name').textContent=name;
    $('#sidebar-member-name').textContent=name;
    $('#member-email').textContent=currentUser.email || '';
    $('#member-message').textContent='';
    showDashboardView(activeDashboardView);
  }
}
function showDashboardView(view){
  const allowed=['dashboard','discover','matches','messages','profile'];
  activeDashboardView=allowed.includes(view)?view:'dashboard';
  document.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==activeDashboardView);
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===activeDashboardView));
  const titles={dashboard:'Dashboard',discover:'Discover people',matches:'My matches',messages:'Messages',profile:'My profile'};
  $('#dashboard-title').textContent=titles[activeDashboardView];
  if(!currentUser)return;
  if(activeDashboardView==='discover')loadProfiles('#discover-profiles');
  if(activeDashboardView==='dashboard')loadProfiles('#dashboard-profiles');
  if(activeDashboardView==='matches')loadMatches();
  if(activeDashboardView==='messages')loadConversations();
  if(activeDashboardView==='profile')loadMyProfile();
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showDashboardView(b.dataset.view)));
$('#sign-out')?.addEventListener('click',doSignOut);$('#header-logout')?.addEventListener('click',doSignOut);
async function doSignOut(){if(!supabase)return;const {error}=await supabase.auth.signOut();if(error){$('#member-message').textContent=error.message;return;}currentUser=null;selectedMatch=null;document.body.classList.remove('is-authenticated');$('#member-dashboard').hidden=true;window.scrollTo({top:0,behavior:'smooth'});setMessage('You have logged out successfully.');}
async function refreshSession(){if(!supabase){setMessage('Setup required: add your Supabase Project URL and publishable key in Render environment settings.',true);return;}const {data,error}=await supabase.auth.getSession();if(error){setMessage(error.message,true);return;}currentUser=data.session?.user||null;renderAuthState();if(currentUser){await loadProfiles('#dashboard-profiles');}else setMessage('Enter your email and password to log in, or choose Sign Up to create an account.');}
$('#auth-form').addEventListener('submit',async e=>{e.preventDefault();if(!supabase){setMessage('Supabase is not configured. Please check the Render environment settings.',true);return;}if(authMode==='signup'&&!$('#signup-gender').value){setMessage('Please select your gender.',true);return;}if(authMode==='signup'&&!$('#age-check').checked){setMessage('Please confirm you are 18 or older.',true);return;}const email=$('#auth-email').value.trim(),password=$('#auth-password').value;$('#auth-submit').disabled=true;setMessage(authMode==='signup'?'Creating your account…':'Signing in…');try{let result;if(authMode==='signup'){result=await supabase.auth.signUp({email,password,options:{data:{display_name:$('#display-name').value.trim(),gender:$('#signup-gender').value,account_type:$('#account-type').value,age_confirmed:true}}});if(result.error)throw result.error;if(result.data.user&&!result.data.session){setMessage('Account created. Check your email to confirm your account, then log in.');return;}}else{result=await supabase.auth.signInWithPassword({email,password});if(result.error)throw result.error;}currentUser=result.data.user;activeDashboardView='dashboard';renderAuthState();await loadMyProfile();await loadProfiles('#dashboard-profiles');window.scrollTo({top:0,behavior:'smooth'});}catch(err){setMessage(err.message||'Could not complete request.',true);}finally{$('#auth-submit').disabled=false;}});
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
async function loadMyProfile(){if(!supabase||!currentUser)return;const {data,error}=await supabase.from('profiles').select('display_name,gender,city,bio,interests,account_type').eq('id',currentUser.id).maybeSingle();if(error){$('#profile-message').textContent=error.message;return;}memberProfile=data||{};$('#profile-display-name').value=memberProfile.display_name||currentUser.user_metadata?.display_name||'';$('#profile-gender').value=memberProfile.gender||currentUser.user_metadata?.gender||'';$('#profile-city').value=memberProfile.city||'Abuja';$('#profile-bio').value=memberProfile.bio||'';$('#profile-interests').value=(memberProfile.interests||[]).join(', ');}
$('#profile-form')?.addEventListener('submit',async e=>{e.preventDefault();if(!supabase||!currentUser)return;const button=e.submitter;button.disabled=true;$('#profile-message').textContent='Saving…';const values={id:currentUser.id,display_name:$('#profile-display-name').value.trim(),gender:$('#profile-gender').value||null,city:$('#profile-city').value.trim(),bio:$('#profile-bio').value.trim(),interests:$('#profile-interests').value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,20),account_type:memberProfile?.account_type||currentUser.user_metadata?.account_type||'regular',age_confirmed:true,updated_at:new Date().toISOString()};try{const {error}=await supabase.from('profiles').upsert(values,{onConflict:'id'});if(error)throw error;$('#profile-message').textContent='Profile saved successfully.';$('#member-name').textContent=values.display_name;$('#sidebar-member-name').textContent=values.display_name;}catch(err){$('#profile-message').textContent=err.message||'Could not save profile.';}finally{button.disabled=false;}});
async function loadMatches(){if(!supabase||!currentUser)return;const list=$('#matches-list');list.innerHTML='<p class="empty-state">Loading matches…</p>';const {data,error}=await supabase.from('matches').select('id,user_one,user_two,created_at').or(`user_one.eq.${currentUser.id},user_two.eq.${currentUser.id}`).order('created_at',{ascending:false});if(error){list.innerHTML=`<p class="empty-state">Could not load matches: ${escapeHtml(error.message)}</p>`;return;}if(!data?.length){list.innerHTML='<p class="empty-state">No matches yet. Visit Discover and like profiles to get started.</p>';$('#stat-matches').textContent='0';return;}const ids=[...new Set(data.map(m=>m.user_one===currentUser.id?m.user_two:m.user_one))];const {data:profiles}=await supabase.from('profiles').select('id,display_name,city').in('id',ids);const byId=Object.fromEntries((profiles||[]).map(p=>[p.id,p]));list.innerHTML=data.map(m=>{const id=m.user_one===currentUser.id?m.user_two:m.user_one,p=byId[id]||{};return `<article class="match-card"><div><h3>${escapeHtml(p.display_name||'Abuja Connect member')}</h3><p>${escapeHtml(p.city||'Abuja')} · Matched ${new Date(m.created_at).toLocaleDateString()}</p></div><button class="btn btn-blue" data-chat-match="${m.id}" data-other="${id}" data-name="${escapeHtml(p.display_name||'Member')}">Message</button></article>`}).join('');list.querySelectorAll('[data-chat-match]').forEach(b=>b.onclick=()=>{selectedMatch={id:b.dataset.chatMatch,other:b.dataset.other,name:b.dataset.name};showDashboardView('messages');});$('#stat-matches').textContent=String(data.length);}
async function loadConversations(){if(!supabase||!currentUser)return;const list=$('#conversation-list');list.innerHTML='<p class="empty-state">Loading matches…</p>';const {data,error}=await supabase.from('matches').select('id,user_one,user_two,created_at').or(`user_one.eq.${currentUser.id},user_two.eq.${currentUser.id}`).order('created_at',{ascending:false});if(error){list.innerHTML=`<p class="empty-state">Could not load conversations: ${escapeHtml(error.message)}</p>`;return;}if(!data?.length){list.innerHTML='<p class="empty-state">You need a mutual match before starting a conversation.</p>';$('#conversation-empty').hidden=false;$('#conversation-content').hidden=true;return;}const ids=[...new Set(data.map(m=>m.user_one===currentUser.id?m.user_two:m.user_one))];const {data:profiles}=await supabase.from('profiles').select('id,display_name').in('id',ids);const byId=Object.fromEntries((profiles||[]).map(p=>[p.id,p]));list.innerHTML=data.map(m=>{const other=m.user_one===currentUser.id?m.user_two:m.user_one,p=byId[other]||{};return `<button class="conversation-choice ${selectedMatch?.id===m.id?'active':''}" data-open-match="${m.id}" data-other="${other}" data-name="${escapeHtml(p.display_name||'Member')}">${escapeHtml(p.display_name||'Member')}<small>Open conversation</small></button>`}).join('');list.querySelectorAll('[data-open-match]').forEach(b=>b.onclick=()=>{selectedMatch={id:b.dataset.openMatch,other:b.dataset.other,name:b.dataset.name};loadMessages();});if(selectedMatch&&data.some(m=>m.id===selectedMatch.id)){loadMessages();}else{selectedMatch=null;$('#conversation-empty').hidden=false;$('#conversation-content').hidden=true;}const {count}=await supabase.from('messages').select('id',{count:'exact',head:true}).or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`);$('#stat-messages').textContent=String(count||0);}
async function loadMessages(){if(!supabase||!currentUser||!selectedMatch)return;$('#conversation-empty').hidden=true;$('#conversation-content').hidden=false;$('#conversation-heading').textContent=selectedMatch.name;const box=$('#message-list');box.innerHTML='<p class="empty-state">Loading messages…</p>';const {data,error}=await supabase.from('messages').select('id,sender_id,recipient_id,body,created_at').eq('match_id',selectedMatch.id).order('created_at',{ascending:true}).limit(100);if(error){box.innerHTML=`<p class="empty-state">Could not load messages: ${escapeHtml(error.message)}. Messaging may require an active subscription.</p>`;return;}if(!data?.length){box.innerHTML='<p class="empty-state">No messages yet. Say hello when your account has messaging access.</p>';return;}box.innerHTML=data.map(m=>`<div class="chat-bubble ${m.sender_id===currentUser.id?'mine':''}">${escapeHtml(m.body)}<small>${new Date(m.created_at).toLocaleString()}</small></div>`).join('');box.scrollTop=box.scrollHeight;}
$('#message-form')?.addEventListener('submit',async e=>{e.preventDefault();if(!supabase||!currentUser||!selectedMatch)return;const input=$('#message-input'),body=input.value.trim();if(!body)return;const button=e.submitter;button.disabled=true;try{const {error}=await supabase.from('messages').insert({match_id:selectedMatch.id,sender_id:currentUser.id,recipient_id:selectedMatch.other,body});if(error)throw error;input.value='';await loadMessages();}catch(err){notice('Message not sent',err.message.includes('active subscriber')?'Sending messages requires an active subscription. Subscription payment activation is not configured yet.':err.message||'Please try again.');}finally{button.disabled=false;}});
$('#refresh-discover')?.addEventListener('click',()=>loadProfiles('#discover-profiles'));$('#refresh-matches')?.addEventListener('click',loadMatches);
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeUrl(v){try{const u=new URL(v);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
async function likeProfile(id,button){if(!supabase||!currentUser){notice('Sign in required','Please sign in to express interest in a profile.');return;}button.disabled=true;try{const {error}=await supabase.from('likes').upsert({from_user:currentUser.id,to_user:id},{onConflict:'from_user,to_user'});if(error)throw error;button.textContent='♥ Liked';button.classList.remove('btn-blue');button.classList.add('btn-outline');const {count}=await supabase.from('likes').select('id',{count:'exact',head:true}).eq('from_user',currentUser.id);$('#stat-likes').textContent=String(count||0);notice('Interest sent','Your interest was saved. A match is created only if the other person also likes your profile.');}catch(e){notice('Could not like profile',e.message||'Please try again.');button.disabled=false;}}
$('#menu')?.addEventListener('click',()=>{const n=$('#nav'),open=n.classList.toggle('open');$('#menu').setAttribute('aria-expanded',String(open));});document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>{$('#nav').classList.remove('open');$('#menu').setAttribute('aria-expanded','false');}));$('#close-modal')?.addEventListener('click',()=>modal.close());$('#notice-ok')?.addEventListener('click',()=>modal.close());$('#year').textContent=new Date().getFullYear();renderPrices();setAuthMode('login');if(supabase)supabase.auth.onAuthStateChange((_event,session)=>{currentUser=session?.user||null;renderAuthState();if(currentUser){loadMyProfile();loadProfiles('#dashboard-profiles');}});refreshSession();


})();
