"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { AnalysisScore, ChatMessage, SmartQuestion, fetchSmartQuestions, generateAIResponse } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Send, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from 'react';

interface SmartChatProps {
  analysisScores: AnalysisScore[];
  onComplete: (chatHistory: ChatMessage[]) => void;
  onSkip: () => void;
}

// 問題模板 - 可以輕鬆替換為 API 調用
const QUESTION_TEMPLATES = {
  // 工作經驗相關問題
  work_experience: [
    "請詳細描述您在 [公司名稱] 擔任 [職位] 期間的主要職責和成就？",
    "您在工作中遇到過什麼挑戰，是如何解決的？能分享具體的例子嗎？",
    "您有沒有帶領團隊或跨部門協作的經驗？具體是什麼情況？",
    "在您的工作經歷中，有哪些量化的成果可以分享？比如提升效率、節省成本等。"
  ],
  
  // 技能專長相關問題
  skills: [
    "您最擅長的技術棧是什麼？在實際項目中是如何應用的？",
    "您有哪些認證或證書可以證明您的專業能力？",
    "您是如何持續學習和更新技術知識的？最近學習了什麼新技術？",
    "除了技術技能，您認為自己在軟技能方面有什麼優勢？"
  ],
  
  // 項目作品相關問題
  projects: [
    "請介紹您最自豪的一個項目，包括技術架構、您的角色和最終成果。",
    "這個項目中您遇到了什麼技術難題？是如何解決的？",
    "項目的用戶規模和影響力如何？有具體的數據嗎？",
    "您在這個項目中學到了什麼？對您的職業發展有什麼幫助？"
  ],
  
  // 個人發展相關問題
  personal_development: [
    "您的職業目標是什麼？希望在未來 3-5 年達到什麼樣的職位？",
    "您認為自己的核心競爭力是什麼？與其他候選人相比有什麼優勢？",
    "您如何平衡工作和個人成長？有什麼學習計劃嗎？",
    "您對目標公司和職位有什麼了解？為什麼想要這個機會？"
  ],
  
  // 成果驗證相關問題
  achievements: [
    "您有作品集或 GitHub 可以展示您的能力嗎？",
    "您有沒有獲得過同事、主管或客戶的正面評價？",
    "您參與過哪些有影響力的項目或活動？",
    "您有沒有發表過文章、演講或參與開源項目的經驗？"
  ]
};

// 預設 AI 回應模板
const AI_RESPONSE_TEMPLATES = [
  "很棒的分享！這個經驗非常有價值，讓我們繼續深入了解。",
  "感謝您的詳細說明，這些資訊對履歷優化很有幫助。",
  "這是一個很好的例子，能展現您的專業能力。",
  "您的經驗很豐富，我們可以進一步優化表達方式。",
  "非常好！這樣的具體數據會讓履歷更有吸引力。"
];

// 獲取隨機問題模板
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getRandomQuestionTemplate = (category?: string): string => {
  const templates = QUESTION_TEMPLATES[category as keyof typeof QUESTION_TEMPLATES] || QUESTION_TEMPLATES.personal_development;
  return templates[Math.floor(Math.random() * templates.length)];
};

// 獲取隨機 AI 回應
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getRandomAIResponse = (): string => {
  return AI_RESPONSE_TEMPLATES[Math.floor(Math.random() * AI_RESPONSE_TEMPLATES.length)];
};

