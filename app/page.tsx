'use client';

import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

// --- 분류 체계 데이터 ---
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

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const t = themes.professional; 

  const [activeTab, setActiveTab] = useState('analyze');
  const [viewMode, setViewMode] = useState('input'); 

  // 분석 상태
  const [script, setScript] = useState('');
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  // 옵션 상태
  const [framework, setFramework] = useState('save_the_cat');
  const [subType, setSubType] = useState('monster_in_the_house');

  // 마켓 상태
  const [marketItems, setMarketItems] = useState([]);
  const [marketForm, setMarketForm] = useState({ title: '', logline: '', synopsis: '', contactLink: '' });
  const [showMarketForm, setShowMarketForm] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (activeTab === 'market') fetchMarketItems();
  }, [activeTab]);

  useEffect(() => {
    setSubType(frameworks[framework].subTypes[0].val);
  }, [framework]);

  const fetchMarketItems = async () => {
    try {
      const q = query(collection(db, "market"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setMarketItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error(e); }
  };

  const handleSaveMarket = async () => {
    if (!marketForm.title) return alert("제목은 필수입니다.");
    try {
      await addDoc(collection(db, "market"), { ...marketForm, createdAt: serverTimestamp() });
      alert("등록 완료!");
      setShowMarketForm(false); fetchMarketItems();
    } catch (e) { alert("오류 발생"); }
  };

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

  // --- PPT 슬라이드 렌더링 ---
  const renderReport = () => {
    if (!resultData) return null;

    // ★ 안전장치: 데이터가 없을 경우를 대비한 기본값 처리 (Optional Chaining)
    const charData = resultData?.slide1_character || {};
    const structData = resultData?.slide2_structure || {};
    const endingData = resultData?.slide3_ending || {};
    
    const advicePanel = structData?.advice_panel || {};
    const storyPrompts = endingData?.storyboard_prompts || ["장면 분석 실패", "", "", "", ""];

    const slides = [
      // PAGE 1: 캐릭터 & 이미지 생성
      <div key="s1" className="slide-content">
        <h2 style={{color: t.primary}}>👤 PAGE 1. 캐릭터 & 비주얼</h2>
        <p style={{fontSize: '1.2rem', color: '#ccc', fontStyle: 'italic'}}>"{charData?.summary || '분석 결과가 없습니다.'}"</p>

        <div style={{display: 'flex', gap: '30px', margin: '30px 0', alignItems: 'flex-start'}}>
          {/* 왼쪽: 이미지 생성 영역 */}
          <div style={{flex: 1}}>
            <div style={{width: '100%', height: '300px', background: '#222', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${t.primary}`, position: 'relative'}}>
              {charData?.features ? (
                <img 
                  src={`https://image.pollinations.ai/prompt/cinematic portrait of ${encodeURIComponent(charData.features)}?width=500&height=500&nologo=true`}
                  alt="AI Character Visual"
                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                  onError={(e)=>{e.target.style.display='none'; e.target.nextSibling.style.display='flex'}} 
                />
              ) : (
                <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#666'}}>이미지 생성 불가</div>
              )}
              <div style={{display: 'none', position:'absolute', top:0, left:0, width:'100%', height:'100%', alignItems:'center', justifyContent:'center', color:'#666', padding:'20px', textAlign:'center'}}>
                이미지 로딩 실패
              </div>
            </div>
            <p style={{fontSize: '0.85rem', color: '#888', marginTop: '10px'}}>💡 AI 분석 외모: {charData?.features || '정보 없음'}</p>
            
            <div style={{display: 'flex', gap: '8px', marginTop: '15px', flexWrap: 'wrap'}}>
               {['📸 실사', '🎨 애니메이션', '🦊 동물화', '📺 드라마톤'].map(style => (
                 <button key={style} onClick={()=>alert('스타일 변경은 프리미엄 기능입니다.')} style={{padding: '6px 12px', fontSize: '0.8rem', borderRadius: '20px', border: '1px solid #555', background: 'rgba(255,255,255,0.05)', color: '#ccc', cursor: 'pointer'}}>{style}</button>
               ))}
            </div>
          </div>
          
          {/* 오른쪽: 분석 데이터 */}
          <div style={{flex: 1.2, background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '16px'}}>
            <div style={{marginBottom: '25px'}}>
               <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                 <span style={{color: t.primary, fontWeight:'bold'}}>💪 강점 파워</span>
                 <span style={{fontWeight:'bold'}}>{charData?.strength_score || 0} / 100</span>
               </div>
               <div style={{width: '100%', background: '#333', height: '12px', borderRadius: '6px', overflow: 'hidden'}}>
                 <div style={{width: `${charData?.strength_score || 0}%`, background: `linear-gradient(90deg, ${t.primary}, #60a5fa)`, height: '100%'}}></div>
               </div>
            </div>
            <h4 style={{color: '#2ecc71', margin: '15px 0 8px 0'}}>✅ Best Points</h4>
            <ul style={{fontSize: '0.95rem', paddingLeft: '20px', color: '#ddd', lineHeight:'1.6'}}>
              {charData?.pros?.map((p,i)=><li key={i}>{p}</li>) || <li>데이터 없음</li>}
            </ul>
            <h4 style={{color: '#ff453a', margin: '20px 0 8px 0'}}>❌ Weak Points</h4>
            <ul style={{fontSize: '0.95rem', paddingLeft: '20px', color: '#ddd', lineHeight:'1.6'}}>
              {charData?.cons?.map((p,i)=><li key={i}>{p}</li>) || <li>데이터 없음</li>}
            </ul>
            <div style={{marginTop: '25px', padding: '15px', background: `rgba(41, 151, 255, 0.1)`, borderRadius: '10px', borderLeft: `3px solid ${t.primary}`}}>
              <strong style={{color: t.primary, display:'block', marginBottom:'5px'}}>✨ 닥터의 제안</strong>
              <span style={{fontSize:'0.9rem', color:'#eee'}}>{charData?.suggestion || '제안 내용이 없습니다.'}</span>
            </div>
          </div>
        </div>
      </div>,

      // PAGE 2: 구조 & 4대 천왕
      <div key="s2" className="slide-content">
        <h2 style={{color: t.primary}}>🏗️ PAGE 2. 구조적 완성도 & 전문가 패널</h2>
        <div style={{display: 'flex', justifyContent: 'space-around', margin: '30px 0', padding:'30px', background:'rgba(255,255,255,0.03)', borderRadius:'16px'}}>
           <div style={{textAlign: 'center'}}>
             <div style={{fontSize: '3rem', fontWeight: '900', color: t.primary, textShadow: `0 0 20px ${t.primary}50`}}>{structData?.completeness_score || 0}</div>
             <div style={{fontSize: '1rem', color: '#aaa', fontWeight:'bold'}}>구조 완성도</div>
           </div>
           <div style={{textAlign: 'center', borderLeft:'1px solid #444', paddingLeft:'50px'}}>
             <div style={{fontSize: '3rem', fontWeight: '900', color: '#ffd60a', textShadow: `0 0 20px #ffd60a50`}}>{structData?.marketability_score || 0}</div>
             <div style={{fontSize: '1rem', color: '#aaa', fontWeight:'bold'}}>상업성 지수</div>
           </div>
        </div>

        <h3 style={{borderBottom: '1px solid #333', paddingBottom: '15px', marginTop: '40px', color:'#eee'}}>🎙️ 4대 천왕의 조언</h3>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
          <div style={{background: '#1c1c1e', padding: '20px', borderRadius: '12px', border: '1px solid #333'}}>
            <strong style={{color: '#ff453a', fontSize:'1.1rem'}}>📖 로버트 맥키</strong>
            <p style={{fontSize: '0.95rem', color: '#ccc', marginTop: '10px', lineHeight:'1.5', fontStyle:'italic'}}>"{advicePanel?.robert_mckee || '조언 없음'}"</p>
          </div>
          <div style={{background: '#1c1c1e', padding: '20px', borderRadius: '12px', border: '1px solid #333'}}>
            <strong style={{color: '#30d158', fontSize:'1.1rem'}}>🐱 블레이크 스나이더</strong>
            <p style={{fontSize: '0.95rem', color: '#ccc', marginTop: '10px', lineHeight:'1.5', fontStyle:'italic'}}>"{advicePanel?.blake_snyder || '조언 없음'}"</p>
          </div>
          <div style={{background: '#1c1c1e', padding: '20px', borderRadius: '12px', border: '1px solid #333'}}>
            <strong style={{color: '#0a84ff', fontSize:'1.1rem'}}>📝 시드 필드</strong>
            <p style={{fontSize: '0.95rem', color: '#ccc', marginTop: '10px', lineHeight:'1.5', fontStyle:'italic'}}>"{advicePanel?.syd_field || '조언 없음'}"</p>
          </div>
          <div style={{background: '#1c1c1e', padding: '20px', borderRadius: '12px', border: '1px solid #333'}}>
            <strong style={{color: '#ffd60a', fontSize:'1.1rem'}}>💡 픽사 크리에이터</strong>
            <p style={{fontSize: '0.95rem', color: '#ccc', marginTop: '10px', lineHeight:'1.5', fontStyle:'italic'}}>"{advicePanel?.pixar_creator || '조언 없음'}"</p>
          </div>
        </div>
      </div>,

      // PAGE 3: 엔딩 콘티
      <div key="s3" className="slide-content">
        <h2 style={{color: t.primary}}>🎬 PAGE 3. 엔딩 시뮬레이션 & 콘티</h2>
        
        <div style={{display: 'flex', gap: '20px', marginBottom: '30px'}}>
           <div style={{flex: 1, padding: '25px', background: 'linear-gradient(135deg, #222 0%, #111 100%)', borderRadius: '12px', borderLeft: `4px solid ${t.accent}`}}>
             <strong style={{color: t.accent, fontSize:'1.1rem'}}>🏆 칸 영화제용 엔딩</strong>
             <p style={{fontSize: '1rem', color: '#ddd', lineHeight:'1.6', marginTop:'10px'}}>"{endingData?.cannes_direction || '데이터 없음'}"</p>
           </div>
           <div style={{flex: 1, padding: '25px', background: 'linear-gradient(135deg, #222 0%, #111 100%)', borderRadius: '12px', borderLeft: `4px solid #ff453a`}}>
             <strong style={{color: '#ff453a', fontSize:'1.1rem'}}>🍿 천만 관객용 엔딩</strong>
             <p style={{fontSize: '1rem', color: '#ddd', lineHeight:'1.6', marginTop:'10px'}}>"{endingData?.boxoffice_direction || '데이터 없음'}"</p>
           </div>
        </div>

        <h3 style={{marginTop:'40px', marginBottom:'20px', color:'#eee'}}>🎞️ 엔딩 콘티 (Storyboard)</h3>
        <div style={{display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '15px'}}>
          
          {/* 1번 무료 콘티 */}
          <div style={{minWidth: '220px', height: '150px', background: '#222', borderRadius: '12px', position: 'relative', overflow:'hidden', border: `1px solid ${t.primary}`}}>
             <span style={{position:'absolute', top:'10px', left:'10px', fontSize: '0.7rem', color: 'white', background: t.primary, padding: '3px 8px', borderRadius: '10px', fontWeight:'bold', zIndex:2}}>FREE PREVIEW</span>
             {storyPrompts[0] && (
               <img 
                 src={`https://image.pollinations.ai/prompt/storyboard sketch of ${encodeURIComponent(storyPrompts[0])}?width=400&height=300&nologo=true`}
                 alt="Storyboard 1"
                 style={{width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8}}
               />
             )}
             <p style={{position:'absolute', bottom:0, left:0, width:'100%', padding:'10px', margin:0, fontSize: '0.8rem', color: '#fff', background:'rgba(0,0,0,0.7)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
               #1. {storyPrompts[0] || '생성 불가'}
             </p>
          </div>
          
          {/* 2~5번 유료 잠금 콘티 */}
          {[1,2,3,4].map(i => (
            <div key={i} onClick={()=>alert("전체 콘티 열람은 프리미엄 기능입니다.")} style={{minWidth: '220px', height: '150px', background: '#111', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px dashed #444', flexDirection:'column'}}>
                <div style={{fontSize: '2rem', marginBottom:'10px'}}>🔒</div>
                <div style={{fontSize: '0.9rem', color: '#888', fontWeight:'bold'}}>Premium Scene #{i+1}</div>
            </div>
          ))}
        </div>
      </div>
    ];

    return (
      <div 
        onContextMenu={preventCapture}
        style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'black', zIndex: 9999, padding: '40px', overflowY: 'auto', userSelect: 'none', WebkitUserSelect: 'none'}}
      >
        <div style={{maxWidth: '1100px', margin: '0 auto'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems:'center'}}>
            <button onClick={() => setViewMode('input')} style={{background: '#333', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '1rem', padding:'10px 20px', borderRadius:'20px'}}>✖ 닫기</button>
            <h1 style={{margin: 0, fontSize: '1.8rem', color: 'white', fontWeight:'900'}}>Diagnosis Report</h1>
            <button onClick={() => alert('이메일 발송은 유료 서비스입니다.')} style={{background: t.primary, border: 'none', color: 'white', padding: '12px 25px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', boxShadow:`0 5px 15px ${t.primary}40`}}>📩 PDF / 이메일 (Premium)</button>
          </div>

          <div style={{background: t.cardBg, padding: '60px', borderRadius: '24px', border: t.border, minHeight: '700px', boxShadow: t.shadow}}>
            {slides[slideIndex]}
          </div>

          <div style={{display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '40px'}}>
            <button disabled={slideIndex===0} onClick={()=>setSlideIndex(p=>p-1)} style={{padding: '15px 40px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '40px', color: 'white', opacity: slideIndex===0?0.3:1, cursor: 'pointer', fontSize:'1.1rem', fontWeight:'bold'}}>◀ Prev</button>
            <button disabled={slideIndex===2} onClick={()=>setSlideIndex(p=>p+1)} style={{padding: '15px 40px', background: t.primary, border: 'none', borderRadius: '40px', color: 'white', opacity: slideIndex===2?0.3:1, cursor: 'pointer', fontSize:'1.1rem', fontWeight:'bold', boxShadow:`0 0 30px ${t.primary}50`}}>Next Page ▶</button>
          </div>
        </div>
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <div style={{backgroundColor: t.bg, color: t.text, minHeight: '100vh', fontFamily: '-apple-system, sans-serif'}}>
      {viewMode === 'report' && renderReport()}

      <div style={{padding: '40px 20px', textAlign: 'center', borderBottom: '1px solid #333'}}>
        <h1 style={{fontSize: '3rem', fontWeight: '900', background: `linear-gradient(to right, ${t.primary}, ${t.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0}}>Scenario OS Pro</h1>
      </div>

      <div style={{maxWidth: '1000px', margin: '40px auto', padding: '0 20px'}}>
        <div style={{display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '40px'}}>
          <button onClick={() => setActiveTab('analyze')} style={{padding: '12px 30px', borderRadius: '25px', border: 'none', background: activeTab==='analyze'?t.primary:'#222', color: 'white', cursor: 'pointer', fontWeight: 'bold'}}>AI Analysis</button>
          <button onClick={() => setActiveTab('market')} style={{padding: '12px 30px', borderRadius: '25px', border: 'none', background: activeTab==='market'?t.primary:'#222', color: 'white', cursor: 'pointer', fontWeight: 'bold'}}>Market</button>
        </div>

        {activeTab === 'analyze' && (
          <div style={{background: t.cardBg, padding: '40px', borderRadius: t.radius, border: t.border}}>
            <h3 style={{marginTop: 0, marginBottom: '20px'}}>⚙️ 프로젝트 설정</h3>
            <div style={{display: 'flex', gap: '15px', marginBottom: '20px'}}>
              <div style={{flex: 1}}>
                <label style={{display:'block', marginBottom:'5px', color:'#888', fontSize:'0.9rem'}}>분석 프레임워크</label>
                <select style={{width: '100%', padding: '15px', borderRadius: '12px', background: '#1c1c1e', color: 'white', border: '1px solid #333'}} value={framework} onChange={(e)=>setFramework(e.target.value)}>
                  {Object.entries(frameworks).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
              <div style={{flex: 1}}>
                <label style={{display:'block', marginBottom:'5px', color:'#888', fontSize:'0.9rem'}}>세부 유형</label>
                <select style={{width: '100%', padding: '15px', borderRadius: '12px', background: '#1c1c1e', color: 'white', border: '1px solid #333'}} value={subType} onChange={(e)=>setSubType(e.target.value)}>
                  {frameworks[framework].subTypes.map((type) => (
                    <option key={type.val} value={type.val}>{type.label}</option>
                  ))}
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
              style={{width: '100%', marginTop: '30px', padding: '20px', background: loading ? '#333' : t.primary, color: 'white', border: 'none', borderRadius: '16px', fontSize: '1.3rem', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer', transition:'all 0.2s', boxShadow: loading ? 'none' : `0 10px 30px ${t.primary}40`}}
            >
              {loading ? "전문가 패널이 분석 중입니다... 🧠" : "🚀 리포트 생성 (Start)"}
            </button>
          </div>
        )}

        {activeTab === 'market' && (
           <div style={{textAlign: 'center', color: '#888', padding: '50px', background: t.cardBg, borderRadius: t.radius, border: t.border}}>마켓 기능 준비중...</div>
        )}
      </div>
    </div>
  );
}