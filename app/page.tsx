'use client';

import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

// --- 분류 체계 ---
const frameworks = {
  save_the_cat: {
    label: "🐱 Save the Cat",
    subTypes: [
      { val: "monster_in_the_house", label: "🏠 집안의 괴물" },
      { val: "golden_fleece", label: "🏆 황금 양털" },
      { val: "buddy_love", label: "❤️ 버디 러브" },
      { val: "whydunit", label: "🕵️ 와이던잇" },
      { val: "dude_with_a_problem", label: "😱 곤경에 처한 녀석" },
      { val: "rites_of_passage", label: "🚶 통과의례" },
      { val: "fool_triumphant", label: "🤡 바보의 승리" },
      { val: "institutionalized", label: "🏥 제도화된 집단" },
      { val: "superhero", label: "🦸 슈퍼히어로" },
      { val: "out_of_the_bottle", label: "🧞 요술 램프" }
    ]
  },
  the_story: {
    label: "📖 The Story (맥키)",
    subTypes: [
      { val: "archplot", label: "📈 아크플롯 (전형적)" },
      { val: "miniplot", label: "📉 미니플롯 (내면적)" },
      { val: "antiplot", label: "🌀 안티플롯 (실험적)" }
    ]
  },
  workbook: {
    label: "📝 시나리오 워크북",
    subTypes: [
      { val: "plot_driven", label: "🎬 사건(Plot) 중심" },
      { val: "character_driven", label: "👤 인물(Character) 중심" },
      { val: "environment_driven", label: "🌍 배경/환경 중심" }
    ]
  },
  pixar: {
    label: "💡 Pixar 스토리텔링",
    subTypes: [
      { val: "coming_of_age", label: "🌱 성장과 자아 발견" },
      { val: "unlikely_bond", label: "🤝 뜻밖의 우정과 연대" },
      { val: "loss_acceptance", label: "🍂 상실과 수용" }
    ]
  }
};

