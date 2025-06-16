"use client";

import { AnalysisScores } from "@/components/analysis-scores";
import { Button } from "@/components/ui/button";
import { AnalysisScore, fetchAnalysisScores } from "@/lib/mock-data";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AnalysisResultsPage() {
  const router = useRouter();
  const [analysisScores, setAnalysisScores] = useState<AnalysisScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleStartChat = () => {
    router.push('/smart-chat');
  };

  const handleSkipToSuggestions = () => {
    router.push('/suggestions');
  };

  const handlePrevious = () => {
    router.push('/analyze');
  };

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            AI 正在分析您的履歷...
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            正在評估各項指標並生成評分
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <span className="text-5xl">📊</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            履歷分析結果
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            基於AI深度分析，為您的履歷各個項目進行評分，並提供詳細的評語和改進建議。
          </p>
        </div>

        {/* 分析評分組件 */}
        <AnalysisScores 
          scores={analysisScores}
        />

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回分析</span>
          </Button>
          
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={handleStartChat}
              className="flex items-center space-x-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 dark:border-cyan-400 dark:text-cyan-400 dark:hover:bg-cyan-950/30"
            >
              <span>🤖</span>
              <span>AI 問答優化</span>
            </Button>
            
            <Button
              onClick={handleSkipToSuggestions}
              className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <span>查看建議</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 