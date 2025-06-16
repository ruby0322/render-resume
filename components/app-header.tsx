"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { usePathname } from "next/navigation";

const AppHeader = () => {
  const pathname = usePathname();
  
  // 計算進度
  const getProgress = () => {
    const progressMap: { [key: string]: number } = {
      '/': 0,
      '/upload': 25,
      '/analyze': 50,
      '/suggestions': 75,
      '/preview': 100,
      '/smart-qa': 75
    };
    return progressMap[pathname] || 0;
  };

  const getStepName = () => {
    const stepMap: { [key: string]: string } = {
      '/': '歡迎',
      '/upload': '上傳作品',
      '/analyze': '分析中',
      '/suggestions': '優化建議',
      '/preview': '預覽完成',
      '/smart-qa': '智慧問答'
    };
    return stepMap[pathname] || '處理中';
  };

  const progress = getProgress();
  const stepName = getStepName();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">📄</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                RenderResume
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                懶得履歷．AI 履歷生成器
              </p>
            </div>
          </Link>

          {/* Progress Section */}
          {progress > 0 && (
            <div className="flex-1 max-w-md mx-8">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stepName}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-cyan-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Theme Switcher */}
          <div className="flex items-center space-x-2">
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};

export { AppHeader };
