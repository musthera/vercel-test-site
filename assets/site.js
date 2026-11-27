const menu=document.querySelector('.menu'),nav=document.querySelector('nav');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);menu.textContent=open?'닫기':'메뉴'});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');nav.classList.remove('open');menu.textContent='메뉴'}));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){menu.setAttribute('aria-expanded','false');nav.classList.remove('open');menu.textContent='메뉴';menu.focus();}});
document.getElementById('year').textContent=new Date().getFullYear();
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 const type=button.dataset.filter;
 const items=[...document.querySelectorAll('[data-gallery-type]')];
 items.forEach(item=>{item.hidden=type!=='전체'&&item.dataset.galleryType!==type});
 const count=items.filter(item=>!item.hidden).length;
 document.getElementById('gallery-empty').hidden=count>0;
 const labels={'전시':'작품전시회 영상','영상':'작품발표 영상','사진':'활동 영상'};
 const summary=Object.keys(labels).map(key=>({label:labels[key],count:items.filter(item=>item.dataset.galleryType===key).length})).filter(entry=>entry.count>0).map(entry=>entry.label+' '+entry.count+'건');
 document.getElementById('gallery-count').textContent=type==='전체'?'전체 '+items.length+'건 · '+summary.join(' · '):labels[type]+' '+count+'건';
}));
document.querySelectorAll('[data-project-filter]').forEach(button=>button.addEventListener('click',()=>{
 const category=button.dataset.projectFilter;
 document.querySelectorAll('[data-project-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 document.getElementById('projects-healing').hidden=category!=='healing';
 document.getElementById('projects-education').hidden=category!=='education';
 document.getElementById('project-category-description').textContent=category==='healing'?'2020 ~ 2026 · 통합예술치유 사업':'2021 ~ 2026 · 영화·통기타 예술교육 사업';
}));
if(new URLSearchParams(window.location.search).get('field')==='education')document.querySelector('[data-project-filter="education"]')?.click();