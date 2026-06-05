/* ===== 준오헤어 게임 — 로직 유틸 (window.QU) ===== */
(function(){
  const KEY = "junohair_quiz_v1";

  // ---- 랭크(매장 직급 = 등급 뱃지) ----
  const RANKS = [
    { min:1,  name:"신입 스타일리스트", ic:"🌱" },
    { min:3,  name:"디자이너",         ic:"✂️" },
    { min:5,  name:"수석실장",         ic:"💇" },
    { min:7,  name:"부원장",           ic:"⭐" },
    { min:9,  name:"원장",             ic:"👑" },
    { min:12, name:"대표원장",         ic:"🏆" },
  ];
  function rankFor(level){
    let r = RANKS[0];
    for(const x of RANKS){ if(level>=x.min) r=x; }
    return r;
  }
  // 레벨 n 까지 필요한 누적 XP: 각 레벨 i 는 i*120 XP
  function xpForLevel(n){ // n레벨 시작에 필요한 누적
    let t=0; for(let i=1;i<n;i++) t+=i*120; return t;
  }
  function levelInfo(xp){
    let lv=1;
    while(xp >= xpForLevel(lv+1)) lv++;
    const cur = xpForLevel(lv), next = xpForLevel(lv+1);
    return { level:lv, into:xp-cur, span:next-cur, pct:Math.min(100,Math.round((xp-cur)/(next-cur)*100)) };
  }

  // ---- 저장 ----
  function blank(){
    return { xp:0, answered:0, correct:0, bestCombo:0, plays:0,
             perCat:{}, wrongIds:[], lastResult:null };
  }
  function load(){
    try{ const r=JSON.parse(localStorage.getItem(KEY)); return r?Object.assign(blank(),r):blank(); }
    catch(e){ return blank(); }
  }
  function save(p){ try{ localStorage.setItem(KEY, JSON.stringify(p)); }catch(e){} }
  function reset(){ localStorage.removeItem(KEY); }

  // ---- 채점 ----
  function digits(s){ return String(s).replace(/[^0-9]/g,""); }
  function gradeShort(input, q){
    const a = digits(input);
    if(!a) return false;
    if(a === digits(q.a)) return true;
    if(q.alt) return q.alt.some(x=>digits(x)===a);
    return false;
  }
  // 계산 최종가: base 가격들에 steps(%) 순차 적용 후 합산
  function calcFinal(q){
    return q.base.reduce((sum,b)=>{
      let p=b.price;
      (q.steps||[]).forEach(pc=> p = p*(1-pc/100));
      return sum + Math.round(p);
    },0);
  }
  function fmt(n){ return Number(n).toLocaleString("ko-KR"); }

  // ---- 큐 만들기 ----
  function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
  const ALL = window.QUIZ_QUESTIONS;
  function byId(id){ return ALL.find(q=>q.id===id); }
  function buildQueue(mode, profile){
    if(mode==="all")    return ALL.map(q=>q.id);
    if(mode==="random") return shuffle(ALL.map(q=>q.id));
    if(mode==="time")   return shuffle(ALL.map(q=>q.id));
    if(mode==="retry")  return shuffle((profile.wrongIds||[]).filter(byId));
    if(mode && mode.startsWith("cat:")){
      const c=mode.slice(4);
      return ALL.filter(q=>q.cat===c).map(q=>q.id);
    }
    return ALL.map(q=>q.id);
  }

  // ---- 점수/XP ----
  function pointsFor(q){ return q.type==="calc"?20:10; }
  function comboMult(combo){ // 콤보 보너스 배율 (피버: 5콤보 이상 2배)
    if(combo>=10) return 2.5;
    if(combo>=5)  return 2;     // 🔥 피버타임
    if(combo>=3)  return 1.5;
    return 1;
  }
  function gradeNum(input, answer){
    const a=digits(input); if(!a) return false; return a===digits(answer);
  }

  // ---- 효과음 (합성, 에셋 없음) ----
  let _actx=null, _on = (localStorage.getItem("juno_sound")||"1")==="1";
  function ac(){ if(!_actx){ try{ _actx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } return _actx; }
  function blip(freqs, type, dur, vol){
    if(!_on) return; const a=ac(); if(!a) return;
    try{ if(a.state==="suspended") a.resume();
      let t=a.currentTime;
      freqs.forEach(f=>{ const o=a.createOscillator(), g=a.createGain();
        o.type=type; o.frequency.value=f;
        g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+0.012);
        g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
        o.connect(g).connect(a.destination); o.start(t); o.stop(t+dur); t+=dur*0.78; });
    }catch(e){}
  }
  const sound = {
    correct(){ blip([880,1320],"triangle",0.12,0.16); },
    wrong(){ blip([240,170],"sawtooth",0.17,0.10); },
    fever(){ blip([784,1046,1318],"triangle",0.1,0.16); },
    level(){ blip([523,659,784,1046],"triangle",0.14,0.18); },
    tap(){ blip([620],"sine",0.045,0.06); },
    get on(){ return _on; },
    toggle(){ _on=!_on; localStorage.setItem("juno_sound",_on?"1":"0"); return _on; }
  };

  // ---- 결과를 프로필에 반영 ----
  function commit(profile, session){
    const p = profile;
    p.plays += 1;
    p.xp += session.xpEarned;
    p.answered += session.results.length;
    p.correct += session.results.filter(r=>r.ok).length;
    p.bestCombo = Math.max(p.bestCombo, session.maxCombo);
    session.results.forEach(r=>{
      const c = r.cat;
      if(!p.perCat[c]) p.perCat[c]={seen:0,correct:0};
      p.perCat[c].seen += 1;
      if(r.ok) p.perCat[c].correct += 1;
    });
    // 오답노트 갱신: 맞춘 건 제거, 틀린 건 추가
    const set = new Set(p.wrongIds||[]);
    session.results.forEach(r=>{ if(r.ok) set.delete(r.id); else set.add(r.id); });
    p.wrongIds = Array.from(set);
    p.lastResult = {
      score:session.score, xp:session.xpEarned, total:session.results.length,
      correct:session.results.filter(r=>r.ok).length, maxCombo:session.maxCombo,
      mode:session.mode, at:Date.now()
    };
    save(p);
    return p;
  }

  // 분야별 정답률 (누적)
  function catStats(profile){
    const meta = window.QUIZ_META.cats;
    return Object.keys(meta).map(k=>{
      const s = profile.perCat[k]||{seen:0,correct:0};
      const total = ALL.filter(q=>q.cat===k).length;
      return { key:k, ...meta[k], seen:s.seen, correct:s.correct, total,
               pct: s.seen? Math.round(s.correct/s.seen*100):null };
    });
  }

  window.QU = { RANKS, rankFor, levelInfo, xpForLevel, load, save, reset, blank,
    gradeShort, gradeNum, calcFinal, fmt, digits, shuffle, buildQueue, byId, ALL,
    pointsFor, comboMult, commit, catStats, sound };
})();
