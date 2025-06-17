"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AnalysisScore, LetterGrade } from "@/lib/types/resume-analysis";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AnalysisScoresProps {
  scores: AnalysisScore[];
}

export function AnalysisScores({ scores }: AnalysisScoresProps) {
  const router = useRouter();
  
  // Convert letter grades to numerical values for calculations
  const gradeToNumber = (grade: LetterGrade): number => {
    switch (grade) {
      case 'A+': return 97;
      case 'A': return 92;
      case 'A-': return 87;
      case 'B+': return 82;
      case 'B': return 77;
      case 'B-': return 72;
      case 'C+': return 65;
      case 'C': return 55;
      case 'C-': return 45;
      case 'F': return 30;
      default: return 0;
    }
  };

  // Calculate overall grade based on average of numerical scores
  const overallNumericalScore = Math.round(scores.reduce((sum, score) => sum + gradeToNumber(score.grade), 0) / scores.length);
  const numberToGrade = (score: number): LetterGrade => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 50) return 'C';
    if (score >= 40) return 'C-';
    return 'F';
  };

  const overallGrade = numberToGrade(overallNumericalScore);
  const lowGrades = scores.filter(score => gradeToNumber(score.grade) < 80);
  const hasLowGrades = lowGrades.length > 0;

  // Animation states
  const [animatedOverallScore, setAnimatedOverallScore] = useState(0);
  const [animatedScores, setAnimatedScores] = useState<number[]>(new Array(scores.length).fill(0));
  const [isVisible, setIsVisible] = useState(false);

  // Animation effects
  useEffect(() => {
    // Start visibility animation
    setIsVisible(true);

    // Animate overall score
    const overallTimer = setTimeout(() => {
      let currentScore = 0;
      const increment = overallNumericalScore / 50; // 50 steps for smooth animation
      const overallInterval = setInterval(() => {
        currentScore += increment;
        if (currentScore >= overallNumericalScore) {
          setAnimatedOverallScore(overallNumericalScore);
          clearInterval(overallInterval);
        } else {
          setAnimatedOverallScore(Math.round(currentScore));
        }
      }, 20); // 20ms intervals for 1 second total animation

      return () => clearInterval(overallInterval);
    }, 500); // Start after 0.5s delay

    // Animate individual scores with staggered timing
    scores.forEach((score, index) => {
      const numericalScore = gradeToNumber(score.grade);
      setTimeout(() => {
        let currentScore = 0;
        const increment = numericalScore / 50;
        const interval = setInterval(() => {
          currentScore += increment;
          if (currentScore >= numericalScore) {
            setAnimatedScores(prev => {
              const newScores = [...prev];
              newScores[index] = numericalScore;
              return newScores;
            });
            clearInterval(interval);
          } else {
            setAnimatedScores(prev => {
              const newScores = [...prev];
              newScores[index] = Math.round(currentScore);
              return newScores;
            });
          }
        }, 20);

        return () => clearInterval(interval);
      }, 800 + index * 200); // Staggered start times
    });

    return () => {
      clearTimeout(overallTimer);
    };
  }, [overallNumericalScore, scores]);

  const handleStartChat = () => {
    router.push('/smart-chat');
  };

  const handleSkipToSuggestions = () => {
    router.push('/suggestions');
  };

  const getGradeLevel = (grade: LetterGrade) => {
    if (['A+', 'A', 'A-'].includes(grade)) return "優秀";
    if (['B+', 'B', 'B-'].includes(grade)) return "良好";
    if (['C+', 'C', 'C-'].includes(grade)) return "需要改進";
    return "不合格";
  };

  const getGradeComment = (grade: LetterGrade) => {
    if (['A+', 'A', 'A-'].includes(grade)) return "您的履歷整體品質很不錯！";
    if (['B+', 'B', 'B-'].includes(grade)) return "還有一些地方可以進一步優化";
    if (['C+', 'C', 'C-'].includes(grade)) return "您的履歷需要進行較大程度的改進";
    return "履歷品質嚴重不足，需要全面重新整理";
  };

  const getGradeColors = (grade: LetterGrade) => {
    if (['A+', 'A', 'A-'].includes(grade)) {
      return {
        stroke: "text-green-500",
        fill: "fill-green-500",
        background: "text-green-100 dark:text-green-900"
      };
    } else if (['B+', 'B', 'B-'].includes(grade)) {
      return {
        stroke: "text-orange-500",
        fill: "fill-orange-500",
        background: "text-orange-100 dark:text-orange-900"
      };
    } else {
      return {
        stroke: "text-red-500",
        fill: "fill-red-500",
        background: "text-red-100 dark:text-red-900"
      };
    }
  };

  const gradeColors = getGradeColors(overallGrade);

  return (
    <div className={`space-y-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {/* Overall Grade */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-gray-900 dark:text-white">
            📊 履歷分析評分
          </CardTitle>
          <CardDescription>
            基於 AI 深度分析的綜合評估結果
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center items-center justify-center flex flex-col">
          <div className="relative flex items-center justify-center w-40 h-40 mb-4">
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 36 36">
              {/* Background circle */}
              <path
                d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Filled progress circle with animation */}
              <path
                d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${animatedOverallScore}, 100`}
                strokeLinecap="round"
                className={gradeColors.stroke}
                style={{
                  transition: 'stroke-dasharray 0.3s ease-out'
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${gradeColors.stroke.replace('text-', 'text-')} transition-all duration-300`}>
                {numberToGrade(animatedOverallScore)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                等第制
              </span>
            </div>
          </div>
          <div className={`inline-block px-4 py-2 rounded-full mb-2 ${gradeColors.background} ${gradeColors.stroke} transition-all duration-500 delay-1000 ${isVisible ? 'scale-100' : 'scale-95'}`}>
            <p className="text-lg font-bold">
              {getGradeLevel(overallGrade)}
            </p>
          </div>
          <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto transition-all duration-500 delay-1200">
            {getGradeComment(overallGrade)}
          </p>
        </CardContent>
      </Card>

      {/* Detailed Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scores.map((score, index) => {
          const colors = getGradeColors(score.grade);
          const animatedScore = animatedScores[index] || 0;
          const animatedGrade = numberToGrade(animatedScore);
          return (
            <Card 
              key={index} 
              className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ 
                transitionDelay: `${800 + index * 200}ms` 
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center text-gray-900 dark:text-white">
                  <span className="text-2xl mr-3">{score.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold">{score.category}</span>
                      <span className={`text-lg font-bold ${colors.stroke} transition-all duration-300`}>
                        {animatedGrade}
                      </span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress 
                  value={animatedScore} 
                  className="h-3 mb-3"
                  style={{
                    transition: 'all 0.3s ease-out'
                  }}
                />
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                  {score.description}
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-white">AI 評語：</span>
                    {score.comment}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 操作選項 */}
      <Card className={`bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-cyan-200 dark:border-cyan-800 transition-all duration-700 delay-2000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <CardHeader>
          <CardTitle className="text-center text-cyan-800 dark:text-cyan-200">下一步選擇</CardTitle>
          <CardDescription className="text-center">
            {hasLowGrades 
              ? `發現 ${lowGrades.length} 個項目評分低於 B+，建議通過 AI 問答來完善這些內容`
              : '您的履歷各項評分都很不錯，可以直接進行生成'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleStartChat}
              className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg hover:shadow-xl transition-all"
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

          {hasLowGrades && (
            <div className="mt-4 p-4 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg border border-cyan-200 dark:border-cyan-800">
              <h4 className="text-sm font-medium text-cyan-800 dark:text-cyan-200 mb-2 flex items-center">
                <span className="mr-2">⚠️</span>
                建議優化的項目：
              </h4>
              <div className="space-y-2">
                {lowGrades.map((score, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-cyan-100 dark:border-cyan-700">
                    <span className="text-sm text-cyan-700 dark:text-cyan-300 font-medium">
                      {score.category}
                    </span>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                      {score.grade}
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