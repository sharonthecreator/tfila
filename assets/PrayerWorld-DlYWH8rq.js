import{$ as e,A as t,B as n,C as r,D as i,E as a,F as o,G as s,H as c,I as l,J as u,K as d,L as f,M as p,N as m,O as h,P as g,Q as _,R as v,S as y,T as b,U as x,V as S,W as C,X as ee,Y as w,Z as T,_ as E,a as D,at as O,b as k,c as A,ct as j,d as M,dt as N,et as P,f as F,ft as I,g as L,h as R,i as z,it as B,j as te,k as ne,l as re,lt as ie,m as ae,mt as oe,n as se,nt as V,o as ce,ot as le,p as ue,pt as H,q as de,r as fe,rt as pe,s as me,st as he,t as ge,tt as _e,u as ve,ut as ye,v as be,w as U,x as W,y as G,z as xe}from"./engine-BMzL6CY9.js";var K=Math.PI/180;function q(e,t,n,r=new H){return r.set(Math.sin(e*K)*t,n,Math.cos(e*K)*t)}var Se=(e,t=new H)=>t.set(Math.sin(e*K),0,Math.cos(e*K)),Ce=e=>(Math.atan2(e.x,e.z)/K%360+360)%360,we=(e,t)=>((t-e)%360+540)%360-180,J=(e,t,r)=>{let i=n.clamp((r-e)/(t-e),0,1);return i*i*(3-2*i)},Te=e=>e<.5?4*e*e*e:1-(-2*e+2)**3/2,Ee=`"Frank Ruhl Libre", serif`,De=`"Inter Variable", "Heebo Variable", sans-serif`,Oe=`"JetBrains Mono Variable", monospace`;function ke(e,t){let n=document.createElement(`canvas`);return n.width=e,n.height=t,[n,n.getContext(`2d`)]}var Ae=e=>{let t=new a(e);return`${Math.round(t.r*255)},${Math.round(t.g*255)},${Math.round(t.b*255)}`};function je(e,t,n,i=2048){let{turnH:a,base:o,turns:s}=e.ladder,c=i,l=Math.round(c*(n.top-n.bottom)/(2*Math.PI*n.radius)),[u,d]=ke(c,l),f=new Map(e.regions.map(e=>[Math.floor(e.a/30),e])),p=e.worlds.map(e=>e.id),m=new Map;for(let n of e.nodes){let e=`${Math.floor(n.a/30)}|${p.indexOf(n.world)}`,r=m.get(e)||[];r.push(...(t[n.id]||n.title).split(` `).slice(0,60)),m.set(e,r)}let h=e.nodes.flatMap(e=>(t[e.id]||e.title).split(` `).slice(0,12)),g=Math.max(9,Math.round(c/150));d.font=`${g}px ${Ee}`,d.direction=`rtl`,d.textAlign=`right`,d.textBaseline=`middle`;let v=new Map,y=0;for(let e=g;e<l;e+=g*1.55){let t=n.top-e/l*(n.top-n.bottom),r=c-e*5.3%(g*5);for(;r>0;){let n=r/c*360,i=(t-o)/a-n/360,l=Math.round(i),u=Math.max(0,1-Math.abs(i-l)*2),p=l>=0&&l<s,_=Math.floor(n/30),b=`${_}|${l}`,x=p&&m.get(b)||h,S=v.get(b)||0;v.set(b,S+1);let C=x[S%x.length];d.fillStyle=`rgba(${p?Ae(f.get(_)?.color||`#9fd8ff`):`150,190,230`}, ${((p?.035+.15*u*u:.025)*(.85+.15*Math.sin(y++*1.7))).toFixed(3)})`,d.fillText(C,r,e),r-=d.measureText(C).width+g*.5}}let b=new r(u);return b.colorSpace=P,b.anisotropy=8,b.wrapS=_,b}function Me(e,t,n,r,i=1024){let[a,o]=ke(i,i),s=i/2,c=i/2,l=i*.47,u=o.createRadialGradient(s,c*.85,l*.1,s,c,l);u.addColorStop(0,`rgba(16, 22, 32, 0.92)`),u.addColorStop(.9,`rgba(8, 11, 17, 0.86)`),u.addColorStop(1,`rgba(8, 11, 17, 0)`),o.fillStyle=u,o.beginPath(),o.arc(s,c,l,0,Math.PI*2),o.fill(),o.strokeStyle=`rgba(${Ae(r)}, 0.75)`,o.lineWidth=i*.004,o.beginPath(),o.arc(s,c,l*.965,0,Math.PI*2),o.stroke();for(let e=0;e<120;e++){let t=e/120*Math.PI*2,n=e%10==0,r=l*(n?.9:.93),a=l*.95;o.strokeStyle=`rgba(255,255,255,${n?.45:.16})`,o.lineWidth=i*(n?.003:.0018),o.beginPath(),o.moveTo(s+Math.cos(t)*r,c+Math.sin(t)*r),o.lineTo(s+Math.cos(t)*a,c+Math.sin(t)*a),o.stroke()}o.direction=`rtl`,o.textAlign=`center`,o.fillStyle=r,o.font=`600 ${Math.round(i*.026)}px ${Oe}`,o.fillText(t,s,c-l*.72),o.fillStyle=`#eef2f8`,o.font=`700 ${Math.round(i*.056)}px ${De}`,o.fillText(e,s,c-l*.58);let d=Math.round(i*.056),f=d*1.6;o.font=`400 ${d}px ${Ee}`,o.fillStyle=`#e9eef6`,o.textAlign=`right`;let p=n.split(` `).filter(Boolean),m=0,h=o.measureText(` `).width*1.1,g=c+l*.74;for(let e=c-l*.4;e<g&&m<p.length;e+=f){let t=Math.abs(e-d*.35-c),n=Math.sqrt(Math.max(0,(l*.82)**2-t*t));if(n<d*2)continue;let r=s+n,i=s-n,a=[],u=0;for(;m<p.length;){let e=o.measureText(p[m]).width;if(a.length&&u+h+e>r-i)break;u+=(a.length?h:0)+e,a.push([p[m],e]),m++}let _=e+f>=g||m>=p.length,v=!_&&a.length>1?(r-i-(u-h*(a.length-1)))/(a.length-1):h,y=_?s+u/2:r;for(let[t,n]of a)o.fillText(t,y,e),y-=n+v}return m<p.length&&(o.textAlign=`center`,o.fillStyle=r,o.font=`500 ${Math.round(d*.8)}px ${Oe}`,o.fillText(`· · ·`,s,c+l*.84)),a}var Y=-1.58;function Ne(e){let t=new Float32Array(e*3),n=new Float32Array(e);for(let r=0;r<e;r++){let e=1.7+Math.random()*3.4,i=Math.random()*Math.PI*2;t.set([Math.cos(i)*e,-.9800000000000001+Math.random()*4.2,Math.sin(i)*e],r*3),n[r]=Math.random()*100}let r=new y;r.setAttribute(`position`,new W(t,3)),r.setAttribute(`seed`,new W(n,1));let i=new V({uniforms:{uTime:{value:0},uPR:{value:1}},vertexShader:`attribute float seed; uniform float uTime; uniform float uPR; varying float vA;
      void main(){ vec3 p = position; p.y += sin(uTime*0.15 + seed)*0.12; p.x += cos(uTime*0.11 + seed*1.7)*0.08;
        vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
        vA = (0.35 + 0.65*abs(sin(uTime*0.4 + seed))) * smoothstep(0.8, 2.4, -mv.z);
        gl_PointSize = min(uPR * (1.4 + fract(seed)*1.8) * (6.0 / -mv.z), 5.0 * uPR); }`,fragmentShader:`varying float vA; void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.,d)*vA*0.55;
      gl_FragColor = vec4(vec3(1.0,0.9,0.68)*a, a); }`,transparent:!0,depthWrite:!1,blending:2}),a=new w(r,i);return a.name=`motes`,a}var X=new H(-.79,.37,-.49).normalize(),Pe=new a(`#ffc58e`),Fe=2.5,Ie=new H(.6,.55,.58).normalize(),Le=new I(.82,.57).normalize(),Z=e=>e.toFixed(4),Re=e=>`isColor`in e?`vec3(${Z(e.r)}, ${Z(e.g)}, ${Z(e.b)})`:`vec3(${Z(e.x)}, ${Z(e.y)}, ${Z(e.z)})`,ze=new I(X.x,X.z).normalize(),Be=[{a:38,len:.95,w:1},{a:81,len:.7,w:.8},{a:122,len:1.1,w:1},{a:163,len:.75,w:.85},{a:205,len:1,w:1},{a:248,len:.65,w:.75},{a:290,len:1.05,w:.95},{a:328,len:.6,w:.7}];function Ve(){let e=new h(new Uint8Array([0,0,0,255]),1,1);return e.needsUpdate=!0,e}var Q={uTime:{value:0},uWind:{value:1},uSunPos:{value:new H(0,3.23,0)},uCrownShadow:{value:Ve()},uCrownXf:{value:new oe(0,0,.05,0)},uStones:{value:Array.from({length:12},()=>new oe(0,0,999,.01))},uTrunkTop:{value:2.4}},$=`
#define GROUND_Y ${Z(Y)}
#define TRUNK_R 0.47
const vec3 KEY_DIR = ${Re(X)};
const vec3 KEY_COL = ${Re(Pe.clone().multiplyScalar(Fe/Math.PI))};
const vec3 FILL_DIR = ${Re(Ie)};
const vec3 FILL_COL = vec3(0.045, 0.07, 0.13);
const vec3 SKY_COL = vec3(0.16, 0.21, 0.34);
const vec3 BOUNCE_COL = vec3(0.075, 0.07, 0.035);
const vec3 SUN_COL = vec3(1.0, 0.72, 0.38);
const vec2 WIND_DIR = vec2(${Z(Le.x)}, ${Z(Le.y)});
uniform float uTime; uniform float uWind; uniform vec3 uSunPos;
uniform sampler2D uCrownShadow; uniform vec4 uCrownXf; uniform vec4 uStones[12]; uniform float uTrunkTop;

float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash13(vec3 p3){ p3 = fract(p3 * 0.1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
vec3 hash33(vec3 p3){ p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yxx) * p3.zyx); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), f.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x), f.y); }
float vnoise3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
float fbm2(vec2 p){ return vnoise(p) * 0.55 + vnoise(p * 2.07 + 5.3) * 0.3 + vnoise(p * 4.3 + 1.7) * 0.15; }

// ── wind: big slow gusts rolling across the field with the wind, a travelling wave, and every blade's own flutter
float gust(vec2 xz, float t){
  vec2 p = xz * 0.13 - WIND_DIR * t * 0.42;
  float n = vnoise(p) * 0.68 + vnoise(p * 2.3 + 4.1) * 0.32;
  return smoothstep(0.38, 0.92, n);
}
vec2 windAt(vec2 xz, float t, float ph){
  float g = gust(xz, t);
  float wave = sin(dot(xz, WIND_DIR) * 1.9 - t * 2.1 + ph * 0.6);
  vec2 w = WIND_DIR * (0.16 + 0.75 * g + 0.12 * wave * (0.35 + g));
  w += vec2(sin(t * 5.7 + ph * 6.2832), cos(t * 4.9 + ph * 9.13)) * 0.055 * (0.35 + g);
  return w * uWind;
}

// ── the meadow's colours, shared by the blades and the ground they stand on
float meadowDry(vec2 xz){
  float n = fbm2(xz * 0.21 + 3.1);
  float d = smoothstep(0.42, 0.74, n);
  return clamp(d * 0.9 - 0.25 * (1.0 - smoothstep(1.0, 3.2, length(xz))), 0.0, 1.0); // lush in the tree's shade
}
vec3 bladeMid(float dry){ return mix(vec3(0.085, 0.17, 0.03), vec3(0.19, 0.2, 0.055), dry); }
vec3 bladeTip(float dry){ return mix(vec3(0.21, 0.3, 0.065), vec3(0.5, 0.38, 0.15), dry); }

// ── shadows of the evening light: the trunk (analytic, soft with distance) and the crown (a map along the light)
float trunkShadow(vec3 p){
  vec2 L = KEY_DIR.xz;
  float s = -dot(p.xz, L) / dot(L, L);
  if (s <= 0.0) return 1.0;
  float dmin = length(p.xz + L * s);
  float y = p.y + KEY_DIR.y * s;
  float R = TRUNK_R * (1.0 + 0.5 * (1.0 - smoothstep(GROUND_Y, GROUND_Y + 0.6, y)));
  float pen = 0.015 + 0.03 * s;
  float sh = smoothstep(R + pen, R - pen, dmin) * smoothstep(uTrunkTop + 0.3 + pen, uTrunkTop - pen, y);
  return 1.0 - sh * 0.92;
}
float crownShadow(vec3 p){
  vec3 g = p - KEY_DIR * ((p.y - GROUND_Y) / KEY_DIR.y);
  vec2 uv = (g.xz - uCrownXf.xy) * uCrownXf.z + 0.5;
  uv += windAt(g.xz * 0.5, uTime * 0.7, 0.0) * 0.0012;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 1.0;
  return 1.0 - texture2D(uCrownShadow, uv).r * uCrownXf.w;
}
float keyShadow(vec3 p){ return trunkShadow(p) * crownShadow(p); }

// ── contact darkening where the meadow meets the trunk, the stones and the ladder's posts
float contactAO(vec3 p){
  float ao = mix(0.42, 1.0, smoothstep(0.6, 1.25, length(p.xz)));
  ao *= mix(0.55, 1.0, smoothstep(0.012, 0.09, length(p.xz - vec2(0.0, 0.74))));
  ao *= mix(0.55, 1.0, smoothstep(0.012, 0.09, length(p.xz - vec2(0.0, 1.36))));
  for (int i = 0; i < 12; i++) {
    vec4 s = uStones[i];
    ao *= mix(0.38, 1.0, smoothstep(0.8, 1.75, length(p.xz - s.xz) / s.w));
  }
  return ao;
}

// ── light: the sky (cool above, a dim green bounce below), the evening key, the cool fill, the sun at the ladder's head
vec3 ambient(vec3 N){ return mix(BOUNCE_COL, SKY_COL, 0.5 + 0.5 * N.y); }
vec3 sunLight(vec3 P, vec3 N, out vec3 S, out float fall){
  S = uSunPos - P; float ds = length(S); S /= ds;
  fall = 1.0 / (1.0 + ds * ds * 0.9);
  return SUN_COL * fall;
}
`,He=`
#ifndef TF_HAZE
#define TF_HAZE
vec3 tfHaze(vec3 d){
  vec2 h = normalize(d.xz + vec2(1e-5));
  float tw = dot(h, vec2(${Z(ze.x)}, ${Z(ze.y)})) * 0.5 + 0.5;
  vec3 c = mix(vec3(0.2, 0.2, 0.3), vec3(0.85, 0.47, 0.24), pow(tw, 3.5));
  c = mix(c, vec3(0.36, 0.3, 0.36), 0.2 * (1.0 - tw));
  // looking up there is less air; looking down, the dark land shows through the haze
  return c * (1.0 - 0.3 * smoothstep(0.0, 0.5, d.y)) * (1.0 - 0.45 * smoothstep(-0.01, -0.2, d.y));
}
#endif
`,Ue=!1;function We(){if(Ue)return;Ue=!0;let e=be;e.fog_pars_vertex=`#ifdef USE_FOG
 varying float vFogDepth; varying vec3 vFogView;
#endif
`,e.fog_vertex=`#ifdef USE_FOG
 vFogDepth = - mvPosition.z; vFogView = mvPosition.xyz;
#endif
`,e.fog_pars_fragment=`#ifdef USE_FOG
  uniform vec3 fogColor; varying float vFogDepth; varying vec3 vFogView;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear; uniform float fogFar;
  #endif
  ${He}
#endif
`,e.fog_fragment=`#ifdef USE_FOG
  {
    vec3 fogW = (vec4(vFogView, 0.0) * viewMatrix).xyz;
    float fogDist = length(fogW);
    vec3 fogD = fogW / max(fogDist, 1e-4);
    float fh0 = max(cameraPosition.y - (${Z(Y)}), 0.0);
    float fh1 = max(fh0 + fogW.y, 0.0);
    float fdh = fh1 - fh0;
    const float fk = 0.6;
    float fInt = abs(fdh) > 0.01 ? (exp(-fk * fh0) - exp(-fk * fh1)) / (fk * fdh) : exp(-fk * fh0);
    #ifdef FOG_EXP2
      float fogFactor = 1.0 - exp(-fogDensity * fogDensity * fogDist * fogDist * 0.6 - fogDist * fogDensity * 0.25 * fInt);
    #else
      float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    gl_FragColor.rgb = mix(gl_FragColor.rgb, tfHaze(fogD), fogFactor);
  }
