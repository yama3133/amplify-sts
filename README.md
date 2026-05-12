# amplify-sts

**Speech-to-Speech Voice Agent** — OpenAI Realtime API × Next.js × AWS Amplify

リアルタイム音声会話ができるWebアプリです。ブラウザのマイクに話しかけると、AIが音声で返答します。6種類の話者を選択でき、会話のトランスクリプトをリアルタイムで確認できます。

---

## デプロイ済みURL

https://main.d3hxz6l0kwx2wz.amplifyapp.com

---

## アーキテクチャ

```
ブラウザ（Mic / Speaker）
    │
    │ ① POST /api/session  — Ephemeral Token を発行
    ▼
Next.js API Route（/app/api/session/route.ts）
    │  OPENAI_API_KEY はサーバーサイドのみで保持
    │  OpenAI /v1/realtime/sessions を呼び出し
    │
    │ ② WebRTC SDP Offer / Answer
    ▼
OpenAI Realtime API（api.openai.com）
    │  音声ストリーム — 双方向 WebRTC
    │  テキスト — RTCDataChannel
    ▼
ブラウザ Audio Context（再生 / 波形ビジュアライザー）

ホスティング: AWS Amplify（CloudFront + S3 + SSR Lambda）
```

**ポイント:**
- 音声はブラウザが OpenAI と **WebRTC で直接接続**するため低遅延
- `OPENAI_API_KEY` はサーバーサイドのみで使用し、ブラウザには **有効期限60秒の Ephemeral Token** だけを渡す
- 文字起こしは `language: "ja"` を明示することで日本語認識精度を向上

---

## 機能

- 🎙️ リアルタイム音声会話（Speech-to-Speech）
- 🔊 6種類の話者を選択（Alloy / Ash / Coral / Echo / Sage / Shimmer）
- 📝 会話トランスクリプトのリアルタイム表示（日本語対応）
- 🌊 音声波形ビジュアライザー
- 🌐 日本語・英語など話した言語で自動応答
- ⚡ 割り込み検知（VAD）対応

---

## ディレクトリ構成

```
amplify-sts/
├── app/
│   ├── api/
│   │   └── session/
│   │       └── route.ts     # Ephemeral Token 発行 API
│   ├── page.tsx             # メイン UI（WebRTC 接続・波形・トランスクリプト）
│   ├── layout.tsx
│   └── globals.css
├── amplify.yml              # Amplify ビルド設定
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## ローカル開発

### 前提条件

- Node.js 20以上
- OpenAI APIキー（Realtime API アクセス権限付き）

### セットアップ

```bash
# 1. リポジトリをクローン
git clone https://github.com/yama3133/amplify-sts.git
cd amplify-sts

# 2. 依存インストール
npm install

# 3. 環境変数を設定
echo 'OPENAI_API_KEY=sk-...' > .env.local

# 4. 開発サーバー起動
npm run dev
# → http://localhost:3000
```

---

## AWS Amplify へのデプロイ

### Step 1: GitHubにプッシュ

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/あなたのユーザー名/amplify-sts.git
git push -u origin main
```

### Step 2: Amplifyコンソールでアプリを作成

1. https://console.aws.amazon.com/amplify を開く
2. **「Create new app」** → **「GitHub」** を選択
3. リポジトリ `amplify-sts`、ブランチ `main` を選択
4. Framework: **Next.js - SSR** が自動検出されることを確認
5. **「Save and deploy」** をクリック

### Step 3: 環境変数を設定

Amplify コンソール → **「ホスティング」** → **「環境変数」**

| 変数名 | 値 |
|---|---|
| `OPENAI_API_KEY` | `sk-...` |

設定後 **「保存」** を押す。

### Step 4: ビルド設定を確認・修正

**「ホスティング」** → **「ビルドの設定」** → **「編集」** で以下に書き換えて保存：

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - cp .env.production .next/standalone/.env.production 2>/dev/null || true
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### Step 5: 再デプロイ

設定後、**「再デプロイ」** を実行。

> **注意:** AmplifyのSSRランタイム（Lambda）に環境変数を渡すには、`amplify.yml` のビルドフェーズで `.env.production` を生成する方法が確実です。

---

## 環境変数

| 変数名 | 説明 | 必須 |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API キー | ✅ |

---

## 話者一覧

| 話者 | 特徴 |
|---|---|
| Alloy | 中性的・落ち着いた |
| Ash | ソフト・明瞭 |
| Coral | フレンドリー・明るい（デフォルト） |
| Echo | 男性的・深み |
| Sage | 知的・穏やか |
| Shimmer | 女性的・温かみ |

---

## 技術スタック

| 役割 | 技術 |
|---|---|
| フロントエンド | Next.js 15 (App Router) |
| 音声通信 | WebRTC + RTCDataChannel |
| AI音声 | OpenAI Realtime API (`gpt-4o-realtime-preview`) |
| 文字起こし | Whisper (`whisper-1`, `language: "ja"`) |
| ホスティング | AWS Amplify (CloudFront + S3 + SSR Lambda) |
| 言語 | TypeScript |

---

## 注意事項

- マイクアクセスには `https://` または `localhost` 環境が必要です
- OpenAI Realtime API は通常の Chat API より高価です。使用後は必ず **STOP** ボタンを押してセッションを終了してください
- Ephemeral Token の有効期限は60秒です（接続確立後はセッションが継続するため問題ありません）
- AmplifyのSSRランタイムへの環境変数の受け渡しには注意が必要です（詳細はStep 4参照）
