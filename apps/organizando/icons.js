const iconPaths={
moon:'<path d="M20.7 14A8.9 8.9 0 0 1 10 3.3 9 9 0 1 0 20.7 14Z"/>',
grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
list:'<path d="M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1"/>',
target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
market:'<path d="M3 20h18M5 16v-5m5 5V7m5 9v-5m5 5V3"/>',
bank:'<path d="m2 8 10-5 10 5M3 9h18M5 11v6m5-6v6m4-6v6m5-6v6M3 20h18"/>',
bitcoin:'<path d="M8 5h6c5 0 5 7 0 7H8m0 0h7c5 0 5 7 0 7H7m2-14v14m2-17v3m4-3v3m-4 14v3m4-3v3"/>',
wallet:'<rect x="3" y="6" width="18" height="14" rx="3"/><path d="m4 6 13-3v3m4 5h-6v4h6m-3-2h.01"/>',
down:'<path d="M17 6 6 17m0-9v9h9"/>',up:'<path d="m6 17 11-11m-9 0h9v9"/>',
calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v5m10-5v5M3 10h18"/>',plus:'<path d="M12 5v14M5 12h14"/>',
plane:'<path d="m3 13 7-2 7-7c2-2 5 0 3 3l-6 7-2 7-2-1v-5l-4 2-3-2 1-1Z"/>',
bill:'<path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Zm3 5h8m-8 4h6"/>',
refresh:'<path d="M20 8a8 8 0 0 0-14-2L3 9m0-5v5h5m-4 7a8 8 0 0 0 14 2l3-3m0 5v-5h-5"/>',
close:'<path d="m5 5 14 14M19 5 5 19"/>',edit:'<path d="m4 16 11-11 4 4L8 20l-5 1 1-5Zm10-10 4 4"/>',
chevron:'<path d="m6 9 6 6 6-6"/>',layers:'<path d="m3 8 9-5 9 5-9 5-9-5Zm0 5 9 5 9-5"/>',
dot:'<circle cx="12" cy="12" r="7"/>',check:'<path d="m4 12 5 5L20 6"/>'
};
function ic(name){return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">'+(iconPaths[name]||'')+'</svg>'}
function ribbon() {
  let paths='';
  for(let i=0;i<30;i++){
    const t=i/29;
    const coords=[];
    for(let j=0;j<=144;j++){
      const a=j*Math.PI/72;
      const r=1+.16*Math.sin(2*a+2*t)+.095*Math.cos(3*a-.6);
      const x=Math.cos(a)*r*(49+24*t),y=Math.sin(a)*r*(77-19*t);
      const tilt=-.56+1.18*t;
      coords.push((j?'L':'M')+(90+42*t+x*Math.cos(tilt)-y*Math.sin(tilt)).toFixed(2)+' '+(112-30*t+x*Math.sin(tilt)+y*Math.cos(tilt)).toFixed(2));
    }
    paths+='<path d="'+coords.join('')+'Z"/>';
  }
  return '<svg class="ribbon" viewBox="0 0 202 200" preserveAspectRatio="xMidYMid slice" fill="none" stroke="#e4fc38" stroke-width=".95" aria-hidden="true">'+paths+'</svg>';
}
const balanceArt=ribbon();

