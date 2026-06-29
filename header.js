(function(){
  var css=[
    /* shared loading animation */
    '@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}',
    '.loading{animation:pulse 1.4s ease-in-out infinite;pointer-events:none;}',
    /* skeleton block */
    '.skel{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:14px;}',
    '.skel-line{height:11px;background:rgba(255,255,255,0.07);border-radius:6px;margin-bottom:9px;}',
    /* header */
    '#page-header{margin-bottom:32px;}',
    '.sh-back{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:var(--text-dim2);text-decoration:none;font-family:var(--mono);margin-bottom:28px;transition:color 0.15s;}',
    '.sh-back:hover{color:var(--text);}',
    '.sh-badge{display:inline-flex;align-items:center;gap:8px;background:var(--accent-soft);border:1px solid rgba(139,148,116,0.3);color:var(--accent);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;padding:5px 13px;border-radius:100px;margin-bottom:8px;}',
    '.sh-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);flex-shrink:0;}',
    '.sh-deploy{font-family:var(--mono);font-size:10.5px;color:var(--text-dim2);opacity:0.5;margin-bottom:28px;min-height:14px;display:block;}',
    '.sh-deploy.loading{opacity:0.4;}',
  ].join('');
  var s=document.createElement('style');
  s.textContent=css;
  document.head.appendChild(s);

  function render(){
    var el=document.getElementById('page-header');
    if(!el)return;
    var backHref=el.dataset.backHref||'';
    var backLabel=el.dataset.backLabel||'';
    var badge=el.dataset.badge||'';
    var title=el.dataset.title||'';
    var deployPath=el.dataset.deployPath||'data/deploy.json';
    var uid='shd'+Math.random().toString(36).slice(2);

    var html='';
    if(backHref){
      html+='<a href="'+backHref+'" class="sh-back">'
        +'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 5-7 7 7 7"/></svg>'
        +backLabel+'</a><br>';
    }
    if(badge){
      html+='<div class="sh-badge"><span class="sh-dot"></span>'+badge+'</div>';
    }
    html+='<div class="sh-deploy loading" id="'+uid+'">— — —</div>';
    if(title){
      html+='<h1>'+title+'</h1>';
    }
    el.innerHTML=html;

    fetch(deployPath+'?v='+Date.now())
      .then(function(r){return r.json();})
      .then(function(d){
        var node=document.getElementById(uid);
        if(!node)return;
        node.classList.remove('loading');
        if(!d.deployedAt)return;
        var dt=new Date(new Date(d.deployedAt).getTime()+3600000);
        var pad=function(n){return String(n).padStart(2,'0');};
        node.textContent=dt.getUTCFullYear()+'-'+pad(dt.getUTCMonth()+1)+'-'+pad(dt.getUTCDate())+' '+pad(dt.getUTCHours())+':'+pad(dt.getUTCMinutes())+' GMT+1';
      }).catch(function(){
        var node=document.getElementById(uid);
        if(node)node.classList.remove('loading');
      });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',render);
  }else{
    render();
  }
})();