#endif
`}function Ge(e,t){let n=new _e,r=t.clone();n.add(r);let i=new c(new B(6,16,8),new x({color:new a(`#ffc890`).multiplyScalar(3),toneMapped:!1}));i.position.copy(X).setY(.12).normalize().multiplyScalar(40),n.add(i);let o=new E(e),s=o.fromScene(n,.04);return o.dispose(),i.geometry.dispose(),i.material.dispose(),s.texture}var Ke={fog:new a(`#5f5566`)};function qe(e){let t=e;return()=>(t=t*16807%2147483647)/2147483647}var Je=new I(X.x,X.z).normalize();function Ye(){let e=new V({side:1,depthWrite:!1,fog:!1,uniforms:{...Q},vertexShader:`varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p.xyww; }`,fragmentShader:`
      ${$}
      ${He}
      varying vec3 vD;
      const vec2 KEY_H = vec2(${Je.x.toFixed(4)}, ${Je.y.toFixed(4)});
      void main(){
        vec3 d = normalize(vD);
        float y = d.y, yy = max(y, 0.0);
        vec2 h = normalize(d.xz + vec2(1e-5));
        float tw = dot(h, KEY_H) * 0.5 + 0.5;
        float glow = pow(tw, 4.0);
        // the dome
        vec3 zen = vec3(0.008, 0.017, 0.056);
        vec3 mid = mix(vec3(0.045, 0.075, 0.19), vec3(0.17, 0.15, 0.24), glow);
        vec3 c = mix(mid, zen, smoothstep(0.0, 0.8, pow(yy, 0.75)));
        // the horizon band melts into the haze (the fog has the same colour there, so the meadow meets the sky without a seam)
        vec3 hz = tfHaze(vec3(d.x, 0.0, d.z));
        c = mix(c, hz, exp(-yy * mix(15.0, 6.5, glow)));
        // the glow over the place where the sun went down
        vec3 sd = normalize(vec3(KEY_H.x, -0.05, KEY_H.y));
        float s = max(dot(d, sd), 0.0);
        c += vec3(1.0, 0.48, 0.2) * (pow(s, 6.0) * 0.26 + pow(s, 18.0) * 0.16) * smoothstep(-0.02, 0.06, y);
        // opposite it: the pink belt of Venus over the blue shadow of the earth
        float anti = pow(1.0 - tw, 2.0);
        c += vec3(0.2, 0.085, 0.12) * anti * exp(-pow((yy - 0.14) / 0.075, 2.0));
        c = mix(c, vec3(0.11, 0.12, 0.21), anti * (1.0 - smoothstep(0.0, 0.08, yy)) * 0.45);
        // long thin clouds, lit from below toward the glow, dusky grey elsewhere
        vec2 uv = d.xz / (yy + 0.12);
        vec2 cuv = vec2(dot(uv, vec2(0.86, 0.5)), dot(uv, vec2(-0.5, 0.86))) * vec2(0.5, 2.3) + vec2(uTime * 0.005, 0.0);
        float cl = smoothstep(0.52, 0.84, fbm2(cuv) * 0.72 + vnoise(cuv * 3.3) * 0.28) * smoothstep(0.035, 0.17, yy) * (1.0 - smoothstep(0.42, 0.8, yy));
        vec3 cloud = mix(vec3(0.075, 0.07, 0.11), vec3(1.05, 0.5, 0.26), glow * (1.0 - smoothstep(0.06, 0.42, yy)));
        cloud = mix(cloud, vec3(0.24, 0.12, 0.15), anti * 0.4 * (1.0 - smoothstep(0.1, 0.4, yy)));
        c = mix(c, cloud, cl * 0.75);
        // the first stars, high up and away from the glow
        vec2 g = d.xz / (y + 1.0) * 230.0;
        float st = step(0.9972, hash12(floor(g))) * smoothstep(0.35, 0.85, y) * (1.0 - glow) * (0.6 + 0.4 * sin(uTime * 1.3 + hash12(floor(g)) * 30.0));
        c += vec3(st) * 0.7;
        // far hills, and nearer lines of trees, in the haze
        if (y < 0.06) {
          float aa = max(fwidth(y), 1e-4);
          float hill = 0.006 + 0.026 * fbm2(h * 2.6 + 3.0);
          float trees = 0.003 + 0.011 * fbm2(h * 7.0 + 11.0);
          trees += 0.0065 * smoothstep(0.35, 0.8, vnoise(h * 260.0)) * smoothstep(0.35, 0.6, vnoise(h * 11.0));
          trees *= smoothstep(0.3, 0.55, vnoise(h * 4.0 + 2.0));
          vec3 hillC = hz * mix(vec3(0.78, 0.8, 0.9), vec3(0.85, 0.75, 0.75), glow);
          vec3 treeC = hz * mix(vec3(0.5, 0.55, 0.66), vec3(0.6, 0.48, 0.45), glow);
          c = mix(c, hillC, smoothstep(hill + aa, hill - aa, y));
          c = mix(c, treeC, smoothstep(trees + aa, trees - aa, y));
        }
        if (y < 0.0) c = mix(c, tfHaze(d), smoothstep(0.0, -0.02, y));
        gl_FragColor = vec4(c, 1.0);
      }`}),t=new c(new B(80,64,40),e);return t.frustumCulled=!1,t.renderOrder=-10,t.name=`sky`,t}function Xe(e=!1){let t=Be.map(e=>new oe(Math.sin(e.a*Math.PI/180),Math.cos(e.a*Math.PI/180),.85+e.len,e.w)),n=new V({fog:!0,defines:e?{LQ:1}:{},uniforms:{...N.clone(G.fog),...Q,uRoots:{value:t}},vertexShader:`
      varying vec3 vW;
      #include <fog_pars_vertex>
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,fragmentShader:`
      ${$}
      uniform vec4 uRoots[8];
      varying vec3 vW;
      #include <fog_pars_fragment>
      float segD(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
      void main(){
        vec2 xz = vW.xz;
        float r = length(xz);
        float camD = distance(vW, cameraPosition);
        float dry = meadowDry(xz);
        // the field: blades seen from above and afar, in streaks that lean with the wind
        vec2 sq = vec2(dot(xz, vec2(0.82, 0.57)), dot(xz, vec2(-0.57, 0.82)));
        float n1 = vnoise(sq * vec2(5.0, 15.0));
        float n2 = vnoise(xz * 41.0);
        #ifndef LQ
          n1 = n1 * 0.7 + vnoise(sq * vec2(13.0, 38.0)) * 0.3;
        #endif
        float tuft = vnoise(xz * 2.3) * 0.6 + vnoise(xz * 7.1) * 0.4;
        vec3 field = mix(bladeMid(dry), bladeTip(dry), 0.18 + 0.35 * n1) * (0.62 + 0.3 * n2 + 0.25 * tuft);
        // close by, the field is a tangle of blade tops over dark gaps
        float fine = smoothstep(0.004, 0.0, length(fwidth(xz)) * 0.03) ;
        float strands = 0.0;
        #ifndef LQ
          vec2 sq2 = vec2(dot(xz, vec2(0.6, 0.8)), dot(xz, vec2(-0.8, 0.6)));
          strands = smoothstep(0.55, 0.85, vnoise(sq * vec2(28.0, 90.0))) * 0.6 + smoothstep(0.55, 0.85, vnoise(sq2 * vec2(25.0, 80.0) + 3.0)) * 0.6;
        #endif
        float gap = smoothstep(0.35, 0.75, vnoise(xz * 60.0));
        field *= mix(1.0, mix(0.45, 1.0, gap) + strands * 0.7, (1.0 - smoothstep(1.0, 12.0, camD)) * 0.9);
        // underneath the sward close by: dark thatch
        vec3 thatch = mix(vec3(0.022, 0.03, 0.01), vec3(0.06, 0.055, 0.024), n2 * 0.7 + dry * 0.3);
        float open = smoothstep(1.5, 9.0, camD) * mix(0.65, 1.0, smoothstep(2.6, 4.6, r));
        vec3 col = mix(thatch, field, mix(0.45, 0.95, open));
        // bare earth and leaf litter at the foot of the trunk, along the roots
        float ang = atan(xz.x, xz.y);
        float soilR = 0.92 + 0.22 * vnoise(vec2(ang * 2.2, 3.0)) + 0.12 * vnoise(xz * 3.0);
        float soil = 1.0 - smoothstep(soilR - 0.28, soilR + 0.08, r);
        float rootD = 9.0;
        for (int i = 0; i < 8; i++) {
          vec4 R = uRoots[i];
          float d = segD(xz, R.xy * 0.4, R.xy * R.z) / mix(1.0, 0.25, clamp((length(xz) - 0.4) / R.z, 0.0, 1.0));
          rootD = min(rootD, d / R.w);
        }
        soil = max(soil, (1.0 - smoothstep(0.06, 0.2, rootD)) * (1.0 - smoothstep(1.4, 2.0, r)));
        vec3 earth = mix(vec3(0.03, 0.019, 0.011), vec3(0.075, 0.05, 0.03), n2);
        float litter = smoothstep(0.62, 0.8, vnoise(xz * 23.0)) * (0.6 + 0.4 * vnoise(xz * 5.0));
        earth = mix(earth, mix(vec3(0.14, 0.075, 0.03), vec3(0.2, 0.15, 0.06), n2), litter * 0.75);
        earth = mix(earth, vec3(0.03, 0.05, 0.012), smoothstep(0.55, 0.8, vnoise(xz * 9.0 + 4.0)) * 0.6); // moss
        col = mix(col, earth, soil);
        // light
        float sh = keyShadow(vW);
        float ao = contactAO(vW) * mix(0.55, 1.0, smoothstep(0.03, 0.22, rootD));
        vec3 N = vec3(0.0, 1.0, 0.0);
        vec3 S; float fall; vec3 sc = sunLight(vW, N, S, fall);
        float sunVis = smoothstep(1.4, 3.0, r);
        // lit like the blades it stands for: from the light's side we see their lit faces, against it their shaded
        // backs with the light shining through
        vec3 V = normalize(cameraPosition - vW);
        float facing = 0.5 + 0.5 * dot(normalize(V.xz + vec2(1e-4)), normalize(KEY_DIR.xz));
        float bladeK = 0.16 + 0.5 * facing + 0.3 * pow(1.0 - facing, 3.0);
        float keyK = mix(bladeK, KEY_DIR.y, soil);
        vec3 light = ambient(vec3(0.0, mix(0.35, 1.0, soil), 0.9)) * ao + FILL_COL * 0.5 * ao + KEY_COL * keyK * sh * (0.75 + 0.25 * ao) + sc * S.y * 1.6 * sunVis;
        col *= light;
        // the gusts: blades bowing over show their lighter, drier sides
        float g = gust(xz, uTime) * uWind;
        col *= 1.0 + 0.35 * g * smoothstep(1.5, 5.0, camD) * (1.0 - soil);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`}),r=new c(new b(150,96).rotateX(-Math.PI/2),n);return r.position.y=Y,r.name=`ground`,r.renderOrder=-5,r}var Ze=(()=>{let e=qe(7),t=[];for(let n=0;n<12;n++){let r=.06+e()*.13,i=1+e()*.6,a=n/12*Math.PI*2+e()*.4,o=1.55+e()*.6;t.push({x:Math.cos(a)*o,z:Math.sin(a)*o,s:r,sx:i,sy:.62+e()*.25,rot:[(e()-.5)*.3,e()*6,(e()-.5)*.3],seed:e()*100})}return t})();Q.uStones.value.forEach((e,t)=>{let n=Ze[t];e.set(n.x,0,n.z,n.s*(1+(n.sx-1)*.5)*1.05)});function Qe(){let e=(e,t,n)=>{let r=Math.sin(e*127.1+t*311.7+n*74.7)*43758.5453;return r-Math.floor(r)},t=e=>e*e*(3-2*e);return(n,r,i)=>{let a=Math.floor(n),o=Math.floor(r),s=Math.floor(i),c=t(n-a),l=t(r-o),u=t(i-s),d=(e,t,n)=>e+(t-e)*n;return d(d(d(e(a,o,s),e(a+1,o,s),c),d(e(a,o+1,s),e(a+1,o+1,s),c),l),d(d(e(a,o,s+1),e(a+1,o,s+1),c),d(e(a,o+1,s+1),e(a+1,o+1,s+1),c),l),u)}}function $e(){let e=new p,t=Qe(),r=(e,n,r)=>t(e,n,r)*.55+t(e*2.1,n*2.1,r*2.1)*.3+t(e*4.3,n*4.3,r*4.3)*.15,i=new s({vertexColors:!0,roughness:.93,metalness:0,envMapIntensity:.22});for(let s of Ze){let l=new o(1,4),u=l.getAttribute(`position`),d=new H;for(let e=0;e<u.count;e++){d.fromBufferAttribute(u,e);let n=s.seed,i=1+.32*(r(d.x*1.3+n,d.y*1.3,d.z*1.3)-.5)+.06*(t(d.x*7+n,d.y*7,d.z*7)-.5),a=Math.max(Math.abs(d.x*.9+d.y*.3),Math.abs(d.z*.85-d.y*.4));i=Math.min(i,1.02/Math.max(.6,a+.25)),d.multiplyScalar(i),d.y<-.35&&(d.y=-.35+(d.y+.35)*.3),u.setXYZ(e,d.x,d.y,d.z)}l.computeVertexNormals();let f=l.getAttribute(`normal`),p=new Float32Array(u.count*3),m=new a,h=new H,g=t(s.seed,1,2);for(let e=0;e<u.count;e++){d.fromBufferAttribute(u,e),h.fromBufferAttribute(f,e);let r=s.seed+5,i=t(d.x*9+r,d.y*9,d.z*9);m.setRGB(.24+.07*g,.2+.05*g,.155).multiplyScalar(.7+.5*i);let o=n.smoothstep(t(d.x*5+r,d.y*5,d.z*5)*.7+t(d.x*15,d.y*15+r,d.z*15)*.3,.6,.75);m.lerp(t(d.x*2,d.y*2,d.z*2+r)>.6?new a(.42,.2,.06):new a(.42,.43,.33),o*.65);let c=n.smoothstep(h.y+(t(d.x*3,d.y*3+r,d.z*3)-.5)*.9,.45,.9);m.lerp(new a(.05,.085,.02),c*.85),m.multiplyScalar(n.lerp(.35,1,n.smoothstep(d.y,-.4,.15))),p.set([m.r,m.g,m.b],e*3)}l.setAttribute(`color`,new W(p,3));let _=new c(l,i);_.position.set(s.x,Y+s.s*.12,s.z),_.scale.set(s.s*s.sx,s.s*s.sy,s.s),_.rotation.set(...s.rot),_.castShadow=_.receiveShadow=!0,e.add(_)}return e.name=`stones`,e}function et(e){let n=[],r=[];for(let t=0;t<e;t++){let r=(t/e)**.85;n.push(-1,r,0,1,r,0)}n.push(0,1,0);for(let t=0;t<e-1;t++){let e=t*2;r.push(e,e+1,e+2,e+2,e+1,e+3)}let i=(e-1)*2;r.push(i,i+1,e*2);let a=new y;return a.setAttribute(`position`,new t(n,3)),a.setIndex(r),a}function tt(e,t,r=0){let i=Math.hypot(e,t);if(i<.66+r)return!0;let a=Math.atan2(e,t);for(let o of Be){let s=o.a*Math.PI/180,c=e*Math.sin(s)+t*Math.cos(s),l=Math.abs(-e*Math.cos(s)+t*Math.sin(s)),u=.85+o.len;if(c>.3&&c<u&&l<n.lerp(.11,.02,(c-.3)/(u-.3))*o.w+r||i<1&&Math.abs(Math.atan2(Math.sin(a-s),Math.cos(a-s)))<.22)return!0}for(let n of Ze)if(Math.hypot(e-n.x,t-n.z)<n.s*(1+(n.sx-1)*.5)*.95+r)return!0;return!1}function nt(e,t){let r=new Float32Array(e.count*4),i=new Float32Array(e.count*4),a=0;for(;a<e.count;){let o,s;if(e.tile===0){let e=0;do{let e=Math.sqrt(.36+t()*(4.7*4.7-.36)),r=t()*Math.PI*2;o=Math.sin(r)*e,s=Math.cos(r)*e;let i=1-.45*n.smoothstep(e,2.4,4.7);if(t()<i&&!tt(o,s,.02))break}while(++e<50)}else o=t()*e.tile,s=t()*e.tile;let c=5+Math.floor(t()*14),l=.025+t()*.07,u=.7+t()*.65,d=t()*Math.PI*2,f=.15+t()*.55,p=t();for(let m=0;m<c&&a<e.count;m++){let c=t()*Math.PI*2,m=l*Math.sqrt(-2*Math.log(Math.max(1e-4,t())))*.6,h=o+Math.cos(c)*m,g=s+Math.sin(c)*m,_=Math.hypot(h,g);if(e.tile===0&&(tt(h,g)||_>4.7))continue;let v=(.075+t()*.12)*u;e.tile===0&&_<1.5?v=Math.min(v,.15):t()<.035&&(v*=1.6);let y=d+(t()-.5)*1.6;r.set([h,g,y,v],a*4),i.set([.011+t()*.01,f*(.6+t()*.8),n.clamp(p*.6+t()*.4,0,1),t()],a*4),a++}}return{a:r,b:i,n:a}}var rt=`
  attribute vec4 aBlade; attribute vec4 aLook;
  uniform vec4 uLayer;   // tile size (0: fixed around the tree), inner half-size, blades per unit², far distance
  uniform vec3 uLod;     // blades per unit² wanted next to the camera, distance and power of its falloff
  varying vec3 vCol; varying float vSide;
  #include <fog_pars_vertex>
  void main(){
    vec2 xz = aBlade.xy;
    float seed = aLook.w;
    float h = aBlade.w;
    float keep = 1.0;
    if (uLayer.x > 0.0) {
      vec2 rel = mod(xz - cameraPosition.xz + 0.5 * uLayer.x, uLayer.x) - 0.5 * uLayer.x;
      xz = cameraPosition.xz + rel;
      if (max(abs(rel.x), abs(rel.y)) < uLayer.y) keep = 0.0;
      if (length(xz) < 3.3 + 1.4 * fract(seed * 7.31)) keep = 0.0;   // the meadow around the tree is grown by the fixed layer
      for (int i = 0; i < 12; i++) if (length(xz - uStones[i].xz) < uStones[i].w) keep = 0.0;
    } else if (length(xz) > 3.3 + 1.4 * fract(seed * 5.77)) keep = 0.0;
    vec3 root = vec3(xz.x, GROUND_Y - 0.008, xz.y);
    float camD = distance(root, cameraPosition);
    if (uLayer.x > 0.0) {
      float want = uLod.x / (1.0 + pow(camD / uLod.y, uLod.z));
      if (fract(seed * 13.37) > want / uLayer.z) keep = 0.0;
    } else if (fract(seed * 13.37) > clamp(1.4 - camD / 7.5, 0.18, 1.0)) keep = 0.0;   // the meadow around the tree thins out from afar too, or it glitters
    h *= 1.0 - smoothstep(uLayer.w * 0.8, uLayer.w, camD);
    if (keep < 0.5 || h < 0.003) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); vCol = vec3(0.0); vSide = 0.0; return; }

    float t = position.y, side = position.x;
    float w = aLook.x * clamp(camD / 5.0, 1.0, 2.2);
    // the blade is an arc of constant length h, bent by its own lean and by the wind
    vec2 fdir = vec2(cos(aBlade.z), sin(aBlade.z));
    vec2 wv = windAt(xz, uTime, seed) * (0.75 + 0.5 * fract(seed * 3.7)) * (0.55 + 3.0 * h);
    vec2 bend = fdir * aLook.y + wv;
    float beta = length(bend) + 1e-4;
    vec2 bdir = bend / beta;
    beta = min(beta, 1.5);
    float ang = beta * t;
    float fwd = h * (1.0 - cos(ang)) / beta, up = h * sin(ang) / beta;
    vec3 tang = vec3(bdir.x * sin(ang), cos(ang), bdir.y * sin(ang));
    vec3 across = normalize(vec3(-fdir.y, 0.0, fdir.x));
    float wt = w * (1.0 - pow(t, 1.5)) * (0.85 + 0.15 * t);
    vec3 wp = root + vec3(bdir.x * fwd, up, bdir.y * fwd) + across * side * wt * 0.5;
    vec3 N = normalize(cross(across, tang) + across * side * 0.45);

    // colour: dark at the foot of the sward, fresh green up the blade, dry gold at the tips of the dry patches
    float dry = clamp(meadowDry(xz) + (aLook.z - 0.5) * 0.6, 0.0, 1.0);
    vec3 c = mix(vec3(0.035, 0.05, 0.016), bladeMid(dry), smoothstep(0.0, 0.5, t));
    c = mix(c, bladeTip(dry), smoothstep(0.4, 1.0, t) * (0.45 + 0.55 * dry));

    // light, per vertex
    vec3 V = normalize(cameraPosition - wp);
    if (dot(N, V) < 0.0) N = -N;
    // from afar we see the tops of the sward, not into it: the dark feet and the glinting tips even out
    float farK = smoothstep(5.0, 14.0, camD);
    float cao = contactAO(wp);
    float ao = mix(mix(0.3, 0.7, farK), 1.0, smoothstep(0.0, 0.75, t)) * cao;
    float sh = keyShadow(wp);
    float NL = dot(N, KEY_DIR);
    float back = pow(max(dot(-V, KEY_DIR), 0.0), 5.0);
    vec3 trans = vec3(0.95, 1.1, 0.42) * (max(-NL, 0.0) * 0.45 + back * 0.9) * smoothstep(0.1, 0.8, t) * (1.0 - 0.8 * farK);  // the low light shining through the blades
    vec3 light = ambient(N) * ao + FILL_COL * max(dot(N, FILL_DIR), 0.0) * ao;
    light += KEY_COL * (max(NL, 0.0) * 0.75 + 0.2 + trans) * sh * mix(0.35, 1.0, t);
    vec3 S; float fall; vec3 sc = sunLight(wp, N, S, fall);
    float sunVis = smoothstep(1.5, 3.0, length(wp.xz));
    light += sc * (max(dot(N, S), 0.0) * 0.9 + pow(max(dot(-V, S), 0.0), 6.0) * 0.5 * t * (1.0 - 0.7 * farK)) * sunVis * mix(0.4, 1.0, t);
    vec3 H = normalize(KEY_DIR + V);
    vCol = c * light + KEY_COL * pow(max(dot(N, H), 0.0), 24.0) * 0.05 * sh * t;
    // far off, a blade takes the colour the field has there (the ground carries on with the same model)
    float facing = 0.5 + 0.5 * dot(normalize(V.xz + vec2(1e-4)), normalize(KEY_DIR.xz));
    vec3 fieldL = ambient(vec3(0.0, 0.35, 0.9)) * cao + FILL_COL * 0.5 + KEY_COL * (0.16 + 0.5 * facing + 0.3 * pow(1.0 - facing, 3.0)) * sh;
    // and the light of the sun in the crown, as the ground under it has it (or the blades around the tree show dark against it)
    vec3 S2; float fall2; vec3 sc2 = sunLight(wp, vec3(0.0, 1.0, 0.0), S2, fall2);
    fieldL += sc2 * S2.y * 1.6 * smoothstep(1.4, 3.0, length(wp.xz));
    vec3 fieldC = mix(bladeMid(dry), bladeTip(dry), 0.2 + 0.5 * t) * (0.7 + 0.5 * t) * fieldL;
    vCol = mix(vCol, fieldC, smoothstep(6.0, 16.0, camD) * 0.75);
    vSide = side;
    vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`,it=`
  varying vec3 vCol; varying float vSide;
  #include <fog_pars_fragment>
  void main(){
    gl_FragColor = vec4(vCol * (1.0 - 0.22 * vSide * vSide), 1.0);
    #include <fog_fragment>
  }`;function at(e){let t=new p;t.name=`grass`;let r=qe(97),[i,a,o,s]=e.grass,u=[3.6,9,22],d=a/(u[0]*u[0]),m=o/(u[1]*u[1]),h=s/(u[2]*u[2]),g=Math.max(.5,d/Math.max(m,.001)-1),_=s>0?n.clamp(Math.log((d/h-1)/g)/Math.log(u[1]/u[0]),1.5,4):2.4,v=u[0]/2/g**(1/_),y=s>0?10.5:o>0?4.4:1.8,b=[{count:i,segs:e.segs[0],tile:0,inner:0,rho:1},{count:a,segs:e.segs[1],tile:u[0],inner:0,rho:d},{count:o,segs:e.segs[2],tile:u[1],inner:u[0]/2,rho:o/(u[1]*u[1])},{count:s,segs:e.segs[3],tile:u[2],inner:u[1]/2,rho:s/(u[2]*u[2])}];for(let e of b){if(e.count<=0)continue;let n=nt(e,r),i=new f,a=et(e.segs);i.index=a.index,i.setAttribute(`position`,a.getAttribute(`position`)),i.setAttribute(`aBlade`,new l(n.a,4)),i.setAttribute(`aLook`,new l(n.b,4)),i.instanceCount=n.n;let o=new V({side:2,fog:!0,uniforms:{...N.clone(G.fog),...Q,uLayer:{value:new oe(e.tile,e.inner,e.rho,e.tile===0?60:y)},uLod:{value:new H(d,v,_)}},vertexShader:$+rt,fragmentShader:it}),s=new c(i,o);s.frustumCulled=!1,s.name=e.tile===0?`grass-tree`:`grass-ring`,t.add(s)}return e.flowers>0&&t.add(ot(e.flowers,r)),{group:t,dispose(){t.traverse(e=>{let t=e;t.geometry&&(t.geometry.dispose(),t.material.dispose())})}}}function ot(e,n){let r=[],i=[];for(let e=0;e<=3;e++)r.push(-1,e/3,0,1,e/3,0);for(let e=0;e<3;e++){let t=e*2;i.push(t,t+1,t+2,t+2,t+1,t+3)}let a=r.length/3;r.push(-1,-1,1,1,-1,1,-1,1,1,1,1,1),i.push(a,a+1,a+2,a+2,a+1,a+3);let o=new f;o.setAttribute(`position`,new t(r,3)),o.setIndex(i);let s=new Float32Array(e*4),u=new Float32Array(e*4),d=0;for(;d<e;){let t=Math.sqrt(3.24+n()*87.01),r=n()*Math.PI*2,i=Math.sin(r)*t,a=Math.cos(r)*t,o=n()<.3?3:Math.floor(n()*3),c=4+Math.floor(n()*14);for(let t=0;t<c&&d<e;t++){let e=i+(n()-.5)*.9,t=a+(n()-.5)*.9;if(tt(e,t,.03)||Math.hypot(e,t)<1.7)continue;let r=n()<.8?o:Math.floor(n()*4),c=r===3?.22+n()*.14:.1+n()*.12;s.set([e,t,c,r],d*4),u.set([r===3?.022+n()*.01:.011+n()*.008,n(),.1+n()*.35,n()],d*4),d++}}o.setAttribute(`aF`,new l(s,4)),o.setAttribute(`aG`,new l(u,4)),o.instanceCount=d;let p=new V({side:2,fog:!0,uniforms:{...N.clone(G.fog),...Q},vertexShader:$+`
      attribute vec4 aF; attribute vec4 aG;
      varying vec3 vLight; varying vec2 vUv; varying float vHead; varying float vKind; varying float vTint;
      #include <fog_pars_vertex>
      void main(){
        vec2 xz = aF.xy; float h = aF.z, kind = aF.w, size = aG.x, seed = aG.y;
        vec3 root = vec3(xz.x, GROUND_Y - 0.005, xz.y);
        float camD = distance(root, cameraPosition);
        float fade = 1.0 - smoothstep(9.0, 13.0, camD);
        if (fade < 0.01) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return; }
        float la = seed * 6.2832;
        vec2 bend = vec2(cos(la), sin(la)) * aG.z + windAt(xz, uTime, seed) * (0.6 + 2.0 * h);
        float beta = length(bend) + 1e-4; vec2 bd = bend / beta; beta = min(beta, 1.2);
        bool head = position.z > 0.5;
        float t = head ? 1.0 : position.y;
        float an = beta * t;
        vec3 sp = root + vec3(bd.x, 0.0, bd.y) * h * (1.0 - cos(an)) / beta + vec3(0.0, h * sin(an) / beta, 0.0);
        vec3 tang = normalize(vec3(bd.x * sin(an), cos(an), bd.y * sin(an)));
        vec3 V = normalize(cameraPosition - sp);
        vec3 rt = normalize(cross(tang, V));
        vec3 wp;
        if (head) {
          float sz = size * fade;
          vec3 yAx = kind > 2.5 ? tang : normalize(mix(normalize(cross(V, rt)), tang, 0.35));
          vec2 hs = kind > 2.5 ? vec2(0.32, 1.0) * sz : vec2(sz);
          wp = sp + rt * position.x * hs.x + yAx * (position.y * hs.y + (kind > 2.5 ? hs.y * 0.85 : 0.0));
          vUv = position.xy;
        } else {
          wp = sp + rt * position.x * 0.0013 * fade;
          vUv = vec2(position.x, t);
        }
        vHead = head ? 1.0 : 0.0; vKind = kind; vTint = aG.w;
        vec3 N = normalize(V + vec3(0.0, 0.5, 0.0));
        float sh = keyShadow(wp);
        vec3 S; float fall; vec3 sc = sunLight(wp, N, S, fall);
        float back = pow(max(dot(-V, KEY_DIR), 0.0), 4.0);
        vLight = ambient(N) * mix(0.5, 1.0, t) * contactAO(wp) + KEY_COL * (0.18 + back * 0.7) * sh + sc * 0.35 * smoothstep(1.5, 3.0, length(xz));
        vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,fragmentShader:`
      varying vec3 vLight; varying vec2 vUv; varying float vHead; varying float vKind; varying float vTint;
      #include <fog_pars_fragment>
      void main(){
        vec3 c;
        if (vHead > 0.5) {
          vec2 p = vUv; float r = length(p); float ang = atan(p.y, p.x);
          float a;
          if (vKind < 0.5) {          // daisy
            float pr = 0.5 + 0.5 * pow(abs(cos(ang * 6.5)), 0.7);
            a = step(r, pr * 0.98);
            c = r < 0.3 ? vec3(0.85, 0.55, 0.05) : vec3(0.82, 0.8, 0.74) * (0.8 + 0.2 * (1.0 - r));
          } else if (vKind < 1.5) {   // buttercup
            float pr = 0.72 + 0.28 * cos(ang * 5.0);
            a = step(r, pr * 0.9);
            c = vec3(0.95, 0.66, 0.05) * (0.65 + 0.45 * (1.0 - r));
          } else if (vKind < 2.5) {   // cornflower
            float pr = 0.7 + 0.3 * fract(sin(floor(ang * 2.6 + 9.0) * 91.7) * 43.1);
            a = step(r, pr * 0.95);
            c = mix(vec3(0.22, 0.16, 0.62), vec3(0.42, 0.24, 0.62), vTint) * (0.7 + 0.5 * r);
          } else {                    // seed head
            float w = 0.9 * sqrt(max(1.0 - p.y * p.y, 0.0)) * (0.65 + 0.35 * abs(sin(p.y * 14.0)));
            a = step(abs(p.x), w);
            c = mix(vec3(0.42, 0.33, 0.14), vec3(0.62, 0.5, 0.24), vTint) * (0.75 + 0.25 * p.y);
          }
          if (a < 0.5) discard;
        } else c = mix(vec3(0.05, 0.09, 0.02), vec3(0.14, 0.2, 0.05), vUv.y);
        gl_FragColor = vec4(c * vLight, 1.0);
        #include <fog_fragment>
      }`}),m=new c(o,p);return m.frustumCulled=!1,m.name=`flowers`,m}function st(){let e=document.createElement(`canvas`);e.width=e.height=512;let t=e.getContext(`2d`);t.translate(256,256),t.filter=`blur(3px)`;let n=qe(5);for(let e=0;e<64;e++){let e=n()*Math.PI*2,r=120+n()*130,i=.01+n()*.03,a=t.createLinearGradient(0,0,Math.cos(e)*r,Math.sin(e)*r);a.addColorStop(0,`rgba(255,236,196,${(.12+n()*.2).toFixed(3)})`),a.addColorStop(1,`rgba(255,214,150,0)`),t.fillStyle=a,t.beginPath(),t.moveTo(0,0),t.lineTo(Math.cos(e-i)*r,Math.sin(e-i)*r),t.lineTo(Math.cos(e+i)*r,Math.sin(e+i)*r),t.fill()}return new r(e)}var ct=[7,6,4,3],lt=[.07,.13,.2,.26],ut=[.125,.08,.04,.02],dt=[0,.06,.1,.14],ft=[.5,.42,.38,.3],pt=[4,3,2],mt=[.42,.3,.28];function ht(e){let t=20231,r=()=>(t=t*16807%2147483647)/2147483647,i=new H(0,1,0),o=e=>{let t=Math.hypot(e.x,e.z);return t<.001?new H(1,0,0):new H(e.x/t,0,e.z/t)},s=[],c=[],l=0,u=(t,a,d,f,p,m)=>{let h=ct[p],g=[t.clone()],_=a.clone().normalize(),v=t.clone();for(let t=1;t<=h;t++){_.addScaledVector(o(v),ut[p]).addScaledVector(i,dt[p]).add(new H(r()-.5,(r()-.5)*.6,r()-.5).multiplyScalar(lt[p])).normalize();let t=v.clone().addScaledVector(_,d/h);p>0&&t.y<e.clearY+.15&&(_.y=Math.abs(_.y)*.5+.1),v.addScaledVector(_.normalize(),d/h),g.push(v.clone())}let y=f*ft[p];if(s.push({pts:g,r0:f,r1:y,level:p}),p===3){c.push({c:v.clone(),R:.42+r()*.18,tone:r(),mass:m});return}let b=new U(g),x=pt[p]+ +(r()>.6),S=r()*Math.PI*2;for(let e=0;e<x;e++){let t=mt[p]+(e+.3+r()*.5)/x*(.97-mt[p]),a=b.getPointAt(t),s=b.getTangentAt(t),c=new H().crossVectors(s,Math.abs(s.y)>.9?new H(1,0,0):i).normalize();c.applyAxisAngle(s,S+e*2.39996+(r()-.5)*.6);let h=(30+r()*25)*n.DEG2RAD,g=s.clone().multiplyScalar(Math.cos(h)).addScaledVector(c,Math.sin(h)),_=o(a),v=g.x*_.x+g.z*_.z;v<.15&&g.addScaledVector(_,.15-v*1.4),g.y+=.12;let C=n.lerp(f,y,t**.8);u(a,g.normalize(),d*(.6+r()*.14)*(1.08-.32*t),C*.74,p+1,p===0?l++:m)}p>=1&&c.push({c:v.clone(),R:.5+r()*.2+(p===1?.12:0),tone:r(),mass:m})};for(let t=0;t<6;t++){let i=t/6*Math.PI*2+(r()-.5)*.35,a=new H(Math.cos(i)*e.trunkR*.3,e.top-.32,Math.sin(i)*e.trunkR*.3),o=(66+r()*10)*n.DEG2RAD;u(a,new H(Math.cos(i)*Math.cos(o),Math.sin(o),Math.sin(i)*Math.cos(o)),1.95+r()*.4,e.trunkR*.44,0,l++)}let d=Math.max(e.clearY,e.sun.y+.5),f=e.leaves,p=new Float32Array(f*4),m=new Float32Array(f*4),h=new Float32Array(f*4),g=new Float32Array(f*3),_=new Float32Array(f*2),v=n.clamp(.46*Math.sqrt(3600/Math.max(1,f)),.36,.8),y=0,b=0;for(let e of c)y+=e.c.y,b=Math.max(b,Math.hypot(e.c.x,e.c.z));y/=c.length;let x=Array.from({length:l},()=>new H),C=Array(l).fill(0),w=Array(l).fill(.3),T=Array.from({length:l},()=>r());for(let e of c)x[e.mass].add(e.c),C[e.mass]++;x.forEach((e,t)=>e.divideScalar(Math.max(1,C[t])));for(let e of c)w[e.mass]=Math.max(w[e.mass],e.c.distanceTo(x[e.mass])+e.R);let E=[`#1c3a15`,`#24481a`,`#2e571e`,`#3a6523`,`#477329`,`#58822e`,`#6e9133`,`#879e3b`].map(e=>new a(e)),D=new ee,O=new S,k=new H,A=new H,j=new H,M=new H,N=new H,P=new a,F=-1/0,I=0,L=[],R=0;for(let e of c)L.push(R+=e.c.y>d-e.R*.3?e.R*e.R*e.R:0);let z=e=>d-.18*n.smoothstep(e,2.4,3.6),B=t=>t.y>=z(Math.hypot(t.x,t.z))&&t.distanceTo(e.sun)>=1.2;for(let e=0;e<f;e++){let t=c[0],i=1,a=0;do{let e=r()*R,n=0,a=L.length-1;for(;n<a;){let t=n+a>>1;L[t]<e?n=t+1:a=t}t=c[n],N.set(r()*2-1,r()*2-1,r()*2-1),N.lengthSq()<1e-4&&N.set(0,1,0),N.normalize(),i=.3+.7*r()**.45,M.copy(t.c).add(new H(N.x*t.R*i,N.y*t.R*i*.72,N.z*t.R*i)),M.lerp(x[t.mass],.12)}while(!B(M)&&++a<12);let s=Math.hypot(M.x,M.z);B(M)||(M.y=Math.max(M.y,z(s)+r()*.1)),k.copy(N).add(new H((r()-.5)*1.1,(r()-.5)*1.1+.25,(r()-.5)*1.1)).normalize();let l=v*(.75+r()*.5);k.y<0&&M.y+k.y*l<z(s)&&(k.y=-k.y*.5,k.normalize()),j.set(r()-.5,r()-.5,r()-.5).cross(k).normalize(),A.crossVectors(j,k).normalize(),O.makeBasis(j,k,A),D.setFromRotationMatrix(O),M.addScaledVector(k,-l*.35),p.set([M.x,M.y,M.z,l],e*4),m.set([D.x,D.y,D.z,D.w],e*4);let u=n.clamp(.25+.75*Math.hypot(s/(b+.4),(M.y-y)/1.1),0,1),d=M.clone().sub(x[t.mass]);d.y/=.75;let f=n.clamp(d.length()/w[t.mass],0,1),S=n.clamp(.05+.3*i*i+.45*f*f+.25*u,0,1),C=N.clone().multiplyScalar(.4).add(d.normalize().multiplyScalar(.6)).add(o(M).multiplyScalar(.15*u)).normalize();h.set([C.x,C.y,C.z,S],e*4);let ee=n.clamp(T[t.mass]*.45+t.tone*.25+r()*.25+(M.y-y)*.12+f*.12-.05,0,.999);P.copy(E[Math.floor(ee*E.length)]).multiplyScalar(.88+r()*.24),g.set([P.r,P.g,P.b],e*3),_.set([Math.floor(r()*4),r()],e*2),F=Math.max(F,M.y+l),I=Math.max(I,s+l)}return{branches:s,leafPos:p,leafRot:m,leafMass:h,leafCol:g,leafVar:_,maxY:F,radius:I,floorY:d}}var gt=e=>`float[${e.length}](${e.map(e=>e.toFixed(4)).join(`, `)})`,_t=`
// furrows: the contour lines of noise fields stretched along the wood, so they run long, wavy and interlacing
float barkFurrows(vec3 q){
#ifdef BARK_HQ
  q += (vec3(vnoise3(q * vec3(0.35, 0.12, 0.35)), 0.0, vnoise3(q * vec3(0.35, 0.12, 0.35) + 3.3)) - 0.5) * vec3(1.4, 0.0, 1.4);
  float v2 = vnoise3(q * vec3(3.4, 0.4, 3.4) + 5.0);
#else
  float v2 = 0.0;
#endif
  float v1 = vnoise3(q * vec3(1.7, 0.2, 1.7));
  float e = abs(v1 - 0.5) * 1.7;
#ifdef BARK_HQ
  e = min(e, abs(v2 - 0.5) * 2.4 + 0.1);
#endif
  // the ridges are broken across here and there
  float brk = smoothstep(0.07, 0.0, abs(vnoise3(q * vec3(1.3, 1.0, 1.3) + 9.0) - 0.5));
  return mix(e, 0.03, brk * 0.8);
}
// q: bark space (stretched along the wood); P: object space; hA: height above the ground; N: normal. Writes the relief height h (0 furrow … 1 plate).
vec3 barkAlbedo(vec3 q, vec3 P, float hA, vec3 N, out float h){
  float e = barkFurrows(q);
  float fw = fwidth(e);
  // a V-shaped furrow: a crisp dark crease at the bottom, rounded plates either side
  float plate = sqrt(clamp(e / (0.34 + fw), 0.0, 1.0));
  float crease = 1.0 - smoothstep(0.0, 0.05 + fw * 1.5, e);
  float fib = vnoise3(q * vec3(6.0, 0.8, 6.0) + P.y * 3.0) * 0.6 + vnoise3(q * vec3(2.0, 3.5, 2.0)) * 0.4;
  // close up: fine grain along the wood and small cross-cracks in the plates (faded out where a pixel covers them)
  float near = 1.0 - smoothstep(0.08, 0.3, fwidth(q.x * 20.0));
  float grain = near > 0.0 ? vnoise3(q * vec3(26.0, 2.6, 26.0)) * 0.6 + vnoise3(q * vec3(9.0, 9.0, 9.0)) * 0.4 : 0.5;
  float crack = near > 0.0 ? smoothstep(0.07, 0.0, abs(vnoise3(q * vec3(3.0, 7.0, 3.0)) - 0.5)) * smoothstep(0.3, 0.6, plate) : 0.0;
  h = plate * (0.78 + 0.22 * fib) + (grain - 0.5) * 0.18 * near - crack * 0.35 * near;
  float tone = vnoise3(P * 2.1);
  vec3 plateC = mix(vec3(0.19, 0.14, 0.1), vec3(0.32, 0.26, 0.2), tone) * (0.78 + 0.38 * fib);
  vec3 c = mix(plateC * vec3(0.32, 0.29, 0.27), plateC, smoothstep(0.0, 0.85, plate)) * (1.0 - crease * 0.75) * (1.0 - crack * 0.5 * near);
  c *= 1.0 + (grain - 0.5) * 0.35 * near;
  c *= 0.8 + 0.4 * vnoise3(q * vec3(1.3, 0.25, 1.3));
  float li = smoothstep(0.64, 0.8, vnoise3(P * 8.0) * 0.65 + vnoise3(P * 25.0) * 0.35) * plate;
  c = mix(c, mix(vec3(0.33, 0.35, 0.28), vec3(0.4, 0.3, 0.12), step(0.72, vnoise3(P * 3.0 + 9.0))), li * 0.55);
  float mz = 1.0 - smoothstep(0.0, 0.85 + vnoise3(P * 1.7) * 0.8, hA);
  vec2 nh = normalize(N.xz + vec2(1e-4));
  float m = mz * smoothstep(0.35, 0.75, vnoise3(P * 4.5) * 0.55 + (1.0 - plate) * 0.4 + 0.25 * (1.0 - max(dot(nh, normalize(KEY_DIR.xz)), 0.0)));
  c = mix(c, vec3(0.055, 0.095, 0.018) * (0.7 + 0.6 * vnoise3(P * 30.0)), m * 0.9);
  h = mix(h, 0.62, m * 0.6);
  return c;
}
// bump mapping from a height without tangents (Mikkelsen), weaker when a pixel covers much bark
vec3 bumpNormal(vec3 W, vec3 N, float h, float amp){
  vec3 dpx = dFdx(W), dpy = dFdy(W);
  amp *= clamp(0.005 / max(length(dpx) + length(dpy), 1e-6), 0.15, 1.0);
  float dhx = dFdx(h) * amp, dhy = dFdy(h) * amp;
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx);
  float det = dot(dpx, r1);
  vec3 grad = sign(det) * (dhx * r1 + dhy * r2);
  return normalize(abs(det) * N - grad);
}
// warm on the side of the evening light, the cool sky on the other, gold from the sun at the head of the ladder
vec3 barkLight(vec3 alb, vec3 N, vec3 V, vec3 W, float ao, float keyVis){
  vec3 S; float fall; vec3 sc = sunLight(W, N, S, fall);
  float NL = max(dot(N, KEY_DIR), 0.0);
  // the warm meadow and the glow bounce light back into the shade side
  vec3 bounce = vec3(0.17, 0.13, 0.08) * (0.6 + 0.4 * max(-N.y, 0.0) + 0.5 * max(dot(N.xz, KEY_DIR.xz), 0.0));
  vec3 col = alb * (ambient(N) * ao * 1.1 + bounce * ao + FILL_COL * max(dot(N, FILL_DIR), 0.0) * ao + KEY_COL * NL * keyVis + sc * max(dot(N, S), 0.0) * 2.6);
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  col += KEY_COL * 0.2 * rim * pow(max(dot(-V, KEY_DIR), 0.0), 1.5) * keyVis * (0.25 + alb.r * 3.0);
  col += SUN_COL * rim * fall * pow(max(dot(-V, S), 0.0), 2.0) * 0.6;
  return col;
}
`;function vt(e){let t=Be.map(e=>e.a*Math.PI/180),n=Be.map(e=>e.w);return new V({fog:!0,defines:e.hq?{BARK_HQ:1}:{},uniforms:{...N.clone(G.fog),...Q,uTime:{value:0},uWords:{value:null},uHas:{value:0},uCam:{value:new H},uSel:{value:new H},uBase:{value:e.base},uTurnH:{value:e.turnH},uTurns:{value:e.turns},uWorldCols:{value:e.worldColors.map(e=>new H(e.r,e.g,e.b))},uWordsK:{value:1},uFoot:{value:e.foot},uTopY:{value:e.top},uLimbA:{value:[0,1.05,2.1,3.14,4.2,5.2]}},vertexShader:$+`
      uniform float uFoot; uniform float uTopY; uniform float uLimbA[6];
      varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying vec3 vP;
      #include <fog_pars_vertex>
      const float RA[8] = ${gt(t)};
      const float RW[8] = ${gt(n)};
      float trunkRadius(float th, float y){
        float foot = 1.0 - smoothstep(uFoot, uFoot + 0.62, y);
        float but = 1.0 - smoothstep(uFoot - 0.04, uFoot + 0.3, y);
        float lob = 0.0;
        for (int i = 0; i < 8; i++) lob += pow(max(cos(th - RA[i]), 0.0), 34.0) * RW[i];
        float r = TRUNK_R * (1.0 + 0.34 * foot * foot + 0.95 * lob * but * but);
        float ll = 0.0;
        for (int i = 0; i < 6; i++) ll += pow(max(cos(th - uLimbA[i]), 0.0), 8.0);
        // where the limbs part, the trunk swells toward each of them and then closes over among their bases
        r *= 1.0 + smoothstep(uTopY - 0.8, uTopY, y) * 0.2 * ll;
        r *= 1.0 - 0.4 * smoothstep(uTopY - 0.02, uTopY + 0.32, y);
        // an old trunk is never round: broad bulges and a slow twist
        r *= 1.0 + 0.055 * sin(th * 2.0 + y * 0.9 + 1.3) + 0.035 * sin(th * 3.0 - y * 1.7) + 0.02 * sin(y * 7.3 - th * 3.0);
        vec3 q = vec3(sin(th) * TRUNK_R * 6.5, y * 1.3, cos(th) * TRUNK_R * 6.5);
        r += 0.012 * (vnoise3(q) - 0.5) + 0.006 * (vnoise3(q * 2.3) - 0.5);
        return r;
      }
      // the trunk leans and wanders a little as it grows
      vec3 trunkPoint(float th, float y){ float r = trunkRadius(th, y); vec2 c = vec2(sin(y * 0.75 + 0.4), cos(y * 0.6 + 1.1)) * 0.035 * smoothstep(uFoot, uFoot + 1.2, y); return vec3(sin(th) * r + c.x, y, cos(th) * r + c.y); }
      void main(){
        float th = uv.x * 6.2831853, y = position.y;
        vec3 P = trunkPoint(th, y);
        vec3 n = normalize(cross(trunkPoint(th + 0.01, y) - P, trunkPoint(th, y + 0.01) - P));
        vP = P;
        vUv = vec2(uv.x, (y - uFoot) / (uTopY - uFoot));
        vec4 w = modelMatrix * vec4(P, 1.0); vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * n);
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,fragmentShader:$+_t+`
      uniform sampler2D uWords; uniform float uHas; uniform vec3 uCam; uniform vec3 uSel;
      uniform float uBase; uniform float uTurnH; uniform float uTurns; uniform vec3 uWorldCols[4]; uniform float uWordsK; uniform float uTopY;
      varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying vec3 vP;
      #include <fog_pars_fragment>
      void main(){
        vec3 n = normalize(vN);
        vec3 V = normalize(cameraPosition - vW);
        float ang = vUv.x * 6.2831853;
        float u = (vW.y - uBase) / uTurnH - vUv.x;           // helix coordinate: integer = a rung of world u
        float wi = clamp(floor(u + 0.5), 0.0, uTurns - 1.0);
        vec3 wc = wi < 0.5 ? uWorldCols[0] : wi < 1.5 ? uWorldCols[1] : wi < 2.5 ? uWorldCols[2] : uWorldCols[3];
        // bark
        float hb;
        vec3 alb = barkAlbedo(vec3(vP.x * 8.0, vP.y * 2.3, vP.z * 8.0), vP, vW.y - GROUND_Y, n, hb);
        // the prayers' words, carved into the bark: gilded, and glowing with the light from above where a rung is near
        vec4 words = uHas > 0.5 && vUv.y < 1.0 ? texture2D(uWords, vUv) : vec4(0.0);
        float carve = smoothstep(0.035, 0.1, words.a);
        float gild = smoothstep(0.05, 0.15, words.a) * mix(0.55, 1.0, uWordsK);
        alb = mix(alb, mix(alb * 0.3, vec3(0.5, 0.33, 0.1), gild), carve);
        vec3 N = bumpNormal(vW, n, mix(hb, -0.3, carve), 0.011);
        float ao = mix(0.5, 1.0, smoothstep(0.0, 0.8, vW.y - GROUND_Y)) * mix(0.5, 1.0, hb) * mix(1.0, 0.7, carve * (1.0 - gild));
        vec3 col = barkLight(alb, N, V, vW, ao, 1.0);
        col *= mix(1.0, 0.35, smoothstep(uTopY - 0.15, uTopY + 0.22, vP.y));   // the crotch among the limbs is in their shade
        vec3 Hk = normalize(KEY_DIR + V);
        col += KEY_COL * vec3(1.0, 0.8, 0.45) * gild * carve * pow(max(dot(N, Hk), 0.0), 24.0) * 1.5;
        vec3 gold = mix(vec3(1.0, 0.78, 0.42), words.rgb * 4.0, 0.25);
        // the rows by a rung glow; the rest of the words are only cut into the bark
        col += gold * words.a * 2.9 * uWordsK * smoothstep(0.03, 0.1, words.a);
        col += gold * words.a * 0.25 * uWordsK;
        float band = smoothstep(0.5, 0.0, abs(u - floor(u + 0.5))) * step(-0.5, u) * step(u, uTurns - 0.5);
        col += wc * band * 0.012;
        // prayer rising: soft bands of warm light travelling up the trunk
        float rise = pow(0.5 + 0.5 * sin(vW.y * 5.0 - uTime * 0.9 + sin(ang * 3.0) * 0.4), 18.0);
        col += vec3(1.0, 0.82, 0.55) * rise * 0.04;
        // glow behind the prayer in focus
        float da = abs(mod(ang - uSel.x + 3.14159265, 6.2831853) - 3.14159265);
        col += vec3(0.62, 0.94, 1.0) * uSel.z * exp(-da * da * 18.0 - pow((vW.y - uSel.y) * 7.0, 2.0)) * 0.22;
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`})}function yt(e){let r=[],i=[],a=[],o=[],s=[];for(let t of e){let e=t.curve.computeFrenetFrames(t.segs,!1),c=r.length/3,l=t.flat??1;for(let s=0;s<=t.segs;s++){let c=s/t.segs,u=t.curve.getPointAt(c),d=n.lerp(t.r0,t.r1,c**.75)*(1+(t.flare??0)*(1-c)**4),f=e.tangents[s];for(let n=0;n<=t.radial;n++){let c=n/t.radial*Math.PI*2,p=e.normals[s].clone().multiplyScalar(Math.cos(c)).addScaledVector(e.binormals[s],Math.sin(c));r.push(u.x+p.x*d,u.y+p.y*d*l,u.z+p.z*d),p.y/=l,p.normalize(),i.push(p.x,p.y,p.z),a.push(f.x,f.y,f.z),o.push(d)}}for(let e=0;e<t.segs;e++)for(let n=0;n<t.radial;n++){let r=c+e*(t.radial+1)+n,i=r+t.radial+1;s.push(r,r+1,i,i,r+1,i+1)}}let c=new y;return c.setAttribute(`position`,new t(r,3)),c.setAttribute(`normal`,new t(i,3)),c.setAttribute(`aT`,new t(a,3)),c.setAttribute(`aR`,new t(o,1)),c.setIndex(s),c}function bt(e,t){return new V({fog:!0,defines:t?{BARK_HQ:1}:{},uniforms:{...N.clone(G.fog),...Q,uFloorY:{value:e}},vertexShader:`
      attribute vec3 aT; attribute float aR;
      varying vec3 vW; varying vec3 vN; varying vec3 vP; varying vec3 vT; varying float vR;
      #include <fog_pars_vertex>
      void main(){
        vP = position; vT = aT; vR = aR;
        vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,fragmentShader:$+_t+`
      uniform float uFloorY;
      varying vec3 vW; varying vec3 vN; varying vec3 vP; varying vec3 vT; varying float vR;
      #include <fog_pars_fragment>
      void main(){
        vec3 n = normalize(vN);
        vec3 V = normalize(cameraPosition - vW);
        vec3 T = normalize(vT);
        float along = dot(vP, T);
        float k = clamp(3.1 / max(vR, 0.02), 7.5, 80.0);
        vec3 q = (vP - T * along) * k + T * along * k * 0.28;
        float hA = vW.y - GROUND_Y;
        float hb;
        vec3 alb = barkAlbedo(q, vP, hA, n, hb);
        float rough = smoothstep(0.018, 0.08, vR);   // twigs are smooth
        hb = mix(0.6, hb, rough);
        alb = mix(vec3(0.15, 0.12, 0.095) * (0.8 + 0.4 * vnoise3(vP * 40.0)), alb, rough);
        vec3 N = bumpNormal(vW, n, hb, 0.009 * mix(0.3, 1.0, rough));
        // inside the crown the evening light and the sky are mostly hidden by the leaves; the sun within is not
        float inCrown = smoothstep(uFloorY - 0.2, uFloorY + 0.9, vW.y);
        float ao = mix(1.0, 0.5, inCrown) * mix(0.5, 1.0, hb) * mix(0.35, 1.0, smoothstep(-0.02, 0.16, hA));
        vec3 col = barkLight(alb, N, V, vW, ao, mix(1.0, 0.3, inCrown) * mix(0.4, 1.0, smoothstep(0.0, 0.2, hA)));
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`})}function xt(e){let t=document.createElement(`canvas`);t.width=t.height=e*2;let n=t.getContext(`2d`),i=3,a=()=>(i=i*16807%2147483647)/2147483647,o=e/256,s=(e,t,r,i)=>{let s=i*(.36+a()*.1),c=Math.floor(a()*255);n.save(),n.translate(e,t),n.rotate(r),n.beginPath(),n.moveTo(0,0),n.bezierCurveTo(s*.95,-i*.18,s*.75,-i*.72,0,-i),n.bezierCurveTo(-s*.75,-i*.72,-s*.95,-i*.18,0,0),n.save(),n.clip();let l=n.createLinearGradient(-s,0,s,0);l.addColorStop(0,`rgb(150,${c},0)`),l.addColorStop(.45,`rgb(236,${c},0)`),l.addColorStop(.55,`rgb(190,${c},0)`),l.addColorStop(1,`rgb(120,${c},0)`),n.fillStyle=l,n.fillRect(-s,-i,s*2,i),n.strokeStyle=`rgb(250,${c},0)`,n.lineWidth=1.6*o,n.beginPath(),n.moveTo(0,0),n.lineTo(0,-i*.96),n.stroke(),n.strokeStyle=`rgb(120,${c},0)`,n.lineWidth=.9*o;for(let e=1;e<7;e++){let t=-i*(.1+e*.115);n.beginPath(),n.moveTo(0,t),n.quadraticCurveTo(-s*.4,t-i*.06,-s*.85,t-i*.14),n.moveTo(0,t),n.quadraticCurveTo(s*.4,t-i*.06,s*.85,t-i*.14),n.stroke()}n.restore(),n.restore()};for(let t=0;t<4;t++){n.save(),n.translate(t%2*e+e/2,Math.floor(t/2)*e+e-8*o);let r=(a()-.5)*.5,i=5+t%2*2,c=new I(r*60*o,-e*.62),l=e=>new I(c.x*e*e,c.y*e);n.strokeStyle=`rgb(80,0,0)`,n.lineWidth=4*o,n.beginPath(),n.moveTo(0,0),n.quadraticCurveTo(0,c.y*.5,c.x,c.y),n.stroke();for(let t=0;t<i-1;t++){let n=.2+t/(i-1)*.75,o=l(n),c=t%2?1:-1;s(o.x,o.y,c*(.95-n*.45)+r*n,e*(.27+.1*Math.sin(Math.PI*n))*(.85+a()*.3))}s(c.x,c.y,r*.8,e*.34),n.restore()}let c=new r(t);return c.anisotropy=4,c}function St(e){let t=X,n=e.map(([e,n,r,i,a])=>{let o=(n-Y)/t.y;return[e-t.x*o,r-t.z*o,i,a]}),r=1/0,i=-1/0,a=1/0,o=-1/0;for(let[e,t]of n)r=Math.min(r,e),i=Math.max(i,e),a=Math.min(a,t),o=Math.max(o,t);let s=Math.max(i-r,o-a)+3,c=(r+i)/2,l=(a+o)/2,u=new Float32Array(65536),d=new I(t.x,t.z).normalize(),f=1/Math.max(.3,t.y);for(let[e,t,r,i]of n){let n=((e-c)/s+.5)*256,a=((t-l)/s+.5)*256,o=Math.max(.8,r/s*256),p=Math.ceil(o*f*1.6);for(let e=Math.max(0,Math.floor(a-p));e<=Math.min(255,Math.ceil(a+p));e++)for(let t=Math.max(0,Math.floor(n-p));t<=Math.min(255,Math.ceil(n+p));t++){let r=t-n,s=e-a,c=(r*d.x+s*d.y)/f,l=-r*d.y+s*d.x,p=(c*c+l*l)/(o*o);p<2.6&&(u[e*256+t]+=i*Math.exp(-p*1.6))}}let p=new Uint8Array(262144);for(let e=0;e<65536;e++){let t=1-Math.exp(-u[e]*.9);p[e*4]=p[e*4+1]=p[e*4+2]=Math.round(t*255),p[e*4+3]=255}let m=new h(p,256,256);return m.magFilter=m.minFilter=xe,m.needsUpdate=!0,{tex:m,xf:new oe(c,l,1/s,.82)}}function Ct(e){let t=new p;t.name=`tree`;let r=11,i=()=>(r=r*16807%2147483647)/2147483647,a=ht({trunkR:e.trunkR,top:e.top,sun:e.sun,clearY:e.clearY,leaves:e.leaves}),o=bt(a.floorY,e.hq),s=[];for(let t of Be){let n=t.a*Math.PI/180,r=new H(Math.sin(n),0,Math.cos(n)),a=new H(r.z,0,-r.x),o=(i()-.5)*.25,c=.85+t.len,l=[r.clone().multiplyScalar(.32).setY(e.bottom+.4),r.clone().multiplyScalar(.64).setY(e.bottom+.1),r.clone().multiplyScalar(.62+t.len*.45).addScaledVector(a,o*.4).setY(e.bottom+.015),r.clone().multiplyScalar(c).addScaledVector(a,o).setY(e.bottom-.04)];s.push({curve:new U(l),segs:22,radial:10,r0:.15*t.w,r1:.012,flat:.6});for(let n=0;n<2;n++){if(i()<.35)continue;let o=.45+i()*.3,c=new U(l).getPointAt(o),u=a.clone().multiplyScalar(n?1:-1),d=r.clone().multiplyScalar(.6).addScaledVector(u,.8).normalize(),f=.25+i()*.3;s.push({curve:new U([c.clone().setY(c.y+.01),c.clone().addScaledVector(d,f*.5).setY(e.bottom+.005),c.clone().addScaledVector(d,f).setY(e.bottom-.03)]),segs:8,radial:6,r0:.035*t.w,r1:.006,flat:.6})}}let d=new c(yt(s),o);d.castShadow=d.receiveShadow=!0,d.name=`roots`,t.add(d);let f=new p;f.position.y=e.top;let m=new p;m.position.y=-e.top,f.add(m),t.add(f);let h=[16,10,7,5],g=[6,4,3,2],_=new c(yt(a.branches.map(e=>({curve:new U(e.pts),segs:e.pts.length*g[e.level],radial:h[e.level],r0:e.r0,r1:e.r1,flare:e.level===0?.35:.18}))),o);_.name=`branches`,_.castShadow=!0,m.add(_);let b=a.branches.filter(e=>e.level===0).map(e=>{let t=e.pts[Math.min(2,e.pts.length-1)];return Math.atan2(t.x,t.z)}),x=e.leaves,C=new u(1,1,2,3).translate(0,.5,0),T=C.getAttribute(`position`);for(let e=0;e<T.count;e++)T.setZ(e,-Math.abs(T.getX(e))*.22+T.getY(e)*T.getY(e)*.12);C.computeVertexNormals(),C.setAttribute(`aMass`,new l(a.leafMass,4)),C.setAttribute(`aCol`,new l(a.leafCol,3)),C.setAttribute(`aVar`,new l(a.leafVar,2));let E=new V({side:2,fog:!0,defines:e.a2c?{A2C:1}:{},alphaToCoverage:e.a2c,uniforms:{...N.clone(G.fog),...Q,uMap:{value:null}},vertexShader:$+`
      attribute vec4 aMass; attribute vec3 aCol; attribute vec2 aVar;
      varying vec2 vUv; varying vec3 vCol; varying vec3 vW; varying vec3 vN; varying vec3 vMass; varying float vExp;
      #include <fog_pars_vertex>
      void main(){
        vUv = (uv + vec2(mod(aVar.x, 2.0), 1.0 - floor(aVar.x / 2.0))) * 0.5;
        vec3 root = instanceMatrix[3].xyz;
        vec4 ip = instanceMatrix * vec4(position, 1.0);
        // the same wind as the meadow's: gusts through the whole crown, stronger at its edges; every sprig flutters on its stem
        float ph = aVar.y;
        float reach = 0.35 + smoothstep(0.6, 3.4, length(root.xz));
        vec2 w = windAt(root.xz, uTime, ph * 0.3);
        vec3 gustV = vec3(w.x, 0.25 * length(w) * sin(uTime * 0.9 + root.y + ph * 6.0), w.y) * 0.05 * reach;
        vec3 flutter = vec3(sin(uTime * 2.3 + ph * 18.8), 0.6 * sin(uTime * 2.9 + ph * 31.4), cos(uTime * 1.9 + ph * 25.1)) * 0.026 * uv.y * uWind;
        ip.xyz += gustV * (0.4 + 0.6 * uv.y) + flutter;
        vec4 wp = modelMatrix * ip;
        vW = wp.xyz;
        vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        vMass = normalize(mat3(modelMatrix) * aMass.xyz);
        vExp = aMass.w; vCol = aCol;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,fragmentShader:$+`
      uniform sampler2D uMap;
      varying vec2 vUv; varying vec3 vCol; varying vec3 vW; varying vec3 vN; varying vec3 vMass; varying float vExp;
      #include <fog_pars_fragment>
      void main(){
        vec4 tx = texture2D(uMap, vUv);
      #ifdef A2C
        float alpha = smoothstep(0.28, 0.58, tx.a);
        if (alpha < 0.02) discard;
      #else
        float alpha = 1.0;
        if (tx.a < 0.42) discard;
      #endif
        vec3 V = normalize(cameraPosition - vW);
        vec3 nf = normalize(vN); if (dot(nf, V) < 0.0) nf = -nf;   // the face turned to us
        vec3 M = normalize(vMass);
        vec3 N = normalize(mix(nf, M, 0.72));                       // shaded as part of its mass
        vec3 S; float fall; vec3 sc = sunLight(vW, N, S, fall);
        // colour: the leaf's own green, varied leaf by leaf; warmer and golden near the sun
        vec3 base = vCol * mix(0.6, 1.12, tx.r) * mix(vec3(0.86, 0.95, 0.82), vec3(1.16, 1.06, 0.82), tx.g);
        base = mix(base, base * vec3(1.45, 1.2, 0.5) + vec3(0.03, 0.022, 0.0), clamp(fall * 1.3, 0.0, 1.0) * 0.55 * max(dot(N, S) * 0.7 + 0.3, 0.0));
        float occl = mix(0.08, 1.0, vExp * vExp);                  // deep inside the foliage it is dark
        float keyVis = smoothstep(0.2, 0.85, vExp);
        // the evening light on the masses: a lit side and a shade side, the cool sky from above
        float kd = max(dot(N, KEY_DIR) * 0.7 + 0.3, 0.0);
        vec3 col = base * (ambient(N) * 1.5 * occl + FILL_COL * 1.3 * max(dot(N, FILL_DIR), 0.0) * occl + KEY_COL * 1.15 * kd * kd * keyVis);
        // and shining through the leaves when we look toward it
        float backK = pow(max(dot(-V, KEY_DIR), 0.0), 3.0);
        col += base * vec3(1.15, 1.3, 0.4) * KEY_COL * (backK * 2.2 + max(dot(-nf, KEY_DIR), 0.0) * 0.4) * keyVis * mix(0.4, 1.0, tx.r);
        // the sun at the head of the ladder lights the crown from within and below
        col += base * sc * max(dot(N, S), 0.0) * 3.2 * mix(0.25, 1.0, vExp);
        float behind = max(dot(-V, S), 0.0);
        float through = pow(behind, 3.0) + 0.4 * max(dot(-nf, S), 0.0) * smoothstep(0.0, 0.7, behind);
        col += vec3(0.62, 0.66, 0.1) * mix(0.35, 1.0, tx.r) * through * fall * 2.0 * mix(0.3, 1.0, vExp);
        // a gold rim on the masses around the sun, a cool rim of sky along the top of the crown
        float rim = pow(1.0 - max(dot(N, V), 0.0), 2.5);
        col += vec3(1.0, 0.68, 0.3) * rim * fall * max(dot(M, S), 0.0) * 0.8 * vExp;
        col += SKY_COL * rim * max(M.y, 0.0) * vExp * 0.5;
        // the leaves are glossy: they catch the evening light
        vec3 H = normalize(KEY_DIR + V);
        col += KEY_COL * pow(max(dot(nf, H), 0.0), 28.0) * 0.22 * keyVis;
        gl_FragColor = vec4(col, alpha);
        #include <fog_fragment>
      }`});E.uniforms.uMap.value=xt(e.leafTex);let D=new v(C,E,x),O=new S,k=new ee,A=new H,j=new H;for(let e=0;e<x;e++){let t=a.leafPos;j.set(t[e*4],t[e*4+1],t[e*4+2]),k.fromArray(a.leafRot,e*4),A.setScalar(t[e*4+3]),D.setMatrixAt(e,O.compose(j,k,A))}D.computeBoundingSphere(),D.boundingSphere.radius+=.4,D.name=`leaves`,m.add(D);let M=[],P=Math.sqrt(9e3/Math.max(1,x));for(let e=0;e<x;e++){let t=a.leafPos;M.push([t[e*4],t[e*4+1]+t[e*4+3]*.3,t[e*4+2],t[e*4+3]*.42,.55*P*P])}for(let e of a.branches){let t=new U(e.pts),r=t.getLength(),i=Math.max(2,Math.ceil(r/.08));for(let r=0;r<=i;r++){let a=t.getPointAt(r/i);M.push([a.x,a.y,a.z,Math.max(.03,n.lerp(e.r0,e.r1,r/i)),1.2])}}let F=St(M),I=Q.uCrownShadow.value;Q.uCrownShadow.value=F.tex,Q.uCrownXf.value.copy(F.xf),I.dispose();let L=t=>{let n=new y,r=new Float32Array(t*4);for(let e=0;e<r.length;e++)r[e]=i();return n.setAttribute(`position`,new W(new Float32Array(t*3),3)),n.setAttribute(`aSeed`,new W(r,4)),n.boundingSphere=new pe(e.sun.clone(),a.radius+1),n},R={uTime:{value:0},uH:{value:800},uSun:{value:e.sun},uFloor:{value:a.floorY},uClear:{value:e.clearY}},z=new w(L(e.sparks),new V({uniforms:R,vertexShader:`
      attribute vec4 aSeed; uniform float uTime; uniform float uH; uniform vec3 uSun; varying float vA;
      void main(){
        float h = fract(aSeed.z + uTime * 0.01 * (0.5 + aSeed.w));
        float a = aSeed.x * 6.2831853 + uTime * 0.04 * (aSeed.y - 0.5);
        float r = 0.35 + aSeed.y * 2.4;
        vec3 p = uSun + vec3(cos(a) * r, -0.45 + h * 2.4 + sin(uTime * 0.3 + aSeed.x * 20.0) * 0.05, sin(a) * r);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        vA = sin(h * 3.14159) * (0.55 + 0.45 * sin(uTime * 1.7 + aSeed.w * 40.0)) / (1.0 + r * 0.4);
        gl_PointSize = clamp((0.022 + 0.02 * aSeed.w) * projectionMatrix[1][1] * uH * 0.5 / -mv.z, 1.0, 9.0);
      }`,fragmentShader:`varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5); float a = (smoothstep(0.5, 0.0, d) * 0.5 + smoothstep(0.18, 0.0, d)) * vA;
        gl_FragColor = vec4(vec3(1.0, 0.82, 0.48) * a * 1.4, a); }`,transparent:!0,depthWrite:!1,blending:2}));z.name=`crown-motes`;let B=new w(L(Math.max(4,Math.round(e.sparks*.35))),new V({uniforms:R,vertexShader:`
      attribute vec4 aSeed; uniform float uTime; uniform float uH; uniform float uFloor; uniform float uClear;
      varying float vA; varying float vSpin; varying float vLit;
      void main(){
        float h = fract(aSeed.z + uTime * 0.012 * (0.6 + aSeed.w));
        float a = aSeed.x * 6.2831853 + h * 0.5;
        float r = 1.3 + aSeed.y * 1.9 + h * 0.4;
        float sway = sin(uTime * 1.1 + aSeed.x * 30.0) * 0.18 * h;
        vec3 p = vec3(cos(a) * r + sway * sin(a), mix(uFloor, uClear + 0.05, h), sin(a) * r - sway * cos(a));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        vA = smoothstep(0.0, 0.12, h) * smoothstep(1.0, 0.8, h);
        vSpin = uTime * (1.2 + aSeed.w * 2.0) + aSeed.y * 6.28;
        vLit = 0.55 + 0.45 * sin(vSpin * 1.3);
        gl_PointSize = clamp(0.1 * projectionMatrix[1][1] * uH * 0.5 / -mv.z, 1.5, 28.0);
      }`,fragmentShader:`varying float vA; varying float vSpin; varying float vLit;
      void main(){
        vec2 q = gl_PointCoord - 0.5; float c = cos(vSpin), s = sin(vSpin);
        q = vec2(c * q.x - s * q.y, s * q.x + c * q.y);
        float w = 0.17 * (1.0 - pow(abs(q.y) / 0.45, 2.0)) * (0.6 + 0.4 * abs(sin(vSpin * 0.7)));
        if (abs(q.y) > 0.45 || abs(q.x) > w || vA < 0.02) discard;
        gl_FragColor = vec4(mix(vec3(0.12, 0.17, 0.03), vec3(0.55, 0.45, 0.1), vLit) * (0.8 + 0.4 * vA), vA);
      }`,transparent:!0,depthWrite:!1}));return B.name=`falling-leaves`,m.add(z,B),{group:t,maxY:a.maxY,radius:a.radius,limbAngles:b,update(e,t){R.uTime.value=e,z.visible=B.visible=t>0,f.rotation.set(Math.sin(e*.31)*.004*t,0,Math.sin(e*.37+1)*.005*t)},setPixelHeight(e){R.uH.value=e},dispose(){t.traverse(e=>{let t=e;if(t.geometry){t.geometry.dispose();for(let e of[].concat(t.material)){for(let t of Object.values(e))t instanceof he&&t.dispose();if(e instanceof V)for(let[t,n]of Object.entries(e.uniforms))n.value instanceof he&&!(t in Q)&&n.value.dispose();e.dispose()}}})}}}var wt=class extends fe{constructor(e){super(`GradeEffect`,`
      uniform float uSeed; uniform float uGrain;
      float gHash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
        vec3 c = pow(max(inputColor.rgb, 0.0), vec3(1.0 / 2.2));
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c *= mix(vec3(0.94, 0.99, 1.07), vec3(1.045, 1.0, 0.93), smoothstep(0.12, 0.75, l));
        c = c * 0.955 + vec3(0.024, 0.026, 0.036);
        float l2 = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(vec3(l2), c, 1.07);
        c = mix(c, c * c * (3.0 - 2.0 * c), 0.18);
        float g = gHash(floor(uv * resolution) + uSeed * 97.0) + gHash(floor(uv * resolution) * 1.37 + uSeed * 31.0) - 1.0;
        c += g * uGrain * (1.0 - 0.75 * l2);
        outputColor = vec4(pow(max(c, 0.0), vec3(2.2)), inputColor.a);
      }`,{blendFunction:ge.SRC,uniforms:new Map([[`uSeed`,new ye(0)],[`uGrain`,new ye(e)]])})}set seed(e){this.uniforms.get(`uSeed`).value=e}},Tt=class{renderer;camera;sun;composer;bloom;godRays=null;grade;mainPass=null;smaaPass=null;frameNo=0;constructor(e,t,n,r,i){this.renderer=e,this.camera=n,this.sun=i,this.composer=new z(e,{frameBufferType:m,multisampling:r.msaa}),this.composer.addPass(new A(t,n)),this.setQuality(r)}setQuality(e){for(let e of[this.mainPass,this.smaaPass])e&&(this.composer.removePass(e),e.dispose());this.smaaPass=null,this.sun.removeFromParent(),this.composer.multisampling=e.msaa,this.bloom=new se({mipmapBlur:!0,intensity:.9,luminanceThreshold:.72,luminanceSmoothing:.28,radius:.55,levels:e.bloomLevels}),this.godRays=e.godRays>0?new ce(this.camera,this.sun,{blendFunction:ge.SCREEN,samples:e.godRays,density:.9,decay:.925,weight:.3,exposure:.5,clampMax:.55,blur:!0,kernelSize:me.SMALL,resolutionScale:.5}):null,this.grade=new wt(e.grain);let t=[this.bloom];this.godRays&&t.push(this.godRays),t.push(new M({mode:F.ACES_FILMIC}),this.grade,new ue({offset:.28,darkness:.62})),this.mainPass=new D(this.camera,...t),this.composer.addPass(this.mainPass),e.msaa===0&&(this.smaaPass=new D(void 0,new re({preset:ve.HIGH})),this.composer.addPass(this.smaaPass))}setRays(e){this.godRays&&(this.godRays.blendMode.opacity.value=e)}setSize(e,t){this.composer.setSize(e,t,!1)}render(e,t=!1){t||(this.grade.seed=++this.frameNo%64/64),this.renderer.setRenderTarget(null),this.composer.render(e)}},Et={contains:`#ffd27a`,adds:`#5dffa2`,varies:`#c9a2ff`,related:`#7fb2ff`},Dt=.14,Ot=26,kt=.47,At=.95,jt=.1,Mt=34*K,Nt=[`I`,`II`,`III`,`IV`],Pt={pos:{value:new H},r:{value:0}};function Ft(e){return e.onBeforeCompile=e=>{e.uniforms.uCutPos=Pt.pos,e.uniforms.uCutR=Pt.r,e.vertexShader=`varying vec3 vCutW;
`+e.vertexShader.replace(`#include <project_vertex>`,`#include <project_vertex>
      #ifdef USE_INSTANCING
        vCutW = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
      #else
        vCutW = (modelMatrix * vec4(transformed, 1.0)).xyz;
      #endif`),e.fragmentShader=`uniform vec3 uCutPos; uniform float uCutR; varying vec3 vCutW;
`+e.fragmentShader.replace(`void main() {`,`void main() {
  if (uCutR > 0.0 && distance(vCutW, uCutPos) < uCutR) discard;`)},e}function It(e){let t=document.createElement(`canvas`);t.width=t.height=128;let n=t.getContext(`2d`),i=n.createRadialGradient(64,64,0,64,64,64);for(let[t,n]of e)i.addColorStop(t,n);return n.fillStyle=i,n.fillRect(0,0,128,128),new r(t)}var Lt=class{canvas;labelsEl;cb;renderer;scene=new _e;camera=new d(38,1,.003,200);pipeline;timer=new j;time=0;keyLight;motes=null;sky;grass=null;ground;sunSource=new c(new B(.32,24,16),new x({color:new a(`#ffcf90`).multiplyScalar(1),transparent:!0,depthWrite:!1,fog:!1}));rays=null;tree=null;crown={top:5.4,r:3.4};ladder=new p;pillar;pillarMat;heaven;angels=[];angelPoints;angelMat;railMats=[];metalMats=[];world;L={turnH:.9,rIn:.74,rOut:1.36,base:-1.32,turns:4,top:2.28};nodes=[];nodeIndex=new Map;nodePos=[];nodePoints;nodeMat;relLines=[];relGroup=new p;nodeLabels=[];regionLabels=[];worldLabels=[];captions=[];badges=[];focusTag;proj=[];routeGroup=null;routeMat=null;comet=null;routePts=[];routeCum=[];segPts=[];travel=null;speed=1;beam;beamMat;tiles=new Map;tileMeshes=[];previews={};view={t:new H(0,.4,0),az:.3,d:9};flight=null;atHome=!1;vel={az:0,y:0};dragging=!1;lastInteraction=performance.now();insets={left:0,right:0,top:0,bottom:0};viewOff={x:0,y:0};width=1;height=1;selectedId=null;route=null;routeNusach=`em`;stopIndex=-1;hoverId=null;reduceMotion=!1;relView=!0;preset;fpsSamples=[];onSlow=null;constructor(e,t,n,r={}){this.canvas=e,this.labelsEl=t,this.cb=r,this.renderer=new k({canvas:e,antialias:!1,stencil:!1,depth:!0,powerPreference:`high-performance`}),this.renderer.toneMapping=0,this.renderer.outputColorSpace=P,this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=1,We(),this.sky=Ye(),this.scene.add(this.sky),this.scene.environment=Ge(this.renderer,this.sky),this.scene.fog=new te(Ke.fog,.012),this.scene.add(this.ladder),this.buildLights(),this.buildBeam(),this.ground=Xe(n.grass[3]===0),this.scene.add(this.ground,$e()),this.applyQuality(n),this.bindInput(),this.resize(),new ResizeObserver(()=>this.resize()).observe(e),this.renderer.setAnimationLoop(()=>this.frame())}buildLights(){let e=new ne(Pe,Fe);e.position.copy(X).multiplyScalar(12).add(new H(0,.2,0)),e.castShadow=!0,e.shadow.camera.left=e.shadow.camera.bottom=-3.4,e.shadow.camera.right=e.shadow.camera.top=3.4,e.shadow.camera.near=3,e.shadow.camera.far=26,e.shadow.bias=-3e-4,e.shadow.normalBias=.02,e.shadow.radius=5,e.target.position.set(0,.2,0),this.keyLight=e;let t=new ne(`#9fbcff`,.7);t.position.copy(Ie).multiplyScalar(10),this.scene.add(e,e.target,t,new g(`#7f9ccc`,`#3b3a24`,.7))}buildBeam(){this.beamMat=new V({uniforms:{uTime:{value:0},uOp:{value:0}},vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,fragmentShader:`varying vec2 vUv; uniform float uTime; uniform float uOp;
        void main(){ float a = (1.0 - vUv.y) * (1.0 - vUv.y) * uOp; float s = 0.75 + 0.25*sin(vUv.y*40.0 - uTime*3.0);
          gl_FragColor = vec4(vec3(0.62,0.94,1.0)*a*s*1.6, a*s); }`,transparent:!0,depthWrite:!1,blending:2,side:2});let t=new c(new i(.0035,.0035,.36,12,1,!0).translate(0,.18,0),this.beamMat),n=new c(new e(.017,.0205,64).rotateX(-Math.PI/2),new x({color:`#9ff0ff`,transparent:!0,opacity:0,depthWrite:!1,blending:2}));this.beam=new p,this.beam.add(t,n),this.beam.visible=!1,this.scene.add(this.beam)}applyQuality(e){let t=!this.preset;if(this.preset=e,this.renderer.setPixelRatio(e.dpr),this.keyLight.castShadow=e.shadows,this.keyLight.shadow.mapSize.set(e.shadowSize,e.shadowSize),this.keyLight.shadow.map?.dispose(),this.keyLight.shadow.map=null,this.motes&&(this.scene.remove(this.motes),this.motes.geometry.dispose()),this.motes=Ne(e.motes),this.scene.add(this.motes),this.grass&&(this.scene.remove(this.grass.group),this.grass.dispose()),this.grass=at({grass:e.grass,segs:e.grassSegs,flowers:e.flowers}),this.scene.add(this.grass.group),t?this.pipeline=new Tt(this.renderer,this.scene,this.camera,e,this.sunSource):this.pipeline.setQuality(e),this.ground){let t=this.ground.material,n=e.grass[3]===0;!!t.defines.LQ!==n&&(n?t.defines.LQ=1:delete t.defines.LQ,t.needsUpdate=!0)}if(this.pillarMat&&!!this.pillarMat.defines.BARK_HQ!==e.barkHQ&&(e.barkHQ?this.pillarMat.defines.BARK_HQ=1:delete this.pillarMat.defines.BARK_HQ,this.pillarMat.needsUpdate=!0),this.rays&&(this.rays.visible=e.godRays===0),!t&&this.world){this.buildTree();for(let e of this.tiles.values())this.disposeTile(e);this.tiles.clear(),this.setPreviews(this.previews)}this.resize()}setWorld(e){this.world=e;let t=e.ladder;this.L={turnH:t.turnH,rIn:t.rIn,rOut:t.rOut,base:t.base,turns:t.turns,top:t.base+t.turns*t.turnH},this.nodes=e.nodes,this.nodeIndex=new Map(this.nodes.map((e,t)=>[e.id,t])),this.nodePos=this.nodes.map(e=>q(e.a,e.r,e.y+.012)),this.buildLadder(),this.buildNodes(),this.buildRelations(),this.buildLabels(),this.view={t:new H(0,this.midY,0),az:.35,d:Math.min(26,this.homeD()*1.25)}}get frameY(){return[Y-.3,this.crown.top+.5]}get midY(){let[e,t]=this.frameY,n=Math.max(.35,(this.height-this.insets.top-this.insets.bottom)/this.height),r=this.homeD()/1.03*Math.tan(this.camera.fov*K/2)*n;return Math.max((e+t)/2,t-r)}unwrapped(e){return this.world.worlds.findIndex(t=>t.id===e.world)*360+e.a}helixY(e){return this.L.base+e/360*this.L.turnH}buildTree(){this.tree&&(this.ladder.remove(this.tree.group),this.tree.dispose());let e=this.L.top;this.tree=Ct({trunkR:kt,bottom:Y,top:e+.12,sun:new H(0,e+At,0),clearY:e+.35,leaves:this.preset.leaves,sparks:this.preset.sparks,leafTex:this.preset.leafTex,a2c:this.preset.msaa>0,hq:this.preset.barkHQ}),this.pillarMat.uniforms.uLimbA.value=this.tree.limbAngles.slice(0,6).concat([0,0,0,0,0,0]).slice(0,6),this.crown={top:this.tree.maxY,r:this.tree.radius},this.tree.setPixelHeight(this.height*this.renderer.getPixelRatio()),this.ladder.add(this.tree.group),this.reframeHome()}buildLadder(){let{rIn:e,rOut:t,turns:n,top:r}=this.L;this.ladder.clear();let o=Ft(new C({color:`#efe2c2`,metalness:1,roughness:.2,clearcoat:.3})),s=Ft(new C({color:`#ffffff`,metalness:1,roughness:.32}));for(let e of[o,s])e.transparent=!0,e.userData.base=1;this.metalMats=[o,s];let l=this.world.worlds.map(e=>new a(e.color)),u=n*360;this.railMats=[];for(let a of[e,t]){let e=[];for(let t=0;t<=u;t+=3)e.push(q(t,a,this.helixY(t)));let t=new c(new ie(new U(e),e.length*2,.011,8,!1),o);t.castShadow=!0,this.ladder.add(t);let s=new R;s.setPositions(e.flatMap(e=>[e.x*1,e.y+0,e.z])),s.setColors(e.flatMap((e,t)=>l[Math.min(n-1,Math.floor(t*3/360))].toArray()));let d=this.lineMat(`#ffffff`,1.4,{opacity:.32});d.vertexColors=!0,this.railMats.push(d);let f=new ae(s,d);f.computeLineDistances(),f.renderOrder=2,this.ladder.add(f);let p=new c(new i(.011,.011,this.L.base-Y,10),o);p.position.copy(q(0,a,(this.L.base+Y)/2)),p.castShadow=!0,this.ladder.add(p);let m=new c(new B(.026,20,14),new x({color:`#fff6dc`}));m.position.copy(q(0,a,r)),this.ladder.add(m)}let d=this.nodes.map(e=>this.unwrapped(e)),f=this.nodes.map((e,t)=>({u:d[t],color:new a(this.world.regionMap.get(e.region).color).lerp(new a(`#ffffff`),.35)}));for(let e=3.75;e<u;e+=7.5)d.some(t=>Math.abs(t-e)<2.8)||f.push({u:e,color:new a(`#9aa0a8`)});let m=t-e,h=new i(.0068,.0068,m,8),g=new v(h,s,f.length),_=new S,b=new ee,T=new H(0,1,0),E=new H(1,1,1);f.forEach((n,r)=>{let i=n.u%360;b.setFromUnitVectors(T,Se(i)),_.compose(q(i,(e+t)/2,this.helixY(n.u)),b,E),g.setMatrixAt(r,_),g.setColorAt(r,n.color)}),g.castShadow=!0,this.ladder.add(g);let D=Y,k=r+.12;this.pillarMat=vt({foot:D,top:k,base:this.L.base,turnH:this.L.turnH,turns:n,worldColors:l,hq:this.preset.barkHQ}),Q.uTrunkTop.value=k,Q.uSunPos.value.set(0,r+At,0);let A=.08,j=.32;this.pillar=new c(new i(kt,kt,k-D+A+j,200,120,!0).translate(0,(k+j+D-A)/2,0),this.pillarMat),this.pillar.castShadow=!0,this.ladder.add(this.pillar),this.buildTree();for(let e=0;e<=n;e++){let r=[];for(let n=0;n<=360;n+=3)r.push(...q(n,t+.1,this.L.base+e*this.L.turnH).toArray());let i=new R;i.setPositions(r);let a=new ae(i,this.lineMat(this.world.worlds[Math.min(e,n-1)].color,1,{opacity:.16,dashed:!0,dashSize:.03,gapSize:.03}));a.computeLineDistances(),this.ladder.add(a)}this.heaven=new p;let M=new O(new le({map:It([[0,`rgba(255,248,225,0.95)`],[.16,`rgba(255,214,150,0.45)`],[.45,`rgba(255,170,90,0.1)`],[1,`rgba(255,150,80,0)`]]),transparent:!0,depthWrite:!1,blending:2,fog:!1}));M.scale.setScalar(3.6),this.rays=new O(new le({map:st(),transparent:!0,depthWrite:!1,blending:2,fog:!1,opacity:.55})),this.rays.scale.setScalar(5.2);let N=new O(new le({map:It([[0,`rgba(255,255,255,1)`],[.3,`rgba(255,240,200,0.6)`],[1,`rgba(255,240,200,0)`]]),transparent:!0,depthWrite:!1,blending:2,fog:!1}));N.scale.setScalar(.95),this.heaven.add(M,N,this.rays),this.heaven.position.y=r+At,this.sunSource.position.set(0,r+At,0),this.sunSource.updateMatrix(),this.rays.visible=this.preset.godRays===0,this.ladder.add(this.heaven),this.angels=Array.from({length:14},(n,r)=>({u:r/14*u,dir:r%2?-1:1,speed:10+r%5*2.2,r:e+(t-e)*(.25+.5*(r*.37%1))}));let P=new y;P.setAttribute(`position`,new W(new Float32Array(42),3)),P.setAttribute(`alpha`,new W(new Float32Array(14),1)),P.setAttribute(`dir`,new W(new Float32Array(this.angels.map(e=>e.dir)),1)),this.angelMat=new V({uniforms:{uPR:{value:1}},vertexShader:`attribute float alpha; attribute float dir; uniform float uPR; varying float vA; varying float vDir;
        void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv; vA = alpha; vDir = dir;
          gl_PointSize = clamp(uPR * 26.0 / -mv.z, 2.0*uPR, 14.0*uPR); }`,fragmentShader:`varying float vA; varying float vDir; void main(){ float d = length(gl_PointCoord-0.5);
        float a = (smoothstep(0.5,0.0,d)*0.6 + smoothstep(0.12,0.0,d)) * vA;
        vec3 c = vDir > 0.0 ? vec3(0.8,0.95,1.0) : vec3(1.0,0.86,0.6);
        gl_FragColor = vec4(c*a*1.4, a); }`,transparent:!0,depthWrite:!1,blending:2}),this.angelPoints=new w(P,this.angelMat),this.angelPoints.frustumCulled=!1,this.ladder.add(this.angelPoints)}buildNodes(){let e=this.nodes.length,t=new Float32Array(e*3),n=new Float32Array(e*3),r=new Float32Array(e),i=new Float32Array(e);this.nodes.forEach((e,i)=>{t.set(this.nodePos[i].toArray(),i*3);let o=new a(this.world.regionMap.get(e.region).color);n.set([o.r,o.g,o.b],i*3),r[i]=5+e.imp*2.6});let o=new y;o.setAttribute(`position`,new W(t,3)),o.setAttribute(`color`,new W(n,3)),o.setAttribute(`size`,new W(r,1)),o.setAttribute(`state`,new W(i,1)),this.nodeMat=new V({uniforms:{uTime:{value:0},uPR:{value:1},uD:{value:1},uMotion:{value:1}},vertexShader:`
        attribute vec3 color; attribute float size; attribute float state;
        uniform float uTime; uniform float uPR; uniform float uD; uniform float uMotion;
        varying vec3 vC; varying float vS; varying float vPulse;
        void main(){
          vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv;
          float s = size * clamp(3.2/(uD+0.6), 0.75, 2.6);
          if (state > 0.5 && state < 1.5) s *= 0.55;
          if (state > 1.5) s *= 1.3;
          vPulse = state > 2.5 ? 0.5 + 0.5*sin(uTime*3.0*uMotion) : 0.0;
          gl_PointSize = s * uPR * (1.0 + vPulse*0.3);
          vC = color; vS = state;
        }`,fragmentShader:`
        varying vec3 vC; varying float vS; varying float vPulse;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float core = smoothstep(0.15, 0.0, d);
          float glow = smoothstep(0.5, 0.0, d);
          float ring = smoothstep(0.03, 0.0, abs(d - 0.40)) * step(2.5, vS);
          vec3 c = vC;
          float a = glow*0.5 + core;
          if (vS > 0.5 && vS < 1.5) { c = mix(c, vec3(0.3,0.33,0.4), 0.7); a *= 0.4; }
          vec3 col = c*(glow*0.9 + core*2.2) + vec3(0.62,0.94,1.0)*ring*(1.0+vPulse)*1.5;
          gl_FragColor = vec4(col, clamp(a + ring, 0.0, 1.0));
        }`,transparent:!0,depthWrite:!1,blending:2}),this.nodePoints=new w(o,this.nodeMat),this.nodePoints.renderOrder=3,this.ladder.add(this.nodePoints)}lineMat(e,t,n={}){let r=new L({color:new a(e),linewidth:t,transparent:!0,opacity:n.opacity??.8,dashed:!!n.dashed,dashSize:n.dashSize??.02,gapSize:n.gapSize??.01,depthWrite:!1,worldUnits:!1});return r.blending=2,r.fog=!1,r.resolution.set(this.width*this.renderer.getPixelRatio(),this.height*this.renderer.getPixelRatio()),r}arc(e,t,r=1){let i=Ce(e),a=Ce(t),o=Math.hypot(e.x,e.z),s=Math.hypot(t.x,t.z),c=we(i,a),l=t.y-e.y,u=Math.abs(c)/90+Math.abs(l)/1.1,d=(.05+.2*Math.min(1,u))*r,f=Math.max(8,Math.round(10+Math.abs(c)/3+Math.abs(l)*30)),p=[];for(let t=0;t<=f;t++){let r=t/f,a=r*r*(3-2*r)*.35+r*.65;p.push(q(i+c*r,n.lerp(o,s,r)+Math.sin(Math.PI*r)*d,e.y+l*a))}return p}buildRelations(){this.relGroup.clear(),this.relLines=[];for(let e of this.nodes)for(let t of e.rel){let n=this.nodeIndex.get(t.target);if(n==null)continue;let r=this.arc(this.nodePos[this.nodeIndex.get(e.id)],this.nodePos[n],.6),i=new R;i.setPositions(r.flatMap(e=>[e.x,e.y,e.z]));let a=t.type===`adds`||t.type===`varies`,o=this.lineMat(Et[t.type],1.4,{dashed:a,dashSize:t.type===`adds`?.016:.005,gapSize:t.type===`adds`?.01:.009,opacity:.16}),s=new ae(i,o);s.computeLineDistances(),s.renderOrder=2,s.userData={from:e.id,to:t.target},this.relGroup.add(s),this.relLines.push(s)}this.ladder.add(this.relGroup)}buildLabels(){this.labelsEl.textContent=``,this.nodeLabels=this.nodes.map(e=>{let t=document.createElement(`div`),n=this.world.regionMap.get(e.region).color;return t.className=`label node`+(e.imp>=2?``:` minor`)+(e.tags.includes(`kabbalah`)?` kab`:``),t.style.color=n,t.innerHTML=`<span class="dot"></span><span class="t"></span>`,t.querySelector(`.t`).textContent=e.title,this.labelsEl.appendChild(t),{el:t,w:0,h:0,op:0,shown:!1,state:0}}),this.regionLabels=this.world.regions.map(e=>{let t=document.createElement(`div`);t.className=`label region`;let n=this.nodes.filter(t=>t.region===e.id).length;return t.innerHTML=`<span class="dot" style="color:${e.color}"></span>${e.name}<span class="v">${n}</span>`,this.labelsEl.appendChild(t),{el:t,a:e.a,w:0,h:0,op:0}}),this.worldLabels=this.world.worlds.map((e,t)=>{let n=document.createElement(`div`);return n.className=`label world`,n.style.setProperty(`--wc`,e.color),n.innerHTML=`<span class="n">${Nt[t]}</span><span class="he">${e.he}</span><span class="en">${e.en.toUpperCase()}</span>`,this.labelsEl.appendChild(n),{el:n,y:this.L.base+(t+.5)*this.L.turnH,w:0,h:0,op:0}});let e=(e,t,n)=>{let r=document.createElement(`div`);return r.className=`label caption`,r.innerHTML=e,this.labelsEl.appendChild(r),{el:r,pos:t,w:0,h:0,op:0,far:n}};this.captions=[e(`וְרֹאשׁוֹ מַגִּיעַ הַשָּׁמָיְמָה<span class="v">בראשית כח, יב</span>`,new H(0,this.crown.top+.2,0),3.2),e(`סֻלָּם מֻצָּב אַרְצָה`,new H(0,this.L.base+.05,0),3.2)],this.focusTag=document.createElement(`div`),this.focusTag.className=`label plane`,this.labelsEl.appendChild(this.focusTag),requestAnimationFrame(()=>this.measureLabels())}measureLabels(){for(let e of this.nodeLabels)e.w=e.el.offsetWidth,e.h=e.el.offsetHeight;for(let e of[...this.regionLabels,...this.worldLabels,...this.captions])e.w=e.el.offsetWidth,e.h=e.el.offsetHeight}setPreviews(e){this.previews=e;let t=this.pillarMat.uniforms.uWords.value;this.pillarMat.uniforms.uWords.value=je(this.world,e,{bottom:Y,top:this.L.top+.12,radius:kt},Math.min(2048,this.preset.dustWidth/2)),this.pillarMat.uniforms.uHas.value=1,t?.dispose();for(let e of this.tiles.values())this.disposeTile(e);this.tiles.clear(),this.tileMeshes=[]}setSelected(e){this.selectedId=e,this.refreshStates()}setRelView(e){this.relView=e,this.refreshStates()}setRoute(e,t){this.route=e,this.routeNusach=t,this.stopIndex=-1,this.routeGroup&&(this.ladder.remove(this.routeGroup),this.routeGroup.traverse(e=>{let t=e;t.geometry?.dispose(),t.material?.dispose()})),this.routeGroup=null,this.routeMat=null,this.comet=null;for(let e of this.badges)e.el.remove();this.badges=[],e&&this.buildRoute(e,t),this.refreshStates()}stopPoint(e){let t=this.route.stops[e],n=this.nodePos[this.nodeIndex.get(t.n)].clone();if(t.occTotal<=1)return n;let r=this.nodes[this.nodeIndex.get(t.n)],i=(t.occ-1)/t.occTotal*Math.PI*2,a=new H(Math.cos(r.a*K),0,-Math.sin(r.a*K));return n.addScaledVector(a,Math.cos(i)*.02).add(new H(0,Math.sin(i)*.02,0)).addScaledVector(Se(r.a),.01)}stopU(e){return this.unwrapped(this.nodes[this.nodeIndex.get(this.route.stops[e].n)])}lanePath(e,t,r,i,a){let{rIn:o,rOut:s}=this.L,c=i-t;if(Math.abs(c)<.5)return[e.clone(),r.clone()];let l=(c>0?s-.11:o+.11)+(a%3-1)*.022,u=Math.hypot(e.x,e.z),d=Math.hypot(r.x,r.z),f=Math.max(6,Math.ceil(Math.abs(c)/2.5)),p=Math.min(.5,9/Math.abs(c)),m=[];for(let i=0;i<=f;i++){let a=i/f,o=t+c*a,s=J(0,p,a)*J(1,1-p,a),h=n.lerp(a<.5?u:d,l,s),g=a<.5?e.y:r.y,_=n.lerp(g,this.helixY(o)+.03,s);m.push(q(o%360,h,_))}return m[0].copy(e),m[f].copy(r),m}buildRoute(e,t){let n=new p,r=e.stops.map((e,t)=>this.stopPoint(t)),i=[],o=[],s=new a(`#c9f6ff`),c=new a(`#ffc46b`),l=new a(`#8fd6ff`);this.segPts=[];for(let e=0;e<r.length-1;e++){let t=r[e],n=r[e+1],a=this.stopU(e),u=this.stopU(e+1),d=this.lanePath(t,a,n,u,e);this.segPts.push(d.map(e=>e.clone()));let f=u-a>30?s:u-a<-30?c:l,p=i.length?d.slice(1):d;for(let e of p)i.push(e),o.push(f.r,f.g,f.b)}if(this.routePts=i,i.length>=2){let e=i.flatMap(e=>[e.x,e.y,e.z]),t=new R;t.setPositions(e),t.setColors(o);let r=this.lineMat(`#ffffff`,5,{opacity:.08});r.vertexColors=!0;let a=new ae(t,r);a.computeLineDistances();let s=new R;s.setPositions(e),s.setColors(o),this.routeMat=this.lineMat(`#ffffff`,2,{dashed:!0,dashSize:.03,gapSize:.018,opacity:.92}),this.routeMat.vertexColors=!0;let c=new ae(s,this.routeMat);c.computeLineDistances(),a.renderOrder=c.renderOrder=4,n.add(a,c),this.comet=new O(new le({map:It([[0,`rgba(255,255,255,1)`],[.25,`rgba(160,240,255,0.85)`],[1,`rgba(95,224,255,0)`]]),transparent:!0,depthWrite:!1,blending:2})),this.comet.renderOrder=5,n.add(this.comet),this.routeCum=[0];for(let e=1;e<i.length;e++)this.routeCum.push(this.routeCum[e-1]+i[e].distanceTo(i[e-1]))}this.routeGroup=n,this.ladder.add(n),e.stops.forEach((e,n)=>{let i=document.createElement(`div`),a=e.omit||!!e.only&&!e.only.includes(t);i.className=`badge`+(e.omit?` omit`:a?` off`:``),i.textContent=String(n+1),this.labelsEl.appendChild(i),this.badges.push({el:i,pos:r[n].clone(),i:n})})}setStop(e){this.stopIndex=e,this.badges.forEach(t=>t.el.classList.toggle(`current`,t.i===e)),this.refreshStates()}refreshStates(){if(!this.nodePoints)return;let e=this.nodePoints.geometry.getAttribute(`state`),t=new Set(this.route?this.route.stops.map(e=>e.n):[]),n=this.route&&this.stopIndex>=0?this.route.stops[this.stopIndex].n:null;this.nodes.forEach((r,i)=>{let a=this.route?t.has(r.id)?2:1:0;(r.id===n||r.id===this.selectedId)&&(a=3),e.setX(i,a);let o=this.nodeLabels[i];o.state=a,o.el.classList.toggle(`active`,a>=3),o.el.classList.toggle(`dimmed`,a===1)}),e.needsUpdate=!0;for(let e of this.relLines){let{from:r,to:i}=e.userData,a=this.relView?.16:0;this.route&&(a=this.relView&&t.has(r)&&t.has(i)?.55:0);let o=n||this.selectedId;o&&(r===o||i===o)&&(a=.95),e.material.opacity=a,e.visible=a>0}let r=n||this.selectedId;if(r){let e=this.nodeIndex.get(r);this.beam.position.copy(this.nodePos[e]),this.beam.visible=!0,this.beam.userData.id=r,this.pillarMat.uniforms.uSel.value.set(this.nodes[e].a*K,this.nodePos[e].y,1)}else this.beam.visible=!1,this.pillarMat.uniforms.uSel.value.z=0}homeD(){let e=this.camera.fov*K,t=Math.max(.35,(this.height-this.insets.top-this.insets.bottom)/this.height),r=Math.max(.35,(this.width-this.insets.left-this.insets.right)/this.width),[i,a]=this.frameY,o=(a-i)/2/Math.tan(e/2)/t,s=Math.max(6.2,2*this.crown.r*(this.camera.aspect*r<1?.8:1))/2/Math.tan(e/2)/(this.camera.aspect*r);return n.clamp(Math.max(o,s)*1.03,4,26)}ladderD(){let e=this.camera.fov*K,t=Math.max(.35,(this.height-this.insets.top-this.insets.bottom)/this.height),r=Math.max(.35,(this.width-this.insets.left-this.insets.right)/this.width),i=(this.L.top+2.1-Y)/2/Math.tan(e/2)/t,a=6.2/2/Math.tan(e/2)/(this.camera.aspect*r);return n.clamp(Math.max(i,a)*1.3,4,17)}elevation(e){let t=n.lerp(7,3.5,J(9,20,e));return n.lerp(34,t,J(.6,5,e))*K}flyTo(e,t={}){let r={t:this.view.t.clone(),az:this.view.az,d:this.view.d};if(e={t:e.t.clone(),az:r.az+we(r.az/K,e.az/K)*K,d:n.clamp(e.d,Dt,26)},this.flight?.resolve(),this.atHome=!1,this.travel){let e=this.travel;this.travel=null,e.resolve()}if(this.vel.az=this.vel.y=0,this.reduceMotion)return this.view=e,this.flight=null,Promise.resolve();let i=r.t.distanceTo(e.t)+Math.abs(e.az-r.az)*.6,a=t.duration??n.clamp(900+i*380+Math.abs(Math.log(e.d/r.d))*260,900,2600),o=Math.max(r.d,e.d,Math.min(this.ladderD()*.6,i*.9));return new Promise(t=>{this.flight={from:r,to:e,peak:o,t0:performance.now(),dur:a,resolve:t}})}flyHome(e={}){let t=this.flyTo({t:new H(0,this.midY,0),az:this.view.az,d:this.homeD()},e);return this.atHome=!0,t}reframeHome(){if(!this.atHome||!this.world)return;let e=this.flight?.to??this.view;(Math.abs(Math.log(this.homeD()/e.d))>.03||Math.abs(e.t.y-this.midY)>.05)&&this.flyHome({duration:1400})}flyToNode(e,t=.46){let n=this.nodeIndex.get(e);if(n==null)return Promise.resolve();let r=this.nodes[n],i=this.nodePos[n].clone().addScaledVector(Se(r.a),.03).add(new H(0,-.035,0));return this.flyTo({t:i,az:r.a*K,d:t})}travelTo(e,t){let r=t===e+1?this.segPts[e]:t===e-1?this.segPts[t]&&[...this.segPts[t]].reverse():null,i=this.route?.stops[t]?.n;if(!r||r.length<3||this.reduceMotion||!i)return i?this.flyToNode(i):Promise.resolve();this.cancelFlight(),this.atHome=!1,this.travel?.resolve();let a=[0];for(let e=1;e<r.length;e++)a.push(a[e-1]+r[e].distanceTo(r[e-1]));let o=[],s=Ce(r[0]),c=s;for(let e of r){let t=Ce(e);c+=we(s,t),s=t,o.push(c*K)}let l=a[a.length-1],u=n.clamp((.7+l/2.4)/this.speed,.45,16)*1e3;return new Promise(e=>{this.travel={pts:r,cum:a,ang:o,from:{t:this.view.t.clone(),az:this.view.az,d:this.view.d},t0:performance.now(),dur:u,dMid:n.clamp(.55+l*.04,.6,1.1),resolve:e},this.vel.az=this.vel.y=0})}stepTravel(){let e=this.travel,t=Math.min(1,(performance.now()-e.t0)/e.dur),r=t*t*(3-2*t),i=r*e.cum[e.cum.length-1],a=1;for(;a<e.cum.length-1&&e.cum[a]<i;)a++;let o=(i-e.cum[a-1])/(e.cum[a]-e.cum[a-1]||1),s=e.pts[a-1].clone().lerp(e.pts[a],o),c=n.lerp(e.ang[a-1],e.ang[a],o),l=s.clone().addScaledVector(Se(c/K),.03).add(new H(0,-.035,0)),u=.46+(e.dMid-.46)*Math.sin(Math.PI*r),d=J(0,.18,t),f=e.from.az,p=c+Math.round((f-e.ang[0])/(Math.PI*2))*Math.PI*2;this.view.t.lerpVectors(e.from.t,l,d),this.view.az=n.lerp(f,p,d),this.view.d=Math.exp(n.lerp(Math.log(e.from.d),Math.log(u),d)),t>=1&&(this.travel=null,e.resolve())}flyToRegion(e){let t=this.world.regionMap.get(e);return t?this.flyTo({t:q(t.a,.7,(this.L.base+this.L.top)/2),az:t.a*K,d:this.ladderD()*.72}):Promise.resolve()}overview(){if(!this.route)return this.flyHome();let e=this.route.stops.map(e=>this.nodePos[this.nodeIndex.get(e.n)]),t=0,r=0,i=1/0,a=-1/0;for(let n of e){let e=Ce(n)*K;t+=Math.sin(e),r+=Math.cos(e),i=Math.min(i,n.y),a=Math.max(a,n.y)}let o=Math.hypot(t,r)/e.length,s=Math.atan2(t,r),c=this.camera.fov*K,l=Math.max(.35,(this.height-this.insets.top-this.insets.bottom)/this.height),u=n.clamp((a-i+.7)/2/Math.tan(c/2)/l*(1+(1-o)*.5),1.6,this.ladderD());return this.flyTo({t:q(s/K,.95*o,(i+a)/2),az:s,d:u})}zoomBy(e){this.view.d=n.clamp(this.view.d*e,Dt,26),this.cancelFlight(),this.touch()}orbit(e,t){let r=new ee().setFromAxisAngle(new H(0,1,0),e);this.view.t.applyQuaternion(r),this.view.az+=e,this.view.t.y=n.clamp(this.view.t.y+t,Y+.1,Math.max(this.L.top+.9,this.midY)),this.cancelFlight(),this.touch()}cancelFlight(){let e=this.flight,t=this.travel;this.flight=null,this.travel=null,e?.resolve(),t?.resolve()}setInsets(e){this.insets={left:0,right:0,top:0,bottom:0,...e},this.reframeHome()}get focusScreen(){return{x:this.width/2-this.viewOff.x,y:this.height/2-this.viewOff.y}}get distance(){return this.view.d}touch(){this.lastInteraction=performance.now(),this.atHome=!1}unitsPerPx(){return 2*this.view.d*Math.tan(this.camera.fov*K/2)/(this.height||800)}updateCamera(){let e=this.flight;if(this.travel)this.stepTravel();else if(e){let t=Math.min(1,(performance.now()-e.t0)/e.dur),r=Te(t);this.view.t.lerpVectors(e.from.t,e.to.t,r),this.view.az=n.lerp(e.from.az,e.to.az,r);let i=1-r,a=i*i*Math.log(e.from.d)+2*i*r*Math.log(e.peak)+r*r*Math.log(e.to.d);this.view.d=Math.exp(a),t>=1&&(this.flight=null,e.resolve())}else Math.abs(this.vel.az)+Math.abs(this.vel.y)>1e-5?(this.orbit(this.vel.az,this.vel.y),this.vel.az*=.92,this.vel.y*=.92):!this.reduceMotion&&!this.route&&!this.selectedId&&!this.dragging&&performance.now()-this.lastInteraction>9e3&&this.view.d>2.5&&(this.view.az-=7e-4,this.view.t.applyAxisAngle(new H(0,1,0),-7e-4));let{t,az:r,d:i}=this.view,a=this.elevation(i),o=new H(Math.sin(r)*Math.cos(a),Math.sin(a),Math.cos(r)*Math.cos(a)).multiplyScalar(i).add(t);o.y=Math.max(o.y,Y+.12),this.camera.position.copy(o),this.camera.up.set(0,1,0),this.camera.lookAt(t),this.camera.near=Math.max(.002,i*.04);let s=this.reduceMotion?1:.12;this.viewOff.x+=((this.insets.right-this.insets.left)/2-this.viewOff.x)*s,this.viewOff.y+=((this.insets.bottom-this.insets.top)/2-this.viewOff.y)*s,Math.abs(this.viewOff.x)+Math.abs(this.viewOff.y)>.5?this.camera.setViewOffset(this.width,this.height,this.viewOff.x,this.viewOff.y,this.width,this.height):this.camera.clearViewOffset(),this.camera.updateProjectionMatrix(),this.camera.updateMatrixWorld(),this.pillarMat.uniforms.uCam.value.copy(this.camera.position),Pt.pos.value.copy(this.camera.position),Pt.r.value=i<1.5?n.clamp(i*.86,.1,.9)*J(1.5,1.1,i):0,this.pillarMat.uniforms.uWordsK.value=.12+.88*J(.7,2.2,i),this.nodeMat.uniforms.uD.value=i}bindInput(){let e=this.canvas,t=new Map,n=null,r=0,i=0,a=0;e.addEventListener(`pointerdown`,a=>{if(e.setPointerCapture(a.pointerId),t.set(a.pointerId,{x:a.clientX,y:a.clientY}),n={x:a.clientX,y:a.clientY},r=0,this.dragging=!0,this.cancelFlight(),this.vel.az=this.vel.y=0,t.size===2){let[e,n]=[...t.values()];i=Math.hypot(e.x-n.x,e.y-n.y)}this.touch()}),e.addEventListener(`pointermove`,e=>{if(!t.has(e.pointerId)){this.hover(e);return}let n=t.get(e.pointerId),o={x:e.clientX,y:e.clientY};if(t.set(e.pointerId,o),t.size===2){let[e,n]=[...t.values()],a=Math.hypot(e.x-n.x,e.y-n.y);i>0&&this.zoomBy(i/a),i=a,r+=10;return}let s=o.x-n.x,c=o.y-n.y;r+=Math.abs(s)+Math.abs(c);let[l,u]=this.dragDelta(s,c);this.orbit(l,u);let d=performance.now(),f=Math.max(8,d-a);a=d,this.vel.az=16/f*l,this.vel.y=16/f*u});let o=e=>{t.has(e.pointerId)&&(t.delete(e.pointerId),t.size<2&&(i=0),t.size===0&&(this.dragging=!1,(performance.now()-a>80||this.reduceMotion)&&(this.vel.az=this.vel.y=0),r<6&&n&&this.click(e)))};e.addEventListener(`pointerup`,o),e.addEventListener(`pointercancel`,o),e.addEventListener(`pointerleave`,()=>{this.dragging||this.setHover(null,0,0)}),e.addEventListener(`wheel`,e=>{e.preventDefault();let t=Math.exp(e.deltaY*(e.deltaMode===1?.05:.0016)),n=this.pointAtTargetDepth(e.clientX,e.clientY);this.zoomBy(t),t<1&&n&&this.view.t.lerp(n,Math.min(1,(1-t)*1.1))},{passive:!1}),e.addEventListener(`keydown`,e=>{let t=()=>{let e=this.pickCenter();e&&this.cb.onSelect?.(e)},n=(e,t)=>{let[n,r]=this.dragDelta(e,t);this.orbit(n,r)},r={ArrowLeft:()=>n(60,0),ArrowRight:()=>n(-60,0),ArrowUp:()=>n(0,60),ArrowDown:()=>n(0,-60),"+":()=>this.zoomBy(.8),"=":()=>this.zoomBy(.8),"-":()=>this.zoomBy(1.25),_:()=>this.zoomBy(1.25),PageUp:()=>n(0,240),PageDown:()=>n(0,-240),Home:()=>void this.flyHome(),Enter:t," ":t};r[e.key]&&(e.preventDefault(),r[e.key](),this.cb.onKeyNav?.(this.pickCenter()))})}dragDelta(e,t){let n=this.unitsPerPx(),r=Math.hypot(this.view.t.x,this.view.t.z);return[-e*Math.min(.006,n/Math.max(.3,r)),t*n]}ndc(e,t){let n=this.canvas.getBoundingClientRect();return new I((e-n.left)/n.width*2-1,-((t-n.top)/n.height)*2+1)}pointAtTargetDepth(e,t){let r=new T;r.setFromCamera(this.ndc(e,t),this.camera);let i=this.camera.getWorldDirection(new H),a=new de().setFromNormalAndCoplanarPoint(i,this.view.t),o=r.ray.intersectPlane(a,new H);return o?(o.y=n.clamp(o.y,Y+.1,this.L.top+.9),o):null}nearestNode(e,t,n=22){let r=this.canvas.getBoundingClientRect(),i=null,a=n;if(this.proj.forEach((n,o)=>{if(!n?.visible||n.facing<.3)return;let s=Math.hypot(n.x+r.left-e,n.y+r.top-t);s<a&&(a=s,i=this.nodes[o].id)}),!i&&this.tileMeshes.length){let n=new T;n.setFromCamera(this.ndc(e,t),this.camera);let r=n.intersectObjects(this.tileMeshes.filter(e=>e.visible&&e.material.opacity>.3))[0];r&&(i=r.object.userData.id)}return i}pickCenter(){let e=this.canvas.getBoundingClientRect(),t=this.focusScreen;return this.nearestNode(t.x+e.left,t.y+e.top,140)}hover(e){this.setHover(this.nearestNode(e.clientX,e.clientY),e.clientX,e.clientY)}setHover(e,t,n){e!==this.hoverId&&(this.hoverId=e,this.canvas.style.cursor=e?`pointer`:`grab`),this.cb.onHover?.(e,t,n)}click(e){let t=this.nearestNode(e.clientX,e.clientY,matchMedia(`(pointer: coarse)`).matches?30:22);t?this.cb.onSelect?.(t):this.cb.onBackground?.()}tileFor(e){let t=this.nodes[e],n=this.tiles.get(t.id);if(n)return n;let i=this.previews[t.id],a=this.world.regionMap.get(t.region).color,o=`${this.world.regionMap.get(t.region).name} · ${this.world.worldMap.get(t.world).he}`,s=Me(t.title,o,i||t.d,a,this.preset.tileSize),l=new r(s);l.colorSpace=P,l.anisotropy=this.renderer.capabilities.getMaxAnisotropy();let d=new c(new u(jt,jt),new x({map:l,transparent:!0,opacity:0,depthWrite:!1,toneMapped:!1})),f=Se(t.a),p=new H(0,1,0),m=f.clone().multiplyScalar(Math.cos(Mt)).addScaledVector(p,Math.sin(Mt)),h=p.clone().multiplyScalar(Math.cos(Mt)).addScaledVector(f,-Math.sin(Mt)),g=new H().crossVectors(h,m);d.quaternion.setFromRotationMatrix(new S().makeBasis(g,h,m)),d.position.copy(this.nodePos[e]).addScaledVector(h,-.062).addScaledVector(m,.004),d.renderOrder=1,d.userData={id:t.id},this.ladder.add(d);let _={mesh:d,tex:l,last:performance.now()};if(this.tiles.set(t.id,_),this.tiles.size>this.preset.maxTiles){let e=[...this.tiles.entries()].sort((e,t)=>e[1].last-t[1].last).slice(0,this.tiles.size-this.preset.maxTiles);for(let[t,n]of e)this.disposeTile(n),this.tiles.delete(t)}return this.tileMeshes=[...this.tiles.values()].map(e=>e.mesh),_}disposeTile(e){this.ladder.remove(e.mesh),e.mesh.geometry.dispose(),e.mesh.material.dispose(),e.tex.dispose()}resize(){let e=this.canvas.clientWidth||innerWidth,t=this.canvas.clientHeight||innerHeight;this.width=e,this.height=t,this.renderer.setSize(e,t,!1),this.camera.aspect=e/t,this.camera.updateProjectionMatrix(),this.pipeline?.setSize(e,t);let n=this.renderer.getPixelRatio(),r=new I(e*n,t*n);this.ladder.traverse(e=>{let t=e.material;t&&`resolution`in t&&t.resolution.copy(r)}),this.nodeMat&&(this.nodeMat.uniforms.uPR.value=n),this.angelMat&&(this.angelMat.uniforms.uPR.value=n),this.motes&&(this.motes.material.uniforms.uPR.value=n),this.tree?.setPixelHeight(t*n)}setReduceMotion(e){this.reduceMotion=e,this.nodeMat&&(this.nodeMat.uniforms.uMotion.value=+!e),e&&(this.vel.az=this.vel.y=0)}frame(){if(document.hidden)return;this.timer.update();let e=Math.min(.05,this.timer.getDelta());if(this.time+=e,this.trackFps(e),!this.world){this.pipeline.render(e);return}this.updateCamera();let t=this.reduceMotion?0:this.time,r=this.view.d;this.nodeMat.uniforms.uTime.value=this.time,this.pillarMat.uniforms.uTime.value=t,this.motes&&(this.motes.material.uniforms.uTime.value=t),this.beamMat.uniforms.uTime.value=t;let i=this.beam.visible?.75*J(.5,1.4,r)+.15:0;this.beamMat.uniforms.uOp.value+=(i-this.beamMat.uniforms.uOp.value)*.1,this.beam.children[1].material.opacity=this.beamMat.uniforms.uOp.value,this.beam.scale.setScalar(n.clamp(r*.55,.25,2.2)),this.updateAngels(e),this.heaven.children[0].scale.setScalar(3.6+(this.reduceMotion?0:Math.sin(this.time*.6)*.15)),this.rays&&(this.rays.material.rotation=t*.02),Q.uTime.value=t,Q.uWind.value=+!this.reduceMotion,this.tree?.update(t,+!this.reduceMotion),this.pipeline.setRays(.55*J(1.6,3.6,r));for(let e of this.railMats)e.opacity=.18+.2*J(.6,3,r);let a=.16+.84*J(.75,1.5,r);for(let e of this.metalMats)e.opacity=a,e.depthWrite=a>.95;if(this.routeMat&&(this.reduceMotion||(this.routeMat.dashOffset=-this.time*.08*this.speed),this.routeMat.opacity=.45+.5*J(.25,1.2,r)),this.comet&&this.routePts.length>1){let e=this.routeCum[this.routeCum.length-1],t=this.reduceMotion?0:this.time*this.speed*Math.max(.08,e/40)%e,i=1;for(;i<this.routeCum.length-1&&this.routeCum[i]<t;)i++;let a=this.routeCum[i]-this.routeCum[i-1]||1;this.comet.position.copy(this.routePts[i-1]).lerp(this.routePts[i],(t-this.routeCum[i-1])/a),this.comet.visible=!this.reduceMotion,this.comet.scale.setScalar(n.clamp(r*.03,.012,.09))}this.updateLabels(),this.updateTiles(),this.pipeline.bloom.intensity=(this.route?.6:.8)+.25*J(.6,3,r),this.pipeline.render(e,this.reduceMotion),this.cb.onFrame?.(r)}updateAngels(e){let t=this.L.turns*360,n=this.angelPoints.geometry.getAttribute(`position`),r=this.angelPoints.geometry.getAttribute(`alpha`);this.angels.forEach((i,a)=>{this.reduceMotion||(i.u=(i.u+i.dir*i.speed*e+t)%t);let o=q(i.u%360,i.r,this.helixY(i.u)+.045);n.setXYZ(a,o.x,o.y,o.z);let s=Math.min(i.u,t-i.u)/40;r.setX(a,this.reduceMotion?0:Math.min(1,s)*.9)}),n.needsUpdate=!0,r.needsUpdate=!0}trackFps(e){if(!(!this.onSlow||e<=0)&&(this.fpsSamples.push(e),this.fpsSamples.length>=120)){let e=this.fpsSamples.reduce((e,t)=>e+t,0)/this.fpsSamples.length;this.fpsSamples=[],1/e<28&&this.onSlow()}}project(e,t={}){let n=e.clone().project(this.camera);return t.x=(n.x*.5+.5)*this.width,t.y=(-n.y*.5+.5)*this.height,t.z=n.z,t}facing(e){let t=this.camera.position,n=Math.hypot(t.x,t.z)||1,r=Math.hypot(e.x,e.z)||1,i=(t.x*e.x+t.z*e.z)/(n*r),a=J(.35,1.2,(t.y-e.y)/Math.max(.5,n));return Math.max(J(-.3,.15,i),a*.6)}place(e,t,n,r){e.style.opacity=t<.01?`0`:t.toFixed(3),e.style.transform=t<.01?`translate3d(-9999px,0,0)`:`translate3d(${n.toFixed(1)}px, ${r.toFixed(1)}px, 0)`}updateLabels(){let e=this.view.d,t=this.width,r=this.height,i=this.focusScreen,a=this.reduceMotion?1:.2,o=[];this.nodes.forEach((n,a)=>{let s=this.nodePos[a],c=this.proj[a]||={x:0,y:0,z:0,visible:!1,facing:0};if(this.project(s,c),c.facing=this.facing(s),c.visible=c.z<1&&c.x>-50&&c.x<t+50&&c.y>-50&&c.y<r+50&&s.distanceTo(this.camera.position)>this.camera.near*2,!c.visible)return;let l=this.nodeLabels[a],u=n.imp>=3?6.2:n.imp===2?3:1.7,d=J(u+.4,u-.3,e);l.state>=2&&(d=Math.max(d,J(5.5,3.5,e))),l.state>=3&&(d=1),l.state===1&&(d*=.45),d*=c.facing;let f=Math.hypot(c.x-i.x,c.y-i.y)/Math.hypot(t/2,r/2),p=(l.state>=3?100:0)+(l.state===2?20:0)+n.imp*5-f*6-(1-c.facing)*8+(this.hoverId===n.id?50:0);d>.02&&o.push({i:a,p:c,vis:d,prio:p})}),o.sort((e,t)=>t.prio-e.prio);let s=[],c=new Map,l=n.clamp(1.1-e*.04,.85,1.12);for(let e of o){let t=this.nodeLabels[e.i],n=(t.w||80)*l,r=(t.h||22)*l,i={x0:e.p.x-n/2-4,x1:e.p.x+n/2+4,y0:e.p.y-r-14,y1:e.p.y-8};e.prio<90&&s.some(e=>e.x0<i.x1&&e.x1>i.x0&&e.y0<i.y1&&e.y1>i.y0)||(s.push(i),c.set(e.i,e.vis))}this.nodeLabels.forEach((e,t)=>{let n=c.get(t)??0;if(e.op+=(n-e.op)*a,e.op<.01){e.shown&&=(e.el.style.opacity=`0`,e.el.style.transform=`translate3d(-9999px,0,0)`,!1);return}e.shown=!0;let r=this.proj[t];e.el.style.opacity=e.op.toFixed(3),e.el.style.transform=`translate3d(${(r.x-(e.w||0)/2).toFixed(1)}px, ${(r.y-(e.h||0)-10).toFixed(1)}px, 0) scale(${l.toFixed(3)})`});for(let t of this.regionLabels){let n=q(t.a,2.28,Y+.03),r=this.project(n),i=this.route?0:this.facing(n)*J(1.6,3.2,e);t.op+=(i-t.op)*a,this.place(t.el,t.op,r.x-t.w/2,r.y-t.h/2)}let u=this.view.az/K-64;for(let t of this.worldLabels){let n=q(u,this.L.rOut+.42,t.y),r=this.project(n),i=J(.9,1.8,e)*+(r.z<1);t.op+=(i-t.op)*a,this.place(t.el,t.op,r.x-t.w/2,r.y-t.h/2)}for(let t of this.captions){let n=this.project(t.pos),r=this.route?0:J(t.far,t.far+1.5,e);t.op+=(r-t.op)*a,this.place(t.el,t.op,n.x-t.w/2,n.y-t.h/2)}for(let t of this.badges){let n=this.project(t.pos),r=this.facing(t.pos)*J(5.5,2.4,e)*+(n.z<1);this.place(t.el,r,n.x+4,n.y+2)}let d=this.beam.visible?this.beam.userData.id:null;if(d){let t=this.nodeIndex.get(d),n=this.nodes[t],r=this.nodePos[t].clone().add(new H(0,.36*this.beam.scale.x*.92,0)),i=this.project(r),a=`בפוקוס <span class="v">${this.route&&this.stopIndex>=0?`${this.stopIndex+1}/${this.route.stops.length}`:this.world.worldMap.get(n.world).he}</span>`;this.focusTag.dataset.html!==a&&(this.focusTag.innerHTML=a,this.focusTag.dataset.html=a);let o=this.beamMat.uniforms.uOp.value*J(.1,.3,e)*this.facing(this.nodePos[t]);this.focusTag.style.opacity=o.toFixed(3),this.focusTag.style.transform=`translate3d(${(i.x-this.focusTag.offsetWidth/2).toFixed(1)}px, ${(i.y-26).toFixed(1)}px, 0)`}else this.focusTag.style.opacity=`0`}updateTiles(){let e=J(1.3,.75,this.view.d),t=new Set;if(e>.01){let n=this.focusScreen,r=this.width,i=this.height,a=[];this.nodes.forEach((e,t)=>{let o=this.proj[t];if(!o?.visible||o.facing<.5)return;let s=Math.hypot(o.x-n.x,o.y-n.y)/Math.hypot(r/2,i/2);s<.95&&a.push({i:t,d:s})}),a.sort((e,t)=>e.d-t.d);let o=this.camera.position;for(let{i:n,d:r}of a.slice(0,this.preset.visibleTiles)){t.add(this.nodes[n].id);let i=this.tileFor(n);i.last=performance.now();let a=this.nodeLabels[n].state===1?.35:1,s=e*J(1,.55,r)*this.proj[n].facing*a,c=i.mesh.material;c.opacity+=(s-c.opacity)*(this.reduceMotion?1:.12),i.mesh.visible=c.opacity>.01,i.mesh.renderOrder=1+Math.round(10-Math.min(10,i.mesh.position.distanceTo(o)*4))}}for(let[e,n]of this.tiles){if(t.has(e))continue;let r=n.mesh.material;r.opacity*=this.reduceMotion?0:.85,n.mesh.visible=r.opacity>.01}}};function Rt(){try{let e=document.createElement(`canvas`);return!!(window.WebGLRenderingContext&&(e.getContext(`webgl2`)||e.getContext(`webgl`)))}catch{return!1}}export{Ot as MAX_D,Dt as MIN_D,Lt as PrayerWorld,Rt as webglAvailable};