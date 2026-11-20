'use strict';
const $ = selector => document.querySelector(selector);
const esc = value => String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const pages={inicio:['Visão geral','grid'],lancamentos:['Lançamentos','list'],planejamento:['Planejamento','target'],mercado:['Mercado','market']};
const dialog=$('#dialog');
let mode=localStorage.getItem('organizando.mode')==='personal'?'personal':'demo';
let data=readData(mode);
let selectedMonth=thisMonth, filter='all', activeTab={stocks:'large',crypto:'large'};
let marketData={...initialMarket}, marketState={stocks:'snapshot',crypto:'snapshot'};
let pending={stocks:false,crypto:false}, toastTimer;
function notify(message){clearTimeout(toastTimer);$('#toast').textContent=message;toastTimer=setTimeout(()=>$('#toast').textContent='',4600)}
function page(){const key=location.hash.slice(1);return Object.hasOwn(pages,key)?key:'inicio'}
function monthSelector(){
  const months=new Set([selectedMonth,...data.entries.map(row=>row.date.slice(0,7)),...Array.from({length:37},(_,i)=>shiftMonth(thisMonth,i-24))]);
  return `<label class="selectbox">${ic('calendar')}<select id="select-month" aria-label="Mês do painel">${[...months].sort().reverse().map(month=>`<option value="${month}" ${month===selectedMonth?'selected':''}>${capFirst(titleMonth(month,'short'))}</option>`).join('')}</select></label>`;
}
function head(key){
  let tools='';
  if(key==='inicio'||key==='lancamentos')tools=monthSelector()+`<button class="primary" data-act="entry">${ic('plus')} Novo lançamento</button>`;
  if(key==='planejamento')tools=`<button class="primary" data-act="plan">${ic('plus')} Novo plano</button>`;
  return `<div class="page-head"><div><div class="eyebrow">${key==='mercado'?'Cotações em reais':'Painel financeiro'}</div><h1>${pages[key][0]}<span class="punct">.</span></h1></div><div class="head-tools">${tools}</div></div>`;
}
function spark(rows,type){
  const buckets=Array(10).fill(0);
  for(const row of rows.filter(r=>r.type===type))buckets[Math.min(9,Math.floor((Number(row.date.slice(-2))-1)/3))]+=row.amount;
  const max=Math.max(...buckets,1);
  return `<div class="mini-bars ${type}" aria-hidden="true">${buckets.map(n=>`<b style="height:${Math.max(3,100*n/max)}%"></b>`).join('')}</div>`;
}
function metricAmount(value){return `<strong><small>${value<0?'− ':''}R$</small> ${esc(money(Math.abs(value)).replace(/^R\$\s*/,''))}</strong>`}
function metrics(){
  const rows=monthEntries(selectedMonth), sum=totals(rows);
  return `<section class="metrics" aria-label="Resumo do mês"><article class="metric dark">${balanceArt}<div class="metric-label">${ic('wallet')} Saldo do mês</div>${metricAmount(sum.in-sum.out)}<div class="metric-note">Entradas menos saídas</div></article>${['in','out'].map(type=>{
    const n=rows.filter(r=>r.type===type).length;
    return `<article class="metric"><div class="metric-label">${ic(type==='in'?'down':'up')} ${type==='in'?'Entradas':'Saídas'}</div>${metricAmount(sum[type])}<div class="metric-note">${n} ${n===1?'lançamento':'lançamentos'} no mês</div>${spark(rows,type)}</article>`;
  }).join('')}</section>`;
}
function chart(){
  const bars=Array.from({length:6},(_,i)=>{const month=shiftMonth(selectedMonth,i-5);return {month,...totals(monthEntries(month))}});
  const max=Math.max(1,...bars.flatMap(b=>[b.in,b.out]))/100;
  const scale=Math.pow(10,Math.floor(Math.log10(max)));
  const unit=Math.max(1, Math.ceil(max/3/scale*2)*scale/2);
  const top=unit*3;
  const axis=n=>n>=1000?num(n/1000)+' mil':num(n);
  const first=bars[0],last=bars[5];
  const name=b=>new Date(b.month+'-15T12:00:00').toLocaleDateString(pt,{month:'short'}).replace('.','');
  const info=b=>`${capFirst(titleMonth(b.month,'short'))} · Entradas ${money(b.in)} · Saídas ${money(b.out)}`;
  return `<article class="panel"><div class="panel-head flow-head"><div><h2>Fluxo de caixa</h2><p class="panel-sub">Entradas e saídas nos últimos 6 meses</p></div><div class="chart-legend"><span><b class="key"></b>Entradas</span><span><b class="key out"></b>Saídas</span></div></div><div class="plot" aria-label="Gráfico mensal em reais"><div class="axis" aria-hidden="true">${[3,2,1,0].map(i=>'<span>'+axis(i*unit)+'</span>').join('')}</div><div class="bars">${bars.map(b=>`<button class="bar-pair" aria-label="${info(b)}" data-chart="${info(b)}"><i class="bar" style="height:${b.in/top}%"></i><i class="bar out" style="height:${b.out/top}%"></i><span class="month">${name(b)}</span></button>`).join('')}</div></div><p class="plot-note" id="chart-note">${capFirst(titleMonth(first.month,'short'))} — ${titleMonth(last.month,'short')} · Valores em R$</p></article>`;
}
function goalItem(plan){
  const done=paid(plan);
  const pct=done?100:Math.min(100,Math.round(plan.saved*100/plan.target));
  const icon=plan.kind==='trip'?'plane':plan.kind==='bill'?'bill':'target';
  return `<div class="goal-item ${plan.kind==='bill'?'pay':''}"><div class="goal-top"><span class="goal-ico ${plan.kind==='bill'?'pay':''}">${ic(icon)}</span><div><div class="goal-name">${esc(plan.name)}</div><div class="muted">${done?'Pagamento registrado':dateLabel(plan.date)}</div></div><span class="goal-count">${pct}%</span></div><div class="track" role="progressbar" aria-label="${esc(plan.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div><div class="goal-fin"><span>${money(done?plan.target:plan.saved)} ${done?'pago':'reservados'}</span><span>de ${money(plan.target)}</span></div></div>`;
}
function sortedPlans(){return [...data.plans].sort((a,b)=>Number(paid(a))-Number(paid(b))||a.date.localeCompare(b.date))}
function goalsMini(){
  const plans=sortedPlans().filter(p=>!paid(p)).slice(0,2);
  return `<article class="panel"><div class="panel-head"><div><h2>Meus planos</h2><p class="panel-sub">Metas e pagamentos com data marcada</p></div><a class="textlink" href="#planejamento">Ver planos</a></div>${plans.length?plans.map(goalItem).join(''):'<div class="empty"><strong>Nenhum plano em aberto.</strong>Crie uma meta de viagem ou programe uma conta.</div><button class="secondary" data-act="plan">Criar plano</button>'}</article>`;
}
function quotePrice(price){return price.toLocaleString(pt,{style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:price<1?Math.min(10,Math.max(4,2-Math.floor(Math.log10(price)))):2})}
function marketCard(type) {
  const stocks=type==='stocks', tab=activeTab[type], group=marketData[type], rows=group[tab];
  const date=new Date(group.at).toLocaleString(pt,{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const provider=stocks?'<a href="https://brapi.dev" target="_blank" rel="noreferrer">brapi</a>':'<a href="https://coinpaprika.com" target="_blank" rel="noreferrer">CoinPaprika</a>';
  let status=marketState[type]==='error'?'API indisponível · última consulta salva':marketState[type]==='snapshot'?'Consulta arquivada':'Consulta';
  if(pending[type]) status='Atualizando · consulta anterior';
  return `<article class="market-card"><div class="panel-head"><div class="market-title"><span class="market-ico ${type}">${ic(stocks?'market':'bitcoin')}</span><div><h3>${stocks?'Ações da B3':'Criptomoedas'}</h3><p class="panel-sub">${stocks?'Variação no pregão':'Variação em 24 horas'}</p></div></div><div class="tabs" aria-label="Ranking de ${stocks?'ações':'criptos'}">${Object.entries({large:'Maiores',up:'Altas',down:'Quedas'}).map(([id,label])=>`<button data-act="rank" data-type="${type}" data-id="${id}" aria-pressed="${id===tab}">${label}</button>`).join('')}</div></div><table class="market-table" aria-label="${stocks?'Ações':'Criptomoedas'} · ${{large:'Maiores por valor de mercado',up:'Maiores altas',down:'Maiores quedas'}[tab]}"><thead><tr><th>#</th><th>Ativo</th><th>Cotação</th><th>Var. %</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${String(i+1).padStart(2,'0')}</td><td><b>${esc(r.symbol)}</b><small title="${esc(r.name)}">${esc(r.name)}</small></td><td>${quotePrice(r.price)}</td><td class="${r.change>0?'value-up':r.change<0?'value-down':''}">${r.change==null?'—':(r.change>0?'+':'')+r.change.toLocaleString(pt,{minimumFractionDigits:2,maximumFractionDigits:2})+'%'}</td></tr>`).join('')||'<tr><td colspan="4">Nenhum ativo com essa variação.</td></tr>'}</tbody></table><p class="source">${provider} · ${status} em ${date}</p></article>`;
}
function market(standalone=false){
  return `<section id="market"><div class="section-head ${standalone?'nospace':''}"><h2>${standalone?'Rankings de mercado':'Radar de mercado'}<span class="punct">.</span></h2><button class="subtle" data-act="refresh" ${pending.stocks||pending.crypto?'disabled':''}>${ic('refresh')} Atualizar</button></div><div class="market-grid">${marketCard('stocks')}${marketCard('crypto')}</div><details class="method"><summary>Como os rankings são calculados</summary><p>As maiores são ordenadas pelo valor de mercado. Na B3, cada emissor aparece uma vez nesse ranking, com sua classe mais negociada. As altas e quedas consideram cada classe de ação ou unit negociada em lote padrão (incluindo códigos com sufixo B). A variação compara o preço do pregão ao fechamento anterior. Nas criptos, a variação cobre 24 horas. Os rankings abrangem os ativos com preço e volume informados pelas APIs na consulta: ${marketData.stocks.count} papéis e ${marketData.crypto.count} criptomoedas. Os horários indicam a consulta aos provedores.</p></details></section>`;
}
function ledger(){
  const all=monthEntries(selectedMonth);
  const rows=all.filter(r=>filter==='all'||r.type===filter).sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
  return `<article class="panel"><div class="panel-head"><div><h2>Movimentações do mês</h2><p class="panel-sub">${all.length} ${all.length===1?'lançamento registrado':'lançamentos registrados'}</p></div></div><div class="filters">${Object.entries({all:'Todos',in:'Entradas',out:'Saídas'}).map(([k,v])=>`<button class="filter-btn ${filter===k?'on':''}" data-act="filter" data-id="${k}" aria-pressed="${filter===k}">${v}</button>`).join('')}</div>${rows.length?`<div class="table-wrap"><table class="ledger"><thead><tr><th>Descrição</th><th>Data</th><th>Categoria</th><th>Valor</th><th><span aria-label="Ações"></span></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${dateLabel(r.date)}</td><td>${esc(r.category)}</td><td class="${r.type==='in'?'value-up':'value-down'}">${r.type==='in'?'+':'−'} ${money(r.amount)}</td><td><button class="iconbtn" aria-label="Editar ${esc(r.name)}" data-act="entry" data-id="${esc(r.id)}">${ic('edit')}</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Nenhuma movimentação neste filtro.</div>'}</article>`;
}
function planning(){
  const plans=sortedPlans();
  if(!plans.length)return '<section class="panel"><h2>Seu primeiro plano</h2><p class="empty">Escolha um pagamento, uma viagem ou outra meta. Defina o valor e a data para acompanhar quanto falta reservar.</p><button class="secondary" data-act="plan">Criar plano</button></section>';
  return '<section class="plan-grid">'+plans.map(p=>{
    const done=paid(p),missing=Math.max(0,p.target-p.saved);
    const [y,m]=p.date.split('-').map(Number);
    const months=Math.max(1,(y-now.getFullYear())*12+m-now.getMonth());
    const message=p.date<today?'Prazo encerrado':`Reserva mensal até o prazo · ${money(Math.ceil(missing/months))}`;
    return `<article class="plan-card"><div class="eyebrow">${{bill:'Pagamento',trip:'Viagem',goal:'Meta'}[p.kind]}</div>${goalItem(p)}<div class="big-detail">${done?'Pago':missing===0?'Meta atingida':money(missing)}</div><p class="muted">${done?'Despesa registrada nos lançamentos.':missing===0?'Todo o valor já está reservado.':'Falta reservar · '+message}</p><div class="plan-actions">${!done&&missing>0?`<button class="secondary" data-act="reserve" data-id="${p.id}">Reservar</button>`:''}${p.kind==='bill'&&!done?`<button class="secondary" data-act="pay" data-id="${p.id}">Registrar pagamento</button>`:''}${!done?`<button class="iconbtn" data-act="plan" data-id="${p.id}" aria-label="Editar ${esc(p.name)}">${ic('edit')}</button>`:''}</div></article>`;
  }).join('')+'</section>';
}
function render(){
  const key=page();
  document.title=pages[key][0]+' · Organizando';
  $('#mode-label').textContent=mode==='demo'?'Demonstração':'Meus dados';
  $('#nav').innerHTML=Object.entries(pages).map(([id,[name,icon]])=>`<a href="#${id}" ${id===key?'aria-current="page"':''}>${ic(icon)}${name}</a>`).join('');
  $('#main').innerHTML=head(key)+(key==='inicio'?metrics()+'<section class="insight-grid">'+chart()+goalsMini()+'</section>'+market():key==='mercado'?market(true):key==='lancamentos'?ledger():planning());
}
function updateMarket(){
  const el=$('#market');
  if(!el)return;
  const opened=el.querySelector('details').open;
  const focus=document.activeElement?.dataset;
  el.outerHTML=market(page()==='mercado');
  if(opened)$('#market details').open=true;
  if(focus?.act==='rank')document.querySelector(`[data-act="rank"][data-type="${focus.type}"][data-id="${focus.id}"]`)?.focus({preventScroll:true});
}
async function refreshMarket(type,force=false){
  if(pending[type])return;
  const cacheKey='organizando.market.v1.'+type;
  if(!force){
    try{const item=JSON.parse(localStorage.getItem(cacheKey));if(item&&Array.isArray(item.large)&&item.at>=marketData[type].at){marketData[type]=item;marketState[type]='saved';if(Date.now()-item.at<MARKET_TTL){updateMarket();return}}}catch{}
  }
  pending[type]=true;updateMarket();
  try{
    const result=await fetch(urls[type],{signal:AbortSignal.timeout(18000),cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
    if(!result.ok)throw Error('Falha na consulta');
    const snapshot=rankMarket(type,await result.json());
    marketData[type]=snapshot;marketState[type]='fresh';
    try{localStorage.setItem(cacheKey,JSON.stringify(snapshot))}catch{}
  }catch{marketState[type]='error'}finally{pending[type]=false;updateMarket()}
}
function refreshBoth(force){for(const type of ['stocks','crypto'])refreshMarket(type,force)}

