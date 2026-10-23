const menu=document.querySelector('.menu'),nav=document.querySelector('nav');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);menu.textContent=open?'닫기':'메뉴'});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');nav.classList.remove('open');menu.textContent='메뉴'}));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){menu.setAttribute('aria-expanded','false');nav.classList.remove('open');menu.textContent='메뉴';menu.focus();}});
document.getElementById('year').textContent=new Date().getFullYear();
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 const type=button.dataset.filter,photos=type==='사진';
 document.querySelector('.gallery-feature').hidden=photos;
 document.getElementById('gallery-empty').hidden=!photos;
 document.getElementById('gallery-count').textContent=photos?'사진 0건':type==='영상'?'영상 1건':'전체 1건 · 영상 1건';
}));
document.querySelectorAll('[data-project-filter]').forEach(button=>button.addEventListener('click',()=>{
 const category=button.dataset.projectFilter;
 document.querySelectorAll('[data-project-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 document.getElementById('projects-healing').hidden=category!=='healing';
 document.getElementById('projects-education').hidden=category!=='education';
 document.getElementById('project-category-description').textContent=category==='healing'?'2020–2026 · 통합예술치유 사업':'2021–2026 · 영화·통기타 예술교육 사업';
}));
if(new URLSearchParams(window.location.search).get('field')==='education')document.querySelector('[data-project-filter="education"]')?.click();