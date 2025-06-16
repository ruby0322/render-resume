"use client";

import SmartChat from "@/components/smart-chat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalysisScore, ChatMessage, fetchAnalysisScores } from "@/lib/mock-data";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SmartChatPage() {
  const [analysisScores, setAnalysisScores] = useState<AnalysisScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadAnalysisScores();
  }, []);

  const loadAnalysisScores = async () => {
    setIsLoading(true);
    try {
      const scores = await fetchAnalysisScores();
      setAnalysisScores(scores);
    } catch (error) {
      console.error('Failed to load analysis scores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatComplete = (history: ChatMessage[]) => {
    setIsCompleted(true);
    
    // 將聊天記錄存儲到 localStorage 以便在建議頁面使用
    localStorage.setItem('chatHistory', JSON.stringify(history));
    
    // 延遲跳轉，讓用戶看到完成狀態
    setTimeout(() => {
      router.push('/suggestions');
    }, 2000);
  };

  const handleSkipToSuggestions = () => {
    router.push('/suggestions');
  };

  const handlePrevious = () => {
    router.push('/analysis-results');
  };

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            正在準備 AI 問答...
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            正在載入您的分析結果
          </p>
        </div>
      </div>
    );
  }

  // 問答完成狀態
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <span className="text-6xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            問答優化完成！
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            感謝您的詳細回答，正在為您生成個性化建議...
          </p>
          <div className="animate-pulse">
            <div className="h-2 bg-cyan-200 rounded-full w-64 mx-auto">
              <div className="h-2 bg-cyan-600 rounded-full w-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <span className="text-5xl">🤖</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            AI 智慧問答
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            通過簡單的問答互動，幫助您補齊履歷中的關鍵信息，讓 AI 為您生成更精準的優化建議。
          </p>
        </div>

        {/* 進度指示器 */}
        <div className="max-w-2xl mx-auto mb-8">
          <Card className="bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-cyan-700 dark:text-cyan-400">
                優化流程
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                    ✓
                  </div>
                  <span className="text-gray-600 dark:text-gray-300">履歷分析</span>
                </div>
                <div className="flex-1 h-px bg-cyan-300 dark:bg-cyan-700"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-cyan-500 text-white rounded-full flex items-center justify-center text-xs">
                    2
                  </div>
                  <span className="text-cyan-600 dark:text-cyan-400 font-medium">AI 問答</span>
                </div>
                <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 text-gray-500 rounded-full flex items-center justify-center text-xs">
                    3
                  </div>
                  <span className="text-gray-500 dark:text-gray-400">優化建議</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 智慧問答組件 */}
        <SmartChat 
          analysisScores={analysisScores}
          onComplete={handleChatComplete}
          onSkip={handleSkipToSuggestions}
        />

        {/* Navigation */}
        <div className="flex justify-between mt-8 max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={handlePrevious}
            className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回分析結果</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={handleSkipToSuggestions}
            className="flex items-center space-x-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 dark:border-cyan-400 dark:text-cyan-400 dark:hover:bg-cyan-950/30"
          >
            <span>跳過問答</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 