import { Code, Heart, Lightbulb, Star, Target, Users } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  const visionPoints = [
    {
      icon: Target,
      title: "專業導向",
      description: "基於 Fortune 500 企業標準，提供國際級履歷分析服務"
    },
    {
      icon: Users,
      title: "人人可用",
      description: "讓每位求職者都能展現自己的最大價值，不論背景經驗"
    },
    {
      icon: Lightbulb,
      title: "AI 賦能",
      description: "運用先進 AI 技術，提供個人化的履歷優化建議"
    },
    {
      icon: Heart,
      title: "用心服務",
      description: "深度理解求職痛點，用科技溫度陪伴每個職涯旅程"
    }
  ];

  const teamMembers = [
    {
      name: "Ruby Ku",
      role: "創辦人 & 技術總監",
      background: "台灣大學資訊管理學系",
      expertise: "AI 產品開發、全端工程",
      description: "深耕 AI 領域多年，致力於讓科技成為每個人職涯發展的助力",
      icon: "👩‍💻"
    },
    {
      name: "AI Agents",
      role: "核心技術團隊",
      background: "來自全球網路資料的訓練集",
      expertise: "自然語言生成",
      description: "快速開發、迭代產品，交付團隊任務",
      icon: "🤖"
    },
    {
      name: "HR 顧問團隊",
      role: "專業顧問",
      background: "Fortune 500 企業 HR 經驗",
      expertise: "人才評估、履歷審查",
      description: "15年+ 專業經驗，確保分析標準與業界需求同步",
      icon: "👔"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto flex p-4 py-8">
        <Link
          href="/"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400"
        >
          返回首頁
        </Link>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-12 max-w-4xl">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              關於 RenderResume
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              讓科技業的求職小白，包含大學畢業生，也能呈現自己的最大價值，找到理想工作
            </p>
          </div>

          {/* Vision Section */}
          <section id="vision" className="mb-16">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🎯</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                產品願景
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                我們相信每個人都有獨特的價值和潛力。透過 AI 技術的力量，
                我們要打破履歷撰寫的門檻，讓每位求職者都能專業地展現自己。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {visionPoints.map((point, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 bg-cyan-100 dark:bg-cyan-900 rounded-lg flex items-center justify-center mr-4">
                      <point.icon className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {point.title}
                    </h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {point.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-lg p-8 border border-cyan-200 dark:border-cyan-800">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                我們的使命
              </h3>
              <p className="text-lg text-gray-700 dark:text-gray-300 text-center leading-relaxed">
                「讓科技業的求職小白，包含大學畢業生，也能呈現自己的最大價值，找到理想工作」
                <br />
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold mt-2 block">
                  —— 這就是我們存在的理由
                </span>
              </p>
            </div>
          </section>

          {/* Team Section */}
          <section id="author" className="mb-16">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center">
                  <span className="text-3xl">👥</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                開發團隊
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                由技術專家、AI 研究員和 HR 專業人士組成的跨領域團隊，
                致力於打造最專業的 AI 履歷分析平台。
              </p>
            </div>

            <div className="space-y-6">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col md:flex-row md:items-center">
                    <div className="flex items-center mb-4 md:mb-0 md:mr-6">
                      <div className="h-16 w-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mr-4 text-2xl">
                        {member.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {member.name}
                        </h3>
                        <p className="text-cyan-600 dark:text-cyan-400 font-semibold">
                          {member.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">背景</span>
                          <p className="text-gray-700 dark:text-gray-300">{member.background}</p>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">專長</span>
                          <p className="text-gray-700 dark:text-gray-300">{member.expertise}</p>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 italic">
                        {member.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Core Values */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              核心價值
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  專業品質
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  堅持國際級標準，提供最專業的履歷分析服務
                </p>
              </div>
              
              <div className="text-center">
                <div className="h-16 w-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Code className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  技術創新
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  持續投入 AI 技術研發，打造最智能的求職助手
                </p>
              </div>
              
              <div className="text-center">
                <div className="h-16 w-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  用戶至上
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  以用戶需求為中心，打造最貼心的使用體驗
                </p>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              與我們聯繫
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              有任何建議或合作想法？我們很樂意聽到您的聲音！
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:info@render-resume.com"
                className="inline-flex items-center justify-center px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
              >
                聯絡我們
              </a>
              <Link 
                href="/faq"
                className="inline-flex items-center justify-center px-6 py-3 border border-cyan-600 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950 rounded-lg transition-colors"
              >
                常見問題
              </Link>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row gap-4 text-center">
              <Link
                href="/privacy"
                className="text-cyan-600 hover:text-cyan-700 underline underline-offset-4"
              >
                隱私權政策
              </Link>
              <Link
                href="/terms"
                className="text-cyan-600 hover:text-cyan-700 underline underline-offset-4"
              >
                服務條款
              </Link>
              <Link
                href="/help"
                className="text-cyan-600 hover:text-cyan-700 underline underline-offset-4"
              >
                使用說明
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 