'use strict';
const decode64=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
document.querySelectorAll('.activity-unlock').forEach(form=>{
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  const input=form.querySelector('input'),button=form.querySelector('button'),status=form.querySelector('[role="status"]'),card=form.closest('.activity-video');
  if(button.disabled)return;
  button.disabled=true;status.textContent='확인 중입니다.';
  try{
   const payload=JSON.parse(form.dataset.payload);
   const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(input.value),'PBKDF2',false,['deriveKey']);
   const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:decode64(payload.salt),iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
   const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode64(payload.iv)},key,decode64(payload.data));
   const id=new TextDecoder().decode(bytes);
   if(!/^[\w-]{11}$/.test(id))throw new Error('Invalid video');
   const player=card.querySelector('.activity-player'),iframe=document.createElement('iframe');
   iframe.src='https://www.youtube-nocookie.com/embed/'+id+'?rel=0';
   iframe.title=card.querySelector('h2').textContent;
   iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
   iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';
   player.replaceChildren(iframe);player.hidden=false;card.querySelector('.activity-poster').hidden=true;
   input.value='';form.hidden=true;card.querySelector('.activity-relock').hidden=false;
   status.textContent='';iframe.focus();
  }catch(error){status.textContent=window.isSecureContext?'비밀번호가 올바르지 않습니다. 다시 입력해 주세요.':'보안 연결(HTTPS)에서 다시 시도해 주세요.';input.select();}
  finally{button.disabled=false;}
 });
});
function lockActivity(card){
 card.querySelector('.activity-player').replaceChildren();card.querySelector('.activity-player').hidden=true;
 card.querySelector('.activity-poster').hidden=false;card.querySelector('.activity-unlock').hidden=false;card.querySelector('.activity-relock').hidden=true;
}
document.querySelectorAll('.activity-relock').forEach(button=>button.addEventListener('click',()=>{const card=button.closest('.activity-video');lockActivity(card);card.querySelector('input').focus();}));
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.activity-video[hidden]').forEach(lockActivity);}));
if(new URLSearchParams(location.search).get('category')==='activity')document.querySelector('[data-filter="사진"]')?.click();

