// Difficulty is earned per mode; a high overall rank never skips a new mode's basics.
function difficultyFor(m=mode) {
  const correct=Math.max(0,Number(state.master[m])||0);
  const earned=correct>=44?5:correct>=28?4:correct>=16?3:correct>=8?2:correct>=4?1:0;
  const xp=Math.max(0,Number(state.xp)||0);
  const rankCap=xp>=9000?5:xp>=4200?4:xp>=2000?3:2;
  return Math.min(earned,rankCap);
}

// Returns a new configuration. Called only for a new question, never on reinforcement.
function upgradeConfig(input,tier) {
  const c={...input};
  if(tier<3)return c;
  const fillet=c.type==='Filete';
  const doubled=['X','K','Duplo U','Duplo J'].includes(c.type);
  c.contour=fillet?pick(['Plano','Convexo','Côncavo']):pick(['Plano','Convexo']);
  c.finish=pick(['G','M']);
  c.field=tier>=4||Math.random()<.6;
  if(fillet) {
    // Both sides remain restricted to an unambiguous T joint.
    if(c.joint==='T'&&tier>=4)c.side='ambos';
    if(tier>=4) {
      c.length=pick(tier>=5?[50,60]:[30,40,50,60]);
      c.pitch=pick(tier>=5?[80,100]:[80,100,120,150]);
    }
    // All-around and an intermittent pattern are trained separately here.
    c.all=c.joint==='T'&&!c.length&&(tier>=5||c.all);
  } else {
    c.root=pick(tier>=5?[3,4]:[2,3,4]);
    c.face=pick([1,2,3]);
    c.length=0;c.pitch=0;c.all=false;
    if(['V','Bisel','X','K'].includes(c.type))c.angle=pick(tier>=5?[60,70]:[45,60,70]);
    else delete c.angle;
    if(!doubled&&c.type!=='Reto') {
      c.backing=Math.random()<.5;
      c.melt=!c.backing;
    } else {c.backing=false;c.melt=false;}
    if(doubled)c.side='ambos';
  }
  if(tier>=5)c.size=pick([4,5,6,8,10]);
  return c;
}
