// Only the selected chapter is promoted; other artwork remains lazy loaded.
function prepareChapter(hash) {
  if (!hash || !/^#spring-(section|work)-[\d-]+$/.test(hash)) return;
  const target=document.getElementById(hash.slice(1));
  if (!target) return;
  target.querySelectorAll('img').forEach((img,index)=>{
    if(index<2){img.loading='eager';img.fetchPriority='high';}
  });
}
prepareChapter(location.hash);
document.addEventListener('click',event=>{
  const link=event.target.closest('a[href^="#spring-"]');
  if(link)prepareChapter(link.getAttribute('href'));
  const button=event.target.closest('[data-youtube]');
  if(!button)return;
  const frame=document.createElement('iframe');
  frame.src='https://www.youtube-nocookie.com/embed/'+button.dataset.youtube+'?rel=0&autoplay=1';
  frame.title=button.getAttribute('aria-label');
  frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  frame.allowFullscreen=true;
  frame.referrerPolicy='strict-origin-when-cross-origin';
  button.replaceWith(frame);
});
const videos=document.querySelectorAll('video[data-poster]');
function revealPoster(video){video.poster=video.dataset.poster;delete video.dataset.poster;}
if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){revealPoster(entry.target);observer.unobserve(entry.target);}
  }),{rootMargin:'600px'});
  videos.forEach(video=>observer.observe(video));
}else videos.forEach(revealPoster);
