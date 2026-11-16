(()=>{
  'use strict';
  const dataset=window.TURBINE_OCCUPATION_DATA;
  if(!dataset)return;
  const {roles,groups,stages,special}=dataset;
  const groupsById=Object.fromEntries(groups.map(x=>[x.id,x]));
  const stageById=Object.fromEntries(stages.map(x=>[x.id,x]));
  const byId=Object.fromEntries(roles.map(x=>[x.id,x]));
  const params=new URLSearchParams(window.location.search);
  const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n};
  const attr=(node,obj)=>{for(const [k,v] of Object.entries(obj))node.setAttribute(k,v);return node};
  const a=(label,href,cls)=>{const v=el('a',cls,label);v.href=href;return v};
  const curatedRoleIds=new Set(["accountant", "architect", "bookkeeper", "business-consultant", "car-mechanic", "chief-executive-officer", "cleaning-company-owner", "commercial-farmer", "construction-company-owner", "dentist-practice-owner", "electrician", "estate-agent", "garden-services-business-owner", "gardener", "hair-salon-owner", "logistics-company-owner", "managed-service-provider-owner", "manufacturing-business-owner", "marketing-agency-owner", "mining-services-owner", "nonprofit-director", "plumber", "property-manager", "qse-finance-manager", "qse-owner", "real-estate-agency-owner", "restaurant-owner", "retail-store-owner", "school-principal"]);
  const toProfile=(role,stage)=>curatedRoleIds.has(role.id)&&(!stage||stage==='all')?'roles/'+encodeURIComponent(role.id)+'.html':'occupation.html?role='+encodeURIComponent(role.id)+(stage&&stage!=='all'?'&stage='+encodeURIComponent(stage):'');
  const getStage = value => stageById[value]||null;
  const getGroup = role=>groupsById[role.group];
  const parent=document.getElementById('directory-results');
  if(parent){
    const form=document.getElementById('role-search-form');
    const q=document.getElementById('role-query');
    const group=document.getElementById('role-group');
    const stage=document.getElementById('role-stage');
    const summary=document.getElementById('directory-count');
    const note=document.getElementById('directory-stage-note');
    const more=document.getElementById('role-more');
    const reset=document.getElementById('role-reset');
    for(const g of groups)group.add(new Option(g.title,g.id));
    for(const s of stages)stage.add(new Option(s.label,s.id));
    q.value=params.get('q')||'';
    group.value=groupsById[params.get('group')]?params.get('group'):'all';
    stage.value=stageById[params.get('stage')]?params.get('stage'):'all';
    let limit=36;
    const index=roles.map(r=>({role:r,search:fold([r.name,getGroup(r)?.title,...(r.aliases||[])].join(' '))}));
    const updateUrl=()=>{
      const p=new URLSearchParams();if(q.value.trim())p.set('q',q.value.trim());if(group.value!=='all')p.set('group',group.value);if(stage.value!=='all')p.set('stage',stage.value);
      const path=window.location.pathname;try{window.history.replaceState(null,'',path+(p.toString()?'?'+p.toString():''));}catch(_){/* Null-origin preview sandboxes forbid URL history mutation. Search remains functional. */}
    };
    function render(){
      const term=fold(q.value);
      const tokens=term.split(' ').filter(Boolean);
      const list=index.filter(({role,search})=>(group.value==='all'||role.group===group.value)&&tokens.every(token=>search.includes(token))).map(({role})=>role);
      parent.replaceChildren();
      const select=document.createDocumentFragment();
      for(const role of list.slice(0,limit)){
        const sector=getGroup(role);const card=el('article','occupation-card');
        const kicker=el('div','occupation-category',sector.title);const title=el('h3');
        title.append(a(role.name,toProfile(role,stage.value)));
        const desc=el('p',null,sector.scenario);
        const links=el('div','occupation-actions');links.append(a('See my business story →',toProfile(role,stage.value)));
        links.append(a('Industry journey ↗',sector.link,'minor-link'));
        card.append(kicker,title,desc,links);select.append(card);
      }
      parent.append(select);
      summary.textContent=list.length+' matching occupations from '+roles.length+' curated roles'+(term?' for “'+q.value.trim()+'”':'')+'.';
      more.hidden=list.length<=limit;
      const context=getStage(stage.value);
      note.hidden=!context;
      if(context){note.replaceChildren();const box=el('div');box.append(el('div','eyebrow','BUSINESS CONTEXT'),el('h3',null,context.heading),el('p',null,context.story));
        box.append(a('Explore this stage →',context.next,'story-next-link'));note.append(box);
      }
      if(list.length===0){const empty=el('div','directory-empty');empty.append(el('h3',null,'No exact occupation match yet.'),el('p',null,'Try a broader word such as garden, property, retail, finance or service. Browse an industry when your exact title is not listed.'));
        empty.append(a('Browse all industries →','industries.html','btn ghost'));parent.append(empty);
      }
      updateUrl();
      return list.length;
    }
    form.addEventListener('submit',e=>{e.preventDefault();limit=36;const count=render();window.TURBINE_Telemetry?.emit('occupation_search',{query_length:q.value.trim().length,results_count:count,category:group.value,stage:stage.value})});
    q.addEventListener('input',()=>{limit=36;render()});
    group.addEventListener('change',()=>{limit=36;render()});
    stage.addEventListener('change',()=>{limit=36;render()});
    reset.addEventListener('click',()=>{q.value='';group.value='all';stage.value='all';limit=36;render();q.focus()});
    more.addEventListener('click',()=>{limit+=48;render()});
    render();
  }

  const profile=document.getElementById('occupation-profile');
  if(profile){
    const rid=params.get('role');const role=byId[rid];
    if(!role)return;
    const g=getGroup(role);const selected=getStage(params.get('stage'));
    const personal=special[rid]||null;
    const outcome=personal?.title||('As a '+role.name.toLowerCase()+', you should know what matters next and how the work connects to payment.');
    const story=personal?.story||('Consider a typical day in '+g.title.toLowerCase()+'. '+g.scenario+' The intended BusinessOS journey should keep the original request, the people responsible and the resulting financial decisions together.');
    const steps=personal?.steps||g.steps;
    profile.replaceChildren();
    const crumb=el('div','occupation-crumb');crumb.append(a('All occupations','occupations.html'),el('span',null,' / '+g.title));
    const kicker=el('div','eyebrow','YOUR END IN MIND');
    const title=el('h2',null,outcome);
    const scene=el('p','occupation-scene',story);
    const result=el('div','occupation-result');result.append(el('h3',null,'What becomes easier?'),el('p',null,'Know the customer, the promise, the work, the person responsible and the money attached to it. Make the next decision from one connected business context.'));
    profile.append(crumb,kicker,title,scene,result);
    const cols=el('div','profile-columns');
    const first=el('div');first.append(el('div','eyebrow','FIVE STEPS FROM REQUEST TO RESULT'),el('h3',null,'Follow one business journey'));
    const ol=el('ol','profile-steps');steps.forEach((step,i)=>{const li=el('li');li.append(el('span','timeline-no',String(i+1).padStart(2,'0')),el('span',null,step));ol.append(li)});first.append(ol);
    const second=el('div','profile-side');second.append(el('div','eyebrow','THE BUSINESS AROUND YOUR WORK'),el('h3',null,'One working story. Different levels of responsibility.'));
    const sizes=el('p',null,'A person working alone needs clarity. A growing team needs handoffs. A QSE needs suitable authority, commercial visibility and evidence. Medium and enterprise organisations require additional controls, subject to qualification.');second.append(sizes);
    const focus=el('div','stage-focus compact');
    if(selected){focus.append(el('div','eyebrow','YOUR SELECTED CONTEXT'),el('h3',null,selected.heading),el('p',null,selected.story));focus.append(a('Explore the '+selected.label+' journey →',selected.next,'story-next-link'));
    }else{focus.append(el('h3',null,'Which business stage fits you?'),el('p',null,'The same role can operate in a sole proprietorship, an SME, a QSE or an enterprise. Choose the stage that sounds like your organisation.'));
      const stageNav=el('div','profile-stage-tags');
      for(const s of stages)stageNav.append(a(s.label,toProfile(role,s.id)));
      focus.append(stageNav);
    }
    second.append(focus);cols.append(first,second);profile.append(cols);
    const next=el('section','profile-next');next.append(el('div','eyebrow','KEEP FOLLOWING THE STORY'),el('h3',null,'See the related industry, then the complete journey.'));
    const links=el('div','cta-row');links.append(a(g.title+' →',g.link,'btn primary'),a('Six connected business journeys ↗','journeys.html','btn ghost'),a('How adoption works ↗','getting-started.html','btn ghost'),a('Search another occupation ↗','occupations.html','btn ghost'));
    next.append(links);profile.append(next,el('p','section-footnote','This describes an intended operating journey. Specialist regulatory, statutory and financial capabilities must be independently qualified before a production commitment.'));
    document.title=role.name+' | How TURBINE could fit your work | TURBINE BusinessOS';
    const meta=document.querySelector('meta[name=description]');if(meta)meta.content='Explore how TURBINE could connect the everyday customer, operational and financial work of a '+role.name.toLowerCase()+'.';
    const h1=document.querySelector('main h1');if(h1)h1.textContent=role.name+': see your work as one connected story.';
    const heroLead=document.querySelector('main .page-hero .lead');if(heroLead)heroLead.textContent='This is about the day you actually have, not a list of applications you have to master.';
  }
})();
