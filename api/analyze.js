const MAX_IMAGE_BASE64_LENGTH = 7_500_000;

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return json(response, 405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json(response, 500, { error: 'OPENAI_API_KEY is not configured' });
  }

  const { imageBase64, mimeType } = request.body ?? {};
  if (!imageBase64 || !mimeType) {
    return json(response, 400, { error: 'imageBase64 and mimeType are required' });
  }

  if (typeof imageBase64 !== 'string' || imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
    return json(response, 413, { error: 'Image is too large' });
  }

  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType)) {
    return json(response, 400, { error: 'Unsupported image type' });
  }

  const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `이 사진을 보고 아래 JSON 형식으로만 답해줘.

{
  "title": "감성적인 제목 하나",
  "line": "짧은 한줄 문장 하나"
}

느낌:
- 영화 제목 같게
- 시적인 느낌
- 짧고 여운있게
- 새벽 감성
- 청춘의 한 장면처럼
- 과하게 오글거리지는 않게`
            },
            {
              type: 'input_image',
              image_url: `data:${mimeType};base64,${imageBase64}`,
              detail: 'low'
            }
          ]
        }
      ],
      max_output_tokens: 180
    })
  });

  const payload = await openaiResponse.json().catch(() => null);
  if (!openaiResponse.ok) {
    return json(response, openaiResponse.status, {
      error: payload?.error?.message || 'AI request failed'
    });
  }

  const outputText = extractOutputText(payload);
  const mood = parseMoodJson(outputText);

  return json(response, 200, {
    title: trimForApp(mood.title, '이름 없는 장면', 28),
    line: trimForApp(mood.line, '말없이 오래 남는 빛이었다.', 64)
  });
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text;
  }

  const parts = [];
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (typeof content?.text === 'string') {
        parts.push(content.text);
      }
    }
  }
  return parts.join('').trim();
}

function parseMoodJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) {
      return {};
    }
    return JSON.parse(text.slice(start, end + 1));
  }
}

function trimForApp(value, fallback, maxLength) {
  const text = typeof value === 'string' && value.trim() ? value.trim() : fallback;
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function json(response, status, body) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  return response.status(status).send(JSON.stringify(body));
}
