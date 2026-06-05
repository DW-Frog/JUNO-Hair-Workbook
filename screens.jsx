/* ===== 화면들: 홈 / 분석 / 오답노트 / 프로필 ===== */
const { useState, useEffect, useRef } = React;
const QU = window.QU, META = window.QUIZ_META;

/* 상단 랭크/경험치 헤더 */
function RankHeader({ profile, compact }){
  const li = QU.levelInfo(profile.xp);
  const rk = QU.rankFor(li.level);
  return (
    <div className="home-top" style={compact?{borderRadius:0,paddingBottom:16}:null}>
      <div className="brand">
        <div className="logo"><Duck mood="happy" size={40}/></div>
        <div>
          <div className="t1">{META.store} 가격 마스터</div>
          <div className="t2">꽥꽥 시험 공부 게임</div>
        </div>
      </div>
      <div className="rankcard">
        <div className="rankbadge"><div className="ic">{rk.ic}</div></div>
        <div className="lvtext">
          <div className="lv">Lv.{li.level} · {rk.name}</div>
          <div className="rk">다음 레벨까지 {QU.fmt(li.span - li.into)} XP</div>
          <div className="xpbar"><i style={{width:li.pct+"%"}}></i></div>
          <div className="xpnum">{QU.fmt(li.into)} / {QU.fmt(li.span)} XP</div>
        </div>
      </div>
    </div>
  );
}

/* 홈 — 모드 선택 + 분야 선택 */
function HomeScreen({ profile, onStart }){
  const rate = profile.answered ? Math.round(profile.correct/profile.answered*100) : 0;
  const cats = QU.catStats(profile);
  const wrongN = (profile.wrongIds||[]).length;

  const modes = [
    { mode:"all",    a:"전체 문제",   b:"모든 문제를 순서대로 정복", ic:"📚", bg:"var(--purple)" },
    { mode:"random", a:"랜덤 섞기",   b:"무작위로 출제, 실전 감각",  ic:"🎲", bg:"var(--pink)" },
    { mode:"time",   a:"타임어택",    b:"제한시간 안에 최대 점수!",   ic:"⚡", bg:"var(--amber)" },
    { mode:"retry",  a:"틀린 문제 재시험", b:wrongN?`오답 ${wrongN}문제 다시풀기`:"틀린 문제 없음 👍", ic:"🔁", bg:"var(--red)", cnt:wrongN, disabled:!wrongN },
  ];

  return (
    <div className="scroll fade">
      <div className="pad">
        <div className="mini-stats">
          <div className="mini"><div className="v">{profile.plays}</div><div className="l">플레이</div></div>
          <div className="mini"><div className="v">{rate}%</div><div className="l">정답률</div></div>
          <div className="mini"><div className="v">🔥{profile.bestCombo}</div><div className="l">최고 콤보</div></div>
        </div>

        <div className="sec-t">🎮 모드 선택</div>
        <div className="modes">
          {modes.map(m=>(
            <div key={m.mode} className="mode" style={m.disabled?{opacity:.5}:null}
                 onClick={()=>!m.disabled&&onStart(m.mode)}>
              <div className="ico" style={{background:m.bg}}>{m.ic}</div>
              <div className="mt"><div className="a">{m.a}</div><div className="b">{m.b}</div></div>
              {m.cnt>0 && <div className="cnt">{m.cnt}</div>}
              <div className="arr">›</div>
            </div>
          ))}
        </div>

        <div className="sec-t">📂 분야별 연습</div>
        <div className="cat-grid">
          {cats.map(c=>(
            <div key={c.key} className="catc" onClick={()=>onStart("cat:"+c.key)}>
              <div className="ce">{c.emoji}</div>
              <div className="cn">{c.name}</div>
              <div className="cc">{c.total}문제 {c.pct!=null?`· 정답률 ${c.pct}%`:""}</div>
              <div className="cbar"><i style={{width:(c.pct||0)+"%", background:c.color}}></i></div>
            </div>
          ))}
        </div>
        <div style={{height:8}}></div>
      </div>
    </div>
  );
}

