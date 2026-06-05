/* ===== 퀴즈 엔진 (3단계 계산 + 오리 반응 + 피버 + 효과음) ===== */
const { useState, useEffect, useRef } = React;
const QU = window.QU, META = window.QUIZ_META;
const TIME_LIMIT = 75;

function Confetti(){
  const cols=["#FF5E9A","#7C6BFF","#22C098","#FBB733","#3FB6F0","#FF8FB1"];
  const pieces = Array.from({length:42}).map((_,i)=>({
    left:Math.random()*100, bg:cols[i%cols.length],
    dur:1.1+Math.random()*1.1, delay:Math.random()*.3, rot:Math.random()*360
  }));
  return (<div className="confetti">
    {pieces.map((p,i)=>(<i key={i} style={{left:p.left+"%",background:p.bg,
      animationDuration:p.dur+"s",animationDelay:p.delay+"s",transform:`rotate(${p.rot}deg)`}}></i>))}
  </div>);
}

/* 계산문제를 단계별 가상 문제로 변환 */
function subQ(q, sub){
  if(q.type!=="calc"){
    return { kind:q.type, prompt:q.q, o:q.o, a:q.a, answer:q.a, hint:q.hint,
             points:QU.pointsFor(q), showBase:false };
  }
  const baseSum = q.base.reduce((s,b)=>s+b.price,0);
  if(sub===0){
    const prompt = q.base.length===1
      ? `<b>${q.base[0].label}</b>의 가격은? 🏷️`
      : `${q.base.map(b=>`<b>${b.label}</b>`).join(" + ")}<br>두 시술의 <u>합계 금액</u>은?`;
    return { kind:"short", prompt, answer:baseSum, hint:"원래 가격", points:10, showBase:false };
  }
  if(sub===1){
    return { kind:"mc", prompt:q.q, o:q.o, a:q.a, points:10, showBase:true };
  }
  return { kind:"short", prompt:"그래서 <b>최종 결제 금액</b>은? 💳", answer:QU.calcFinal(q),
           hint:"할인 적용 후", points:15, showBase:true, showPicked:true };
}

