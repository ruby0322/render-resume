"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResumeAnalysisResult } from "@/lib/types/resume-analysis";
import {
  ArrowLeft,
  Award,
  Briefcase,
  Code,
  Download,
  FileText,
  Share2,
  User
} from "lucide-react";
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function ResultsPage() {
  const router = useRouter();
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 從 sessionStorage 讀取分析結果
    const storedResult = sessionStorage.getItem('analysisResult');
    
    if (storedResult) {
      try {
        const result: ResumeAnalysisResult = JSON.parse(storedResult);
        setAnalysisResult(result);
      } catch (error) {
        console.error('Error parsing analysis result:', error);
      }
    } else {
      // 如果沒有結果，返回上傳頁面
      router.push('/upload');
    }
    
    setIsLoading(false);
  }, [router]);

  // 計算技能聯集：從項目的 technologies 和 expertise 合併
  const allSkills = React.useMemo(() => {
    if (!analysisResult) return [];
    const projectTechnologies = analysisResult.projects.flatMap(project => project.technologies);
    const allSkillsSet = new Set([...projectTechnologies, ...analysisResult.expertise]);
    return Array.from(allSkillsSet);
  }, [analysisResult]);

  const handleExportJSON = () => {
    if (!analysisResult) return;
    
    const dataStr = JSON.stringify(analysisResult, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'resume-analysis-result.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleShare = async () => {
    if (!analysisResult) return;
    
    const shareText = `我的履歷分析結果
    
項目數量: ${analysisResult.projects.length}
技能數量: ${analysisResult.expertise.length}
工作經驗: ${analysisResult.work_experiences.length}段
成就數量: ${analysisResult.achievements.length}項

使用 AI 履歷分析工具生成`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '履歷分析結果',
          text: shareText,
        });
      } catch (error) {
        console.log('分享失敗:', error);
      }
    } else {
      // 複製到剪貼板
      navigator.clipboard.writeText(shareText).then(() => {
        alert('結果已複製到剪貼板！');
      });
    }
  };

  const handleNewAnalysis = () => {
    // 清除 sessionStorage
    sessionStorage.removeItem('uploadedFiles');
    sessionStorage.removeItem('additionalText');
    sessionStorage.removeItem('analysisResult');
    
    router.push('/upload');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">載入結果中...</p>
        </div>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">找不到分析結果</p>
          <Button onClick={() => router.push('/upload')}>
            重新開始
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <span className="text-5xl">📊</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            履歷分析結果
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            AI 已完成對您履歷的深度分析，以下是詳細的分析結果。
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Button
            onClick={handleExportJSON}
            variant="outline"
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            匯出 JSON
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex items-center"
          >
            <Share2 className="h-4 w-4 mr-2" />
            分享結果
          </Button>
          <Button
            onClick={handleNewAnalysis}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <FileText className="h-4 w-4 mr-2" />
            新增分析
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6 text-center">
              <User className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                {analysisResult.work_experiences.length}
              </h3>
              <p className="text-sm text-purple-600 dark:text-purple-300">段經歷</p>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <CardContent className="p-6 text-center">
              <Briefcase className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">
                {analysisResult.projects.length}
              </h3>
              <p className="text-sm text-green-600 dark:text-green-300">個項目</p>
            </CardContent>
          </Card>
          
          <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                {analysisResult.achievements.length}
              </h3>
              <p className="text-sm text-orange-600 dark:text-orange-300">項成就</p>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6 text-center">
              <Code className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {allSkills.length}
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-300">項技能</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Results */}
        <div className="space-y-8">
          {/* Work Experience Section - 第一個 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <User className="h-6 w-6 mr-2 text-purple-600" />
                工作經驗
              </CardTitle>
              <CardDescription>{analysisResult.work_experiences_summary}</CardDescription>
            </CardHeader>
            <CardContent>
              {analysisResult.work_experiences.length > 0 ? (
                <div className="space-y-6">
                  {analysisResult.work_experiences.map((exp, index) => (
                    <div key={index} className="border-l-4 border-purple-500 pl-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-r-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {exp.position}
                          </h4>
                          <p className="text-purple-600 dark:text-purple-400 font-medium">
                            {exp.company}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-3 py-1 rounded">
                          {exp.duration}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">
                        {exp.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-gray-400 dark:text-gray-500 mb-2">
                    <User className="h-12 w-12 mx-auto opacity-50" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">未提取到工作經驗</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    AI無法從您的履歷中識別出工作經歷描述
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projects Section - 第二個 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Briefcase className="h-6 w-6 mr-2 text-green-600" />
                項目分析
              </CardTitle>
              <CardDescription>{analysisResult.projects_summary}</CardDescription>
            </CardHeader>
            <CardContent>
              {analysisResult.projects.length > 0 ? (
                <div className="grid gap-6">
                  {analysisResult.projects.map((project, index) => (
                    <div key={index} className="border-l-4 border-green-500 pl-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-r-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {project.name}
                        </h4>
                        {project.duration && (
                          <span className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-3 py-1 rounded">
                            {project.duration}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {project.description}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">技術棧</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {project.technologies.map((tech, techIndex) => (
                              <span
                                key={techIndex}
                                className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">角色</span>
                          <p className="text-gray-800 dark:text-gray-200 mt-1">{project.role}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">主要貢獻</span>
                          <p className="text-gray-800 dark:text-gray-200 mt-1">{project.contribution}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-gray-400 dark:text-gray-500 mb-2">
                    <Briefcase className="h-12 w-12 mx-auto opacity-50" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">未提取到項目信息</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    AI無法從您的履歷中識別出項目經驗，請檢查履歷內容是否包含項目描述
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Achievements Section - 第三個 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Award className="h-6 w-6 mr-2 text-orange-600" />
                成就與亮點
              </CardTitle>
              <CardDescription>{analysisResult.achievements_summary}</CardDescription>
            </CardHeader>
            <CardContent>
              {analysisResult.achievements.length > 0 ? (
                <div className="grid gap-3">
                  {analysisResult.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 flex-1">
                        {achievement}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-gray-400 dark:text-gray-500 mb-2">
                    <Award className="h-12 w-12 mx-auto opacity-50" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">未提取到成就信息</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    AI無法從您的履歷中識別出成就亮點，請檢查履歷內容是否包含量化的工作成果
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills Section - 第四個 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Code className="h-6 w-6 mr-2 text-blue-600" />
                技能分析
              </CardTitle>
              <CardDescription>
                {analysisResult.expertise_summary || "從項目技術棧和專業技能中提取的綜合技能清單"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allSkills.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {allSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-gray-400 dark:text-gray-500 mb-2">
                    <Code className="h-12 w-12 mx-auto opacity-50" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">未提取到技能信息</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    AI無法從您的履歷中識別出技能專長，請檢查履歷內容是否包含技能描述
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="outline" 
            onClick={() => router.push('/analyze')}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回分析
          </Button>
          
          <Button 
            onClick={handleNewAnalysis}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            開始新的分析
          </Button>
        </div>
      </div>
    </div>
  );
} 