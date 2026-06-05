/* ===== 루트 앱 ===== */
const { useState, useEffect } = React;
const QU = window.QU;

function App(){
  const [profile,setProfile] = useState(()=>QU.load());
  const [view,setView] = useState("home");       // home|analysis|wrong|profile|quiz|result
  const [mode,setMode] = useState("all");
  const [session,setSession] = useState(null);
  const [lvUp,setLvUp] = useState({on:false,level:1,rank:null});

  function start(m){ setMode(m); setSession(null); setView("quiz"); }

  function finish(sess){
    const p = QU.load();
    const before = QU.levelInfo(p.xp).level;
    QU.commit(p, sess);
    const after = QU.levelInfo(p.xp).level;
    setProfile({...p});
    setSession(sess);
    const lv = after>before;
    setLvUp({ on: lv, level:after, rank:QU.rankFor(after) });
    setTimeout(()=>{ if(lv) QU.sound.level(); },300);
    setView("result");
    document.querySelector(".app .scroll")?.scrollTo?.(0,0);
  }

  function reset(){ QU.reset(); setProfile(QU.blank()); setView("home"); }

  const tabs = [
    {k:"home",ic:"🏠",l:"시작"},
    {k:"analysis",ic:"📊",l:"분석"},
    {k:"wrong",ic:"📝",l:"오답"},
    {k:"profile",ic:"🧑",l:"프로필"},
  ];
  const showTabs = ["home","analysis","wrong","profile"].includes(view);

  return (
    <div className="app">
      {view==="quiz" && (
        <QuizRunner mode={mode} profile={profile}
          onFinish={finish} onQuit={()=>setView("home")} />
      )}

      {view!=="quiz" && (<>
        {view==="home" && <><RankHeader profile={profile}/><HomeScreen profile={profile} onStart={start}/></>}
        {view==="analysis" && <AnalysisScreen profile={profile}/>}
        {view==="wrong" && <WrongScreen profile={profile} onStart={start}/>}
        {view==="profile" && <ProfileScreen profile={profile} onReset={reset}/>}
        {view==="result" && session &&
          <ResultScreen session={session} profile={profile} leveledUp={lvUp.on} newLevel={lvUp.level} newRank={lvUp.rank}
            onAgain={()=>start(mode)}
            onRetryWrong={()=>start("retry")}
            onHome={()=>setView("home")} />}

        {showTabs && (
          <div className="tabbar">
            {tabs.map(t=>(
              <button key={t.k} className={"tab"+(view===t.k?" on":"")} onClick={()=>setView(t.k)}>
                <span className="ti">{t.ic}</span>{t.l}
              </button>
            ))}
          </div>
        )}
      </>)}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
