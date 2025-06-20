# RenderResume 郵件鉤子設定指南

本指南說明如何使用 Next.js API 路由為 RenderResume 設定和配置發送電子郵件鉤子。

## 概述

發送電子郵件鉤子讓您可以為 Supabase Auth 中的身份驗證訊息自定義電子郵件內容。此實現提供：

- ✅ 美觀、響應式的電子郵件模板
- ✅ Resend 電子郵件提供商支援
- ✅ Webhook 簽名驗證
- ✅ 全面的日誌記錄和錯誤處理
- ✅ TypeScript 支援
- ✅ React 電子郵件模板（使用 Resend SDK）
- ✅ 傳統中文支援

## 設定說明

### 1. 環境變數

在您的專案根目錄建立 `.env.local` 檔案，包含以下變數：

```bash
# Next.js 配置
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 發送電子郵件鉤子配置
SEND_EMAIL_HOOK_SECRET=v1,whsec_your_webhook_secret_from_supabase_dashboard

# 電子郵件提供商配置
RESEND_API_KEY=re_your_resend_api_key

# 電子郵件配置
FROM_EMAIL=RenderResume <noreply@yourdomain.com>
```

### 2. 產生 Webhook 密鑰

1. 前往您的 Supabase 控制台
2. 導航至 **Authentication** → **Hooks**
3. 點擊 **Create a new hook**
4. 選擇 **Send Email Hook**
5. 複製產生的 webhook 密鑰

### 3. 配置 Resend 電子郵件提供商

1. 在 [resend.com](https://resend.com) 註冊
2. 建立 API 金鑰
3. 新增您的網域並驗證
4. 設定 `RESEND_API_KEY` 環境變數

### 4. 部署和配置鉤子

1. 部署您的 Next.js 應用程式
2. 在 Supabase 控制台中，將鉤子 URL 設定為：
   ```
   https://yourdomain.com/api/hooks/send-email
   ```
3. 儲存配置

## API 端點

### POST `/api/hooks/send-email`

處理 Supabase Auth 事件的主要 webhook 端點。

**請求標頭：**
- `x-supabase-signature`: 用於驗證的 Webhook 簽名

**回應：**
```json
{
  "success": true,
  "emailId": "email-id-from-provider",
  "provider": "resend",
  "templateType": "react"
}
```

### GET `/api/hooks/send-email`

回傳電子郵件鉤子狀態的健康檢查端點。

## 電子郵件模板

系統包含針對不同電子郵件操作的專業設計模板：

### 支援的電子郵件類型

1. **註冊** (`signup`)
   - 歡迎訊息與帳戶確認
   - 功能概述
   - 安全資訊

2. **登入** (`login`)
   - 魔法連結登入
   - 安全提醒
   - 存取說明

3. **密碼復原** (`recovery`)
   - 密碼重設說明
   - 安全提醒
   - 強密碼提示

4. **邀請** (`invite`)
   - 團隊邀請
   - 平台介紹
   - 快速入門指南

5. **電子郵件變更** (`email_change_current`, `email_change_new`)
   - 電子郵件地址確認
   - 安全驗證
   - 變更說明

### 模板自定義

模板定義在 `lib/email-templates.ts` 中。您可以自定義：

- 品牌顏色和樣式
- 電子郵件內容和訊息
- 行動呼籲按鈕
- 頁尾資訊

範例自定義：

```typescript
// 修改品牌顏色
const BRAND_COLORS = {
  primary: '#0891b2', // RenderResume 主色
  secondary: '#0e7490',
  // ... 其他顏色
};
```

## React 電子郵件模板

系統支援 React 電子郵件模板以獲得更好的渲染效果：

### 可用的 React 模板

- `SignupEmailTemplate` - 註冊確認
- `BaseEmailTemplate` - 基礎模板包裝器

### 建立新的 React 模板

```typescript
// components/emails/LoginEmailTemplate.tsx
import * as React from 'react';
import { BaseEmailTemplate } from './BaseEmailTemplate';

export const LoginEmailTemplate: React.FC<Props> = ({ token, redirectTo }) => {
  return (
    <BaseEmailTemplate title="登入 RenderResume" preview="您的安全登入連結">
      {/* 您的模板內容 */}
    </BaseEmailTemplate>
  );
};
```

## 測試

### 本地測試

1. 使用 [ngrok](https://ngrok.com) 等工具暴露您的本地服務器：
   ```bash
   ngrok http 3000
   ```

2. 在 Supabase 中將 webhook URL 設定為您的 ngrok URL：
   ```
   https://your-ngrok-id.ngrok.io/api/hooks/send-email
   ```

3. 測試身份驗證流程（註冊、登入、密碼重設）

### 開發端點

使用 `/api/test-email` 端點進行開發測試：

```bash
# 預覽註冊電子郵件模板
curl http://localhost:3000/api/test-email?action=signup

# 預覽登入模板
curl http://localhost:3000/api/test-email?action=login

# 取得 JSON 格式
curl http://localhost:3000/api/test-email?action=recovery&format=json

# 發送測試電子郵件
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"action":"signup","email":"test@example.com","sendTest":true}'
```

## 監控和日誌記錄

電子郵件鉤子提供全面的日誌記錄：

### 日誌格式

```
[2024-01-01T00:00:00.000Z] 📧 Email Hook Triggered: {
  "userId": "user-uuid",
  "email": "user@example.com",
  "action": "signup",
  "templateType": "react"
}
```

## 故障排除

### 常見問題

1. **無效的 Webhook 簽名**
   - 驗證 `SEND_EMAIL_HOOK_SECRET` 與 Supabase 匹配
   - 檢查 webhook 密鑰格式（`v1,whsec_...`）

2. **電子郵件未發送**
   - 驗證 `RESEND_API_KEY` 環境變數已正確設定
   - 檢查 Resend 帳戶狀態和限制
   - 確認 `FROM_EMAIL` 網域已在 Resend 中驗證
   - 查看日誌中的特定錯誤訊息

3. **模板未載入**
   - 確保 `lib/email-templates.ts` 正確匯入
   - 檢查 TypeScript 編譯錯誤

## 安全考量

1. **Webhook 驗證**：始終驗證 webhook 簽名
2. **環境變數**：絕不將機密提交到版本控制
3. **HTTPS**：在生產環境中對 webhook 端點使用 HTTPS
4. **速率限制**：考慮對端點實施速率限制

## 下一步

1. 自定義電子郵件模板以符合您的品牌
2. 設定監控和警報
3. 配置您的網域用於電子郵件發送
4. 測試所有身份驗證流程
5. 設定分析以追蹤電子郵件參與度

## 支援

如有問題或疑問：

1. 檢查控制台日誌以獲取錯誤詳細資訊
2. 驗證所有環境變數已設定
3. 直接測試 webhook 端點
4. 檢查 Supabase Auth 鉤子配置

## 其他資源

- [Supabase Auth Hooks 文件](https://supabase.com/docs/guides/auth/auth-hooks)
- [Resend 文件](https://resend.com/docs)
- [Next.js API 路由](https://nextjs.org/docs/api-routes/introduction) 