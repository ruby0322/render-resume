import {
    AlertCircle,
    CheckCircle,
    Download,
    FileText,
    Lightbulb,
    MessageSquare,
    Search,
    Star,
    Target,
    Upload
} from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  const steps = [
    {
      step: 1,
      icon: Upload,
      title: "上傳履歷",
      description: "支援 PDF、Word 格式，或直接貼上履歷內容",
      details: [
        "檔案大小限制：10MB 以內",
        "支援中英文履歷",
        "自動偵測格式並提取內容",
        "隱私保護：上傳檔案僅用於分析，不會儲存"
      ]
    },
    {
      step: 2,
      icon: Search,
      title: "AI 分析",
      description: "系統會根據六維度模型進行深度分析",
      details: [
        "技術深度與廣度分析",
        "項目複雜度與影響力評估",
        "專業經驗完整度檢視",
        "教育背景匹配度評分",
        "成果與驗證識別",
        "整體專業形象評估"
      ]
    },
    {
      step: 3,
      icon: FileText,
      title: "檢視報告",
      description: "獲得詳細的分析報告和改進建議",
      details: [
        "總體評分（A+ 到 F 等級）",
        "各維度詳細評分",
        "STAR 原則重組建議",
        "具體改進方向",
        "範例與對比說明"
      ]
    },
    {
      step: 4,
      icon: Download,
      title: "下載優化版",
      description: "下載經過 AI 優化的履歷版本",
      details: [
        "多種專業範本選擇",
        "格式自動調整",
        "內容結構優化",
        "支援 PDF/Word 格式匯出"
      ]
    }
  ];

  const features = [
    {
      icon: Star,
      title: "六維度評分系統",
      description: "基於國際標準的全面評估",
      tips: [
        "每個維度都有詳細的評分標準",
        "參考 Fortune 500 企業要求",
        "提供業界基準對比"
      ]
    },
    {
      icon: Target,
      title: "STAR 原則重組",
      description: "工作經驗的結構化呈現",
      tips: [
        "Situation: 清楚描述工作情境",
        "Task: 明確定義任務目標",
        "Action: 詳述具體行動策略",
        "Result: 量化成果與影響"
      ]
    },
    {
      icon: Lightbulb,
      title: "個人化建議",
      description: "針對性的優化建議",
      tips: [
        "根據目標職位調整重點",
        "突出核心競爭優勢",
        "提供具體改進範例"
      ]
    }
  ];

  const faqs = [
    {
      question: "上傳的履歷會被保存嗎？",
      answer: "不會。我們非常重視您的隱私，上傳的履歷僅用於分析目的，分析完成後即刻刪除，不會儲存在我們的伺服器上。"
    },
    {
      question: "分析需要多長時間？",
      answer: "通常在 1-3 分鐘內完成分析。複雜的履歷可能需要稍長時間，但不會超過 5 分鐘。"
    },
    {
      question: "支援哪些檔案格式？",
      answer: "目前支援 PDF、圖片（jpg/jpeg/png）格式，也可以直接複製貼上履歷內容進行分析。"
    },
    {
      question: "分析結果準確嗎？",
      answer: "我們的 AI 模型基於大量真實履歷數據訓練，並參考 Fortune 500 企業標準。雖然無法保證 100% 準確，但能提供有價值的參考意見。"
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
              使用說明
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              簡單四步驟，讓 AI 為您打造專業履歷
            </p>
          </div>

          {/* Quick Start */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              快速開始
            </h2>
            
            <div className="space-y-8">
              {steps.map((step, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col md:flex-row md:items-start">
                    <div className="flex items-center mb-4 md:mb-0 md:mr-6">
                      <div className="h-16 w-16 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center mr-4">
                        <step.icon className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                          步驟 {step.step}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {step.title}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {step.description}
                      </p>
                      <ul className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {detail}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Key Features */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              核心功能說明
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center mr-4 shadow-sm">
                      <feature.icon className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  
                  <ul className="space-y-2 ml-16">
                    {feature.tips.map((tip, tipIndex) => (
                      <li key={tipIndex} className="flex items-start">
                        <Lightbulb className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0 mt-1" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {tip}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Tips & Best Practices */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              使用技巧
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    最佳實踐
                  </h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <span className="text-gray-700 dark:text-gray-300">確保履歷內容完整且最新</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <span className="text-gray-700 dark:text-gray-300">包含具體的數字和成果</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <span className="text-gray-700 dark:text-gray-300">使用清晰的格式和排版</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <span className="text-gray-700 dark:text-gray-300">重點突出核心技能和經驗</span>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    注意事項
                  </h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <span className="text-gray-700 dark:text-gray-300">避免使用模糊不清的描述</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <span className="text-gray-700 dark:text-gray-300">檢查是否有錯字或語法錯誤</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <span className="text-gray-700 dark:text-gray-300">確保個人資訊的隱私安全</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <span className="text-gray-700 dark:text-gray-300">定期更新履歷內容</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* FAQ Preview */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              常見問題
            </h2>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Link 
                href="/faq"
                className="inline-flex items-center px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                查看更多常見問題
              </Link>
            </div>
          </section>

          {/* Contact Support */}
          <section className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              需要協助？
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              如果您在使用過程中遇到任何問題，請隨時聯繫我們的客服團隊
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:info@render-resume.com"
                className="inline-flex items-center justify-center px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
              >
                聯絡客服
              </a>
              <a 
                href="https://forms.gle/XdYUd8wRrqS5WJw59"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 border border-cyan-600 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950 rounded-lg transition-colors"
              >
                意見回饋
              </a>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row gap-4 text-center">
              <Link
                href="/about"
                className="text-cyan-600 hover:text-cyan-700 underline underline-offset-4"
              >
                關於我們
              </Link>
              <Link
                href="/faq"
                className="text-cyan-600 hover:text-cyan-700 underline underline-offset-4"
              >
                常見問題
              </Link>
              <Link
                href="/privacy"
                className="text-cyan-600 hover:text-cyan-700 underline underline-offset-4"
              >
                隱私權政策
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 