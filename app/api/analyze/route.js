import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { scriptContent, framework, subType } = body; // subType: 중분류
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: 'API 키가 없습니다.' }, { status: 500 });

    const prompt = `
      당신은 할리우드 최고의 시나리오 컨설팅 팀입니다.
      사용자의 시나리오를 분석하여 **엄격한 JSON 형식**으로 답하세요.
      
      [설정된 프레임워크]
      - 대분류: ${framework}
      - 중분류(초점): ${subType}

      [요청 사항]
      아래의 JSON 구조를 절대적으로 따르십시오.

      {
        "slide1_character": {
          "summary": "캐릭터 한 줄 요약",
          "features": "캐릭터 외모/성격 묘사 (이미지 생성 프롬프트용)",
          "strength_score": 0~100,
          "weakness_score": 0~100,
          "pros": ["장점1", "장점2"],
          "cons": ["단점1", "단점2"],
          "suggestion": "개선 제안"
        },
        "slide2_structure": {
          "summary": "구조적 완성도 요약",
          "completeness_score": 0~100,
          "marketability_score": 0~100,
          "advice_panel": {
             "robert_mckee": "로버트 맥키 스타일의 독설과 철학적 조언",
             "blake_snyder": "블레이크 스나이더(Save the Cat) 관점의 구조적 지적",
             "syd_field": "시드 필드 관점의 패러다임(구성점) 분석",
             "pixar_creator": "픽사 스토리텔러 관점의 감동/보편성 조언"
          }
        },
        "slide3_ending": {
          "current_ending": "현재 결말 분석",
          "cannes_direction": "예술적(칸 영화제) 결말 제안",
          "boxoffice_direction": "상업적(천만 관객) 결말 제안",
          "storyboard_prompts": [
            "결말 콘티 1번 장면 묘사",
            "결말 콘티 2번 장면 묘사",
            "결말 콘티 3번 장면 묘사",
            "결말 콘티 4번 장면 묘사",
            "결말 콘티 5번 장면 묘사"
          ]
        }
      }

      [시나리오 내용]:
      ${scriptContent}
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message);

    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return NextResponse.json({ result: JSON.parse(rawText) });

  } catch (error) {
    return NextResponse.json({ error: `분석 실패: ${error.message}` }, { status: 500 });
  }
}