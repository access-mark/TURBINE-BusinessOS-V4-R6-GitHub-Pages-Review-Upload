(()=>{
  'use strict';
  const root=document.documentElement;
  const theme=document.getElementById('theme');
  const menu=document.getElementById('menu');
  const mobile=document.getElementById('mobile-nav');
  const safeStorage={
    read(k){try{return window.localStorage.getItem(k)}catch(_){return null}},
    write(k,v){try{window.localStorage.setItem(k,v)}catch(_){} }
  };
  if(safeStorage.read('turbine-theme')==='light')root.dataset.theme='light';
  const isLight=()=>root.dataset.theme==='light';
  function updateTheme(){
    if(!theme)return;
    const action=isLight()?'Dark':'Light';
    theme.textContent=isLight()?'◑ Dark mode':'◐ Light mode';
    theme.setAttribute('aria-label',`Switch to ${action.toLowerCase()} mode`);
    theme.setAttribute('title',`Switch to ${action.toLowerCase()} mode`);
    theme.setAttribute('aria-pressed',String(isLight()));
  }
  updateTheme();
  theme?.addEventListener('click',()=>{
    root.dataset.theme=isLight()?'dark':'light';
    safeStorage.write('turbine-theme',root.dataset.theme);
    updateTheme();
  });
  function closeMenu(returnFocus=false){
    if(!mobile||!menu)return;
    mobile.classList.remove('open');
    menu.setAttribute('aria-expanded','false');
    menu.setAttribute('aria-label','Open navigation');
    if(returnFocus)menu.focus();
  }
  menu?.setAttribute('aria-label','Open navigation');
  menu?.addEventListener('click',()=>{
    if(!mobile)return;
    const willOpen=!mobile.classList.contains('open');
    mobile.classList.toggle('open',willOpen);
    menu.setAttribute('aria-expanded',String(willOpen));
    menu.setAttribute('aria-label',willOpen?'Close navigation':'Open navigation');
  });
  mobile?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu()});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&mobile?.classList.contains('open'))closeMenu(true);
  });
  document.addEventListener('click',e=>{
    if(mobile?.classList.contains('open')&&!mobile.contains(e.target)&&!menu?.contains(e.target))closeMenu();
  });
  window.addEventListener('resize',()=>{if(window.innerWidth>1120)closeMenu()});

  // Page-chapter navigation: desktop remains visible; small layouts collapse.
  const chapterNav=document.querySelector('[data-chapters]');
  if(chapterNav){
    const toggle=chapterNav.querySelector('.chapter-toggle');
    const links=chapterNav.querySelector('.chapter-links');
    let wasCompact=null;
    function chapterViewport(){
      const compact=window.matchMedia('(max-width:1120px)').matches;
      if(compact!==wasCompact){
        links.hidden=compact;
        toggle?.setAttribute('aria-expanded',String(!compact));
        wasCompact=compact;
      }
    }
    chapterViewport();
    window.addEventListener('resize',chapterViewport,{passive:true});
    toggle?.addEventListener('click',()=>{
      links.hidden=!links.hidden;
      toggle.setAttribute('aria-expanded',String(!links.hidden));
    });
    links.addEventListener('click',e=>{
      if(e.target.closest('a')&&window.matchMedia('(max-width:1120px)').matches){
        links.hidden=true;toggle.setAttribute('aria-expanded','false');
      }
    });
    const chapterLinks=[...links.querySelectorAll('a[href^="#"]')];
    const sections=chapterLinks.map(a=>document.getElementById(a.hash.slice(1)));
    if('IntersectionObserver' in window){
      const obs=new IntersectionObserver(()=>{
        let current=null;
        for(let i=0;i<sections.length;i++){
          const sec=sections[i];if(sec&&sec.getBoundingClientRect().top<=195)current=i;
        }
        if(current===null)current=0;
        chapterLinks.forEach((a,i)=>{
          if(i===current)a.setAttribute('aria-current','location');
          else a.removeAttribute('aria-current');
        });
      },{rootMargin:'-110px 0px -70% 0px'});
      sections.forEach(el=>{if(el)obs.observe(el)});
    }
  }

  const form=document.querySelector('#enquiry');
  const status=document.querySelector('#form-status');
  const addr=document.querySelector('meta[name="contact-email"]')?.content?.trim()||'';
  if(form&&status&&!addr){
    status.textContent='Preview only: no approved enquiry destination has been configured. Nothing entered here is transmitted.';
    status.classList.add('status-notice');
  }
  form?.addEventListener('submit',e=>{
    e.preventDefault();
    if(!form.reportValidity())return;
    if(!addr){
      if(status)status.textContent='Enquiry not sent. This preview has no approved contact destination. No trial has been created.';
      window.TURBINE_Telemetry?.emit('contact_attempt_blocked');
      return;
    }
    const fields=[...new FormData(form).entries()].map(([k,v])=>`${k}: ${v}`).join('\n');
    const requestType=form.querySelector('[name="type"]')?.value||'Enquiry';
    const subject=encodeURIComponent('TURBINE BusinessOS — '+requestType);
    const body=encodeURIComponent(fields+'\n\nPrepared from TURBINE website; no trial tenant has been provisioned.');
    window.location.href=`mailto:${encodeURIComponent(addr)}?subject=${subject}&body=${body}`;
    if(status)status.textContent='If your email application opens, review and send the draft to complete your enquiry. This website does not confirm delivery.';
  });
})();
