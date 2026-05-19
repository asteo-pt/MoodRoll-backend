# Mood Roll Backend

Vercel 서버리스 함수 템플릿입니다. 앱 안에 OpenAI API Key를 넣지 않고, 이 백엔드에만 키를 저장합니다.

## 배포 순서

1. Vercel 계정을 만듭니다.
2. 이 `backend` 폴더를 Vercel 프로젝트로 배포합니다.
3. Vercel 환경 변수에 `OPENAI_API_KEY`를 추가합니다.
4. 배포된 주소가 예를 들어 `https://mood-roll-api.vercel.app`이면 앱 빌드 때 아래 값을 사용합니다.

```text
MOOD_ROLL_API_URL=https://mood-roll-api.vercel.app/api/analyze
```

## 주의

OpenAI API 비용은 배포자 계정에서 나갑니다. 상용 배포 전에는 반드시 서버 단에서 일일 사용량 제한, 사용자별 제한, 장애 대응 로깅을 추가하세요.
