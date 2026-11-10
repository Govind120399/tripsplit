export const $=s=>document.querySelector(s);
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const fmt=(v,c='INR')=>new Intl.NumberFormat('en-IN',{style:'currency',currency:c,maximumFractionDigits:2}).format(v/100);
export const decimal=v=>(v/100).toFixed(2);
export const initials=name=>name.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
export function avatar(name,i=0){return `<span class="avatar color-${i%4}">${esc(initials(name))}</span>`;}
export function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3800);}
let opener;
export function sheet(title,body){opener=document.activeElement;$('#sheet-title').textContent=title;$('#sheet-body').innerHTML=body;$('#sheet').showModal();document.body.classList.add('modal-open');setTimeout(()=>$('#sheet-body input, #sheet-body button, #sheet-body select')?.focus(),50);}
export function closeSheet(){$('#sheet').close();document.body.classList.remove('modal-open');opener?.focus();}
export function celebrate(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;for(let i=0;i<20;i++){const dot=document.createElement('i');dot.className='confetti';dot.style.cssText=`left:${Math.random()*100}%;background:${['#6558f5','#2dd4bf','#ffb86b'][i%3]};animation-delay:${Math.random()*.4}s`;document.body.append(dot);setTimeout(()=>dot.remove(),1800);}}
export function field(label,name,type='text',value='',extra=''){return `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;}
export function errorBox(){return '<p class="form-error" role="alert"></p>';}
export function relative(t){const mins=Math.max(0,Math.floor((Date.now()-t)/60000));return mins<1?'Just now':mins<60?mins+'m ago':mins<1440?Math.floor(mins/60)+'h ago':new Date(t).toLocaleDateString('en-GB',{day:'numeric',month:'short'});}
export function icon(name){const paths={home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',trips:'<rect x="4" y="7" width="16" height="14" rx="3"/><path d="M9 7V4h6v3M8 11v6m8-6v6"/>',add:'<path d="M12 5v14M5 12h14"/>',balances:'<path d="M3 7h18v13H3zM3 7V4h15v3"/><path d="M16 12h5v4h-5z"/>',profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',arrow:'<path d="m9 5 7 7-7 7"/>',link:'<path d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 12a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-1 1"/>'};return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.arrow}</svg>`;}
