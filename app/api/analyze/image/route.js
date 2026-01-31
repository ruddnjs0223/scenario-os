import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { prompt } = body;
    const apiKey = process.env.HUGGINGFACE_API_KEY; // 금고에서 키 꺼내기

    if (!apiKey) {
      return NextResponse.json({ error: '서버에 API 키가 없습니다.' }, { status: 500 });
    }

    // 허깅페이스(SDXL)에 요청 보내기
    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        headers: { 
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    if (!response.ok) {
      throw new Error("이미지 생성 실패 (HuggingFace Error)");
    }

    // 이미지를 받아와서 브라우저에게 그대로 전달 (Blob)
    const imageBlob = await response.blob();
    return new NextResponse(imageBlob, {
      headers: { 'Content-Type': 'image/jpeg' }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}