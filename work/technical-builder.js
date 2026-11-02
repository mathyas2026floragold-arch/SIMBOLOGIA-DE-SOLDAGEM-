function technicalBuilderConfig(){
  const mix=mixFor(3),turn=mix.technicalTurn||0;mix.technicalTurn=turn+1;
  if(turn%4===3){
    const c=specialConfig(nextSpecialType(3));
    c.tail='DET. A';
    c.process=pick(supportedProcesses(c.type));
    if(specialWeldMetadata(c.type).supportsField){c.field=true;c.fieldControls=true;}
    if(['Tampão','Ponto'].includes(c.type))c.count=pick([3,4,5]);
    if(c.type==='Costura'){c.length=120;c.pitch=0;}
    return c;
  }
  const types=['V','Filete','Bisel','U','J','X','K','Duplo U','Duplo J','Filete','Reto'];
  const type=types[(turn-Math.floor(turn/4))%types.length];
  const fillet=type==='Filete',doubled=['X','K','Duplo U','Duplo J'].includes(type);
  const c={type,joint:fillet?'T':'Topo',side:fillet||doubled?'ambos':'seta',size:8,length:0,pitch:0,contour:'Plano',finish:'G',field:true,all:false,backing:false,melt:false,tail:'DET. A'};
  c.process=supportedProcesses(type)[turn%supportedProcesses(type).length];
  if(fillet){
    c.size=6;c.length=40;c.pitch=100;
    c.contour=['Plano','Convexo','Côncavo'][turn%3];
    c.finish=c.contour==='Plano'&&turn%2?'M':'G';
    // A separate, continuous case trains all-around without mixing it with intermittent welds.
    if(turn>8&&turn%3===0){c.length=0;c.pitch=0;c.all=true;}
  }else{
    if(turn>0)c.size=pick([6,8,10]);
    c.root=turn===0?3:pick([2,3,4]);
    if(type!=='Reto'){
      c.face=turn===0?2:pick([1,2]);c.thickness=(doubled?2:1)*c.size+c.face;
      if(['V','Bisel','X','K'].includes(type))c.angle=turn===0?60:pick([45,60,70]);
      if(!doubled){c.effective=c.thickness;c.backing=turn%2===0;c.melt=!c.backing;if(c.backing)c.removable=true;}
    }else c.thickness=c.size;
  }
  return c;
}
