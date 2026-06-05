/* ===== 결과 화면 ===== */
const QU = window.QU, META = window.QUIZ_META;
function ResultScreen({ session, profile, leveledUp, newLevel, newRank, onAgain, onRetryWrong, onHome }){
  const total = session.results.length;
  const correct = session.results.filter(r=>r.ok).length;
  const rate = total ? Math.round(correct/total*100) : 0;
  const wrong = session.results.filter(r=>!r.ok).map(r=>QU.byId(r.id));
  const isExam = session.mode==="exam";
  const isDaily = session.mode==="daily";
  const examPass = rate>=80;
  const dailyGain = (profile && profile.lastResult && profile.lastResult.dailyGain) || 0;
  const streak = profile ? QU.dailyStreak(profile) : 0;

  let mood="happy", title="완료!", sub="수고했어요";
  if(rate===100){ mood="proud"; title="올킬! 퍼펙트!"; sub="완벽해요, 가격 마스터 ✨"; }
  else if(rate>=80){ mood="wow"; title="훌륭해요!"; sub="거의 다 맞혔어요"; }
  else if(rate>=50){ mood="happy"; title="좋아요!"; sub="조금만 더 연습하면 완벽!"; }
  else { mood="sad"; title="다시 도전!"; sub="오답노트로 복습해봐요"; }
  const stars = rate===100?3 : rate>=70?2 : rate>=40?1 : 0;
  const duckLineKey = rate>=80?"win":rate>=50?"okhalf":"no";
  if(isExam){ title = examPass?"합격! 🎉":"불합격 😢"; sub = examPass?"가격 마스터 자격 충분!":"80점 이상이면 합격이에요"; mood = examPass?"proud":"sad"; }
  if(isDaily){ title = "오늘의 도전 완료!"; sub = streak>1?`${streak}일 연속 출석 중 🔥`:"내일도 잊지 말고 와요!"; if(rate>=60) mood="happy"; }

  // 이번 판 분야별
  const byCat = {};
  session.results.forEach(r=>{
    if(!byCat[r.cat]) byCat[r.cat]={s:0,c:0};
    byCat[r.cat].s++; if(r.ok) byCat[r.cat].c++;
  });
  const catRows = Object.keys(byCat).map(k=>({
    key:k, ...META.cats[k], pct:Math.round(byCat[k].c/byCat[k].s*100), c:byCat[k].c, s:byCat[k].s
  })).sort((a,b)=>a.pct-b.pct);

  return (
    <div className="scroll fade">
      <div className="result-top">
        <div className="result-duck"><Duck mood={mood} size={120} bob/></div>
        <div className="stars">
          {[0,1,2].map(i=>(<span key={i} className={"star"+(i<stars?" on":"")}
            style={{animationDelay:(i*0.15)+"s"}}>★</span>))}
        </div>
        <div className="result-title jua">{title}</div>
        <div className="result-sub">{sub}</div>
        <div className="result-bubble"><DuckBubble text={window.duckLine(duckLineKey)} tone={rate>=50?"ok":"no"}/></div>

        {isExam && (
          <div className={"exam-verdict "+(examPass?"pass":"fail")}>
            <div className="ev-stamp">{examPass?"합격":"불합격"}</div>
            <div className="ev-body">
              <div className="ev-score">{rate}점</div>
              <div className="ev-line">{correct}/{total} 정답 · 합격 기준 80점</div>
              <div className="ev-bar"><i style={{width:rate+"%"}}></i><span className="ev-pass" style={{left:"80%"}}></span></div>
            </div>
          </div>
        )}
        {isDaily && dailyGain>0 && (
          <div className="daily-reward">
            <div className="dr-ic">🔥</div>
            <div><div className="dr-a">{streak}일 연속 출석!</div>
              <div className="dr-b">출석 보너스 +{dailyGain} XP</div></div>
          </div>
        )}

        <div className="scorebig">
          <div className="lab">획득 점수</div>
          <div className="num">{QU.fmt(session.score)}</div>
          <div style={{fontSize:13,fontWeight:800,opacity:.95,marginTop:6}}>+{QU.fmt(session.xpEarned)} XP 획득 🌟</div>
        </div>

        <div className="res-grid">
          <div className="mini"><div className="v">{correct}/{total}</div><div className="l">정답</div></div>
          <div className="mini"><div className="v">{rate}%</div><div className="l">정답률</div></div>
          <div className="mini"><div className="v">🔥{session.maxCombo}</div><div className="l">최고 콤보</div></div>
        </div>

        {leveledUp && (
          <div className="lvup">
            <div className="ic">{newRank.ic}</div>
            <div style={{textAlign:"left"}}>
              <div className="a">🎊 레벨 업! Lv.{newLevel}</div>
              <div className="b">{newRank.name} 등급 달성!</div>
            </div>
          </div>
        )}
      </div>

      <div className="pad" style={{paddingTop:4}}>
        {catRows.length>1 && (<>
          <div className="sec-t">📊 이번 판 분야별</div>
          <div className="anal">
            {catRows.map(c=>(
              <div className="abar" key={c.key}>
                <div className="ah"><span>{c.emoji} {c.name}</span><span className="pct" style={{color:c.color}}>{c.pct}%</span></div>
                <div className="track"><i style={{width:c.pct+"%",background:c.color}}></i></div>
              </div>
            ))}
          </div>
        </>)}

        {wrong.length>0 && (<>
          <div className="sec-t">📝 틀린 문제 ({wrong.length})</div>
          {wrong.map(q=>(
            <div className="wrongitem" key={q.id}>
              <div className="wa" style={{marginTop:0,marginBottom:7}}>
                <span className="tag catt">{META.cats[q.cat].emoji} {META.cats[q.cat].name}</span>
              </div>
              <div className="wq" dangerouslySetInnerHTML={{__html:q.q}}></div>
              <div className="wa"><span className="tag real">정답: {answerText(q)}</span></div>
            </div>
          ))}
        </>)}

        <div className="col" style={{gap:10,marginTop:18}}>
          {wrong.length>0 && (
            <button className="btn red block" onClick={onRetryWrong}>
              <span className="em">🔁</span> 틀린 {wrong.length}문제 재시험
            </button>
          )}
          <button className="btn block" onClick={onAgain}><span className="em">↻</span> 다시 풀기</button>
          <button className="btn ghost block" onClick={onHome}><span className="em">🏠</span> 홈으로</button>
        </div>
        <div style={{height:10}}></div>
      </div>
    </div>
  );
}

Object.assign(window, { ResultScreen });
