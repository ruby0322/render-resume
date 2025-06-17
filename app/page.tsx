import { Button } from "@/components/ui/button";
import {
    Brain,
    Eye,
    FileText,
    MessageSquare,
    Upload
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const stats = [
    { number: "10,000+", label: "履歷生成數量" },
    { number: "95%", label: "用戶滿意度" },
    { number: "3分鐘", label: "平均生成時間" }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="h-16 w-16 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center">
                <span className="text-3xl">✨</span>
              </div>
              <div className="absolute -top-2 -right-2 h-6 w-6 bg-cyan-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">AI</span>
              </div>
            </div>
          </div>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            讓 AI 為您打造
            <span className="text-cyan-600 dark:text-cyan-400">
              專業履歷
            </span>
          </h1>
          
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            只需上傳作品說明或截圖，AI 將自動生成客製化的履歷和作品集。
            讓您的才華以最完美的方式呈現給雇主和客戶。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 text-lg">
                免費開始使用
                <Upload className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="px-8 py-3 text-lg border-cyan-200 text-cyan-700 hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-300 dark:hover:bg-cyan-950">
                已有帳戶？登入
                <Eye className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      

      {/* How it works */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              如何運作
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {[
                {
                  step: "01",
                  title: "註冊帳戶",
                  description: "創建免費帳戶，開始您的 AI 履歷生成之旅",
                  icon: FileText
                },
                {
                  step: "02",
                  title: "上傳作品",
                  description: "拖拽上傳作品說明文件、截圖或簡短文字說明",
                  icon: Upload
                },
                {
                  step: "03", 
                  title: "AI智能解析",
                  description: "AI 自動分析您的作品內容，識別技能和成就",
                  icon: Brain
                },
                {
                  step: "04",
                  title: "智慧問答與優化",
                  description: "AI 問答收集補充信息，並提供個性化優化建議",
                  icon: MessageSquare
                },
                {
                  step: "05",
                  title: "預覽下載",
                  description: "預覽最終結果，下載專業的履歷和作品集",
                  icon: Eye
                }
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 bg-cyan-600 text-white rounded-full font-bold">
                      {item.step}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center space-x-3 mb-2">
                      <item.icon className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            準備好開始了嗎？
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            註冊免費帳戶，立即體驗 AI 履歷生成服務
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 text-lg">
                免費註冊
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="px-8 py-3 text-lg border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                已有帳戶？登入
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
