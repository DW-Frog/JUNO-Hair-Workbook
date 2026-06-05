/* ===== 꽥꽥이: 귀여운 오리 마스코트 =====
   mood: idle | happy | wow | sad | sleepy | cool | proud
*/
function Duck({ mood="idle", size=90, bob=false }){
  const Y="#FFD23F", YD="#F4B81E", OR="#FF9E2C", ORD="#F0851A",
        BLK="#3B2A1A", PINK="#FF9DBB", WHT="#FFFFFF";
  const open = mood==="happy"||mood==="wow"||mood==="proud";

  // 눈
  let eyes;
  if(mood==="happy"||mood==="proud"){
    eyes = (<g fill="none" stroke={BLK} strokeWidth="4.5" strokeLinecap="round">
      <path d="M40 50 q7 -9 14 0"/><path d="M66 50 q7 -9 14 0"/></g>);
  } else if(mood==="sad"){
    eyes = (<g>
      <g fill="none" stroke={BLK} strokeWidth="4.5" strokeLinecap="round">
        <path d="M40 46 q7 6 14 2"/><path d="M66 48 q7 -4 14 1"/></g>
      <path d="M44 54 q-4 9 0 12 q4 -3 0 -12 Z" fill="#5BC8F0"/>
    </g>);
  } else if(mood==="sleepy"){
    eyes = (<g fill="none" stroke={BLK} strokeWidth="4.5" strokeLinecap="round">
      <path d="M41 50 h12"/><path d="M67 50 h12"/></g>);
  } else if(mood==="cool"){
    eyes = (<g>
      <rect x="36" y="42" width="20" height="14" rx="6" fill={BLK}/>
      <rect x="64" y="42" width="20" height="14" rx="6" fill={BLK}/>
      <rect x="56" y="47" width="8" height="3.5" rx="2" fill={BLK}/>
      <rect x="40" y="45" width="6" height="4" rx="2" fill="#7a7a7a"/>
    </g>);
  } else if(mood==="wow"){
    eyes = (<g>
      <circle cx="47" cy="49" r="8" fill={WHT} stroke={BLK} strokeWidth="2.5"/>
      <circle cx="73" cy="49" r="8" fill={WHT} stroke={BLK} strokeWidth="2.5"/>
      <circle cx="48" cy="50" r="4.2" fill={BLK}/><circle cx="74" cy="50" r="4.2" fill={BLK}/>
      <circle cx="46" cy="48" r="1.6" fill={WHT}/><circle cx="72" cy="48" r="1.6" fill={WHT}/>
    </g>);
  } else { // idle
    eyes = (<g fill={BLK}>
      <circle cx="48" cy="49" r="4.6"/><circle cx="72" cy="49" r="4.6"/>
      <circle cx="46.4" cy="47.4" r="1.5" fill={WHT}/><circle cx="70.4" cy="47.4" r="1.5" fill={WHT}/>
    </g>);
  }

  // 부리
  const beak = open ? (
    <g>
      <path d="M50 60 q10 -6 20 0 q-2 5 -10 5 q-8 0 -10 -5 Z" fill={OR} stroke={ORD} strokeWidth="1.5"/>
      <path d="M50 61 q10 8 20 0 q-3 9 -10 9 q-7 0 -10 -9 Z" fill={ORD}/>
      <path d="M53 64 q7 4 14 0 q-3 4 -7 4 q-4 0 -7 -4 Z" fill="#E25B3A"/>
    </g>
  ) : (
    <path d="M48 60 q12 -7 24 0 q-4 9 -12 9 q-8 0 -12 -9 Z" fill={OR} stroke={ORD} strokeWidth="1.5"/>
  );

  return (
    <svg width={size} height={size} viewBox="0 0 120 120"
      className={bob?"duck-bob":""} style={{display:"block",overflow:"visible"}}>
      {/* 그림자 */}
      <ellipse cx="60" cy="110" rx="30" ry="6" fill="rgba(0,0,0,.10)"/>
      {/* 머리 위 깃털 컬 */}
      <path d="M60 16 q-3 -10 6 -12 q-5 6 2 9" fill="none" stroke={YD} strokeWidth="4.5" strokeLinecap="round"/>
      {/* 몸 */}
      <ellipse cx="60" cy="82" rx="36" ry="32" fill={Y}/>
      <ellipse cx="60" cy="86" rx="26" ry="22" fill="#FFE07A"/>
      {/* 날개 */}
      <path d="M28 78 q-10 6 -2 18 q8 4 12 -4 q-8 -4 -10 -14 Z" fill={YD}/>
      <path d="M92 78 q10 6 2 18 q-8 4 -12 -4 q8 -4 10 -14 Z" fill={YD}/>
      {/* 머리 */}
      <circle cx="60" cy="46" r="30" fill={Y}/>
      {/* 볼터치 */}
      <ellipse cx="36" cy="56" rx="6" ry="4.5" fill={PINK} opacity=".85"/>
      <ellipse cx="84" cy="56" rx="6" ry="4.5" fill={PINK} opacity=".85"/>
      {eyes}
      {beak}
      {/* 발 */}
      <path d="M48 112 q-6 4 -10 2 q4 4 12 2 Z" fill={OR}/>
      <path d="M72 112 q6 4 10 2 q-4 4 -12 2 Z" fill={OR}/>
      {/* 반짝이 (wow/proud) */}
      {(mood==="wow"||mood==="proud") && (
        <g fill="#FFE37A">
          <path d="M14 30 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z"/>
          <path d="M104 24 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5 Z"/>
        </g>
      )}
      {/* 잠 (sleepy) */}
      {mood==="sleepy" && (
        <g fill="none" stroke="#9B8CFF" strokeWidth="3" strokeLinecap="round">
          <path d="M88 26 h10 l-10 10 h10"/>
        </g>
      )}
    </svg>
  );
}

/* 말풍선 */
function DuckBubble({ text, tone="normal" }){
  const bg = tone==="ok"?"#E7FBF4":tone==="no"?"#FFECEF":"#fff";
  const col = tone==="ok"?"#12A07C":tone==="no"?"#E84A65":"#5E4BE0";
  return (
    <div className="duckbubble" style={{background:bg,color:col}}>
      {text}
      <span className="bubtail" style={{background:bg}}></span>
    </div>
  );
}

/* 응원 멘트 풀 */
const DUCK_LINES = {
  start: ["가격 마스터 도전!","꽥! 오늘도 화이팅!","나랑 같이 공부하자 꽥","천천히, 정확하게!"],
  ok:    ["꽥! 정답이야!","역시 너야 ✨","완벽해 꽥꽥!","척척박사네!","이대로 가자!"],
  okCombo:["불타오른다 🔥","멈추지 마 꽥!","연속 정답 미쳤다!","천재인가봐 ✨"],
  no:    ["앗, 아쉬워 꽥","괜찮아 다시 하면 돼","이건 외워두자!","담엔 맞힐 거야 💪"],
  win:   ["대단해 꽥! 🏆","넌 진짜 마스터야!","오리도 감동했어 🥹"],
  okhalf:["좋아 좋아 꽥!","잘하고 있어!","조금만 더!"],
};
function duckLine(key){ const a=DUCK_LINES[key]||DUCK_LINES.ok; return a[Math.floor(Math.random()*a.length)]; }

Object.assign(window, { Duck, DuckBubble, duckLine });
