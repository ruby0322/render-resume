import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Database, ExternalLink, Zap } from "lucide-react";

export function FetchDataSteps() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            設置資料庫
          </CardTitle>
          <CardDescription>
            配置 Supabase 資料庫和認證系統
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            建立資料表、設置 RLS 政策，並配置認證流程。
          </p>
          <Button variant="outline" size="sm" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            查看文檔
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            API 路由
          </CardTitle>
          <CardDescription>
            建立 Next.js API 路由來處理資料
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            使用 App Router 建立 API 端點來處理 CRUD 操作。
          </p>
          <Button variant="outline" size="sm" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            範例代碼
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            即時更新
          </CardTitle>
          <CardDescription>
            實現即時資料同步功能
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            使用 Supabase 的即時訂閱功能來同步資料變更。
          </p>
          <Button variant="outline" size="sm" className="w-full">
            <ExternalLink className="h-4 w-4 mr-2" />
            了解更多
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 