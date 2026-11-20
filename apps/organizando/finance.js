const pt = 'pt-BR';
const money = cents => (cents / 100).toLocaleString(pt, {style:'currency', currency:'BRL'});
const num = amount => amount.toLocaleString(pt, {maximumFractionDigits:2});
const pad = value => String(value).padStart(2,'0');
const isoDate = date => [date.getFullYear(),pad(date.getMonth()+1),pad(date.getDate())].join('-');
const now = new Date();
const today = isoDate(now);
const thisMonth = today.slice(0,7);
function shiftMonth(month, offset) {
  const [year, index] = month.split('-').map(Number);
  return isoDate(new Date(year,index-1+offset,1)).slice(0,7);
}
function titleMonth(month, format='long') {
  const date = new Date(month+'-15T12:00:00');
  return date.toLocaleDateString(pt,{month:format,year:'numeric'}).replace(' de ',' ').replace('.','');
}
const dateLabel = date => new Date(date+'T12:00:00').toLocaleDateString(pt,{day:'2-digit',month:'short',year:'numeric'}).replaceAll(' de ',' ');
const capFirst = text => text.charAt(0).toUpperCase()+text.slice(1);
const categories = {in:['Salário','Freelance','Rendimentos','Outras receitas'],out:['Moradia','Alimentação','Transporte','Lazer','Saúde','Educação','Viagem','Outras despesas']};
function demoData() {
  const entries = [];
  const budgets = [[5400,520,3100],[6200,800,3450],[5750,450,2600],[7050,630,4100],[6100,1150,3300],[6800,1800,3480]];
  budgets.forEach(([salary,extra,cost],i) => {
    const month = shiftMonth(thisMonth,i-5);
    const date = d => month+'-'+pad(i===5 ? Math.min(now.getDate(),d) : d);
    const samples=[['Salário mensal','in','Salário',salary,4],['Projeto freelance','in','Freelance',extra,12],['Aluguel','out','Moradia',cost*.49,5],['Supermercado','out','Alimentação',cost*.23,8],['Transporte do mês','out','Transporte',cost*.13,11],['Cinema e restaurantes','out','Lazer',cost*.15,15]];
    samples.forEach(([name,type,category,value,day],j) => entries.push({id:'demo-'+i+'-'+j,name,type,category,amount:Math.round(value*100),date:date(day)}));
  });
  return {entries,plans:[
    {id:'trip-demo',name:'Viagem ao Rio',kind:'trip',target:600000,saved:390000,date:shiftMonth(thisMonth,4)+'-15'},
    {id:'bill-demo',name:'Seguro do carro',kind:'bill',target:240000,saved:96000,date:shiftMonth(thisMonth,1)+'-12'}
  ]};
}
function readData(key) {
  const saved = localStorage.getItem('organizando.finance.v1.'+key);
  if (!saved) return key === 'demo' ? demoData() : {entries:[],plans:[]};
  const data=JSON.parse(saved);
  if (!Array.isArray(data.entries)||!Array.isArray(data.plans)) throw Error('Formato de dados inválido');
  return data;
}
function monthEntries(month) {return data.entries.filter(row => row.date.startsWith(month))}
function totals(rows) {
  return rows.reduce((sum,row)=>{sum[row.type]+=row.amount;return sum},{in:0,out:0});
}
function paid(plan) {return data.entries.some(row => row.planId === plan.id)}
function parseCents(value) {
  const amount = Number(value);
  if (value === '' || !Number.isFinite(amount) || amount < 0 || amount > 9999999999.99) throw Error('Confira o valor informado.');
  return Math.round(amount*100);
}

