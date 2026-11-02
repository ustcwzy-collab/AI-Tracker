import{r as i,m as r,d as l}from"./language.js";const E="/claude-anthropic.jpg",H="/codex-openai.jpg",_="/cursor.webp",j="/kimi.webp",P="/minimax.webp",q="/xiaomimimo.webp",z="/qwen.webp",D="/zai.webp";/**
 * @license lucide-react v1.27.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=(...t)=>t.filter((e,o,n)=>!!e&&e.trim()!==""&&n.indexOf(e)===o).join(" ").trim();/**
 * @license lucide-react v1.27.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-react v1.27.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=t=>t.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,o,n)=>n?n.toUpperCase():o.toLowerCase());/**
 * @license lucide-react v1.27.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=t=>{const e=y(t);return e.charAt(0).toUpperCase()+e.slice(1)};/**
 * @license lucide-react v1.27.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var u={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v1.27.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=t=>{for(const e in t)if(e.startsWith("aria-")||e==="role"||e==="title")return!0;return!1},B=i.createContext({}),L=()=>i.useContext(B),R=i.forwardRef(({color:t,size:e,strokeWidth:o,absoluteStrokeWidth:n,className:a="",children:s,iconNode:m,...h},$)=>{const{size:c=24,strokeWidth:d=2,absoluteStrokeWidth:k=!1,color:C="currentColor",className:x=""}=L()??{},A=n??k?Number(o??d)*24/Number(e??c):o??d;return i.createElement("svg",{ref:$,...u,width:e??c??u.width,height:e??c??u.height,stroke:t??C,strokeWidth:A,className:p("lucide",x,a),...!s&&!v(h)&&{"aria-hidden":"true"},...h},[...m.map(([b,M])=>i.createElement(b,M)),...Array.isArray(s)?s:[s]])});/**
 * @license lucide-react v1.27.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=(t,e)=>{const o=i.forwardRef(({className:n,...a},s)=>i.createElement(R,{ref:s,iconNode:e,className:p(`lucide-${S(f(t))}`,`lucide-${t}`,n),...a}));return o.displayName=f(t),o};/**
 * @license lucide-react v1.27.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],T=g("check",N);/**
 * @license lucide-react v1.27.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]],I=g("refresh-cw",U),w=t=>Math.max(0,Math.min(100,Math.round(t))),O=(t,e)=>{const o=w(t);return e==="remaining"?r("percentageRemaining",String(100-o)):`${o}%`},Z=(t,e="used")=>`icons/badges/${e==="remaining"?"remaining":"range"}-${t}.png`,F=t=>!!t&&(t==null?void 0:t.available)!==!1,G=t=>{const e=w(t);return e>=l.critical?"critical":e>=l.warning?"warning":"ok"},J=(t,e)=>{if(!t)return r("timeUnknown");const o=new Date(t).getTime()-e;if(!Number.isFinite(o))return r("timeUnknown");if(o<=0)return r("timeNow");const n=Math.floor(o/6e4),a=Math.floor(n/60),s=n%60;return a>=24?`${Math.floor(a/24)}${r("timeDayShort")} ${a%24}${r("timeHourShort")}`:a>0?`${a}${r("timeHourShort")} ${s}${r("timeMinuteShort")}`:`${s}${r("timeMinuteShort")}`},K=(t,e)=>{const o=Math.floor(Math.max(0,e-t)/6e4);if(o<1)return r("timeJustNow");if(o<60)return r("timeAgo",`${o}${r("timeMinuteShort")}`);const n=Math.floor(o/60);return n<24?r("timeAgo",`${n}${r("timeHourShort")}`):r("timeAgo",`${Math.floor(n/24)}${r("timeDayShort")}`)};export{T as C,I as R,E as a,Z as b,w as c,H as d,g as e,_ as f,K as g,J as h,O as i,G as j,F as k,j as l,q as m,P as n,z as q,D as z};