/* 분석 — 분야별 취약점 */
function AnalysisScreen({ profile }){
  const cats = QU.catStats(profile).filter(c=>c.seen>0).sort((a,b)=>a.pct-b.pct);
  const rate = profile.answered ? Math.round(profile.correct/profile.answered*100) : 0;
  const weak = cats.length? cats[0] : null;

  if(!cats.length) return (
    <div className="scroll"><div className="appbar"><span className="at">📊 학습 분석</span></div>
      <div className="empty"><div className="e">📊</div><div style={{marginTop:10}}>아직 데이터가 없어요!<br/>문제를 풀면 분야별 취약점을<br/>분석해 드릴게요.</div></div>
    </div>
  );

  return (
    <div className="scroll fade">
      <div className="appbar"><span className="at">📊 학습 분석</span></div>
      <div className="pad" style={{paddingTop:4}}>
        <div className="scorebig" style={{background:"linear-gradient(160deg,var(--purple),var(--purple-d))"}}>
          <div className="lab">전체 정답률</div>
          <div className="num">{rate}%</div>
          <div style={{fontSize:13,fontWeight:700,opacity:.9,marginTop:4}}>
            총 {QU.fmt(profile.answered)}문제 풀이 · {QU.fmt(profile.correct)}개 정답
          </div>
        </div>

        {weak && weak.pct<80 && (
          <div className="lvup" style={{background:"linear-gradient(120deg,#FF8FA3,#FB6A82)",color:"#fff",marginTop:14}}>
            <div className="ic">{weak.emoji}</div>
            <div>
              <div className="a">가장 약한 분야: {weak.name}</div>
              <div className="b" style={{opacity:.95}}>정답률 {weak.pct}% — 집중 연습이 필요해요!</div>
            </div>
          </div>
        )}

        <div className="sec-t">분야별 정답률</div>
        <div className="anal">
          {cats.map(c=>(
            <div className="abar" key={c.key}>
              <div className="ah">
                <span>{c.emoji} {c.name}
                  {c.pct<60 && <span className="weaktag">취약</span>}
                </span>
                <span className="pct" style={{color:c.color}}>{c.pct}%</span>
              </div>
              <div className="track"><i style={{width:c.pct+"%",background:c.color}}></i></div>
              <div style={{fontSize:11,color:"var(--ink2)",fontWeight:700,marginTop:4}}>{c.correct}/{c.seen} 정답 · 총 {c.total}문제</div>
            </div>
          ))}
        </div>
        <div style={{height:8}}></div>
      </div>
    </div>
  );
}

/* 오답노트 */
function WrongScreen({ profile, onStart }){
  const ids = profile.wrongIds||[];
  const list = ids.map(QU.byId).filter(Boolean);
  if(!list.length) return (
    <div className="scroll"><div className="appbar"><span className="at">📝 오답 노트</span></div>
      <div className="empty"><div className="e">🎉</div><div style={{marginTop:10}}>틀린 문제가 없어요!<br/>완벽해요 ✨</div></div>
    </div>
  );
  return (
    <div className="scroll fade">
      <div className="appbar"><span className="at">📝 오답 노트</span>
        <span style={{marginLeft:"auto",fontSize:13,fontWeight:800,color:"var(--ink2)"}}>{list.length}문제</span>
      </div>
      <div className="pad" style={{paddingTop:4}}>
        <button className="btn red block" style={{marginBottom:14}} onClick={()=>onStart("retry")}>
          <span className="em">🔁</span> 틀린 문제만 모아 재시험
        </button>
        {list.map(q=>{
          const ans = answerText(q);
          return (
            <div className="wrongitem" key={q.id}>
              <div className="wa" style={{marginTop:0,marginBottom:7}}>
                <span className="tag catt">{META.cats[q.cat].emoji} {META.cats[q.cat].name}</span>
              </div>
              <div className="wq" dangerouslySetInnerHTML={{__html:q.q}}></div>
              <div className="wa"><span className="tag real">정답: {ans}</span></div>
            </div>
          );
        })}
        <div style={{height:8}}></div>
      </div>
    </div>
  );
}

/* 프로필 */
function ProfileScreen({ profile, onReset }){
  const li = QU.levelInfo(profile.xp);
  const rk = QU.rankFor(li.level);
  return (
    <div className="scroll fade">
      <RankHeader profile={profile} compact />
      <div className="pad">
        <div className="sec-t">🏅 직급 단계</div>
        <div className="anal">
          {QU.RANKS.map((r,i)=>{
            const on = li.level>=r.min;
            const cur = rk.min===r.min;
            return (
              <div key={i} className="row" style={{padding:"9px 0",opacity:on?1:.4,borderBottom:i<QU.RANKS.length-1?"1px solid var(--line)":"none"}}>
                <div style={{fontSize:24,width:34,textAlign:"center"}}>{r.ic}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:14.5}}>{r.name}{cur&&<span className="weaktag" style={{background:"var(--purple)"}}>현재</span>}</div>
                  <div style={{fontSize:12,color:"var(--ink2)",fontWeight:700}}>Lv.{r.min} 이상</div>
                </div>
                {on && <div style={{color:"var(--green)",fontWeight:900,fontSize:18}}>✓</div>}
              </div>
            );
          })}
        </div>

        <div className="sec-t">📈 통계</div>
        <div className="mini-stats" style={{marginTop:0}}>
          <div className="mini"><div className="v">Lv.{li.level}</div><div className="l">레벨</div></div>
          <div className="mini"><div className="v">{QU.fmt(profile.xp)}</div><div className="l">총 XP</div></div>
          <div className="mini"><div className="v">{QU.fmt(profile.answered)}</div><div className="l">총 풀이</div></div>
        </div>

        <button className="btn ghost block" style={{marginTop:22,color:"var(--red-d)"}}
          onClick={()=>{ if(confirm("모든 기록(레벨·경험치·오답)을 초기화할까요?")) onReset(); }}>
          기록 초기화
        </button>
        <div style={{height:8}}></div>
      </div>
    </div>
  );
}

/* 정답 텍스트 만들기 (오답노트/피드백 공용) */
function answerText(q){
  if(q.type==="mc")    return q.o[q.a];
  if(q.type==="calc")  return q.o[q.a] + " → " + QU.fmt(QU.calcFinal(q)) + "원";
  return QU.fmt(q.a) + "원";
}

Object.assign(window, { RankHeader, HomeScreen, AnalysisScreen, WrongScreen, ProfileScreen, answerText });
