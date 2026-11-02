// Plate positions with distinct joint geometry. x is the weld axis;
// z is vertical before applying the physical workpiece rotation.
function positionJointGeometry(code,yaw=0,joint='T'){
  const n=Number(code[0]),fillet=code[1]==='F';
  const family=fillet?(n===1?'T':['T','Canto','Sobreposta'].includes(joint)?joint:'T'):'Topo';
  const faces=[];
  const polygon=(points,cls='metal',shade='')=>faces.push({points,cls,shade});
  const quad=(a,b,c,d,cls='metal',shade='')=>polygon([a,b,c,d],cls,shade);
  const plate=(x0,x1,y0,y1,z0,z1)=>{
    quad([x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],'metal','#aabfd0');
    quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],'metal','#d7e4ef');
    quad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],'metal','#c2d3e1');
    quad([x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],'metal','#b1c7d9');
    quad([x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1],'metal','#b8ccdc');
    quad([x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1],'metal','#c5d7e5');
  };
  const filletPrism=(edge,direction=1,leg=16)=>{
    const a=[edge,0],b=[edge+direction*leg,0],c=[edge,leg];
    quad([-70,...a],[70,...a],[70,...b],[-70,...b],'weld');
    quad([-70,...b],[70,...b],[70,...c],[-70,...c],'weld');
    polygon([[-70,...a],[-70,...b],[-70,...c]],'weld');
    polygon([[70,...a],[70,...b],[70,...c]],'weld');
  };
  let tip=[0,12,12],from=[0,55,55];
  if(family==='T'){
    // The base continues on both sides of the upright: visibly a T, not an L.
    plate(-75,75,-65,70,-8,0);
    plate(-75,75,-5,5,0,70);
    filletPrism(5,1,16);tip=[0,13,8];from=[0,55,55];
  }else if(family==='Canto'){
    // Two plate edges meet as an L. The fillet occupies the accessible angle.
    plate(-75,75,0,70,-8,0);
    plate(-75,75,-8,0,0,70);
    filletPrism(0,1,16);tip=[0,8,8];from=[0,55,55];
  }else if(family==='Sobreposta'){
    // The edge of the upper plate is at y=0; overlap is y=0..40.
    plate(-75,75,-65,40,-8,0);
    plate(-75,75,0,70,0,12);
    filletPrism(0,-1,12);tip=[0,-6,6];from=[0,-50,42];
  }else{
    plate(-80,80,-65,-6,-8,0);plate(-80,80,6,65,-8,0);
    quad([-80,-6,0],[80,-6,0],[80,6,0],[-80,6,0],'weld');
    tip=[0,0,0];from=[0,0,60];
  }
  const rx=fillet?(n===1?Math.PI/4:n===4?Math.PI:0):(n===2||n===3?Math.PI/2:n===4?Math.PI:0);
  const ry=n===3?Math.PI/2:0;
  const rotate=point=>{
    let [x,y,z]=point;
    [y,z]=[y*Math.cos(rx)-z*Math.sin(rx),y*Math.sin(rx)+z*Math.cos(rx)];
    [x,z]=[x*Math.cos(ry)+z*Math.sin(ry),-x*Math.sin(ry)+z*Math.cos(ry)];
    const a=.6+yaw;
    return [x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a),z];
  };
  const project=point=>{const [x,y,z]=rotate(point);return [220+x*1.35,144+y*.57-z*1.12];};
  const depth=face=>face.points.reduce((sum,p)=>{const r=rotate(p);return sum+r[1]+r[2]*.48;},0)/face.points.length;
  faces.sort((a,b)=>depth(a)-depth(b));
  // The highlighted fillet remains readable in this teaching schematic.
  faces.sort((a,b)=>(a.cls==='weld')-(b.cls==='weld'));
  let content='';
  for(const face of faces)content+=`<polygon class="${face.cls}"${face.shade?` style="fill:${face.shade}"`:''} points="${face.points.map(p=>project(p).join(',')).join(' ')}"/>`;
  const target=project(tip),start=project(from);
  content+=`<path d="M${start.join(' ')} L${target.join(' ')}" stroke="#0878bd" stroke-width="9" stroke-linecap="round"/><circle cx="${target[0]}" cy="${target[1]}" r="4" fill="#ffb63e"/>`;
  content+=txt(18,25,'Gravidade ↓','note')+txt(18,245,'Azul: acesso da tocha · âmbar: solda','note');
  content+=txt(18,265,{T:'Junta em T',Canto:'Junta de canto',Sobreposta:'Junta sobreposta',Topo:'Junta de topo'}[family],'note');
  return svg(content,'Junta '+family+' orientada, com solda de '+(fillet?'filete':'topo')+', acesso da tocha e gravidade para baixo','0 0 440 285');
}