const themes = {
  professional: {
    bg: '#000000', text: '#f5f5f7', primary: '#2997ff', accent: '#bf5af2',
    cardBg: '#1c1c1e', radius: '12px', border: '1px solid #333'
  }
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const t = themes.professional;

  // 탭 상태
  const [activeTab, setActiveTab] = useState('analyze');
  const [viewMode, setViewMode] = useState('input'); // input | report

  // 분석 데이터
  const [script, setScript] = useState('');
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 리포트 내부 탭
  const [reportTab, setReportTab] = useState('character');

  // 이미지 생성 상태
  const [imgLoading, setImgLoading] = useState(false);
  const [charImgUrl, setCharImgUrl] = useState(null);
  const [storyImgUrl, setStoryImgUrl] = useState(null);

  // 옵션 상태
  const [framework, setFramework] = useState('save_the_cat');
  const [subType, setSubType] = useState('monster_in_the_house');

  // 마켓/커뮤니티 상태
  const [marketItems, setMarketItems] = useState([]);
  const [marketForm, setMarketForm] = useState({ title: '', logline: '', synopsis: '', contactLink: '' });
  const [showMarketForm, setShowMarketForm] = useState(false);
  const [posts, setPosts] = useState([]);
  const [commForm, setCommForm] = useState({ title: '', content: '', password: '' });
  const [showCommForm, setShowCommForm] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (activeTab === 'market') fetchMarketItems();
    if (activeTab === 'community') fetchPosts();
  }, [activeTab]);
  useEffect(() => {
    setSubType(frameworks[framework].subTypes[0].val);
  }, [framework]);

  // --- Firebase Functions ---
  const fetchMarketItems = async () => {
    try {
      const q = query(collection(db, "market"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setMarketItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error(e); }
  };
  const handleSaveMarket = async () => {
    if (!marketForm.title) return alert("제목 필수");
    await addDoc(collection(db, "market"), { ...marketForm, createdAt: serverTimestamp() });
    alert("등록 완료"); setShowMarketForm(false); fetchMarketItems();
  };
  const fetchPosts = async () => {
    try {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error(e); }
  };
  const handleSavePost = async () => {
    if (!commForm.title || !commForm.content || !commForm.password) return alert("전부 입력하세요");
    await addDoc(collection(db, "posts"), { ...commForm, createdAt: serverTimestamp() });
    alert("등록 완료"); setCommForm({title:'',content:'',password:''}); setShowCommForm(false); fetchPosts();
  };
  const handleDeletePost = async (id, pw) => {
    const input = prompt("비밀번호:");
    if (input === pw) { await deleteDoc(doc(db, "posts", id)); alert("삭제됨"); fetchPosts(); }
    else { alert("비밀번호 불일치"); }
  };

  // --- AI 분석 ---
  const handleAnalyze = async () => {
    if (!script) return alert("시나리오를 입력해주세요!");
    setLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptContent: script, framework, subType }),
      });
      const data = await response.json();
      if (response.ok) {
        setResultData(data.result);
        setViewMode('report');
        setReportTab('character');
        setCharImgUrl(null);
        setStoryImgUrl(null);
      } else {
        alert("오류: " + data.error);
      }
    } catch (error) { alert("서버 오류"); }
    finally { setLoading(false); }
  };

  // --- 🎨 이미지 생성 (서버 경유) ---
  const generateImage = async (prompt, type) => {
    setImgLoading(true);

    // ★ 스타일 강제 주입
    let finalPrompt = "";
    if (type === 'character') {
      finalPrompt = `(character sheet:1.4), (full body:1.3), front view, side view, concept art, detailed face, white background, high quality, 4k, ${prompt}`;
    } else {
      finalPrompt = `(storyboard sketch:1.5), rough pencil drawing, black and white, cinematic composition, wide angle, loose lines, masterpiece, ${prompt}`;
    }

    try {
      // ★ 변경된 부분: 내 서버(/api/image)로 요청을 보냄 (토큰 필요 없음)
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt }),
      });

      if (!response.ok) throw new Error("이미지 생성 실패");
      
      const blob = await response.blob();
      const imgUrl = URL.createObjectURL(blob);
      
      if (type === 'character') setCharImgUrl(imgUrl);
      else setStoryImgUrl(imgUrl);

    } catch (error) {
      console.error(error);
      alert("이미지 생성 실패 (잠시 후 다시 시도하세요)");
    } finally {
      setImgLoading(false);
    }
  };

  const preventCapture = (e) => e.preventDefault();

  // --- 리포트 화면 ---
  const renderReportDashboard = () => {
    if (!resultData) return null;
    // 안전장치
    const charData = resultData?.slide1_character || {};
    const structData = resultData?.slide2_structure || {};
    const endingData = resultData?.slide3_ending || {};

    return (
      <div onContextMenu={preventCapture} style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#0a0a0a', zIndex: 9999, display: 'flex', color: '#eee'}}>
        
        {/* 사이드바 */}
        <div style={{width: '250px', borderRight: '1px solid #333', padding: '30px 20px', display: 'flex', flexDirection: 'column', background: '#111'}}>
          <h2 style={{fontSize: '1.2rem', color: t.primary, marginBottom: '40px', fontWeight: '900'}}>Scenario Report</h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <button onClick={()=>setReportTab('character')} style={{textAlign: 'left', padding: '15px', borderRadius: '10px', background: reportTab==='character'?'#333':'transparent', color: reportTab==='character'?'white':'#888', border:'none', cursor:'pointer', fontWeight:'bold'}}>👤 캐릭터 설계</button>
            <button onClick={()=>setReportTab('structure')} style={{textAlign: 'left', padding: '15px', borderRadius: '10px', background: reportTab==='structure'?'#333':'transparent', color: reportTab==='structure'?'white':'#888', border:'none', cursor:'pointer', fontWeight:'bold'}}>🏗️ 구조 정밀 분석</button>
            <button onClick={()=>setReportTab('ending')} style={{textAlign: 'left', padding: '15px', borderRadius: '10px', background: reportTab==='ending'?'#333':'transparent', color: reportTab==='ending'?'white':'#888', border:'none', cursor:'pointer', fontWeight:'bold'}}>🎬 엔딩 콘티</button>
          </div>
          <div style={{marginTop: 'auto'}}>
            <button onClick={()=>setViewMode('input')} style={{width: '100%', padding: '15px', background: '#222', color: '#aaa', border: '1px solid #444', borderRadius: '8px', cursor: 'pointer'}}>나가기 (Exit)</button>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div style={{flex: 1, overflowY: 'auto', padding: '50px', background: '#000'}}>
          
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'40px', paddingBottom:'20px', borderBottom:'1px solid #222'}}>
            <h1 style={{fontSize:'2rem', fontWeight:'bold', margin:0}}>{
              reportTab === 'character' ? "Character Design Sheet" :
              reportTab === 'structure' ? "Structure Analysis" : "Ending Storyboard"
            }</h1>
            <div style={{color: '#666', fontSize:'0.9rem'}}>Powered by HuggingFace SDXL</div>
          </div>

          {/* 1. 캐릭터 탭 */}
          {reportTab === 'character' && (
            <div style={{display: 'flex', gap: '40px'}}>
              <div style={{flex: 1, display:'flex', flexDirection:'column', gap:'20px'}}>
                <div style={{background: '#1c1c1e', padding: '25px', borderRadius: '12px', border: '1px solid #333'}}>
                  <h3 style={{color: t.primary, marginTop:0}}>한 줄 요약</h3>
                  <p style={{fontSize: '1.1rem', fontStyle: 'italic', color: '#ccc'}}>"{charData?.summary}"</p>
                </div>
                <div style={{background: '#1c1c1e', padding: '25px', borderRadius: '12px', border: '1px solid #333', flex:1}}>
                  <h3 style={{color: '#2ecc71', marginTop:0}}>장점 (Pros)</h3>
                  <ul>{charData?.pros?.map((p,i)=><li key={i}>{p}</li>)}</ul>
                  <h3 style={{color: '#ff453a', marginTop:'20px'}}>단점 (Cons)</h3>
                  <ul>{charData?.cons?.map((p,i)=><li key={i}>{p}</li>)}</ul>
                </div>
              </div>

              <div style={{flex: 1.2, background: '#111', borderRadius: '12px', border: `1px dashed #444`, padding: '30px', display:'flex', flexDirection:'column', alignItems:'center'}}>
                <h3 style={{marginBottom: '20px', color: '#aaa'}}>AI Character Sheet</h3>
                <div style={{width: '100%', height: '400px', background: '#000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #333', overflow: 'hidden'}}>
                  {imgLoading ? <span style={{color: t.primary}}>🎨 그리는 중...</span> : 
                   charImgUrl ? <img src={charImgUrl} style={{width:'100%', height:'100%', objectFit:'contain'}} alt="Character" /> :
                   <span style={{color:'#444'}}>이미지 없음</span>
                  }
                </div>
                <div style={{marginTop: '20px', textAlign: 'center', width: '100%'}}>
                  <p style={{fontSize: '0.9rem', color: '#666', marginBottom: '10px'}}>외모: {charData?.features}</p>
                  <button 
                    onClick={() => generateImage(charData?.features, 'character')}
                    style={{width: '100%', padding: '15px', background: t.primary, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: imgLoading?0.5:1}}
                    disabled={imgLoading}
                  >
                    ✨ 캐릭터 시트 생성 (Free)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. 구조 탭 */}
          {reportTab === 'structure' && (
             <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px'}}>
                <div style={{gridColumn: '1 / -1', display:'flex', gap:'30px', background:'#1c1c1e', padding:'30px', borderRadius:'12px', border:'1px solid #333'}}>
                   <div style={{textAlign:'center', flex:1}}><h1 style={{fontSize:'4rem', margin:0, color: t.primary}}>{structData?.completeness_score}</h1><p>구조 완성도</p></div>
                   <div style={{textAlign:'center', flex:1, borderLeft:'1px solid #444'}}><h1 style={{fontSize:'4rem', margin:0, color: '#ffd60a'}}>{structData?.marketability_score}</h1><p>상업성 점수</p></div>
                </div>
                <div style={{background: '#1c1c1e', padding: '25px', borderRadius: '12px', border: '1px solid #333'}}>
                  <strong style={{color: '#ff453a', fontSize:'1.2rem'}}>📖 로버트 맥키</strong>
                  <p style={{marginTop:'10px', lineHeight:'1.6'}}>"{structData?.advice_panel?.robert_mckee}"</p>
                </div>
                <div style={{background: '#1c1c1e', padding: '25px', borderRadius: '12px', border: '1px solid #333'}}>
                  <strong style={{color: '#30d158', fontSize:'1.2rem'}}>🐱 블레이크 스나이더</strong>
                  <p style={{marginTop:'10px', lineHeight:'1.6'}}>"{structData?.advice_panel?.blake_snyder}"</p>
                </div>
             </div>
          )}

          {/* 3. 엔딩 탭 */}
          {reportTab === 'ending' && (
            <div>
              <div style={{display: 'flex', gap: '30px', marginBottom: '40px'}}>
                <div style={{flex: 1, padding: '30px', background: '#1c1c1e', borderRadius: '12px', borderLeft: `5px solid ${t.primary}`}}>
                  <h3 style={{color: t.primary}}>🏆 칸 영화제 결말</h3>
                  <p style={{fontSize:'1.1rem', lineHeight:'1.6'}}>{endingData?.cannes_direction}</p>
                </div>
                <div style={{flex: 1, padding: '30px', background: '#1c1c1e', borderRadius: '12px', borderLeft: `5px solid #ff453a`}}>
                  <h3 style={{color: '#ff453a'}}>🍿 천만 관객 결말</h3>
                  <p style={{fontSize:'1.1rem', lineHeight:'1.6'}}>{endingData?.boxoffice_direction}</p>
                </div>
              </div>

              <h2 style={{borderTop: '1px solid #333', paddingTop: '30px'}}>🎞️ Storyboard Visualization</h2>
              <div style={{background: '#111', padding: '30px', borderRadius: '12px', marginTop: '20px', border: '1px dashed #444'}}>
                 <div style={{display:'flex', gap:'20px'}}>
                   <div style={{flex: 1}}>
                      <h4 style={{margin:'0 0 10px 0'}}>Scene #1</h4>
                      <p style={{color:'#ccc'}}>"{endingData?.storyboard_prompts?.[0]}"</p>
                      <button 
                        onClick={() => generateImage(endingData?.storyboard_prompts?.[0], 'storyboard')}
                        style={{marginTop:'20px', padding: '10px 20px', background: '#fff', color: 'black', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', opacity: imgLoading?0.5:1}}
                        disabled={imgLoading}
                      >
                        🎥 콘티 그리기 (Sketch Style)
                      </button>
                   </div>
                   <div style={{flex: 1.5, height: '300px', background: '#000', borderRadius: '8px', border: '1px solid #333', display:'flex', alignItems:'center', justifyContent:'center'}}>
                      {imgLoading ? <span style={{color: t.primary}}>스케치 중...</span> : 
                       storyImgUrl ? <img src={storyImgUrl} style={{width:'100%', height:'100%', objectFit:'cover', filter: 'grayscale(100%)'}} alt="Storyboard" /> :
                       <span style={{color:'#444'}}>콘티 이미지가 없습니다.</span>
                      }
                   </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <div style={{backgroundColor: t.bg, color: t.text, minHeight: '100vh', fontFamily: '-apple-system, sans-serif'}}>
      {viewMode === 'report' && renderReportDashboard()}
      {/* 기존 메인 화면 코드... (생략 없이 이전과 동일) */}
      <div style={{padding: '40px 20px', textAlign: 'center', borderBottom: '1px solid #333', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50}}>
        <h1 style={{fontSize: '3rem', fontWeight: '900', background: `linear-gradient(to right, ${t.primary}, ${t.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0}}>Scenario OS Pro</h1>
        <p style={{color: '#888', marginTop: '10px'}}>AI 기반 시나리오 통합 플랫폼</p>
      </div>

      <div style={{maxWidth: '1000px', margin: '40px auto', padding: '0 20px'}}>
        <div style={{display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '40px'}}>
          <button onClick={() => setActiveTab('analyze')} style={{padding: '12px 25px', borderRadius: '25px', border: 'none', background: activeTab==='analyze'?t.primary:'#222', color: 'white', fontWeight: 'bold', cursor: 'pointer'}}>🤖 AI 분석</button>
          <button onClick={() => setActiveTab('market')} style={{padding: '12px 25px', borderRadius: '25px', border: 'none', background: activeTab==='market'?t.primary:'#222', color: 'white', fontWeight: 'bold', cursor: 'pointer'}}>🏪 마켓</button>
          <button onClick={() => setActiveTab('community')} style={{padding: '12px 25px', borderRadius: '25px', border: 'none', background: activeTab==='community'?t.primary:'#222', color: 'white', fontWeight: 'bold', cursor: 'pointer'}}>🗣️ 수다방</button>
        </div>

        {activeTab === 'analyze' && (
          <div style={{background: t.cardBg, padding: '40px', borderRadius: t.radius, border: t.border}}>
            <div style={{display: 'flex', gap: '15px', marginBottom: '20px'}}>
              <div style={{flex: 1}}>
                <label style={{display:'block', marginBottom:'8px', color:'#888', fontSize:'0.9rem'}}>분석 이론</label>
                <select style={{width: '100%', padding: '15px', borderRadius: '12px', background: '#1c1c1e', color: 'white', border: '1px solid #333'}} value={framework} onChange={(e)=>setFramework(e.target.value)}>
                  {Object.entries(frameworks).map(([key, val]) => (<option key={key} value={key}>{val.label}</option>))}
                </select>
              </div>
              <div style={{flex: 1}}>
                <label style={{display:'block', marginBottom:'8px', color:'#888', fontSize:'0.9rem'}}>세부 장르</label>
                <select style={{width: '100%', padding: '15px', borderRadius: '12px', background: '#1c1c1e', color: 'white', border: '1px solid #333'}} value={subType} onChange={(e)=>setSubType(e.target.value)}>
                  {frameworks[framework].subTypes.map((type) => (<option key={type.val} value={type.val}>{type.label}</option>))}
                </select>
              </div>
            </div>
            <textarea 
              style={{width: '100%', height: '300px', padding: '20px', borderRadius: '12px', border: '1px solid #333', background: '#111', color: 'white', fontSize: '1.1rem', lineHeight: '1.6', outline: 'none'}}
              placeholder="시나리오를 입력하세요..."
              value={script}
              onChange={(e) => setScript(e.target.value)}
            />
            <button 
              onClick={handleAnalyze} 
              disabled={loading}
              style={{width: '100%', marginTop: '30px', padding: '20px', background: loading ? '#333' : t.primary, color: 'white', border: 'none', borderRadius: '16px', fontSize: '1.3rem', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer'}}
            >
              {loading ? "분석 중... 🧠" : "🚀 리포트 생성 (Start)"}
            </button>
          </div>
        )}
        
        {/* 마켓 탭 */}
        {activeTab === 'market' && (
           <div style={{animation: 'fadeIn 0.5s'}}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
               <h2 style={{margin: 0}}>Scenario Market</h2>
               <button onClick={() => setShowMarketForm(!showMarketForm)} style={{padding: '12px 25px', background: '#30d158', border: 'none', borderRadius: '20px', color: 'white', fontWeight: 'bold', cursor: 'pointer'}}>+ 내 작품 등록</button>
             </div>
             {showMarketForm && (
               <div style={{background: '#1c1c1e', padding: '30px', borderRadius: '16px', marginBottom: '30px', border: '1px solid #333'}}>
                 <input style={{width: '100%', padding: '15px', marginBottom: '15px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '10px'}} placeholder="제목" value={marketForm.title} onChange={e=>setMarketForm({...marketForm, title: e.target.value})} />
                 <textarea style={{width: '100%', height: '100px', padding: '15px', marginBottom: '15px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '10px'}} placeholder="로그라인" value={marketForm.logline} onChange={e=>setMarketForm({...marketForm, logline: e.target.value})} />
                 <input style={{width: '100%', padding: '15px', marginBottom: '15px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '10px'}} placeholder="연락처" value={marketForm.contactLink} onChange={e=>setMarketForm({...marketForm, contactLink: e.target.value})} />
                 <button onClick={handleSaveMarket} style={{width: '100%', padding: '15px', background: '#30d158', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer'}}>등록하기</button>
               </div>
             )}
             <div style={{display: 'grid', gap: '20px'}}>
               {marketItems.map(item => (
                 <div key={item.id} style={{background: 'rgba(28,28,30,0.6)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)'}}>
                   <h2 style={{margin: '10px 0', fontSize: '1.5rem'}}>{item.title}</h2>
                   <p style={{color: '#aaa', fontSize: '1.1rem'}}>"{item.logline}"</p>
                   <a href={`mailto:${item.contactLink}`} style={{display: 'inline-block', marginTop: '15px', padding: '10px 20px', background: '#0a84ff', color: 'white', textDecoration: 'none', borderRadius: '20px', fontWeight: 'bold'}}>Contact</a>
                 </div>
               ))}
             </div>
           </div>
        )}

        {/* 커뮤니티 탭 */}
        {activeTab === 'community' && (
           <div style={{animation: 'fadeIn 0.5s'}}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
               <h2 style={{margin: 0}}>Writers' Lounge</h2>
               <button onClick={() => setShowCommForm(!showCommForm)} style={{padding: '12px 25px', background: t.accent, border: 'none', borderRadius: '20px', color: 'white', fontWeight: 'bold', cursor: 'pointer'}}>+ 글쓰기</button>
             </div>
             {showCommForm && (
               <div style={{background: '#1c1c1e', padding: '30px', borderRadius: '16px', marginBottom: '30px', border: '1px solid #333'}}>
                 <input style={{width: '100%', padding: '15px', marginBottom: '15px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '10px'}} placeholder="제목" value={commForm.title} onChange={e=>setCommForm({...commForm, title: e.target.value})} />
                 <textarea style={{width: '100%', height: '100px', padding: '15px', marginBottom: '15px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '10px'}} placeholder="내용" value={commForm.content} onChange={e=>setCommForm({...commForm, content: e.target.value})} />
                 <input type="password" style={{width: '100%', padding: '15px', marginBottom: '15px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '10px'}} placeholder="비밀번호" value={commForm.password} onChange={e=>setCommForm({...commForm, password: e.target.value})} />
                 <button onClick={handleSavePost} style={{width: '100%', padding: '15px', background: t.accent, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer'}}>등록하기</button>
               </div>
             )}
             <div style={{display: 'grid', gap: '15px'}}>
               {posts.map(post => (
                 <div key={post.id} style={{background: '#1c1c1e', padding: '20px', borderRadius: '12px', border: '1px solid #333', position: 'relative'}}>
                   <button onClick={() => handleDeletePost(post.id, post.password)} style={{position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: '1px solid #444', color: '#888', borderRadius: '5px', cursor: 'pointer', padding: '5px 10px'}}>🗑️ 삭제</button>
                   <h4 style={{margin: '0 0 10px 0', fontSize:'1.1rem'}}>{post.title}</h4>
                   <p style={{margin: '0', color: '#ccc', fontSize:'0.95rem'}}>{post.content}</p>
                 </div>
               ))}
             </div>
           </div>
        )}

      </div>
    </div>
  );
}