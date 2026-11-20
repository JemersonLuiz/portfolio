const MARKET_TTL = 15 * 60 * 1000;
const urls = {
  stocks: 'https://brapi.dev/api/quote/list?type=stock',
  crypto: 'https://api.coinpaprika.com/v1/tickers?quotes=BRL'
};
const valid = value => typeof value === 'number' && Number.isFinite(value);
function rankMarket(type, payload) {
  let rows;
  if (type === 'stocks') {
    if (payload.hasNextPage) throw new Error('Lista incompleta');
    rows = payload.stocks.filter(row => row.type === 'stock' && !row.stock.endsWith('F') && row.volume > 0)
      .map(row => ({symbol: row.stock, name: row.name, price: row.close, cap: row.market_cap, change: row.change, volume: row.volume}));
  } else {
    rows = payload.filter(row => row.quotes?.BRL?.volume_24h > 0)
      .map(row => ({symbol: row.symbol, name: row.name, price: row.quotes.BRL.price, cap: row.quotes.BRL.market_cap, change: row.quotes.BRL.percent_change_24h}));
  }
  rows = rows.filter(row => valid(row.price) && row.price > 0);
  if (!rows.length) throw new Error('Dados indisponíveis');
  let leaders = rows.filter(row => valid(row.cap) && row.cap > 0);
  if (type === 'stocks') {
    const companies = new Map();
    for (const row of leaders.sort((a,b) => b.volume - a.volume)) {
      const issuer = row.symbol.slice(0, 4);
      if (!companies.has(issuer)) companies.set(issuer, row);
    }
    leaders = [...companies.values()];
  }
  const changes = rows.filter(row => valid(row.change));
  return {
    at: Date.now(), count: rows.length,
    large: leaders.sort((a,b) => b.cap - a.cap).slice(0,5),
    up: changes.filter(row => row.change > 0).sort((a,b) => b.change - a.change).slice(0,5),
    down: changes.filter(row => row.change < 0).sort((a,b) => a.change - b.change).slice(0,5)
  };
}
if (typeof module !== 'undefined') module.exports = {rankMarket, urls};

