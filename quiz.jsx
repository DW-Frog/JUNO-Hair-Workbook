/* ===== 퀴즈 엔진 ===== */
const { useState, useEffect, useRef } = React;
const QU = window.QU, META = window.QUIZ_META;
const TIME_LIMIT = 75; // 타임어택 제한(초)

function Confetti(){
  const cols=["#FF5E9A","#7C6BFF","#22C098","#FBB733","#3FB6F0","#FF8FB1"];
  const pieces = Array.from({length:42}).map((_,i)=>({
    left:Math.random()*100, bg:cols[i%cols.length],
    dur:1.1+Math.random()*1.1, delay:Math.random()*.3,
    rot:Math.random()*360
  }));
  return (
    <div className="confetti">
      {pieces.map((p,i)=>(
        <i key={i} style={{left:p.left+"%",background:p.bg,
          animationDuration:p.dur+"s",animationDelay:p.delay+"s",
          transform:`rotate(${p.rot}deg)`}}></i>
      ))}
    </div>
  );
}

function QuizRunner({ mode, profile, onFinish, onQuit }){
  const queueRef = useRef(null);
  if(!queueRef.current){
    const ids = QU.buildQueue(mode, profile);
    queueRef.current = ids.map(QU.byId).filter(Boolean);
  }
  const queue = queueRef.current;
  const isTime = mode==="time";

  const [idx,setIdx] = useState(0);
  const [score,setScore] = useState(0);
  const [combo,setCombo] = useState(0);
  const [maxCombo,setMaxCombo] = useState(0);
  const [xpEarned,setXp] = useState(0);
  const [results,setResults] = useState([]);
  const [phase,setPhase] = useState("answer"); // answer | feedback
  const [picked,setPicked] = useState(null);    // mc index
  const [input,setInput] = useState("");
  const inputRef = useRef("");
  const [last,setLast] = useState(null);         // {ok,gain}
  const [confetti,setConfetti] = useState(false);
  const [toast,setToast] = useState(null);
  const [timeLeft,setTimeLeft] = useState(TIME_LIMIT);
  const sessionRef = useRef({score:0,maxCombo:0,xpEarned:0,results:[]});

  const q = queue[idx];

  // 타이머
  useEffect(()=>{
    if(!isTime) return;
    if(timeLeft<=0){ finish(); return; }
    const t=setTimeout(()=>setTimeLeft(timeLeft-1),1000);
    return ()=>clearTimeout(t);
  },[isTime,timeLeft]);

  function finish(){
    const s=sessionRef.current;
    onFinish({ mode, score:s.score, maxCombo:s.maxCombo, xpEarned:s.xpEarned, results:s.results });
  }

  function answer(ok, pickedIdx){
    if(phase!=="feedback"){} // guard handled by caller
    const base = QU.pointsFor(q);
    const mult = QU.comboMult(ok?combo+1:0);
    let gain = ok ? Math.round(base*mult) : 0;
    if(ok && isTime) gain += 5;
    const newCombo = ok ? combo+1 : 0;
    const newMax = Math.max(maxCombo,newCombo);
    const newScore = score+gain;
    const newXp = xpEarned+gain;
    const res = [...results, {id:q.id, cat:q.cat, ok}];

    setPicked(pickedIdx);
    setCombo(newCombo); setMaxCombo(newMax);
    setScore(newScore); setXp(newXp); setResults(res);
    setLast({ok,gain}); setPhase("feedback");
    sessionRef.current = {score:newScore,maxCombo:newMax,xpEarned:newXp,results:res};

    if(ok){
      setConfetti(true); setTimeout(()=>setConfetti(false),1500);
      if(newCombo>=3){ setToast(newCombo+" COMBO!"); setTimeout(()=>setToast(null),900); }
      if(navigator.vibrate) navigator.vibrate(15);
    } else {
      if(navigator.vibrate) navigator.vibrate([0,30,40,30]);
    }
    if(isTime) setTimeout(next, 850);
  }

  function next(){
    if(idx+1>=queue.length){ finish(); return; }
    inputRef.current="";
    setIdx(idx+1); setPhase("answer"); setPicked(null); setInput(""); setLast(null);
  }

  // 입력 핸들러
  function setInp(updater){
    setInput(prev=>{ const nx = typeof updater==="function"?updater(prev):updater; inputRef.current=nx; return nx; });
  }
  function pressKey(k){
    if(phase!=="answer") return;
    if(k==="del") return setInp(v=>v.slice(0,-1));
    if(k==="ok"){ const val=inputRef.current; if(val) answer(QU.gradeShort(val,q), null); return; }
    setInp(v=> v.length>=8 ? v : v+k);
  }
  function pickMC(i){
    if(phase!=="answer") return;
    const ok = i===q.a;
    answer(ok, i);
  }

  const progPct = Math.round(idx/queue.length*100);

  return (
    <React.Fragment>
      <div className="safe-top"></div>
      {/* 상단 진행/점수 */}
      <div className="qtop">
        <div className="qmeta">
          <button className="iconbtn" onClick={onQuit}>✕</button>
          <div className="qprog"><i style={{width:progPct+"%"}}></i></div>
          <div className="qcount">{idx+1}/{queue.length}</div>
        </div>
        <div className="scorebar">
          <div className="pill"><span className="em">⭐</span>{QU.fmt(score)}</div>
          {combo>=2 && <div className="pill combo"><span className="em">🔥</span>{combo}</div>}
          {isTime && <div className={"pill timer"+(timeLeft<=15?" warn":"")}><span className="em">⏱</span>{timeLeft}s</div>}
        </div>
      </div>

      {/* 질문 */}
      <div className="qwrap" key={q.id}>
        <div className="qcard pop">
          <span className="qcat" style={{background:META.cats[q.cat].color}}>
            {META.cats[q.cat].emoji} {META.cats[q.cat].name}
          </span>
          <div className="qtext" dangerouslySetInnerHTML={{__html:q.q}}></div>

          {q.type==="calc" && (
            <div className="qbase">
              {q.base.map((b,i)=>(
                <div className="br" key={i}><span>{b.label}</span><span className="p">{QU.fmt(b.price)}원</span></div>
              ))}
            </div>
          )}

          {(q.type==="mc"||q.type==="calc") ? (
            <div className="opts">
              {q.o.map((o,i)=>{
                let cls="opt";
                if(phase==="feedback"){
                  if(i===q.a) cls+=" correct";
                  else if(i===picked) cls+=" wrong";
                  else cls+=" dim";
                }
                return (
                  <button key={i} className={cls} onClick={()=>pickMC(i)}>
                    <span className="key">{["A","B","C","D"][i]}</span>
                    <span>{o}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <ShortInput input={input} phase={phase} ok={last&&last.ok} q={q} />
          )}
        </div>

        {q.type==="calc" && phase==="feedback" && (
          <div className="qbase fade" style={{marginTop:12,background:"#fff",boxShadow:"var(--shadow-sm)"}}>
            <div className="br" style={{fontSize:15}}><span>✅ 최종 결제 금액</span>
              <span className="p" style={{color:"var(--green-d)"}}>{QU.fmt(QU.calcFinal(q))}원</span></div>
          </div>
        )}
        <div style={{height:140}} className="qspacer"></div>
      </div>

      {/* 단답 키패드 */}
      {(q.type==="short") && phase==="answer" && (
        <div className="qfoot">
          <div className="keypad">
            {["1","2","3","4","5","6","7","8","9"].map(k=>(
              <button key={k} className="key-b" onClick={()=>pressKey(k)}>{k}</button>
            ))}
            <button className="key-b fn" onClick={()=>pressKey("del")}>⌫</button>
            <button className="key-b" onClick={()=>pressKey("0")}>0</button>
            <button className="key-b go" onClick={()=>pressKey("ok")} disabled={!input}>확인</button>
          </div>
        </div>
      )}

      {/* 효과 */}
      {confetti && <Confetti/>}
      {toast && <div className="combotoast">🔥 {toast}</div>}

      {/* 피드백 */}
      {phase==="feedback" && last && (
        <div className={"fb "+(last.ok?"ok":"no")}>
          <div className="fbh">
            <span className="big">{last.ok?"🎉":"😢"}</span>
            {last.ok?"정답!":"아쉬워요"}
            <span className="xpgain">+{last.gain} XP</span>
          </div>
          <div className="fbsub">
            정답: <b dangerouslySetInnerHTML={{__html:answerText(q)}}></b>
          </div>
          {!isTime && (
            <button className="btn ghost block" style={{marginTop:14,color:last.ok?"var(--green-d)":"var(--red-d)"}}
              onClick={next}>
              {idx+1>=queue.length ? "결과 보기 →" : "다음 문제 →"}
            </button>
          )}
        </div>
      )}
    </React.Fragment>
  );
}

function ShortInput({ input, phase, ok, q }){
  let cls="ansbox";
  if(phase==="feedback") cls += ok?" ok":" no";
  return (
    <div className={cls}>
      {input ? <span>{QU.fmt(Number(QU.digits(input)||0))}<span className="won">원</span></span>
             : (phase==="answer" ? <span className="ph">{q.hint||"숫자를 입력하세요"}</span>
                                  : <span>{QU.fmt(input?Number(QU.digits(input)):0)}<span className="won">원</span></span>)}
      {phase==="answer" && input && <span className="caret"></span>}
    </div>
  );
}

Object.assign(window, { QuizRunner });
