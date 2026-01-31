'use client';

import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

// --- 데이터 및 테마 설정 ---
const frameworks = {
  save_the_cat: {
    label: "🐱 Save the Cat",
    subTypes: [
      { val: "monster_in_the_house", label: "🏠 집안의 괴물" },
      { val: "golden_fleece", label: "🏆 황금 양털" },
      { val: "out_of_the_bottle", label: "🧞 요술 램프" },
      { val: "dude_with_a_problem", label: "😱 곤경에 처한 녀석" },
      { val: "rites_of_passage", label: "🚶 통과의례" },
      { val: "buddy_love", label: "❤️ 버디 러브" },
      { val: "whydunit", label: "🕵️ 와이던잇" },
      { val: "fool_triumphant", label: "🤡 바보의 승리" },
      { val: "institutionalized", label: "🏥 제도화된 집단" },
      { val: "superhero", label: "🦸 슈퍼히어로" }
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
    cardBg: 'rgba(28, 28, 30, 0.95)', radius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)'
  }
};

// --- 광고 슬롯 컴포넌트 (애드센스 자리) ---
const AdSlot = () => (
  <div style={{width: '100%', height: '100px', background: '#111', margin: '20px 0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #333', color: '#444', fontSize: '0.8rem'}}>
    📣 Google AdSense Area (자동 광고 영역)
  </div>
);

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const t = themes.professional; 

  // 탭 상태: analyze(분석) | market(마켓) | community(수다방)
  const [activeTab, setActiveTab] = useState('analyze');
  const [viewMode, setViewMode] = useState('input'); // input | report

  // [1] 분석 관련 상태
  const [script, setScript] = useState('');
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [framework, setFramework] = useState('save_the_cat');
  const [subType, setSubType] = useState('monster_in_the_house');

  // [2] 마켓 관련 상태
  const [marketItems, setMarketItems] = useState([]);
  const [marketForm, setMarketForm] = useState({ title: '', logline: '', synopsis: '', contactLink: '' });
  const [showMarketForm, setShowMarketForm] = useState(false);

  // [3] 커뮤니티 관련 상태
  const [posts, setPosts] = useState([]);
  const [commForm, setCommForm] = useState({ title: '', content: '', password: '' });
  const [showCommForm, setShowCommForm] = useState(false);

  // 초기 로드
  useEffect(() => {
    setMounted(true);
  }, []);

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'market') fetchMarketItems();
    if (activeTab === 'community') fetchPosts();
  }, [activeTab]);

  // 프레임워크 변경 시 중분류 리셋
  useEffect(() => {
    setSubType(frameworks[framework].subTypes[0].val);
  }, [framework]);

  // --- Firebase Fetch 함수들 ---
  const fetchMarketItems = async () => {
    try {
      const q = query(collection(db, "market"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setMarketItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error(e); }
  };

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error(e); }
  };

  // --- Firebase Save 함수들 ---
  const handleSaveMarket = async () => {
    if (!marketForm.title) return alert("제목은 필수입니다.");
    try {
      await addDoc(collection(db, "market"), { ...marketForm, createdAt: serverTimestamp() });
      alert("등록 완료!");
      setMarketForm({ title: '', logline: '', synopsis: '', contactLink: '' });
      setShowMarketForm(false); fetchMarketItems();
    } catch (e) { alert("오류 발생"); }
  };

  const handleSavePost = async () => {
    if (!commForm.title || !commForm.content) return alert("제목과 내용은 필수입니다.");
    try {
      await addDoc(collection(db, "posts"), { ...commForm, createdAt: serverTimestamp() });
      alert("글 등록 완료!");
      setCommForm({ title: '', content: '', password: '' });
      setShowCommForm(false); fetchPosts();
    } catch (e) { alert("오류 발생"); }
  };

  // --- AI 분석 요청 ---
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
        setSlideIndex(0);
      } else {
        alert("분석 오류: " + (data.error || "알 수 없는 오류"));
      }
    } catch (error) { alert("서버 연결 실패"); }
    finally { setLoading(false); }
  };

  const preventCapture = (e) => { e.preventDefault(); };

  // --- 리포트 화면 렌더링 (이전 기능 완벽 보존) ---
  const renderReport = () => {
    if (!resultData) return null;
    // 안전장치
    const charData = resultData?.slide1_character || {};
    const structData = resultData?.slide2_structure || {};
    const endingData = resultData?.slide3_ending || {};
    const advicePanel = structData?.advice_panel || {};
    const storyPrompts = endingData?.storyboard_prompts || [];

    const slides = [
      // 1. 캐릭터
      <div key="s1" className="slide-content">
        <h2 style={{color: t.primary}}>👤 PAGE 1. 캐릭터 & 비주얼</h2>
        <p style={{fontSize: '1.2rem', color: '#ccc', fontStyle: 'italic'}}>"{charData?.summary}"</p>
        <div style={{display: 'flex', gap: '30px', margin: '30px 0', alignItems: 'flex-start'}}>
          <div style={{flex: 1}}>
            <div style={{width: '100%', height: '300px', background: '#222', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${t.primary}`, position: 'relative'}}>
              {charData?.features && (
                <img 
                  src={`https://image.pollinations.ai/prompt/cinematic portrait of ${encodeURIComponent(charData.features)}?width=500&height=500&nologo=true`}
                  alt="AI Character" style={{width: '100%', height: '100%', objectFit: 'cover'}}
                  onError={(e)=>{e.target.style.display='none';}}
                />
              )}
            </div>
            <p style={{fontSize: '0.85rem', color: '#888', marginTop: '10px'}}>💡 외모 묘사: {charData?.features}</p>
          </div>
          <div style={{flex: 1.2, background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '16px'}}>
            <div style={{marginBottom: '25px'}}>
               <span style={{color: t.primary, fontWeight:'bold'}}>💪 강점 파워 ({charData?.strength_score}/100)</span>
               <div style={{width: '100%', background: '#333', height: '10px', borderRadius: '5px', marginTop:'5px'}}><div style={{width: `${charData?.strength_score}%`, background: t.primary, height: '100%', borderRadius: '5px'}}></div></div>
            </div>
            <h4 style={{color: '#2ecc71', margin: '0 0 5px 0'}}>✅ 장점</h4>
            <ul style={{fontSize: '0.9rem', color: '#ddd', marginBottom:'20px'}}>{charData?.pros?.map((p,i)=><li key={i}>{p}</li>)}</ul>
            <h4 style={{color: '#ff453a', margin: '0 0 5px 0'}}>❌ 단점</h4>
            <ul style={{fontSize: '0.9rem', color: '#ddd'}}>{charData?.cons?.map((p,i)=><li key={i}>{p}</li>)}</ul>
          </div>
        </div>
      </div>,
      // 2. 구조
      <div key="s2" className="slide-content">
        <h2 style={{color: t.primary}}>🏗️ PAGE 2. 구조적 완성도 & 전문가 패널</h2>
        <div style={{display: 'flex', justifyContent: 'space-around', margin: '30px 0', padding:'30px', background:'rgba(255,255,255,0.03)', borderRadius:'16px'}}>
           <div style={{textAlign: 'center'}}><div style={{fontSize: '3rem', fontWeight: '900', color: t.primary}}>{structData?.completeness_score}</div><div style={{color:'#888'}}>구조 완성도</div></div>
           <div style={{textAlign: 'center', borderLeft:'1px solid #444', paddingLeft:'50px'}}><div style={{fontSize: '3rem', fontWeight: '900', color: '#ffd60a'}}>{structData?.marketability_score}</div><div style={{color:'#888'}}>상업성 지수</div></div>
        </div>
        <h3 style={{borderBottom: '1px solid #333', paddingBottom: '15px', color:'#eee'}}>🎙️ 4대 천왕의 조언</h3>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
          {[
             {name: '로버트 맥키', color: '#ff453a', text: advicePanel?.robert_mckee},
             {name: '블레이크 스나이더', color: '#30d158', text: advicePanel?.blake_snyder},
             {name: '시드 필드', color: '#0a84ff', text: advicePanel?.syd_field},
             {name: '픽사', color: '#ffd60a', text: advicePanel?.pixar_creator},
          ].map((advisor, i) => (
             <div key={i} style={{background: '#1c1c1e', padding: '15px', borderRadius: '10px', border: '1px solid #333'}}>
                <strong style={{color: advisor.color}}>{advisor.name}</strong>
                <p style={{fontSize: '0.9rem', color: '#ccc', marginTop: '5px', fontStyle:'italic'}}>"{advisor.text}"</p>
             </div>
          ))}
        </div>
      </div>,
      // 3. 엔딩
      <div key="s3" className="slide-content">
        <h2 style={{color: t.primary}}>🎬 PAGE 3. 엔딩 시뮬레이션 & 콘티</h2>
        <div style={{display: 'flex', gap: '20px', marginBottom: '30px'}}>
           <div style={{flex: 1, padding: '20px', background: '#222', borderRadius: '12px', borderLeft: `4px solid ${t.accent}`}}><strong style={{color: t.accent}}>🏆 예술적 엔딩</strong><p style={{fontSize:'0.9rem', color:'#ddd'}}>{endingData?.cannes_direction}</p></div>
           <div style={{flex: 1, padding: '20px', background: '#222', borderRadius: '12px', borderLeft: `4px solid #ff453a`}}><strong style={{color: '#ff453a'}}>🍿 상업적 엔딩</strong><p style={{fontSize:'0.9rem', color:'#ddd'}}>{endingData?.boxoffice_direction}</p></div>
        </div>
        <h3 style={{color:'#eee'}}>🎞️ 콘티 프리뷰</h3>
        <div style={{display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px'}}>
          <div style={{minWidth: '220px', height: '150px', background: '#222', borderRadius: '12px', position: 'relative', overflow:'hidden', border: `1px solid ${t.primary}`}}>
             <span style={{position:'absolute', top:'10px', left:'10px', fontSize: '0.7rem', color: 'white', background: t.primary, padding: '3px 8px', borderRadius: '10px', zIndex:2}}>FREE</span>
             {storyPrompts[0] && <img src={`https://image.pollinations.ai/prompt/storyboard sketch of ${encodeURIComponent(storyPrompts[0])}?width=400&height=300&nologo=true`} alt="SB1" style={{width:'100%', height:'100%', objectFit:'cover', opacity:0.8}} />}
          </div>
          {[1,2,3,4].map(i => (
            <div key={i} onClick={()=>alert("프리미엄 기능입니다.")} style={{minWidth: '220px', height: '150px', background: '#111', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px dashed #444', flexDirection:'column'}}>
                <div style={{fontSize: '2rem'}}>🔒</div><div style={{fontSize: '0.8rem', color: '#666'}}>Premium Scene</div>
            </div>
          ))}
        </div>
      </div>
    ];

    return (
      <div onContextMenu={preventCapture} style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'black', zIndex: 9999, padding: '40px', overflowY: 'auto', userSelect: 'none'}}>
        <div style={{maxWidth: '1000px', margin: '0 auto'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
            <button onClick={() => setViewMode('input')} style={{background: 'none', border: 'none', color: '#888', cursor: 'pointer'}}>✖ 닫기</button>
            <h1 style={{fontSize: '1.5rem', color: 'white'}}>Diagnosis Report</h1>
            <button onClick={() => alert('유료 서비스')} style={{background: t.primary, border: 'none', color: 'white', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer'}}>📩 PDF 저장</button>
          </div>
          <div style={{background: t.cardBg, padding: '50px', borderRadius: '24px', border: t.border, minHeight: '600px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}}>{slides[slideIndex]}</div>
          <div style={{display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '30px'}}>
            <button disabled={slideIndex===0} onClick={()=>setSlideIndex(p=>p-1)} style={{padding: '10px 30px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '30px', color: 'white', opacity: slideIndex===0?0.3:1}}>◀ Prev</button>
            <button disabled={slideIndex===2} onClick={()=>setSlideIndex(p=>p+1)} style={{padding: '10px 30px', background: t.primary, border: 'none', borderRadius: '30px', color: 'white', opacity: slideIndex===2?0.3:1}}>Next ▶</button>
          </div>
        </div>
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <div style={{backgroundColor: t.bg, color: t.text, minHeight: '100vh', fontFamily: '-apple-system, sans-serif'}}>
      {viewMode === 'report' && renderReport()}

      <div style={{padding: '40px 20px', textAlign: 'center', borderBottom: '1px solid #333', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50}}>
        <h1 style={{fontSize: '3rem', fontWeight: '900', background: `linear-gradient(to right, ${t.primary}, ${t.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0}}>Scenario OS Pro</h1>
        <p style={{color: '#888', marginTop: '10px'}}>AI 기반 시나리오 통합 플랫폼</p>
      </div>

      <div style={{maxWidth: '1000px', margin: '40px auto', padding: '0 20px'}}>
        
        {/* 메인 탭 네비게이션 */}
        <div style={{display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '40px'}}>
          <button onClick={() => setActiveTab('analyze')} style={{padding: '12px 25px', borderRadius: '25px', border: 'none', background: activeTab==='analyze'?t.primary:'#222', color: 'white', fontWeight: 'bold', cursor: 'pointer', transition:'all 0.3s'}}>🤖 AI 분석</button>
          <button onClick={() => setActiveTab('market')} style={{padding: '12px 25px', borderRadius: '25px', border: 'none', background: activeTab==='market'?t.primary:'#222', color: 'white', fontWeight: 'bold', cursor: 'pointer', transition:'all 0.3s'}}>🏪 마켓</button>
          <button onClick={() => setActiveTab('community')} style={{padding: '12px 25px', borderRadius: '25px', border: 'none', background: activeTab==='community'?t.primary:'#222', color: 'white', fontWeight: 'bold', cursor: 'pointer', transition:'all 0.3s'}}>🗣️ 수다방</button>
        </div>

        {/* --- 1. AI 분석 탭 --- */}
        {activeTab === 'analyze' && (
          <div style={{animation: 'fadeIn 0.5s'}}>
            <div style={{background: t.cardBg, padding: '40px', borderRadius: t.radius, border: t.border, boxShadow: '0 10px 40px rgba(0,0,0,0.5)'}}>
              <h3 style={{marginTop: 0, marginBottom: '20px'}}>⚙️ 프로젝트 설정</h3>
              <div style={{display: 'flex', gap: '15px', marginBottom: '20px'}}>
                <div style={{flex: 1}}>
                  <label style={{display:'block', marginBottom:'8px', color:'#888', fontSize:'0.9rem'}}>분석 이론</label>
                  <select style={{width: '100%', padding: '15px', borderRadius: '12px', background: '#1c1c1e', color: 'white', border: '1px solid #333'}} value={framework} onChange={(e)=>setFramework(e.target.value)}>
                    {Object.entries(frameworks).map(([key, val]) => (<option key={key} value={key}>{val.label}</option>))}
                  </select>
                </div>
                <div style={{flex: 1}}>
                  <label style={{display:'block', marginBottom:'8px', color:'#888', fontSize:'0.9rem'}}>세부 장르/유형</label>
                  <select style={{width: '100%', padding: '15px', borderRadius: '12px', background: '#1c1c1e', color: 'white', border: '1px solid #333'}} value={subType} onChange={(e)=>setSubType(e.target.value)}>
                    {frameworks[framework].subTypes.map((type) => (<option key={type.val} value={type.val}>{type.label}</option>))}
                  </select>
                </div>
              </div>
              <textarea 
                style={{width: '100%', height: '300px', padding: '20px', borderRadius: '12px', border: '1px solid #333', background: '#111', color: 'white', fontSize: '1.1rem', lineHeight: '1.6', outline: 'none'}}
                placeholder="시나리오, 로그라인, 혹은 트리트먼트를 붙여넣으세요..."
                value={script}
                onChange={(e) => setScript(e.target.value)}
              />
              <button 
                onClick={handleAnalyze} 
                disabled={loading}
                style={{width: '100%', marginTop: '30px', padding: '20px', background: loading ? '#333' : t.primary, color: 'white', border: 'none', borderRadius: '16px', fontSize: '1.3rem', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer', boxShadow: loading ? 'none' : `0 10px 30px ${t.primary}40`}}
              >
                {loading ? "전문가 패널이 분석 중입니다... 🧠" : "🚀 리포트 생성 (Start)"}
              </button>
            </div>
            {/* 분석 탭 하단 광고 */}
            <AdSlot />
          </div>
        )}

        {/* --- 2. 마켓 탭 (부활!) --- */}
        {activeTab === 'market' && (
           <div style={{animation: 'fadeIn 0.5s'}}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
               <h2 style={{margin: 0}}>Scenario Market</h2>
               <button onClick={() => setShowMarketForm(!showMarketForm)} style={{padding: '12px 25px', background: '#30d158', border: 'none', borderRadius: '20px', color: 'white', fontWeight: 'bold', cursor: 'pointer'}}>+ 내 작품 등록</button>
             </div>
             
             {showMarketForm && (
               <div style={{background: '#1c1c1e', padding: '30px', borderRadius: '16px', marginBottom: '30px', border: '1px solid #333'}}>
                 <h3 style={{marginTop:0, color:'#30d158'}}>📝 작품 등록</h3>
                 <input style={{width: '100%', padding: '15px', marginBottom: '15px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '10px'}} placeholder="제목" value={marketForm.title} onChange={e=>setMarketForm({...marketForm, title: e.target.value})} />
                 <textarea style={{width: '100%', height: '100px', padding: '15px', marginBottom: '15px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '10px'}} placeholder="로그라인 (한 줄 요약)" value={marketForm.logline} onChange={e=>setMarketForm({...marketForm, logline: e.target.value})} />
                 <input style={{width: '100%', padding: '15px', marginBottom: '15px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '10px'}} placeholder="연락처 (이메일)" value={marketForm.contactLink} onChange={e=>setMarketForm({...marketForm, contactLink: e.target.value})} />
                 <button onClick={handleSaveMarket} style={{width: '100%', padding: '15px', background: '#30d158', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer'}}>등록하기</button>
               </div>
             )}

             <div style={{display: 'grid', gap: '20px'}}>
               {marketItems.map(item => (
                 <div key={item.id} style={{background: 'rgba(28,28,30,0.6)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)'}}>
                   <span style={{color: '#30d158', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #30d158', padding: '3px 8px', borderRadius: '5px'}}>FOR SALE</span>
                   <h2 style={{margin: '10px 0', fontSize: '1.5rem'}}>{item.title}</h2>
                   <p style={{color: '#aaa', fontSize: '1.1rem'}}>"{item.logline}"</p>
                   <a href={`mailto:${item.contactLink}`} style={{display: 'inline-block', marginTop: '15px', padding: '10px 20px', background: '#0a84ff', color: 'white', textDecoration: 'none', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem'}}>Contact Writer</a>
                 </div>
               ))}
             </div>
             <AdSlot />
           </div>
        )}

        {/* --- 3. 커뮤니티 탭 (부활!) --- */}
        {activeTab === 'community' && (
           <div style={{animation: 'fadeIn 0.5s'}}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
               <h2 style={{margin: 0}}>Writers' Lounge</h2>
               <button onClick={() => setShowCommForm(!showCommForm)} style={{padding: '12px 25px', background: t.accent, border: 'none', borderRadius: '20px', color: 'white', fontWeight: 'bold', cursor: 'pointer'}}>+ 글쓰기</button>
             </div>

             {showCommForm && (
               <div style={{background: '#1c1c1e', padding: '30px', borderRadius: '16px', marginBottom: '30px', border: '1px solid #333'}}>
                 <h3 style={{marginTop:0, color: t.accent}}>🗣️ 익명 수다</h3>
                 <input style={{width: '100%', padding: '15px', marginBottom: '15px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '10px'}} placeholder="제목" value={commForm.title} onChange={e=>setCommForm({...commForm, title: e.target.value})} />
                 <textarea style={{width: '100%', height: '100px', padding: '15px', marginBottom: '15px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '10px'}} placeholder="내용" value={commForm.content} onChange={e=>setCommForm({...commForm, content: e.target.value})} />
                 <input type="password" style={{width: '100%', padding: '15px', marginBottom: '15px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '10px'}} placeholder="비밀번호" value={commForm.password} onChange={e=>setCommForm({...commForm, password: e.target.value})} />
                 <button onClick={handleSavePost} style={{width: '100%', padding: '15px', background: t.accent, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer'}}>등록하기</button>
               </div>
             )}

             <div style={{display: 'grid', gap: '15px'}}>
               {posts.map(post => (
                 <div key={post.id} style={{background: '#1c1c1e', padding: '20px', borderRadius: '12px', border: '1px solid #333'}}>
                   <h4 style={{margin: '0 0 10px 0', fontSize:'1.1rem'}}>{post.title}</h4>
                   <p style={{margin: '0', color: '#ccc', fontSize:'0.95rem', whiteSpace: 'pre-wrap'}}>{post.content}</p>
                   <div style={{marginTop: '15px', fontSize: '0.8rem', color: '#666', textAlign: 'right'}}>
                     {post.createdAt?.toDate().toLocaleString()}
                   </div>
                 </div>
               ))}
             </div>
             <AdSlot />
           </div>
        )}

      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }`}</style>
    </div>
  );
}