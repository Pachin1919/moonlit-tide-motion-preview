/* Bounded 2D cloud transport. RGB comes from the painting; this field transports
 * its source coordinates and density together. Not a volumetric fluid solver. */
(() => {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  window.createCloudDensity=(gl,matte) => {
    const sw=innerWidth<600?96:128, sh=innerWidth<600?54:72, count=sw*sh;
    const scratch=document.createElement('canvas');scratch.width=sw;scratch.height=sh;
    const ctx=scratch.getContext('2d',{willReadFrequently:true});ctx.drawImage(matte,0,0,sw,sh);
    const pixels=ctx.getImageData(0,0,sw,sh).data;
    const base=new Float32Array(count),bytes=new Uint8Array(count*4);
    let density=new Float32Array(count),sx=new Float32Array(count),sy=new Float32Array(count);
    let vx=new Float32Array(count),vy=new Float32Array(count),nd=new Float32Array(count);
    let nx=new Float32Array(count),ny=new Float32Array(count),nvx=new Float32Array(count),nvy=new Float32Array(count);
    let accumulator=0,steps=0,peakDisplacement=0;
    const wind={x:0,y:0,vx:0,vy:0,at:-Infinity};
    for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){
      const i=y*sw+x;base[i]=density[i]=pixels[i*4]/255;
      sx[i]=(x+.5)/sw;sy[i]=(y+.5)/sh;
      bytes[i*4]=bytes[i*4+1]=128;bytes[i*4+2]=bytes[i*4+3]=pixels[i*4];
    }
    const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,sw,sh,0,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
    function sample(a,x,y){
      x=clamp(x,0,sw-1);y=clamp(y,0,sh-1);const x0=x|0,y0=y|0,x1=Math.min(x0+1,sw-1),y1=Math.min(y0+1,sh-1),fx=x-x0,fy=y-y0;
      return (a[y0*sw+x0]*(1-fx)+a[y0*sw+x1]*fx)*(1-fy)+(a[y1*sw+x0]*(1-fx)+a[y1*sw+x1]*fx)*fy;
    }
    function step(){
      const hit=performance.now()-wind.at<100,restore=.012;
      for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){
        const i=y*sw+x,px=x-vx[i]*sw/30,py=y-vy[i]*sh/30;
        const dx=(x+.5)/sw-wind.x,dy=((y+.5)/sh-wind.y)*1.777;
        const influence=hit?Math.exp(-(dx*dx+dy*dy)/.002)*Math.min(1,density[i]*2):0;
        nvx[i]=clamp(sample(vx,px,py)*.93+wind.vx*.06*influence,-.09,.09);
        nvy[i]=clamp(sample(vy,px,py)*.93+wind.vy*.06*influence,-.06,.06);
        nd[i]=sample(density,px,py)*(1-restore)+base[i]*restore;
        nx[i]=sample(sx,px,py)*(1-restore)+(x+.5)/sw*restore;
        ny[i]=sample(sy,px,py)*(1-restore)+(y+.5)/sh*restore;
      }
      [density,nd]=[nd,density];[sx,nx]=[nx,sx];[sy,ny]=[ny,sy];[vx,nvx]=[nvx,vx];[vy,nvy]=[nvy,vy];
      peakDisplacement=0;
      for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){
        const i=y*sw+x,j=i*4;
        const sourceX=(x+.5)/sw,sourceY=(y+.5)/sh;
        peakDisplacement=Math.max(peakDisplacement,Math.hypot(sx[i]-sourceX,sy[i]-sourceY));
        bytes[j]=Math.round(clamp(128+(sx[i]-sourceX)/.08*255,0,255));
        bytes[j+1]=Math.round(clamp(128+(sy[i]-sourceY)/.08*255,0,255));
        bytes[j+2]=Math.round(density[i]*255);bytes[j+3]=Math.round(sample(base,sx[i]*sw-.5,sy[i]*sh-.5)*255);
      }
      steps++;
    }
    return {texture,grid:`${sw}×${sh}`,get steps(){return steps;},get peakDisplacement(){return peakDisplacement;},
      pointer(x,y,dx,dy){Object.assign(wind,{x,y,vx:clamp(dx,-1,1),vy:clamp(dy,-1,1),at:performance.now()});},
      clearWind(){wind.at=-Infinity;accumulator=0;},
      advance(elapsed){
        accumulator=Math.min(accumulator+elapsed,2/30);let changed=false;
        while(accumulator>=1/30){step();accumulator-=1/30;changed=true;}
        if(changed){gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,sw,sh,gl.RGBA,gl.UNSIGNED_BYTE,bytes);}
      },destroy(){gl.deleteTexture(texture);}
    };
  };
})();
