"use client";

import { useAuth } from "@/components/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { AnalysisScore, LetterGrade } from "@/lib/types/resume-analysis";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import { Check, Copy, Download, Eye, Share2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface AnalysisScoresProps {
  scores: AnalysisScore[];
}

// 解析 AI 評語的函數
const parseAIComment = (comment: string) => {
  // 使用正則表達式提取不同段落，避免使用 s 標志
  const reasoningMatch = comment.match(/【推理過程】([\s\S]*?)(?=【|$)/);
  const scoreMatch = comment.match(/【最終評分】([\s\S]*?)(?=【|$)/);
  const suggestionsMatch = comment.match(/【改進建議】([\s\S]*?)(?=【|$)/);

  return {
    reasoning: reasoningMatch ? reasoningMatch[1].trim() : '',
    finalScore: scoreMatch ? scoreMatch[1].trim() : '',
    suggestions: suggestionsMatch ? suggestionsMatch[1].trim() : '',
    original: comment // 保留原始評語作為備份
  };
};

export function AnalysisScores({ scores }: AnalysisScoresProps) {
  const router = useRouter();
  const shareCardRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  // Convert letter grades to numerical values for calculations
  const gradeToNumber = (grade: LetterGrade): number => {
    switch (grade) {
      case 'A+': return 95;
      case 'A': return 87;
      case 'A-': return 82;
      case 'B+': return 78;
      case 'B': return 75;
      case 'B-': return 70;
      case 'C+': return 68;
      case 'C': return 65;
      case 'C-': return 60;
      case 'F': return 50;
      default: return 0;
    }
  };

  // Calculate overall grade based on average of numerical scores
  const overallNumericalScore = Math.round(scores.reduce((sum, score) => sum + gradeToNumber(score.grade), 0) / scores.length);
  const numberToGrade = (score: number): LetterGrade => {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 77) return 'B+';
    if (score >= 73) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 67) return 'C+';
    if (score >= 63) return 'C';
    if (score >= 60) return 'C-';
    return 'F';
  };

  const overallGrade = numberToGrade(overallNumericalScore);
  const lowGrades = scores.filter(score => gradeToNumber(score.grade) < 80);
  const hasLowGrades = lowGrades.length > 0;

  // Animation states
  const [animatedOverallScore, setAnimatedOverallScore] = useState(0);
  const [animatedScores, setAnimatedScores] = useState<number[]>(new Array(scores.length).fill(0));
  const [isVisible, setIsVisible] = useState(false);
  
  // Share states
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

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

  // Share functions
  const generateShareText = () => {
    const gradeEmoji = getGradeEmoji(overallGrade);
    // 從 user 對象獲取用戶名字，優先順序：user_metadata.full_name > user_metadata.name > email 的用戶名部分
    const userName = user?.user_metadata?.full_name || 
                     user?.user_metadata?.name || 
                     user?.user_metadata?.display_name ||
                     (user?.email ? user.email.split('@')[0] : '我');
    
    return `${userName}的履歷在 RenderResume 上拿到 ${overallGrade} 評級！${gradeEmoji} 你能贏過我嗎？快來試試看吧！✨\n\n馬上測試你的履歷：\nhttps://www.render-resume.com`;
  };

  const getGradeEmoji = (grade: LetterGrade) => {
    if (['A+', 'A', 'A-'].includes(grade)) return '🏆';
    if (['B+', 'B', 'B-'].includes(grade)) return '🎯';
    if (['C+', 'C', 'C-'].includes(grade)) return '📈';
    return '💪';
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('複製成功', {
        description: '已複製到剪貼簿，快分享給你的朋友們吧！',
        duration: 2000,
        position: 'bottom-right',
        icon: '🔗'
      });
    } catch (err) {
      console.error('複製失敗:', err);
    }
  };

  const handleShareText = async () => {
    const shareText = generateShareText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          text: shareText,
        });
      } catch {
        await handleCopyText();
      }
    } else {
      await handleCopyText();
    }
  };

  const handlePreviewImage = async () => {
    if (!shareCardRef.current) return;
    
    setIsGeneratingImage(true);
    try {
      // 暫時移動元素到可見位置進行截圖
      const element = shareCardRef.current;
      const originalStyle = {
        position: element.style.position,
        top: element.style.top,
        left: element.style.left,
        zIndex: element.style.zIndex
      };
      
      // 移動到可見但不影響佈局的位置
      element.style.position = 'fixed';
      element.style.top = '0px';
      element.style.left = '0px';
      element.style.zIndex = '9999';
      
      // 等待一小段時間確保樣式渲染完成
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
        logging: false,
        width: 400,
        height: element.scrollHeight
      });
      
      // 恢復原始位置
      element.style.position = originalStyle.position;
      element.style.top = originalStyle.top;
      element.style.left = originalStyle.left;
      element.style.zIndex = originalStyle.zIndex;
      
      // 設置預覽圖片並顯示對話框
      const imageUrl = canvas.toDataURL('image/png', 1.0);
      setPreviewImageUrl(imageUrl);
      setShowPreviewDialog(true);
      
    } catch {
      toast.error('圖片生成失敗', {
        description: '無法生成分享圖片，請稍後再試',
        duration: 3000,
        position: 'bottom-right',
        icon: '❌'
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDownloadImage = () => {
    if (!previewImageUrl) return;
    
    const link = document.createElement('a');
    link.download = `RenderResume-${overallGrade}-evaluation.png`;
    link.href = previewImageUrl;
    link.click();
    
    toast.success('圖片已下載', {
      description: '分享圖片已成功下載到您的設備',
      duration: 3000,
      position: 'bottom-right',
      icon: '📸'
    });
    
    setShowPreviewDialog(false);
  };

  const handleShareImage = async () => {
    if (!previewImageUrl) return;
    
    try {
      // 將 base64 轉換為 blob
      const response = await fetch(previewImageUrl);
      const blob = await response.blob();
      const file = new File([blob], `RenderResume-${overallGrade}-evaluation.png`, { type: 'image/png' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'RenderResume 履歷評分結果',
          files: [file]
        });
        setShowPreviewDialog(false);
      } else {
        // Fallback 到下載
        handleDownloadImage();
      }
    } catch (err) {
      console.error('分享圖片失敗:', err);
      // Fallback 到下載
      handleDownloadImage();
    }
  };

  const handleStartChat = () => {
    router.push('/smart-chat');
  };

  const handleSkipToSuggestions = () => {
    router.push('/suggestions');
  };

  const getGradeLevel = (grade: LetterGrade) => {
    return {
      "A+": "卓越",
      "A": "優秀",
      "A-": "良好",
      "B+": "滿意",
      "B": "尚可",
      "B-": "合格",
      "C+": "待改進",
      "C": "需改進",
      "C-": "需改進",
      "F": "不合格"
    }[grade];
  };

  const getGradeComment = (grade: LetterGrade) => {
    const displayName = user?.user_metadata.name ? user?.user_metadata.name + ' ' : '您';
    if (['A+', 'A', 'A-'].includes(grade)) return `${displayName}的履歷整體品質很不錯！`;   
    if (['B+', 'B', 'B-'].includes(grade)) return `${displayName}的履歷還有一些地方可以進一步優化`;
    if (['C+', 'C', 'C-'].includes(grade)) return `${displayName}的履歷需要進行較大程度的改進`;
    return `${displayName}的履歷品質嚴重不足，需要全面重新整理`;
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
       {/* 分享功能 */}
      <Card className={`bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800 transition-all duration-700 delay-2500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <CardHeader>
          <CardTitle className="text-center text-purple-800 dark:text-purple-200 flex items-center justify-center">
            <Share2 className="w-5 h-5 mr-2" />
            分享你的成果
          </CardTitle>
          <CardDescription className="text-center">
            炫耀一下你的履歷評分，讓朋友們也來挑戰看看！
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleShareText}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  已複製！
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  分享文字
                </>
              )}
            </Button>
            <Button 
              onClick={handlePreviewImage}
              variant="outline"
              disabled={isGeneratingImage}
              className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/30 flex items-center"
            >
              {isGeneratingImage ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  生成中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  生成預覽圖片
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
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
                {getGradeLevel(overallGrade)}
              </span>
            </div>
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
          const parsedComment = parseAIComment(score.comment);
          
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
                
                {/* AI 評語區塊 - 分開顯示 */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                  <div className="flex items-center mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">🤖 AI 評語</span>
                  </div>
                  
                  {/* 推理過程 */}
                  {parsedComment.reasoning && (
                    <div className="border-l-4 border-cyan-600 pl-3">
                      <h4 className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 mb-1">
                        推理過程
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {parsedComment.reasoning}
                      </p>
                    </div>
                  )}
                  
                  {/* 最終評分 */}
                  {parsedComment.finalScore && (
                    <div className="border-l-4 border-cyan-600 pl-3">
                      <h4 className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 mb-1">
                        最終評分
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {parsedComment.finalScore}
                      </p>
                    </div>
                  )}
                  
                  {/* 改進建議 */}
                  {parsedComment.suggestions && (
                    <div className="border-l-4 border-cyan-600 pl-3">
                      <h4 className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 mb-1">
                        改進建議
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {parsedComment.suggestions}
                      </p>
                    </div>
                  )}
                  
                  {/* 如果沒有匹配到格式化內容，顯示原始評語 */}
                  {!parsedComment.reasoning && !parsedComment.finalScore && !parsedComment.suggestions && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {parsedComment.original}
                    </p>
                  )}
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
              disabled
            >
              <span className="text-lg mr-2">🤖</span>
              開始 AI 問答優化（建置中）
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSkipToSuggestions}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              disabled
            >
              跳過問答，直接查看建議（建置中）
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

      {/* 隱藏的分享卡片 - 用於匯出圖片 */}
      <div 
        ref={shareCardRef}
        className="absolute -top-[9999px] left-0 w-[400px] bg-white shadow-xl rounded-2xl overflow-hidden"
        style={{ 
          fontFamily: 'system-ui, -apple-system, sans-serif',
          zIndex: -1
        }}
      >
        {/* Header with gradient background */}
        <div className="bg-cyan-600 text-white py-1 px-4">
          <div className="flex items-center justify-start space-x-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <span className="text-white font-bold text-lg">✨</span>
            </div>
            <div className="text-left">
              <h1 className="text-lg   text-white leading-tight">RenderResume</h1>
              <p className="text-cyan-100 text-xs leading-tight">懶得履歷．AI 履歷生成器</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Overall Grade Display */}
          <div className="text-center">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">總體評級</h2>
              <div className="flex items-center justify-center">
                <div className="relative">
                  {/* Circular progress background */}
                  <div className="w-28 h-28 rounded-full border-4 border-gray-200 flex items-center justify-center bg-white">
                    <div className={cn('w-24 h-24 rounded-full border-4 flex items-center justify-center',
                      ['A+', 'A', 'A-'].includes(overallGrade) && 'border-green-500 bg-green-50',
                      ['B+', 'B', 'B-'].includes(overallGrade) && 'border-orange-500 bg-orange-50',
                      ['C+', 'C', 'C-'].includes(overallGrade) && 'border-red-500 bg-red-50'
                    )}
                    >  
                      <div className="text-center w-full -translate-y-2">
                        <div className={cn('text-2xl font-bold leading-none', {
                          'text-green-600': ['A+', 'A', 'A-'].includes(overallGrade),
                          'text-orange-600': ['B+', 'B', 'B-'].includes(overallGrade),
                          'text-red-600': ['C+', 'C', 'C-'].includes(overallGrade)
                        })}>
                          {overallGrade}
                        </div>
                        <div className={`text-xs font-medium leading-none mt-1 ${
                          ['A+', 'A', 'A-'].includes(overallGrade) ? 'text-green-600' :
                          ['B+', 'B', 'B-'].includes(overallGrade) ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {getGradeLevel(overallGrade)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xs text-gray-500">{getGradeEmoji(overallGrade)} {getGradeComment(overallGrade)}</div>
              </div>
            </div>
          </div>

          {/* Detailed Scores */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              {scores.slice(0, 4).map((score, index) => {
                const colors = getGradeColors(score.grade);
                return (
                  <div key={index} className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                    <div className="text-xl mb-2">{score.icon}</div>
                    <div className="text-xs font-medium text-gray-700 mb-2 leading-tight">{score.category}</div>
                    <div className={`text-lg font-bold ${colors.stroke}`}>
                      {score.grade}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Call to action */}
          <div className="text-center pt-4 pb-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">你也想測試你的履歷嗎？快上 RenderResume 看看吧！</p>
            <div className="px-4 py-2 rounded-lg inline-block">
              <p className="font-semibold text-sm">
                www.render-resume.com
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 預覽對話框 */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-[95vw] mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              預覽分享圖片
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-center py-4">
            {previewImageUrl && (
              <Image
                src={previewImageUrl} 
                alt="履歷評分分享圖片" 
                width={400}
                height={0}
                className="max-w-full h-auto rounded-lg shadow-lg border border-gray-200"
                style={{ maxHeight: '400px', width: 'auto' }}
              />
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreviewDialog(false)}
              className="flex items-center"
            >
              <X className="w-4 h-4 mr-2" />
              取消
            </Button>
            <Button
              onClick={handleDownloadImage}
              className="bg-cyan-600 hover:bg-cyan-700 text-white flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              下載圖片
            </Button>
            <Button
              onClick={handleShareImage}
              variant="outline"
              className="border-cyan-600 text-cyan-600 hover:bg-cyan-50 flex items-center"
            >
              <Share2 className="w-4 h-4 mr-2" />
              分享圖片
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 