# KDDI依頼チェッカー

KDDI担当との「相対申請・稟議申請・その他確認依頼」の進捗管理を行うWebアプリケーションです。期限超過を防ぎ、上司が全体状況を見える化できるようにします。

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router) + TypeScript
- **認証**: Firebase Authentication
- **データベース**: Cloud Firestore
- **UI**: Tailwind CSS + カスタムコンポーネント
- **通知**: Nodemailer (SMTP)

## 機能

### ユーザー種別と権限

| ロール | 権限 |
|--------|------|
| 営業 (sales) | 自分が作成したチケットのみ編集可、全チケット閲覧可 |
| 管理者 (admin) | 全チケット閲覧・編集可、ダッシュボード閲覧可 |
| KDDI担当 (kddi) | 自分が担当のチケットのみ閲覧・ステータス更新可 |

### 主な機能

- ✅ チケット管理（CRUD）
- ✅ ステータス管理（未確認→確認済み→上司申請中→差し戻し/完了）
- ✅ 期限超過アラート
- ✅ フィルタリング（ステータス、種別、担当KDDI、期限超過のみ）
- ✅ 管理者ダッシュボード（統計表示）
- ✅ 自動リマインドメール（期限超過チケット）

## セットアップ

### 1. Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) で新しいプロジェクトを作成
2. **Authentication** を有効化
   - メール/パスワード認証を有効化
   - Google認証を有効化（任意）
3. **Cloud Firestore** を作成
   - 本番モードで開始
4. **プロジェクト設定 > 全般** からWebアプリを追加し、設定をコピー

### 2. Firebase Admin SDKの設定

1. Firebase Console > プロジェクト設定 > サービスアカウント
2. 「新しい秘密鍵の生成」をクリック
3. ダウンロードしたJSONから以下の値を取得:
   - `project_id`
   - `client_email`
   - `private_key`

### 3. 環境変数の設定

`env.example` をコピーして `.env.local` を作成:

```bash
cp env.example .env.local
```

以下の値を設定:

```env
# Firebase (クライアント)
NEXT_PUBLIC_FIREBASE_API_KEY=xxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxxxx

# Firebase Admin (サーバー)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# SMTP (Gmail例)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="KDDI依頼チェッカー <your-email@gmail.com>"
```

> **Note**: GmailでSMTPを使用する場合は、[アプリパスワード](https://support.google.com/accounts/answer/185833)を生成してください。

### 4. Firestoreセキュリティルールの設定

Firebase Console > Firestore > ルール に `firestore.rules` の内容をコピー＆ペースト

### 5. 初期ユーザーの作成

Firestoreに最初のユーザーを手動で追加します:

1. Firebase Console > Firestore > データを追加
2. `users` コレクションを作成
3. ドキュメントIDを認証ユーザーのUID（ログイン後に取得）に設定
4. 以下のフィールドを追加:
   - `email`: ユーザーのメールアドレス
   - `displayName`: 表示名
   - `role`: `admin` / `sales` / `kddi`
   - `createdAt`: タイムスタンプ

### 6. 開発サーバーの起動

```bash
npm install
npm run dev
```

http://localhost:3000 でアプリにアクセス

## 通知の設定

### 手動実行

```bash
curl -X POST http://localhost:3000/api/cron/sendReminders
```

### 本番環境（Vercel Cron）

`vercel.json` に以下を追加:

```json
{
  "crons": [
    {
      "path": "/api/cron/sendReminders",
      "schedule": "0 0 * * *"
    }
  ]
}
```

> JSTの朝9時 = UTCの0時

## ディレクトリ構成

```
src/
├── app/
│   ├── (dashboard)/          # 認証後の画面
│   │   ├── admin/            # 管理者ダッシュボード
│   │   ├── tickets/          # チケット一覧・詳細・作成
│   │   └── layout.tsx        # ダッシュボードレイアウト
│   ├── api/
│   │   └── cron/             # Cron APIエンドポイント
│   ├── login/                # ログイン画面
│   └── layout.tsx            # ルートレイアウト
├── components/
│   └── ui/                   # UIコンポーネント
├── contexts/
│   └── AuthContext.tsx       # 認証コンテキスト
├── lib/
│   ├── firebase/             # Firebase設定・操作
│   ├── notifications/        # 通知システム
│   └── utils.ts              # ユーティリティ関数
└── types/
    └── index.ts              # 型定義
```

## 将来拡張

- [ ] プラスメッセージ通知
- [ ] 差し戻し時の作成者通知
- [ ] テンプレート文生成
- [ ] KDDIファイルストレージ連携
- [ ] 閲覧範囲切り替え（部署全体/作成者のみ）

## ライセンス

Private - Internal Use Only
