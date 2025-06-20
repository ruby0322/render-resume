"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Award,
  Briefcase,
  Calendar,
  Code,
  Download,
  Edit,
  FileText,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Printer,
  Share2,
  Star,
  UserCircle
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PreviewPage() {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  // 模擬生成的履歷數據
  const resumeData = {
    personalInfo: {
      fullName: "張小明",
      title: "全端軟體工程師",
      email: "zhang.xiaoming@email.com",
      phone: "+886 912-345-678",
      location: "台北市, 台灣",
      website: "https://zhangxiaoming.dev"
    },
    summary: "具有3年實戰經驗的全端開發者，專精於React、Node.js和現代Web技術。曾成功開發多個電商平台和移動應用，擅長將創新想法轉化為高品質的數位產品。",
    skills: [
      { category: "前端開發", items: ["React", "TypeScript", "Next.js", "Tailwind CSS"] },
      { category: "後端開發", items: ["Node.js", "Python", "PostgreSQL", "MongoDB"] },
      { category: "設計工具", items: ["Figma", "Adobe XD", "Sketch"] },
      { category: "其他技能", items: ["Git", "Docker", "AWS", "敏捷開發"] }
    ],
    experience: [
      {
        title: "軟體工程師",
        company: "科技創新公司",
        period: "2021年6月 - 2023年12月",
        achievements: [
          "開發電商平台，提升轉換率25%，月活躍用戶達50萬",
          "領導5人開發團隊，按時交付3個重大項目",
          "優化系統性能，減少頁面載入時間40%"
        ]
      },
      {
        title: "前端開發實習生",
        company: "數位行銷公司",
        period: "2020年7月 - 2021年5月",
        achievements: [
          "重新設計公司官網，用戶滿意度提升至4.8星",
          "開發響應式網頁，支援多種設備",
          "參與敏捷開發流程，學習現代開發方法"
        ]
      }
    ],
    projects: [
      {
        name: "智能購物助手",
        description: "基於AI的電商推薦系統，提供個性化商品推薦",
        technologies: ["React", "Python", "TensorFlow", "AWS"],
        achievements: ["提升用戶購買轉換率30%", "日處理推薦請求10萬次"]
      },
      {
        name: "任務管理應用",
        description: "團隊協作工具，支援即時同步和多平台使用",
        technologies: ["Next.js", "Node.js", "Socket.io", "MongoDB"],
        achievements: ["獲得4.9星評分", "服務超過1000個團隊"]
      }
    ],
    education: [
      {
        degree: "資訊工程學士",
        school: "國立台灣大學",
        period: "2017-2021",
        details: ["GPA: 3.8/4.0", "程式設計競賽優勝"]
      }
    ]
  };

  const handleDownload = async (format: 'pdf' | 'docx') => {
    setIsDownloading(true);
    // 模擬下載過程
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 這裡可以實現實際的PDF/DOCX生成和下載
    const link = document.createElement('a');
    link.href = '#'; // 實際應用中這裡會是生成的文件URL
    link.download = `resume_${resumeData.personalInfo.fullName}_${Date.now()}.${format}`;
    link.click();
    
    setIsDownloading(false);
  };

  const handleShare = () => {
    // 實現分享功能
    if (navigator.share) {
      navigator.share({
        title: `${resumeData.personalInfo.fullName}的履歷`,
        text: '查看我的專業履歷',
        url: window.location.href
      });
    } else {
      // 複製到剪貼板
      navigator.clipboard.writeText(window.location.href);
      alert('履歷連結已複製到剪貼板！');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <span className="text-5xl">👁️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            履歷預覽
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            您的專業履歷已生成完成！預覽效果並下載您滿意的版本。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Controls */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Download Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">下載選項</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => handleDownload('pdf')}
                  disabled={isDownloading}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                >
                  {isDownloading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  下載 PDF
                </Button>
                
                <Button 
                  onClick={() => handleDownload('docx')}
                  disabled={isDownloading}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  下載 Word
                </Button>

                <Button 
                  onClick={handleShare}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  分享履歷
                </Button>

                <Button 
                  onClick={() => window.print()}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  列印履歷
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">快速操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => router.push('/suggestions')}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  返回編輯
                </Button>
                
                <Button 
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <UserCircle className="w-4 h-4 mr-2" />
                  建立新履歷
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Resume Preview */}
          <div className="lg:col-span-3">
            <Card className="shadow-lg">
              <CardContent className="p-0">
                {/* Resume Document */}
                <div className="bg-white dark:bg-gray-800 p-8 min-h-[1000px]" id="resume-content">
                  {/* Header */}
                  <div className="border-b-2 border-cyan-600 pb-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {resumeData.personalInfo.fullName}
                    </h1>
                    <h2 className="text-xl text-cyan-600 mb-4">
                      {resumeData.personalInfo.title}
                    </h2>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {resumeData.personalInfo.email}
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-1" />
                        {resumeData.personalInfo.phone}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {resumeData.personalInfo.location}
                      </div>
                      <div className="flex items-center">
                        <Globe className="w-4 h-4 mr-1" />
                        {resumeData.personalInfo.website}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <section className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <UserCircle className="w-5 h-5 mr-2 text-cyan-600" />
                      專業摘要
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {resumeData.summary}
                    </p>
                  </section>

                  {/* Skills */}
                  <section className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <Code className="w-5 h-5 mr-2 text-cyan-600" />
                      技術技能
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {resumeData.skills.map((skillGroup, index) => (
                        <div key={index}>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            {skillGroup.category}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {skillGroup.items.map((skill, skillIndex) => (
                              <span
                                key={skillIndex}
                                className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200 text-xs rounded"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Experience */}
                  <section className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <Briefcase className="w-5 h-5 mr-2 text-cyan-600" />
                      工作經驗
                    </h3>
                    <div className="space-y-4">
                      {resumeData.experience.map((exp, index) => (
                        <div key={index} className="border-l-2 border-cyan-200 dark:border-cyan-800 pl-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {exp.title}
                              </h4>
                              <p className="text-cyan-600 font-medium">{exp.company}</p>
                            </div>
                            <span className="text-sm text-gray-500 flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {exp.period}
                            </span>
                          </div>
                          <ul className="space-y-1">
                            {exp.achievements.map((achievement, achIndex) => (
                              <li key={achIndex} className="text-gray-700 dark:text-gray-300 text-sm flex items-start">
                                <Star className="w-3 h-3 mr-2 mt-1 text-yellow-500 flex-shrink-0" />
                                {achievement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Projects */}
                  <section className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <Award className="w-5 h-5 mr-2 text-cyan-600" />
                      專案經驗
                    </h3>
                    <div className="space-y-4">
                      {resumeData.projects.map((project, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            {project.name}
                          </h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                            {project.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {project.technologies.map((tech, techIndex) => (
                              <span
                                key={techIndex}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                          <ul className="space-y-1">
                            {project.achievements.map((achievement, achIndex) => (
                              <li key={achIndex} className="text-gray-700 dark:text-gray-300 text-sm flex items-start">
                                <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full mr-2 mt-2 flex-shrink-0" />
                                {achievement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Education */}
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <GraduationCap className="w-5 h-5 mr-2 text-cyan-600" />
                      教育背景
                    </h3>
                    <div className="space-y-3">
                      {resumeData.education.map((edu, index) => (
                        <div key={index} className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {edu.degree}
                            </h4>
                            <p className="text-cyan-600">{edu.school}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {edu.details.map((detail, detailIndex) => (
                                <span key={detailIndex} className="text-gray-600 dark:text-gray-400 text-sm">
                                  {detail}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500 flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {edu.period}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-8 flex justify-center">
          <Button 
            onClick={() => router.push('/')}
            size="lg"
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-8"
          >
            創建新的履歷
          </Button>
        </div>
      </div>
    </div>
  );
} 