/* Two-layer suspended dust: moonlight, signal, then bottom upwelling. */
(()=>{'use strict';
const F=document.querySelector('#water-dust-field'),C=document.querySelector('#water-dust'),H=document.querySelector('.hero-scroll'),work=document.querySelector('#work'),about=document.querySelector('#about'),contact=document.querySelector('#contact');if(!F||!C)return;
const ctx=C.getContext('2d'),fc=document.createElement('canvas'),fx=fc.getContext('2d'),reduce=matchMedia('(prefers-reduced-motion: reduce)'),abort=new AbortController(),opts={signal:abort.signal},far=[],near=[],matter=[],all=[],grid=[],samples=[],ptr={x:-1e3,y:-1e3,force:0,last:0,dx:0,dy:0},out={x:0,y:0},lay={workTop:1,workBottom:1,aboutTop:1,contactTop:1,contactHeight:1,max:1},footerAnchor={x:.78,y:.62};
const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>v*v*(3-2*v),lerp=(a,b,v)=>a+(b-a)*v,SILVER=['#8197a8','#91aabb','#a4bdcb','#b9cbd6'],PLUM=['#806f90','#93809f','#a58fac','#b8a7bf'],SIGNAL=['#80c2d5','#668fd0','#9481d6','#b979be','#c39876'];let meter=null,meterAt=0,publishAt=0;let W=1,Z=1,d=1,t=0,raf=0,last=0,acc=0,gridAt=0,farAt=0,farDt=0,frames=0,on=false,paused=reduce.matches||document.body.classList.contains('still'),dead=false,healthy=false,gl,program,buffer,transitionTexture,transitionReady=false,signalTexture,signalReady=false,footerRearTexture,footerFrontTexture,footerMaskTexture,footerExchangeTexture,footerReady=false,exchangeReady=false,footerDensity=null,u,cost=0,rng=15277,ratio=1,mx=.759,my=.212,stormStart=0,stormArmed=false,weights={moon:1,signal:0,transition:0,art:0,up:0,name:'moonlight'},stormState={x:.78,y:.87,level:.08,phase:0,still:false,at:-1},scene={x:.759,y:.15,angle:.02,width:.014,noise:2.1,key:''};
function random(){rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;}const perm=new Uint8Array(512),seed=Array.from({length:256},(_,i)=>i),grad=[[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];for(let i=255;i>0;i--){const j=Math.floor(random()*(i+1));[seed[i],seed[j]]=[seed[j],seed[i]];}for(let i=0;i<512;i++)perm[i]=seed[i&255];
function noise(x,y){const s=(x+y)*.366025403784439,i=Math.floor(x+s),j=Math.floor(y+s),z=(i+j)*.211324865405187,a=x-i+z,b=y-j+z,ix=a>b?1:0,iy=a>b?0:1;function c(dx,dy,gx,gy){let m=.5-dx*dx-dy*dy;if(m<=0)return 0;const g=grad[perm[(gx&255)+perm[gy&255]]&7];m*=m;return m*m*(g[0]*dx+g[1]*dy);}return 70*(c(a,b,i,j)+c(a-ix+.211324865405187,b-iy+.211324865405187,i+ix,j+iy)+c(a-.577350269189626,b-.577350269189626,i+1,j+1));}
const NX=48,NY=32;for(let i=0;i<NX*NY;i++)grid.push({x:0,y:0});
function flow(){const e=.025,p=(x,y)=>noise(x+t*.025,y-t*.019)+.24*noise(x*2.03+8-t*.014,y*2.03+3);for(let y=0;y<NY;y++)for(let x=0;x<NX;x++){const q=grid[y*NX+x],px=x/(NX-1)*W/Z*1.7,py=y/(NY-1)*1.7;q.x=(p(px,py+e)-p(px,py-e))/(2*e)*5+3;q.y=-(p(px+e,py)-p(px-e,py))/(2*e)*5-4;}}
function vel(x,y,v=out){const px=clamp(x/W)*(NX-1),py=clamp(y/Z)*(NY-1),ix=Math.floor(px),iy=Math.floor(py),a=grid[iy*NX+ix],b=grid[iy*NX+Math.min(ix+1,NX-1)],c=grid[Math.min(iy+1,NY-1)*NX+ix],e=grid[Math.min(iy+1,NY-1)*NX+Math.min(ix+1,NX-1)],fx=px-ix,fy=py-iy;v.x=(a.x*(1-fx)+b.x*fx)*(1-fy)+(c.x*(1-fx)+e.x*fx)*fy;v.y=(a.y*(1-fx)+b.y*fx)*(1-fy)+(c.y*(1-fx)+e.y*fx)*fy;return v;}function storm(){const still=paused||reduce.matches,clock=still?0:Math.max(0,t-stormStart);if(stormState.at===clock&&stormState.still===still)return stormState;const within=clock%22.6,double=within>=10.4,cycle=double?within-10.4:within,pulse=(at)=>cycle<at?0:cycle<at+.45?.12*smooth((cycle-at)/.45):cycle<at+.61?.12+.88*smooth((cycle-at-.45)/.16):cycle<at+1.26?1-smooth((cycle-at-.61)/.65):0,level=still?0:Math.max(pulse(0),double?pulse(1.5):0);stormState.level=level;stormState.phase=clock;stormState.cycle=cycle;stormState.count=double?2:1;stormState.still=still;stormState.at=clock;return stormState;}function sceneGeom(){const a=weights.signal+weights.up,p1=smooth(clamp((a-.08)/.84)),p2=smooth(clamp((weights.up-.10)/.86));scene.x=lerp(lerp(mx,.68,p1),.76,p2);scene.y=lerp(lerp(.15,.406,p1),.83,p2);scene.angle=lerp(lerp(.02,1.09,p1),.68,p2);scene.width=lerp(lerp(.014,.19,p1),.42,p2);scene.noise=lerp(lerp(2.1,3.2,p1),3.4,p2);scene.key=Math.round(p1*80)+'/'+Math.round(p2*80);return scene;}
const vertex='attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}';
const fragment=`precision highp float;uniform vec2 resolution,moon,pointer,footerAnchor;uniform vec4 storm,scene;uniform sampler2D transitionArt,signalArt,footerRearArt,footerFrontArt,footerMask,footerExchangeArt;uniform float sceneNoise,time,wMoon,wSignal,wTransition,wArt,wUp,energy,signalReady,footerReady,exchangeReady;vec3 M(vec3 x){return x-floor(x/289.)*289.;}vec2 M(vec2 x){return x-floor(x/289.)*289.;}vec3 P(vec3 x){return M((x*34.+1.)*x);}float s(vec2 v){const vec4 C=vec4(.2113248654,.3660254038,-.5773502692,.0243902439);vec2 i=floor(v+dot(v,C.yy)),x=v-i+dot(i,C.xx),o=x.x>x.y?vec2(1,0):vec2(0,1);vec4 z=x.xyxy+C.xxzz;z.xy-=o;i=M(i);vec3 p=P(P(i.y+vec3(0,o.y,1))+i.x+vec3(0,o.x,1)),m=max(.5-vec3(dot(x,x),dot(z.xy,z.xy),dot(z.zw,z.zw)),0.);m*=m;m*=m;vec3 a=2.*fract(p*C.www)-1.,h=abs(a)-.5,a0=a-floor(a+.5);m*=1.792842914-.853734721*(a0*a0+h*h);vec3 q;q.x=a0.x*x.x+h.x*x.y;q.yz=a0.yz*z.xz+h.yz*z.yw;return 130.*dot(m,q);}float hash(vec2 v){return fract(sin(dot(v,vec2(127.1,311.7)))*43758.5453);}
float line(float x,float centre,float width){return 1.-smoothstep(0.,width,abs(x-centre));}
void main(){
 vec2 q=gl_FragCoord.xy/resolution,uv=vec2(q.x,1.-q.y),p=uv*vec2(resolution.x/resolution.y,1.);
 float n=.6*s(p*2.+vec2(time*.015,-time*.011))+.27*s(p*4.06+3.1)+.13*s(p*8.2-7.);
 vec3 base=mix(vec3(.027,.043,.078),vec3(.062,.086,.129),smoothstep(-.65,.7,n));
 // The authored pixel stratum belongs to the work scene, not to either preview panel.
 if(signalReady>.5 && wArt>.01){
  float aspect=resolution.x/resolution.y;
  vec2 cover=vec2(min(1.,aspect/1.777),min(1.,1.777/aspect));
  vec2 sourceUV=(uv-.5)*cover+.5;
  float upper=1.-smoothstep(.35,.71,uv.y);
  float current=s(p*1.35+vec2(time*.035,-time*.022));
  vec2 flowOffset=vec2(mix(-.0045,.0065,upper)*sin(time*.12)+current*.005,.0025*current);
  vec2 delta=uv-pointer;
  float distanceToPointer=length(delta);
  float ripple=energy*.006*sin(distanceToPointer*60.-time*8.)*exp(-distanceToPointer*17.);
  vec2 pointerWarp=delta*inversesqrt(dot(delta,delta)+.0001)*ripple;
  vec3 movingArt=texture2D(signalArt,clamp(sourceUV+flowOffset+pointerWarp,vec2(.002),vec2(.998))).rgb;
  float luminance=max(max(movingArt.r,movingArt.g),movingArt.b);
  movingArt*=.83+.17*sin(time*.9+uv.x*21.+uv.y*17.)*smoothstep(.13,.5,luminance);
  float artEntrance=smoothstep(.1,.85,wArt)*(1.-.32*wTransition);
  base=mix(base,movingArt,artEntrance*(aspect<.7?.67:.82));
 }
 // A brief wallpaper-like memory of the last incoming light: the painted pixels drift in water.
 vec2 artUV=uv+vec2(time*.0014*(.5+uv.y)+.003*s(p*1.7+vec2(time*.045,0.)),.002*s(p*2.1+vec2(0.,time*.06)));
 vec3 art=texture2D(transitionArt,clamp(artUV,vec2(.002),vec2(.998))).rgb;
 float artGlint=smoothstep(.14,.4,max(max(art.r,art.g),art.b));
 art+=art*artGlint*.035*sin(time*.82+uv.x*31.+uv.y*17.);
 float artMask=(.42+.58*smoothstep(.12,.80,uv.x))*(1.-.45*smoothstep(.52,.96,uv.y));
 base=mix(base,art,wTransition*.32*artMask);
 // The lunar source is above the viewport; a distributed surface aperture refracts its light.
 float shaft=0.,depth=uv.y+.25;
 for(int i=0;i<5;i++){
  float f=float(i)-2.,slope=f*.09-.06;
  float bend=(uv.y-scene.y)*sin(scene.z)*.12;
  float centre=scene.x+slope*depth+bend+.009*sin(time*.23+f*1.7+uv.y*2.);
  float width=scene.w+depth*(.022+abs(f)*.004);
  float ray=exp(-pow((uv.x-centre)/width,2.));
  float veil=.78+.22*s(vec2(uv.y*3.-time*.16,f*3.+time*.08));
  shaft+=ray*veil*(.7-abs(f)*.08);
 }
 shaft*=exp(-uv.y*1.15);
 vec3 stage1=vec3(.15,.185,.22)*shaft;
 // The settled stratum has no beam or continuous band: sparse pixel points drift sideways.
 float lane=.22+.46*exp(-pow((uv.y-.27)/.10,2.))+.56*exp(-pow((uv.y-.53)/.12,2.))+.42*exp(-pow((uv.y-.76)/.10,2.));
 float direction=uv.y<.39?1.:uv.y<.66?-.75:1.3;
 vec2 dotUV=vec2(uv.x*190.-time*2.8*direction,uv.y*100.);
 vec2 dotCell=floor(dotUV),dotLocal=fract(dotUV)-.5;
 float selected=step(.991-.014*lane,hash(dotCell));
 float dotShape=1.-smoothstep(.19,.37,max(abs(dotLocal.x),abs(dotLocal.y)));
 float hue=hash(dotCell+vec2(17.2,41.7));
 vec3 pixelColor=hue<.24?vec3(.22,.57,.70):hue<.49?vec3(.25,.38,.70):hue<.76?vec3(.48,.28,.67):hue<.96?vec3(.66,.26,.55):vec3(.68,.39,.20);
 float flicker=.72+.28*sin(time*(.65+hash(dotCell+7.)*.65)+hue*6.28);
 float handoff=clamp(4.*wMoon*wSignal,0.,1.);
 float moonScatter=exp(-pow((uv.x-moon.x)/.20,2.))*(1.-smoothstep(.55,.88,uv.y));
 vec3 stage2=pixelColor*selected*dotShape*lane*flicker+vec3(.19,.22,.24)*selected*dotShape*moonScatter*handoff;
 vec3 water=base+wMoon*stage1+wSignal*stage2;
 if(wUp>.001){
  // The image supplies the contours. Its luminance is an approximate density matte,
  // not a full-screen background: rear and front masses have independent drift.
  vec2 cover=vec2(min(1.,(resolution.x/resolution.y)/1.777),min(1.,1.777/(resolution.x/resolution.y)));
  vec2 source=(uv-footerAnchor)*cover+vec2(.78,.46);
  float current=s(vec2(uv.x*2.3+time*.034,uv.y*3.1-time*.019));
  float rearBreath=sin(time*.17),frontBreath=sin(time*.14+.8);
  vec2 rearUV=source+vec2(sin(time*.21)*.020+current*.006,(source.y-.24)*rearBreath*.010+rearBreath*.010);
  vec2 frontUV=source+vec2(-sin(time*.17+.8)*.018+current*.007,(source.y-.70)*frontBreath*.011-frontBreath*.012);
  vec4 rear=texture2D(footerRearArt,clamp(rearUV,vec2(.002),vec2(.998)));
  vec4 front=texture2D(footerFrontArt,clamp(frontUV,vec2(.002),vec2(.998)));
  vec4 rearMatte=texture2D(footerMask,clamp(rearUV,vec2(.002),vec2(.998)));
  vec4 frontMatte=texture2D(footerMask,clamp(frontUV,vec2(.002),vec2(.998)));
  float rearInside=step(0.,rearUV.x)*step(rearUV.x,1.)*smoothstep(0.,.055,rearUV.y)*step(rearUV.y,1.);
  float frontInside=step(0.,frontUV.x)*step(frontUV.x,1.)*smoothstep(0.,.055,frontUV.y)*step(frontUV.y,1.);
  float rearDensity=rear.a*rearInside,frontDensity=front.a*frontInside;
  float rearThickness=rearMatte.b*rearDensity,frontThickness=frontMatte.a*frontDensity;
  // Painted crossing: upper and lower tongues sample the same authored asset
  // with opposed drift. Keep its transparent negative space between them.
  vec2 exchangeUV=source+vec2(current*.004,0.);
  vec2 upperUV=exchangeUV+vec2(-.009*sin(time*.24),-.012*sin(time*.20));
  vec2 lowerUV=exchangeUV+vec2(.012*sin(time*.19+.9),.014*sin(time*.17+.9));
  vec4 upper=texture2D(footerExchangeArt,clamp(upperUV,vec2(.002),vec2(.998)));
  vec4 lower=texture2D(footerExchangeArt,clamp(lowerUV,vec2(.002),vec2(.998)));
  float upperGate=1.-smoothstep(.44,.54,source.y);
  float lowerGate=smoothstep(.43,.53,source.y);
  float exchangeRegion=smoothstep(.47,.59,source.x)*(1.-smoothstep(.91,.99,source.x));
  float upperAlpha=upper.a*upperGate*exchangeRegion*.54*exchangeReady;
  float lowerAlpha=lower.a*lowerGate*exchangeRegion*.54*exchangeReady;
  float aperture=exp(-pow((uv.x-footerAnchor.x)/.044,2.)-pow((uv.y-footerAnchor.y)/.027,2.));
  float rimReach=exp(-pow((uv.x-footerAnchor.x)/.23,2.)-pow((uv.y-footerAnchor.y)/.18,2.));
  float opening=pow(1.-max(rearThickness*.90,frontThickness*.96),1.6);
  float flashEnergy=storm.z*3.;
  float charge=flashEnergy*aperture*opening*footerReady;
  vec3 deep=mix(water,vec3(.003,.007,.013),.91);
  // Back light is visible through the open channel, then attenuated by each mass.
  deep+=charge*vec3(.42,.50,.59)*.28;
  deep=mix(deep,upper.rgb*.64+flashEnergy*vec3(.060,.072,.095),upperAlpha);
  deep=mix(deep,lower.rgb*.61+flashEnergy*vec3(.078,.061,.098),lowerAlpha);
  deep=mix(deep,rear.rgb*.83,rearDensity*.88*footerReady);
  float rearThin=rearDensity*(1.-smoothstep(.34,.88,rearThickness));
  deep+=flashEnergy*rimReach*rearThin*vec3(.44,.40,.59)*2.1;
  deep=mix(deep,front.rgb*.69,frontDensity*.94*footerReady);
  float frontThin=frontDensity*(1.-smoothstep(.34,.88,frontThickness));
  deep+=flashEnergy*rimReach*frontThin*vec3(.35,.53,.63)*1.9;
  water=mix(water,deep,wUp);
 }
 gl_FragColor=vec4(water,1.);
}`;
const transitionImage=new Image(),signalImage=new Image(),footerImage=new Image(),footerRearImage=new Image(),footerFrontImage=new Image(),footerExchangeImage=new Image();
function uploadTransition(){if(!gl||!transitionTexture||!transitionImage.naturalWidth)return;gl.bindTexture(gl.TEXTURE_2D,transitionTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,transitionImage);transitionReady=true;}
function uploadSignal(){if(!gl||!signalTexture||!signalImage.naturalWidth)return;gl.bindTexture(gl.TEXTURE_2D,signalTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,signalImage);signalReady=true;}
function uploadFooter(){
 if(!gl||!footerMaskTexture||!footerImage.naturalWidth)return;
 // A pixel-aligned matte from the original painting: fine local texture identifies
 // suspended silt where dark cloud RGB overlaps the dark-water background.
 const mw=256,mh=144,mask=document.createElement('canvas');mask.width=mw;mask.height=mh;
 const mc=mask.getContext('2d',{willReadFrequently:true});mc.drawImage(footerImage,0,0,mw,mh);
 const pixels=mc.getImageData(0,0,mw,mh).data,lum=new Float32Array(mw*mh),seed=new Float32Array(mw*mh),expanded=new Float32Array(mw*mh),rgba=new Uint8Array(mw*mh*4);
 for(let i=0;i<lum.length;i++){const k=i*4;lum[i]=(.299*pixels[k]+.587*pixels[k+1]+.114*pixels[k+2])/255;}
 for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){
  const i=y*mw+x;let sum=0,sumSq=0,count=0;
  for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){const xx=Math.max(0,Math.min(mw-1,x+ox)),yy=Math.max(0,Math.min(mh-1,y+oy)),v=lum[yy*mw+xx];sum+=v;sumSq+=v*v;count++;}
  const mean=sum/count,variation=Math.sqrt(Math.max(0,sumSq/count-mean*mean)),texture=smooth(clamp((variation*.8+Math.abs(lum[i]-mean)*1.2-.006)/.025)),bright=smooth(clamp((lum[i]-.07)/.11));seed[i]=Math.max(texture*.9,bright);
 }
 for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){
  const i=y*mw+x;let value=seed[i];
  for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++)value=Math.max(value,seed[Math.max(0,Math.min(mh-1,y+oy))*mw+Math.max(0,Math.min(mw-1,x+ox))]*.87);
  expanded[i]=value;
 }
 footerDensity=new Uint8Array(mw*mh);
 for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){
  const i=y*mw+x,k=i*4,sy=y/mh;let sum=0,count=0;
  for(let oy=-3;oy<=3;oy++)for(let ox=-3;ox<=3;ox++){sum+=expanded[Math.max(0,Math.min(mh-1,y+oy))*mw+Math.max(0,Math.min(mw-1,x+ox))];count++;}
  const soft=expanded[i],thick=smooth(clamp((sum/count-.12)/.68)),rearGate=1-smooth(clamp((sy-.38)/.18)),frontGate=smooth(clamp((sy-.34)/.20));
  rgba[k]=Math.round(255*soft*rearGate);rgba[k+1]=Math.round(255*soft*frontGate);
  rgba[k+2]=Math.round(255*thick*rearGate);rgba[k+3]=Math.round(255*thick*frontGate);
  footerDensity[i]=Math.max(rgba[k+2],rgba[k+3]);
 }
 gl.bindTexture(gl.TEXTURE_2D,footerMaskTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,mw,mh,0,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
 uploadFooterLayers();
}
function uploadFooterLayers(){
 if(!gl||!footerRearTexture||!footerFrontTexture||!footerRearImage.naturalWidth||!footerFrontImage.naturalWidth||!footerDensity)return;
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
 gl.bindTexture(gl.TEXTURE_2D,footerRearTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,footerRearImage);
 gl.bindTexture(gl.TEXTURE_2D,footerFrontTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,footerFrontImage);
 footerReady=true;
}
function uploadFooterExchange(){if(!gl||!footerExchangeTexture||!footerExchangeImage.naturalWidth)return;gl.bindTexture(gl.TEXTURE_2D,footerExchangeTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,footerExchangeImage);exchangeReady=true;}
function cloudDensity(x,y){if(!footerDensity)return 0;const aspect=W/Z,coverX=Math.min(1,aspect/1.777),coverY=Math.min(1,1.777/aspect),ix=Math.max(0,Math.min(255,Math.floor(((x-footerAnchor.x)*coverX+.78)*256))),iy=Math.max(0,Math.min(143,Math.floor(((y-footerAnchor.y)*coverY+.46)*144)));return footerDensity[iy*256+ix]/255;}
function makeTexture(filter){const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([5,9,18,255]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return texture;}
function init(){
 healthy=false;transitionReady=false;signalReady=false;footerReady=false;exchangeReady=false;
 try{
  gl=F.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});
  if(!gl)throw Error('No WebGL');
  const sh=(type,src)=>{const x=gl.createShader(type);gl.shaderSource(x,src);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(x));return x;};
  program=gl.createProgram();gl.attachShader(program,sh(gl.VERTEX_SHADER,vertex));gl.attachShader(program,sh(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const a=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  transitionTexture=makeTexture(gl.LINEAR);signalTexture=makeTexture(gl.NEAREST);footerRearTexture=makeTexture(gl.LINEAR);footerFrontTexture=makeTexture(gl.LINEAR);footerMaskTexture=makeTexture(gl.LINEAR);footerExchangeTexture=makeTexture(gl.LINEAR);uploadTransition();uploadSignal();uploadFooter();uploadFooterExchange();
  u={p:gl.getUniformLocation(program,'pointer'),e:gl.getUniformLocation(program,'energy'),r:gl.getUniformLocation(program,'resolution'),t:gl.getUniformLocation(program,'time'),m:gl.getUniformLocation(program,'moon'),fa:gl.getUniformLocation(program,'footerAnchor'),a:gl.getUniformLocation(program,'wMoon'),b:gl.getUniformLocation(program,'wSignal'),d:gl.getUniformLocation(program,'wTransition'),ar:gl.getUniformLocation(program,'wArt'),c:gl.getUniformLocation(program,'wUp'),tr:gl.getUniformLocation(program,'transitionArt'),sg:gl.getUniformLocation(program,'signalArt'),ft:gl.getUniformLocation(program,'footerRearArt'),ff:gl.getUniformLocation(program,'footerFrontArt'),fm:gl.getUniformLocation(program,'footerMask'),fe:gl.getUniformLocation(program,'footerExchangeArt'),er:gl.getUniformLocation(program,'exchangeReady'),sr:gl.getUniformLocation(program,'signalReady'),fr:gl.getUniformLocation(program,'footerReady'),s:gl.getUniformLocation(program,'storm'),g:gl.getUniformLocation(program,'scene'),n:gl.getUniformLocation(program,'sceneNoise')};
  healthy=true;
 }catch(e){console.warn('Water dust field unavailable',e);}
}
function field(){if(!healthy)return;const S=storm(),G=scene;gl.useProgram(program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,transitionTexture);gl.uniform1i(u.tr,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,signalTexture);gl.uniform1i(u.sg,1);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,footerRearTexture);gl.uniform1i(u.ft,2);gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,footerFrontTexture);gl.uniform1i(u.ff,3);gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,footerMaskTexture);gl.uniform1i(u.fm,4);gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,footerExchangeTexture);gl.uniform1i(u.fe,5);gl.uniform1f(u.er,exchangeReady?1:0);gl.uniform1f(u.sr,signalReady?1:0);gl.uniform1f(u.fr,footerReady?1:0);gl.uniform2f(u.p,ptr.x/W,ptr.y/Z);gl.uniform1f(u.e,ptr.force);gl.uniform2f(u.r,F.width,F.height);gl.uniform1f(u.t,t);gl.uniform2f(u.m,mx,my);gl.uniform2f(u.fa,footerAnchor.x,footerAnchor.y);gl.uniform1f(u.a,weights.moon);gl.uniform1f(u.b,weights.signal);gl.uniform1f(u.d,transitionReady?weights.transition:0);gl.uniform1f(u.ar,weights.art);gl.uniform1f(u.c,weights.up);gl.uniform4f(u.s,S.x,S.y,S.level,S.phase);gl.uniform4f(u.g,G.x,G.y,G.angle,G.width);gl.uniform1f(u.n,G.noise);gl.drawArrays(gl.TRIANGLES,0,3);}
function tint(p){return p.color||(p.tint<.5?SILVER[0]:PLUM[0]);}function fade(p){return clamp(Math.min(p.age,p.life-p.age)/p.fade);}
function reseed(p,isNear,initial=false){p.x=random()*W;p.y=isNear&&weights.up>.5&&!initial?Z*(.86+random()*.14):random()*Z;p.vx=0;p.vy=isNear&&weights.up>.5?-(35+random()*30):0;p.life=isNear?(weights.up>.5?Z/35+random()*8:7+random()*8):20+random()*20;p.age=initial?random()*p.life:0;p.phase=random()*6.28;p.lightTick=-1;}
function illumination(p){
 const S=storm(),G=scene,tick=Math.floor(t*15);if(p.lightTick===tick&&p.lightState===weights.name&&p.stormStill===S.still&&p.sceneKey===G.key)return p.light;
 const x=p.x/W,y=p.y/Z;
 const lunar=Math.exp(-Math.pow((x-G.x+.06*(y+.25))/.19,2))*(1-y*.5);
 const lane=.22+.46*Math.exp(-Math.pow((y-.27)/.10,2))+.56*Math.exp(-Math.pow((y-.53)/.12,2))+.42*Math.exp(-Math.pow((y-.76)/.10,2));p.signalLane=lane;
 const signalGlint=smooth(clamp((noise(x*5+t*.028,y*12)-.10)/.55));
 const signalLight=weights.signal*lane*(p.tint>.82?.25+.48*signalGlint:.08+.19*signalGlint);
 const density=cloudDensity(x,y),aperture=Math.exp(-Math.pow((x-footerAnchor.x)/.125,2)-Math.pow((y-footerAnchor.y)/.082,2)),transmission=1-density*.87,stormMass=aperture*transmission,stormBlue=weights.up*S.level*stormMass*.75,stormPurple=weights.up*S.level*stormMass*.16;
 const light=(.1+.9*(signalLight+weights.moon*lunar+weights.up*(.16+S.level*stormMass*.7)))*(1-weights.up*.28);
 if(weights.signal>.25&&weights.signal>weights.up){const hue=(p.tint+(y<.39?0:y<.66?.18:.38))%1;p.color=SIGNAL[Math.min(SIGNAL.length-1,Math.floor(hue*SIGNAL.length))];}
 else{const blueLight=weights.moon*lunar+stormBlue,purpleLight=stormPurple,colour=clamp(Math.max(blueLight,purpleLight)),bin=Math.min(3,Math.floor(colour*4));p.color=weights.up>.7&&p.tint>.945?(p.tint>.978?SIGNAL[3]:SIGNAL[0]):colour>.025?(blueLight>=purpleLight?SILVER[bin]:PLUM[bin]):(p.tint<.5?SILVER[0]:PLUM[0]);}
 p.light=light;p.lightTick=tick;p.lightState=weights.name;p.stormStill=S.still;p.sceneKey=G.key;return light;
}
function drawFar(){fx.setTransform(d,0,0,d,0,0);fx.clearRect(0,0,W,Z);for(const p of far){const light=illumination(p),layer=1+weights.signal*(2*p.signalLane-.75);fx.globalAlpha=clamp((p.alpha+light*.08)*fade(p)*layer);fx.fillStyle=tint(p);fx.fillRect(p.x,p.y,p.size,p.size);}fx.globalAlpha=1;}
function update(list,dt,isNear){for(const p of list){p.age+=dt;if(p.age>=p.life){reseed(p,isNear);continue;}const v=vel(p.x,p.y),speed=p.speed||1,layer=p.y/Z<.39?0:p.y/Z<.66?1:2,lateral=isNear?[19,-14,27][layer]:[4,-3,6][layer];let x=v.x*(isNear?.36:.12)*speed+lateral*speed*weights.signal,y=v.y*(isNear?.36:.12)*speed*(1-weights.up)-weights.up*(isNear?(35+Math.abs(v.y)*.5):4+Math.abs(v.y)*.1)*speed;y-=weights.signal*(isNear?2:.5)*speed;if(isNear&&p.interactive){const dx=p.x-ptr.x,dy=p.y-ptr.y,ds=Math.hypot(dx,dy),reach=p.reach,local=Math.pow(Math.max(0,1-ds/reach),2)*ptr.force;if(ds>1){x+=dx/ds*local*2.4+ptr.dx*local*p.entrain;y+=dy/ds*local*2.4+ptr.dy*local*p.entrain;}}const k=Math.min(1,dt*(isNear?p.response:.65));p.vx+=(x-p.vx)*k;p.vy+=(y-p.vy)*k;p.x=(p.x+dt*p.vx+W)%W;p.y+=dt*p.vy;if(weights.up>.7&&(p.y<0||p.y>=Z)){reseed(p,isNear);}else{p.y=(p.y+Z)%Z;}}}
function seedMatter(){matter.length=0;const count=W<650?160:380,upper=['#9fb7c7','#819db3'],lower=['#9c92b0','#869caf'];for(let i=0;i<count;i++){const dir=i%2?1:-1,colors=dir>0?upper:lower;matter.push({q:random(),dir,speed:.055+random()*.080,spread:(random()+random()+random()-1.5)/1.5,phase:random()*6.28,size:.7+random()*1.1,alpha:.13+random()*.20,color:colors[Math.floor(random()*colors.length)]});}document.documentElement.dataset.dustMatterCount=String(count);}
function drawMatter(dt){if(weights.up<.3||!footerReady)return;const coverX=Math.min(1,(W/Z)/1.777),coverY=Math.min(1,1.777/(W/Z)),level=storm().level,opacity=smooth(clamp((weights.up-.3)/.5));for(const p of matter){p.q=(p.q+dt*p.speed*p.dir+1)%1;const q=p.q,bow=Math.sin(Math.PI*q),sourceX=lerp(.79,.72,q)+p.spread*(.065-.025*bow)+.005*Math.sin(t*.27+p.phase+q*5)*bow,sourceY=.38+.17*q+.009*p.spread*bow,x=W*(footerAnchor.x+(sourceX-.78)/coverX),y=Z*(footerAnchor.y+(sourceY-.46)/coverY),dist=Math.hypot(x-ptr.x,y-ptr.y),push=Math.pow(Math.max(0,1-dist/90),2)*ptr.force,px=dist>1?(x-ptr.x)/dist*push*11:0,py=dist>1?(y-ptr.y)/dist*push*11:0;ctx.globalAlpha=clamp(p.alpha*(.32+.68*bow)*opacity*(.86+level*.7));ctx.fillStyle=p.color;ctx.fillRect(x+px,y+py,p.size,p.size);}ctx.globalAlpha=1;}
function dust(dt,now){ctx.clearRect(0,0,W,Z);farDt+=dt;if(!farAt||now-farAt>=1000/18){update(far,farDt,false);farDt=0;drawFar();farAt=now;}ctx.drawImage(fc,0,0,W,Z);update(near,dt,true);for(const p of near){const ds=Math.hypot(p.x-ptr.x,p.y-ptr.y),local=Math.pow(Math.max(0,1-ds/p.reach),2)*ptr.force,light=illumination(p),glint=p.twinkle?1+.12*Math.max(0,Math.sin(t*4.4+p.phase)):1,layer=1+weights.signal*(2*p.signalLane-.75),a=clamp((p.alpha+light*.16+local*.12)*fade(p)*glint*layer);ctx.fillStyle=tint(p);if(p.tail&&local>.16){const speed=Math.hypot(p.vx,p.vy)||1,len=Math.min(4,Math.max(1,speed*.04));ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.vy,p.vx));ctx.globalAlpha=a*.1;ctx.fillRect(-len,-p.size*.25,len,p.size*.5);ctx.restore();}ctx.globalAlpha=a;ctx.fillRect(p.x,p.y,p.size,p.size);}drawMatter(dt);ctx.globalAlpha=1;}
function measure(){const top=e=>e?e.getBoundingClientRect().top+scrollY:0;lay.workTop=top(work);lay.workBottom=lay.workTop+(work?.offsetHeight||Z);lay.aboutTop=top(about);lay.contactTop=top(contact);lay.contactHeight=contact?.offsetHeight||Z;lay.max=Math.max(1,document.documentElement.scrollHeight-innerHeight);}
function state(){const enterStart=Math.max(0,lay.workTop-Z*.95),enterEnd=lay.workTop+Z*.48,enter=smooth(clamp((scrollY-enterStart)/Math.max(1,enterEnd-enterStart))),upStart=Math.min(lay.max-Z*.35,Math.max(enterEnd+Z*.35,lay.aboutTop-Z*.9)),up=smooth(clamp((scrollY-upStart)/Math.max(1,lay.max-upStart)));weights.moon=(1-enter)*(1-up);weights.signal=enter*(1-up);const transitionIn=smooth(clamp((scrollY-(lay.workTop-Z*.75))/(Z*.4))),transitionOut=1-smooth(clamp((scrollY-(lay.workTop+Z*.05))/(Z*.8)));weights.transition=transitionIn*transitionOut*(1-up);const artIn=smooth(clamp((scrollY-(lay.workTop-Z*.9))/(Z*.9))),artOut=1-smooth(clamp((scrollY-(lay.aboutTop-Z*.75))/(Z*.65)));weights.art=artIn*artOut;weights.up=up;footerAnchor.y=(lay.contactTop+lay.contactHeight*.35-scrollY)/Z;if(up>.75&&!stormArmed){stormStart=t;stormArmed=true;}else if(up<.35)stormArmed=false;weights.name=up>.5?'upwelling':weights.transition>.25?'transition':enter>.5?'signal':'moonlight';sceneGeom();}
function axis(){const a=W/Z,b=ratio,cx=a>b?1:a/b,cy=a>b?b/a:1;mx=(.759-.5-.26*(1-cx))/cx+.5;my=(.212-.5)/cy+.5;sceneGeom();}const image=new Image();image.addEventListener('load',()=>{ratio=image.naturalWidth/image.naturalHeight||1;axis();field();publish();},{...opts,once:true});image.src='../assets/moonlit-material.png';transitionImage.addEventListener('load',()=>{uploadTransition();field();publish(true);},{...opts,once:true});transitionImage.src='../assets/project-signal-transition-dim-v2.png';signalImage.addEventListener('load',()=>{uploadSignal();field();publish(true);},{...opts,once:true});signalImage.src='../assets/project-signal-stratum-v1.png';footerImage.addEventListener('load',()=>{uploadFooter();field();publish(true);},{...opts,once:true});footerImage.addEventListener('error',()=>{footerReady=false;publish(true);},{...opts,once:true});footerImage.src='../assets/footer-silt-concept-v2.png';
for(const [asset,src] of [[footerRearImage,'../assets/footer-silt-rear-cutout.png'],[footerFrontImage,'../assets/footer-silt-front-cutout.png']]){asset.addEventListener('load',()=>{uploadFooterLayers();field();publish(true);},{...opts,once:true});asset.addEventListener('error',()=>{footerReady=false;publish(true);},{...opts,once:true});asset.src=src;}
footerExchangeImage.addEventListener('load',()=>{uploadFooterExchange();field();publish(true);},{...opts,once:true});footerExchangeImage.src='../assets/footer-silt-exchange-v1.png';
function progress(){return clamp(scrollY/Math.max(1,(H?.offsetHeight||Z)-Z));}let publishedAt=0;function publish(force=false){const now=performance.now();if(!force&&on&&now-publishedAt<250)return;publishedAt=now;const span=samples.length>1?samples.at(-1)-samples[0]:0,fps=span?(samples.length-1)*1000/span:0;Object.assign(document.documentElement.dataset,{dustInteractiveCount:String(near.reduce((n,p)=>n+(p.interactive?1:0),0)),dustPointerEnergy:ptr.force.toFixed(3),dustFrames:String(frames),dustCount:String(all.length),dustFarCount:String(far.length),dustNearCount:String(near.length),dustFarHz:'18',dustActive:String(on),dustFps:fps.toFixed(1),dustRenderMs:cost.toFixed(2),dustHealthy:String(healthy),dustState:weights.name,dustMoonWeight:weights.moon.toFixed(3),dustSignalWeight:weights.signal.toFixed(3),dustTransitionWeight:weights.transition.toFixed(3),dustTransitionReady:String(transitionReady),dustArtWeight:weights.art.toFixed(3),dustSignalReady:String(signalReady),dustFooterReady:String(footerReady),dustUpwellingWeight:weights.up.toFixed(3),dustStormLevel:storm().level.toFixed(3),dustStormPhase:storm().phase.toFixed(2),dustMoonX:mx.toFixed(4),dustMoonY:my.toFixed(4)});
 if(location.search.includes('perf=1')&&(!on||performance.now()-meterAt>300)){
  meterAt=performance.now();
  if(!meter){meter=document.createElement('output');meter.id='dust-meter';document.querySelector('.motion-controls')?.prepend(meter);}
  meter.hidden=progress()<.4;
  meter.textContent=weights.name+' · '+(on?fps.toFixed(0)+' fps':'paused')+' · CPU '+cost.toFixed(1)+' ms · BG '+far.length+' / interactive '+near.length+' / matter '+(weights.up>.3?matter.length:0);
 }
}
function size(){W=innerWidth;Z=innerHeight;d=Math.min(devicePixelRatio||1,1.25);C.width=Math.round(W*d);C.height=Math.round(Z*d);fc.width=C.width;fc.height=C.height;F.width=Math.round(W*.5);F.height=Math.round(Z*.5);ctx.setTransform(d,0,0,d,0,0);if(healthy)gl.viewport(0,0,F.width,F.height);all.length=far.length=near.length=0;const narrow=W<650,fn=narrow?3150:7200,nn=narrow?1395:3060;for(let i=0;i<fn;i++){const p={x:0,y:0,size:.8+random()*.35,tint:random(),alpha:.16+random()*.09,phase:0,age:0,life:0,fade:1.5,vx:0,vy:0,speed:.54+random()*.14,lightTick:-1};reseed(p,false,true);all.push(p);far.push(p);}for(let i=0;i<nn;i++){const layer=random(),tone=layer<.55?'middle':layer<.92?'near':'glint',p={x:0,y:0,size:tone==='middle'?1+random()*.5:tone==='near'?1.4+random()*.9:1+random()*.5,tint:random(),alpha:tone==='middle'?.30+random()*.08:tone==='near'?.43+random()*.10:.38+random()*.12,phase:0,age:0,life:0,fade:tone==='glint'?.48:.65,vx:0,vy:0,tone,speed:tone==='middle'?.82+random()*.16:tone==='near'?1.08+random()*.2:1.2+random()*.2,response:tone==='middle'?4.5:tone==='near'?7:6,interactive:true,twinkle:tone==='glint'||(tone==='near'&&random()<.08),tail:tone==='near'&&random()<.06,reach:tone==='middle'?90:tone==='near'?110:100,entrain:tone==='middle'?.28:tone==='near'?.42:.34,lightTick:-1};reseed(p,true,true);all.push(p);near.push(p);}farAt=0;farDt=0;measure();state();axis();flow();field();drawFar();dust(0,performance.now());publish();}
function stop(){if(raf)cancelAnimationFrame(raf);raf=0;}function start(){if(!raf&&on&&!dead){last=performance.now();acc=0;samples.length=0;raf=requestAnimationFrame(tick);}}function sync(){if(dead)return;const wasOn=on;measure();state();if(paused||document.hidden){resetPointer();}const o=smooth(clamp((progress()-.4)/.26));document.documentElement.dataset.dustVisible=String(o>0&&healthy);document.documentElement.style.setProperty('--dust-field-opacity',String(o));document.documentElement.style.setProperty('--dust-opacity',String(o*.9));on=o>0&&!paused&&!document.hidden&&healthy;if(on)start();else{resetPointer();stop();field();dust(0,performance.now());}publish(wasOn!==on);}
function tick(now){raf=0;if(!on||dead)return;const e=Math.min((now-last)/1000,.04);last=now;acc+=e;if(acc<1/60){raf=requestAnimationFrame(tick);return;}const dt=Math.min(Math.floor(acc*60)/60,.05);acc-=Math.floor(acc*60)/60;const begin=performance.now();t+=dt;if(now-gridAt>1000/24){flow();field();gridAt=now;}dust(dt,now);ptr.force*=Math.exp(-dt*3);cost=performance.now()-begin;frames++;samples.push(now);while(samples.length>90)samples.shift();publish();raf=requestAnimationFrame(tick);}
addEventListener('scroll',sync,{...opts,passive:true});addEventListener('resize',()=>{size();sync();},opts);if(window.ResizeObserver){const ro=new ResizeObserver(()=>{measure();sync();});for(const e of [H,work,about,contact])if(e)ro.observe(e);opts.signal.addEventListener('abort',()=>ro.disconnect(),{once:true});}addEventListener('pointermove',e=>{if(!on||e.pointerType==='touch')return;const n=performance.now(),gap=n-ptr.last,dx=e.clientX-ptr.x,dy=e.clientY-ptr.y,delta=Math.hypot(dx,dy);if(gap<100&&delta<150){ptr.force=clamp(ptr.force+delta/75);ptr.dx=Math.max(-500,Math.min(500,dx/Math.max(.016,gap/1000)));ptr.dy=Math.max(-500,Math.min(500,dy/Math.max(.016,gap/1000)));}else{ptr.dx=0;ptr.dy=0;}ptr.x=e.clientX;ptr.y=e.clientY;ptr.last=n;},{...opts,passive:true});
function resetPointer(){ptr.x=ptr.y=-1e3;ptr.dx=ptr.dy=ptr.force=ptr.last=0;}
document.documentElement.addEventListener('pointerleave',resetPointer,opts);
addEventListener('blur',resetPointer,opts);
addEventListener('resize',seedMatter,opts);
queueMicrotask(()=>{seedMatter();if(!on)dust(0,performance.now());});
document.addEventListener('visibilitychange',sync,opts);reduce.addEventListener('change',()=>{paused=reduce.matches||document.body.classList.contains('still');sync();},opts);const observer=new MutationObserver(()=>{paused=reduce.matches||document.body.classList.contains('still');sync();});observer.observe(document.body,{attributes:true,attributeFilter:['class']});F.addEventListener('webglcontextlost',e=>{e.preventDefault();healthy=false;sync();},opts);F.addEventListener('webglcontextrestored',()=>{init();size();sync();},opts);addEventListener('pagehide',()=>{on=false;stop();},opts);addEventListener('pageshow',sync,opts);window.PachinDust={coversSurface:()=>healthy&&progress()>=.66,setPaused(v){paused=!!v;sync();},refresh(){size();sync();},diagnostics:()=>({frames,active:on,healthy,transitionReady,signalReady,footerReady,exchangeReady,footerAnchor:{...footerAnchor},count:all.length,farCount:far.length,nearCount:near.length,farHz:18,state:weights.name,weights:{moon:weights.moon,signal:weights.signal,transition:weights.transition,art:weights.art,upwelling:weights.up},moon:{x:mx,y:my,ratio},drawMs:cost}),destroy(){dead=true;on=false;stop();abort.abort();observer.disconnect();if(gl){gl.deleteTexture(transitionTexture);gl.deleteTexture(signalTexture);gl.deleteTexture(footerRearTexture);gl.deleteTexture(footerFrontTexture);gl.deleteTexture(footerMaskTexture);gl.deleteTexture(footerExchangeTexture);gl.deleteBuffer(buffer);gl.deleteProgram(program);}}};init();size();sync();})();
