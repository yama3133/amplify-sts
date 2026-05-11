import type { APIGatewayProxyHandlerV2 } from "aws-lambda";

const ALLOWED_VOICES = ["alloy", "ash", "coral", "echo", "sage", "shimmer"] as const;
type Voice = (typeof ALLOWED_VOICES)[number];

/**
 * POST / — OpenAI Realtime API の Ephemeral Token を発行する
 *
 * リクエストボディ（JSON）:
 *   { "voice": "coral" }  ← 省略可、デフォルトは環境変数 OPENAI_VOICE
 *
 * レスポンス:
 *   OpenAI /v1/realtime/sessions のレスポンスをそのまま返す
 *   クライアントは data.client_secret.value を使って WebRTC 接続する
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-realtime-preview";
  const defaultVoice = (process.env.OPENAI_VOICE ?? "coral") as Voice;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // 本番では Amplify ドメインに絞る
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // CORS preflight
  if (event.requestContext.http.method === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "OPENAI_API_KEY is not configured." }),
    };
  }

  // リクエストボディから voice を取得
  let voice: Voice = defaultVoice;
  try {
    const body = JSON.parse(event.body ?? "{}");
    if (ALLOWED_VOICES.includes(body.voice)) voice = body.voice;
  } catch {}

  // OpenAI Realtime Sessions API を呼び出す
  const res = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      voice,
      instructions:
        "You are a helpful, friendly voice assistant. " +
        "Keep responses concise and conversational. " +
        "Respond in the same language the user speaks.",
      input_audio_transcription: { model: "whisper-1" },
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 600,
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      statusCode: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ error: data }),
    };
  }

  return {
    statusCode: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
};
