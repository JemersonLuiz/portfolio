'use strict';
const option=(value,text,selected)=>`<option value="${esc(value)}" ${value===selected?'selected':''}>${esc(text)}</option>`;
function modal(title,body){
  $('#dialog-body').innerHTML=`<div class="dialog-head"><h2 id="dialog-title">${title}</h2><button class="iconbtn" data-act="close" aria-label="Fechar">${ic('close')}</button></div>${body}`;
  if(!dialog.open)dialog.showModal();
}
function buttons(label,id,remove=true){return `<div class="actions">${id&&remove?'<button type="button" class="remove" data-act="ask-remove">Excluir</button>':''}<button type="button" class="secondary" data-act="close">Cancelar</button><button class="primary" type="submit">${label}</button></div>`}
function amountField(name,label,value='',min='0.01',max='9999999999.99'){
  return `<label>${label}<input required name="${name}" type="number" inputmode="decimal" step="0.01" min="${min}" max="${max}" value="${value}"></label>`;
}
function wrapForm(action,id,fields,save,remove=true){return `<form data-form="${action}" data-id="${esc(id)}" data-mode="${mode}"><div class="form-fields">${fields}</div>${buttons(save,id,remove)}</form>`}
function workspaceModal(){
  modal('Seu espaço financeiro',`<p class="muted">Os lançamentos e planos ficam salvos neste navegador. A demonstração tem dados de exemplo para explorar o painel.</p>${[['personal','Meus dados','Seu espaço para registrar despesas, receitas e objetivos.'],['demo','Demonstração','Exemplos de movimentações e metas financeiras.']].map(([id,title,info])=>`<button class="mode-option ${mode===id?'active':''}" data-act="use-mode" data-id="${id}"><strong>${title} ${mode===id?ic('check'):''}</strong><span>${info}</span></button>`).join('')}`);
}
function entryModal(id){
  const r=data.entries.find(x=>x.id===id), type=r?.type||'out', linked=Boolean(r?.planId);
  const defaultDate=selectedMonth===thisMonth?today:selectedMonth+'-01';
  const fields=`<label>Descrição<input name="name" maxlength="80" required value="${esc(r?.name)}" placeholder="Ex.: Supermercado"></label><div class="fieldrow"><label>Tipo<select name="type" aria-label="Tipo" ${linked?'disabled':''}>${option('out','Saída',type)+option('in','Entrada',type)}</select></label>${amountField('amount','Valor (R$)',r?r.amount/100:'')}</div><div class="fieldrow"><label>Data<input name="date" type="date" required max="${today}" value="${defaultDate>today&&!r?today:(r?.date||defaultDate)}"></label><label>Categoria<select name="category" aria-label="Categoria">${categories[type].map(c=>option(c,c,r?.category)).join('')}</select></label></div>${linked?'<p class="muted">Este lançamento quita um pagamento planejado. Ao excluí-lo, o plano volta a ficar em aberto.</p>':''}`;
  modal(r?'Editar lançamento':'Novo lançamento',wrapForm('entry',id,fields,'Salvar lançamento'));
  if(linked)dialog.querySelector('[name="amount"]').readOnly=true;
}
function planModal(id){
  const p=data.plans.find(x=>x.id===id);
  const fields=`<label>Nome do plano<input name="name" required maxlength="80" value="${esc(p?.name)}" placeholder="Ex.: Viagem de férias"></label><div class="fieldrow"><label>Tipo<select name="kind" aria-label="Tipo">${Object.entries({trip:'Viagem',bill:'Pagamento',goal:'Outra meta'}).map(([k,v])=>option(k,v,p?.kind)).join('')}</select></label><label>Prazo<input type="date" name="date" required value="${p?.date||shiftMonth(thisMonth,1)+'-01'}"></label></div><div class="fieldrow">${amountField('target','Valor do plano (R$)',p?p.target/100:'')}${amountField('saved','Já reservado (R$)',(p?.saved||0)/100,'0')}</div>`;
  modal(p?'Editar plano':'Novo plano',wrapForm('plan',id,fields,'Salvar plano'));
}
function reserveModal(id){
  const p=data.plans.find(p=>p.id===id);if(!p||paid(p))return;
  modal('Reservar para o plano',wrapForm('reserve',id,`<p><b>${esc(p.name)}</b></p><p class="muted">Faltam ${money(p.target-p.saved)}. Registre quanto você separou para essa meta. O saldo do mês considera apenas receitas e despesas.</p>${amountField('amount','Valor a reservar (R$)','','0.01',(p.target-p.saved)/100)}`,'Salvar reserva',false));
}
function payModal(id){
  const p=data.plans.find(p=>p.id===id);if(!p||paid(p))return;
  modal('Registrar pagamento',wrapForm('pay',id,`<p>Registrar <b>${esc(p.name)}</b> como uma saída de <b>${money(p.target)}</b> e marcar o plano como pago.</p><label>Data do pagamento<input type="date" name="date" required max="${today}" value="${today}"></label><label>Categoria<select name="category" aria-label="Categoria">${categories.out.map(s=>option(s,s,'Outras despesas')).join('')}</select></label>`,'Registrar saída',false));
}
function askRemove(){
  const old=dialog.querySelector('form'), action=old.dataset.form,id=old.dataset.id;
  const row=(action==='entry'?data.entries:data.plans).find(r=>r.id===id);
  if(!row)return;
  modal('Confirmar exclusão',wrapForm(action==='entry'?'remove-entry':'remove-plan',id,`<p>Excluir <strong>${esc(row.name)}</strong> ${action==='entry'?'dos lançamentos':'do planejamento'}?</p>`,'Excluir',false));
}
async function saveForm(form){
  const action=form.dataset.form,id=form.dataset.id,selectedMode=form.dataset.mode,values=new FormData(form),get=k=>String(values.get(k)||'').trim();
  const run=()=>{
    if(mode!==selectedMode)throw Error('O espaço mudou. Abra o formulário novamente.');
    const next=readData(mode);
    const entry=next.entries.find(r=>r.id===id), plan=next.plans.find(p=>p.id===id);
    const entryAction=action==='entry'||action==='remove-entry';
    if(id&&!(entryAction?entry:plan))throw Error('Este item já foi removido.');
    if(!entryAction&&id&&next.entries.some(r=>r.planId===id))throw Error('Este plano já foi pago.');
    if(['plan','entry'].includes(action)&&!get('name'))throw Error('Preencha o nome ou a descrição.');
    let changedMonth;
    if(action==='entry'){
      const type=entry?.planId?'out':get('type');
      const item={...entry,id:id||crypto.randomUUID(),name:get('name'),amount:entry?.planId?entry.amount:parseCents(get('amount')),type,date:get('date'),category:get('category')};
      if(item.amount<=0||!categories[type]?.includes(item.category)||item.date>today)throw Error('Confira os dados do lançamento.');
      if(entry)Object.assign(entry,item);else next.entries.push(item);
      changedMonth=item.date.slice(0,7);
    }else if(action==='plan'){
      const item={id:id||crypto.randomUUID(),name:get('name'),date:get('date'),kind:get('kind'),target:parseCents(get('target')),saved:parseCents(get('saved'))};
      if(item.target<=0||item.saved>item.target)throw Error('O valor reservado deve ser igual ou inferior ao valor do plano.');
      if(plan)Object.assign(plan,item);else next.plans.push(item);
    }else if(action==='reserve'){
      const amount=parseCents(get('amount'));
      if(amount<=0||plan.saved+amount>plan.target)throw Error('Confira o valor que falta reservar.');
      plan.saved+=amount;
    }else if(action==='pay'){
      next.entries.push({id:crypto.randomUUID(),planId:id,name:plan.name,amount:plan.target,type:'out',category:get('category'),date:get('date')});
      changedMonth=get('date').slice(0,7);
    }else if(action==='remove-entry')next.entries=next.entries.filter(r=>r.id!==id);
    else if(action==='remove-plan')next.plans=next.plans.filter(p=>p.id!==id);
    localStorage.setItem('organizando.finance.v1.'+mode,JSON.stringify(next));
    if(changedMonth)selectedMonth=changedMonth;
    data=next;
  };
  if(navigator.locks)await navigator.locks.request('organizando.finance.'+mode,run);else run();
  dialog.close();render();
  notify(({entry:'Lançamento salvo.',plan:'Plano salvo.',reserve:'Reserva atualizada.',pay:'Pagamento registrado.', 'remove-entry':'Lançamento excluído.','remove-plan':'Plano excluído.'})[action]);
}
document.addEventListener('submit',async e=>{
  const form=e.target.closest('[data-form]');if(!form)return;e.preventDefault();
  const submit=form.querySelector('[type=submit]');if(submit.disabled)return;submit.disabled=true;
  try{await saveForm(form)}catch(error){let feedback=form.querySelector('[role=alert]');if(!feedback){feedback=document.createElement('p');feedback.setAttribute('role','alert');feedback.className='value-down';form.append(feedback)}feedback.textContent=error.message;submit.disabled=false}
});
document.addEventListener('click',e=>{
  const chart=e.target.closest('[data-chart]');if(chart)$('#chart-note').textContent=chart.dataset.chart;
  const button=e.target.closest('[data-act]');if(!button)return;
  const {act,id='',type}=button.dataset;
  switch(act){
    case 'workspace':workspaceModal();break;
    case 'use-mode':{
      mode=id;localStorage.setItem('organizando.mode',id);data=readData(mode);dialog.close();selectedMonth=thisMonth;render();break;
    }
    case 'close':dialog.close();break;
    case 'entry':entryModal(id);break;
    case 'plan':planModal(id);break;
    case 'reserve':reserveModal(id);break;
    case 'pay':payModal(id);break;
    case 'ask-remove':askRemove();break;
    case 'rank':activeTab[type]=id;updateMarket();break;
    case 'refresh':refreshBoth(true);break;
    case 'filter':filter=id;render();break;
  }
});
function chartHover(e){const btn=e.target.closest('[data-chart]');if(btn)$('#chart-note').textContent=btn.dataset.chart}
document.addEventListener('mouseover',chartHover);
document.addEventListener('focusin',chartHover);
document.addEventListener('change',e=>{
  if(e.target.id==='select-month'){selectedMonth=e.target.value;render()}
  if(e.target.name==='type'){dialog.querySelector('[name=category]').innerHTML=categories[e.target.value].map(c=>option(c,c)).join('')}
});
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);$('#main').focus({preventScroll:true})});
window.addEventListener('storage',e=>{
  if(e.key==='organizando.finance.v1.'+mode){data=readData(mode);render()}
  if(e.key==='organizando.mode'&&['demo','personal'].includes(e.newValue)){mode=e.newValue;data=readData(mode);if(dialog.open)dialog.close();render()}
});
document.querySelectorAll('[data-icon]').forEach(el=>el.outerHTML=ic(el.dataset.icon));
render();refreshBoth(false);
setInterval(()=>{if(!document.hidden)refreshBoth(false)},MARKET_TTL);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Object.values(marketData).some(s=>Date.now()-s.at>=MARKET_TTL))refreshBoth(false)});