function QuizRunner({ mode, profile, onFinish, onQuit }){
  const queueRef = useRef(null);
  if(!queueRef.current){
    queueRef.current = QU.buildQueue(mode, profile).map(QU.byId).filter(Boolean);
  }
  const queue = queueRef.current;
  const isTime = mode==="time";

  const [idx,setIdx]   = useState(0);
  const [sub,setSub]   = useState(0);
  const [score,setScore] = useState(0);
  const [combo,setCombo] = useState(0);
  const [maxCombo,setMaxCombo] = useState(0);
  const [xpEarned,setXp] = useState(0);
  const [phase,setPhase] = useState("answer");
  const [picked,setPicked] = useState(null);
  const [input,setInput] = useState("");
  const [last,setLast] = useState(null);
  const [confetti,setConfetti] = useState(false);
  const [toast,setToast] = useState(null);
  const [timeLeft,setTimeLeft] = useState(TIME_LIMIT);
  const [snd,setSnd] = useState(QU.sound.on);

  const inputRef = useRef("");
  const sessionRef = useRef({score:0,maxCombo:0,xpEarned:0,results:[]});
  const calcOkRef = useRef([]);
  const lastOkRef = useRef(false);

  const q = queue[idx];
  const isCalc = q.type==="calc";
  const sq = subQ(q, sub);

  useEffect(()=>{
    if(!isTime) return;
    if(timeLeft<=0){ finish(); return; }
    const t=setTimeout(()=>setTimeLeft(timeLeft-1),1000);
    return ()=>clearTimeout(t);
  },[isTime,timeLeft]);

  function finish(){ onFinish({ mode, ...sessionRef.current }); }

  function handleAnswer(ok, pickedIdx){
    const newCombo = ok?combo+1:0;
    const fever = newCombo>=5;
    const mult = QU.comboMult(newCombo);
    let gain = ok ? Math.round(sq.points*mult) : 0;
    if(ok && isTime) gain += 3;
    const newMax = Math.max(maxCombo,newCombo);
    const newScore = score+gain, newXp = xpEarned+gain;

    setPicked(pickedIdx); setCombo(newCombo); setMaxCombo(newMax);
    setScore(newScore); setXp(newXp);
    setLast({ok,gain,fever}); setPhase("feedback");
    sessionRef.current.score=newScore; sessionRef.current.maxCombo=newMax; sessionRef.current.xpEarned=newXp;
    if(isCalc) calcOkRef.current[sub]=ok; else lastOkRef.current=ok;

    if(ok){
      QU.sound[fever?"fever":"correct"]();
      setConfetti(true); setTimeout(()=>setConfetti(false),1500);
      if(newCombo>=3){ setToast(newCombo+" COMBO!"); setTimeout(()=>setToast(null),900); }
      if(navigator.vibrate) navigator.vibrate(15);
    } else {
      QU.sound.wrong();
      if(navigator.vibrate) navigator.vibrate([0,30,40,30]);
    }
    if(isTime) setTimeout(next, 950);
  }

  function next(){
    // 계산문제: 다음 단계로
    if(isCalc && sub<2){
      inputRef.current="";
      setSub(sub+1); setPhase("answer"); setPicked(null); setInput(""); setLast(null);
      return;
    }
    // 문제 종료 → 결과 기록
    const qOk = isCalc ? calcOkRef.current.slice(0,3).every(Boolean) : lastOkRef.current;
    sessionRef.current.results.push({ id:q.id, cat:q.cat, ok:qOk });
    if(idx+1>=queue.length){ finish(); return; }
    inputRef.current=""; calcOkRef.current=[];
    setIdx(idx+1); setSub(0); setPhase("answer"); setPicked(null); setInput(""); setLast(null);
  }

  // 입력
  function setInp(up){ setInput(prev=>{ const nx=typeof up==="function"?up(prev):up; inputRef.current=nx; return nx; }); }
  function pressKey(k){
    if(phase!=="answer") return;
    QU.sound.tap();
    if(k==="del") return setInp(v=>v.slice(0,-1));
    if(k==="ok"){ const v=inputRef.current; if(v) handleAnswer(QU.gradeNum(v,sq.answer), null); return; }
    setInp(v=> v.length>=8 ? v : v+k);
  }
  function pickMC(i){ if(phase!=="answer") return; handleAnswer(i===sq.a, i); }

  // 오리 기분 & 멘트
  let duckMood="idle", line=window.duckLine("start"), tone="normal";
  if(phase==="feedback"){
    if(last && last.ok){
      duckMood = last.fever?"wow":"happy";
      line = window.duckLine(combo>=3?"okCombo":"ok"); tone="ok";
    } else { duckMood="sad"; line=window.duckLine("no"); tone="no"; }
  }

  const progPct = Math.round((idx + (isCalc?sub/3:0))/queue.length*100);
  const fmtVal = input?QU.fmt(Number(QU.digits(input)||0)):0;
  const feverOn = combo>=5;

  return (
    <React.Fragment>
      <div className="safe-top"></div>
      <div className={"qtop"+(feverOn?" fever":"")}>
        <div className="qmeta">
          <button className="iconbtn" onClick={onQuit}>✕</button>
          <div className="qprog"><i style={{width:progPct+"%"}}></i></div>
          <div className="qcount">{idx+1}/{queue.length}</div>
          <button className="iconbtn" onClick={()=>setSnd(QU.sound.toggle())}>{snd?"🔊":"🔇"}</button>
        </div>
        <div className="scorebar">
          <div className="pill"><span className="em">⭐</span>{QU.fmt(score)}</div>
          {combo>=2 && <div className={"pill combo"+(feverOn?" fever":"")}><span className="em">🔥</span>{combo}{feverOn?" 피버!":""}</div>}
          {isTime && <div className={"pill timer"+(timeLeft<=15?" warn":"")}><span className="em">⏱</span>{timeLeft}s</div>}
        </div>
      </div>

      <div className="qwrap" key={q.id+"-"+sub}>
        <div className="qcard pop">
          <div className="qcardhead">
            <span className="qcat" style={{background:META.cats[q.cat].color}}>
              {META.cats[q.cat].emoji} {META.cats[q.cat].name}
            </span>
            {isCalc && <span className="stepbadge">계산 {sub+1}/3단계</span>}
          </div>
          <div className="qtext" dangerouslySetInnerHTML={{__html:sq.prompt}}></div>

          {sq.showBase && (
            <div className="qbase">
              {q.base.map((b,i)=>(
                <div className="br" key={i}><span>{b.label}</span><span className="p">{QU.fmt(b.price)}원</span></div>
              ))}
              {sq.showPicked && picked==null && q.steps && (
                <div className="br" style={{color:"var(--purple-d)"}}><span>적용 할인</span><span className="p">{q.o[q.a]}</span></div>
              )}
            </div>
          )}

          {sq.kind==="mc" ? (
            <div className="opts">
              {sq.o.map((o,i)=>{
                let cls="opt";
                if(phase==="feedback"){
                  if(i===sq.a) cls+=" correct";
                  else if(i===picked) cls+=" wrong";
                  else cls+=" dim";
                }
                return (<button key={i} className={cls} onClick={()=>pickMC(i)}>
                  <span className="key">{["A","B","C","D"][i]}</span><span>{o}</span></button>);
              })}
            </div>
          ) : (
            <div className={"ansbox"+(phase==="feedback"?(last&&last.ok?" ok":" no"):"")}>
              {input ? <span>{fmtVal}<span className="won">원</span></span>
                     : <span className="ph">{sq.hint||"숫자를 입력하세요"}</span>}
              {phase==="answer" && input && <span className="caret"></span>}
            </div>
          )}
        </div>
        <div style={{height:14}} className="qspacer"></div>
      </div>

      {sq.kind==="short" && phase==="answer" && (
        <div className="qfoot">
          <div className="keypad">
            {["1","2","3","4","5","6","7","8","9"].map(k=>(
              <button key={k} className="key-b" onClick={()=>pressKey(k)}>{k}</button>))}
            <button className="key-b fn" onClick={()=>pressKey("del")}>⌫</button>
            <button className="key-b" onClick={()=>pressKey("0")}>0</button>
            <button className="key-b go" onClick={()=>pressKey("ok")} disabled={!input}>확인</button>
          </div>
        </div>
      )}

      {confetti && <Confetti/>}
      {toast && <div className="combotoast">🔥 {toast}</div>}

      {/* 오리 + 피드백 */}
      {phase==="feedback" && last && (
        <div className={"fb "+(last.ok?"ok":"no")}>
          <div className="fb-duckrow">
            <div className="fb-duck"><Duck mood={duckMood} size={70} bob/></div>
            <DuckBubble text={line} tone={last.ok?"ok":"no"}/>
            <span className="xpgain">+{last.gain}</span>
          </div>
          <div className="fbsub">
            정답: <b dangerouslySetInnerHTML={{__html:subAnswerText(q,sq)}}></b>
            {last.fever && <span className="fevertag">🔥 피버 XP 2배!</span>}
          </div>
          {!isTime && (
            <button className="btn ghost block fb-next" onClick={next}>
              {(isCalc && sub<2) ? "다음 단계 →"
                : (idx+1>=queue.length ? "결과 보기 →" : "다음 문제 →")}
            </button>
          )}
        </div>
      )}
    </React.Fragment>
  );
}

function subAnswerText(q, sq){
  if(sq.kind==="mc") return sq.o[sq.a];
  return QU.fmt(sq.answer) + "원";
}

Object.assign(window, { QuizRunner });