export default function SmartChat({ analysisScores, onComplete, onSkip }: SmartChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<SmartQuestion | null>(null);
  const [availableQuestions, setAvailableQuestions] = useState<SmartQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [messageCounter, setMessageCounter] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const maxQuestions = 5; // 最多問5個問題

  const generateUniqueId = useCallback((prefix: string) => {
    setMessageCounter(prev => prev + 1);
    return `${prefix}-${Date.now()}-${messageCounter}`;
  }, [messageCounter]);

  const initializeChat = useCallback(async () => {
    setIsLoading(true);
    try {
      const questions = await fetchSmartQuestions(analysisScores);
      setAvailableQuestions(questions);
      
      if (questions.length > 0) {
        const firstQuestion = questions[0];
        setCurrentQuestion(firstQuestion);
        
        // 添加AI的開場白和第一個問題
        const welcomeMessage: ChatMessage = {
          id: generateUniqueId('ai-welcome'),
          type: 'ai',
          content: `您好！我是您的AI履歷顧問。基於分析結果，我發現有幾個地方可以進一步優化。讓我問您一些問題來幫助您完善履歷內容。`,
          timestamp: new Date()
        };

        const questionMessage: ChatMessage = {
          id: generateUniqueId('ai-question'),
          type: 'ai',
          content: firstQuestion.question,
          timestamp: new Date()
        };

        setMessages([welcomeMessage, questionMessage]);
        setQuestionsAsked(1);
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    } finally {
      setIsLoading(false);
    }
  }, [analysisScores, generateUniqueId]);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  useEffect(() => {
    // 自動滾動到底部
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentInput.trim() || !currentQuestion || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateUniqueId('user'),
      type: 'user',
      content: currentInput.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setIsLoading(true);

    // 重置 textarea 高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await generateAIResponse(currentInput, currentQuestion);
      
      // 添加AI的鼓勵回應
      const encouragementMessage: ChatMessage = {
        id: generateUniqueId('ai-encouragement'),
        type: 'ai',
        content: response.encouragement,
        timestamp: new Date(),
        encouragement: response.encouragement
      };

      setMessages(prev => [...prev, encouragementMessage]);

      // 檢查是否還有問題要問
      if (questionsAsked < maxQuestions && response.nextQuestion) {
        setTimeout(() => {
          const nextQuestionMessage: ChatMessage = {
            id: generateUniqueId('ai-question'),
            type: 'ai',
            content: response.nextQuestion!.question,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, nextQuestionMessage]);
          setCurrentQuestion(response.nextQuestion!);
          setQuestionsAsked(prev => prev + 1);
        }, 1000);
      } else {
        // 結束對話
        setTimeout(() => {
          const endMessage: ChatMessage = {
            id: generateUniqueId('ai-end'),
            type: 'ai',
            content: '謝謝您的詳細回答！這些資訊對優化您的履歷非常有幫助。現在讓我們看看優化後的建議。',
            timestamp: new Date()
          };

          setMessages(prev => {
            const finalMessages = [...prev, endMessage];
            setTimeout(() => onComplete(finalMessages), 1500);
            return finalMessages;
          });
          setCurrentQuestion(null);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to generate AI response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentInput(e.target.value);
    
    // 自動調整高度
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleSkip = () => {
    onSkip();
  };

  // 消息動畫變體
  const messageVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2
      }
    }
  };

  // 載入動畫變體
  const loadingVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  if (availableQuestions.length === 0 && !isLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="text-2xl mr-2">🤖</span>
            智慧問答
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            您的履歷分析結果都很不錯！無需額外的問答優化。
          </p>
          <Button onClick={onSkip} className="bg-cyan-600 hover:bg-cyan-700 text-white">
            繼續查看建議
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-2">🤖</span>
            AI 智慧問答
          </div>
          <div className="text-sm text-gray-500">
            {questionsAsked}/{maxQuestions}
          </div>
        </CardTitle>
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
          <span>幫助您完善履歷內容</span>
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            跳過問答
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 聊天區域 */}
        <div className="h-[400px] border rounded-lg overflow-hidden">
          <ScrollArea className="w-full h-full p-4" ref={scrollAreaRef}>
            <div className="w-full space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    className={cn(`w-full flex`, message.type === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(`flex items-start space-x-2 max-w-[80%] min-w-0`, message.type === 'user' ? 'flex-row-reverse space-x-reverse' : '')}
                    >
                      <div className={cn(`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center`, message.type === 'user'
                          ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      )}>
                        {message.type === 'user' ? <User className="h-4 w-4" /> : <span className="text-lg">🤖</span>}
                      </div>
                      <div
                        className={cn(`rounded-lg px-4 py-2 min-w-0 flex-1`, message.type === 'user'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap chat-message-content">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString('zh-TW', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div
                  variants={loadingVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex justify-start"
                >
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <span className="text-lg">🤖</span>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                      <div className="flex space-x-1">
                        <motion.div 
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div 
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                        />
                        <motion.div 
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 輸入區域 */}
        {currentQuestion && (
          <div className="flex space-x-2 items-end">
            <Textarea
              ref={textareaRef}
              value={currentInput}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder="輸入您的回答... (Shift+Enter 換行，Enter 發送)"
              disabled={isLoading}
              className="flex-1 min-h-[40px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!currentInput.trim() || isLoading}
              size="icon"
              className="flex-shrink-0 bg-cyan-600 hover:bg-cyan-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 