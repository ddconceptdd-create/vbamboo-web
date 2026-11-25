const potrace=require('potrace');const fs=require('fs');
potrace.trace('scripts/brand/mask.png',{threshold:128,turdSize:20,optTolerance:0.4,color:'currentColor',background:'transparent'},(e,svg)=>{if(e)throw e;fs.writeFileSync('scripts/brand/logo_full.svg',svg);console.log(svg.length, svg.slice(0,300))});
