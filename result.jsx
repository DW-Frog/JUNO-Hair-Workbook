/* ===== 결과 화면 ===== */
const QU = window.QU, META = window.QUIZ_META;
function ResultScreen({ session, leveledUp, newLevel, newRank, onAgain, onRetryWrong, onHome }){
  const total = session.results.length;
  const correct = session.results.filter(r=>r.ok).length;
  const rate = total ? Math.round(correct/total*100) : 0;
  const wrong = session.results.filter(r=>!r.ok).map(r=>QU.byId(r.id));

  let emoji="🎯", title="완료!", sub="수고했어요";
  if(rate===100){ emoji="🏆"; title="올킬! 퍼펙트!"; sub="완벽해요, 가격 마스터 ✨"; }
  else if(rate>=80){ emoji="🎉"; title="훌륭해요!"; sub="거의 다 맞혔어요"; }
  else if(rate>=50){ emoji="💪"; title="좋아요!"; sub="조금만 더 연습하면 완벽!"; }
  else { emoji="📖"; title="다시 도전!"; sub="오답노트로 복습해봐요"; }

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
        <div className="bigemoji">{emoji}</div>
        <div className="result-title jua">{title}</div>
        <div className="result-sub">{sub}</div>

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
