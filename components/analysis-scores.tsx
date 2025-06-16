"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AnalysisScore } from "@/lib/mock-data";
import { useRouter } from "next/navigation";

interface AnalysisScoresProps {
  scores: AnalysisScore[];
}

export function AnalysisScores({ scores }: AnalysisScoresProps) {
  const router = useRouter();
  const overallScore = Math.round(scores.reduce((sum, score) => sum + score.score, 0) / scores.length);
  const lowScores = scores.filter(score => score.score < 80);
  const hasLowScores = lowScores.length > 0;

  const handleStartChat = () => {
    router.push('/smart-chat');
  };

  const handleSkipToSuggestions = () => {
    router.push('/suggestions');
  };

  const getScoreLevel = (score: number) => {
    if (score >= 80) return "優秀";
    if (score >= 60) return "良好";
    return "需要改進";
  };

  const getScoreComment = (score: number) => {
    if (score >= 80) return "您的履歷整體品質很不錯！";
    if (score >= 60) return "還有一些地方可以進一步優化";
    return "您的履歷需要進行較大程度的改進";
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-gray-900 dark:text-white">
            履歷整體評分
          </CardTitle>
          <CardDescription>
            基於 AI 分析的綜合評估結果
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${overallScore}, 100`}
                className="text-cyan-600"
              />
              <path
                d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-200 dark:text-gray-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {overallScore}
              </span>
            </div>
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {getScoreLevel(overallScore)}
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            {getScoreComment(overallScore)}
          </p>
        </CardContent>
      </Card>

      {/* Detailed Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scores.map((score, index) => (
          <Card key={index} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center text-gray-900 dark:text-white">
                <span className="text-2xl mr-2">{score.icon}</span>
                {score.category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {score.score}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  / 100
                </span>
              </div>
              <Progress 
                value={score.score} 
                className="h-2 mb-3"
              />
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {score.description}
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">AI 評語：</span>
                  {score.comment}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 操作選項 */}
      <Card className="bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800">
        <CardHeader>
          <CardTitle className="text-center">下一步選擇</CardTitle>
          <CardDescription className="text-center">
            {hasLowScores 
              ? `發現 ${lowScores.length} 個項目分數低於 80 分，建議通過 AI 問答來完善這些內容`
              : '您的履歷各項評分都很不錯，可以直接進行生成'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleStartChat}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <span className="text-lg mr-2">🤖</span>
              開始 AI 問答優化
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSkipToSuggestions}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              跳過問答，直接查看建議
            </Button>
          </div>

          {hasLowScores && (
            <div className="mt-4 p-4 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
              <h4 className="text-sm font-medium text-cyan-800 dark:text-cyan-200 mb-2">
                建議優化的項目：
              </h4>
              <div className="space-y-1">
                {lowScores.map((score, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <span className="text-lg">⚠️</span>
                    <span className="text-cyan-700 dark:text-cyan-300">
                      {score.category} ({score.score}/100)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 