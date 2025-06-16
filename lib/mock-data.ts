// 假資料管理 - 未來替換為真實API
export interface AnalysisScore {
  category: string;
  score: number;
  maxScore: number;
  description: string;
  comment: string;
  icon: string;
  suggestions: string[];
}

export interface ChatMessage {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  encouragement?: string;
}

export interface SmartQuestion {
  id: string;
  question: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  followUpQuestions?: string[];
}

// 分析評分假資料
export const mockAnalysisScores: AnalysisScore[] = [
  {
    category: '個人信息',
    score: 85,
    maxScore: 100,
    description: '基本信息完整，聯絡方式清楚',
    comment: '聯絡資訊完整，專業形象良好，建議加強個人品牌描述',
    icon: '👤',
    suggestions: ['建議加入LinkedIn個人檔案連結', '可以考慮加入個人網站']
  },
  {
    category: '專業摘要',
    score: 72,
    maxScore: 100,
    description: '摘要內容稍顯簡單，缺乏個人特色',
    comment: '經驗描述較為簡單，缺乏量化成果和具體貢獻說明',
    icon: '💼',
    suggestions: ['增加3-5年的具體工作經驗描述', '強調核心專業技能', '加入職涯目標']
  },
  {
    category: '作品項目',
    score: 78,
    maxScore: 100,
    description: '項目經驗豐富，但缺乏量化數據',
    comment: '技能列表豐富但缺乏具體證明，建議添加技能等級或認證',
    icon: '🛠️',
    suggestions: ['加入項目規模和影響力數據', '詳述技術挑戰和解決方案', '補充團隊協作經驗']
  },
  {
    category: '工作經歷',
    score: 68,
    maxScore: 100,
    description: '工作經歷時間軸清楚，但成就描述不夠具體',
    comment: '經驗描述較為簡單，缺乏量化成果和具體貢獻說明',
    icon: '💼',
    suggestions: ['用數字量化工作成果', '突出核心責任和貢獻', '增加獲得的認可或獎勵']
  },
  {
    category: '技術能力',
    score: 90,
    maxScore: 100,
    description: '技術技能完整且與目標職位匹配度高',
    comment: '教育背景與目標職位高度匹配，學習成果突出',
    icon: '🎓',
    suggestions: ['可以按熟練程度分類展示', '加入最新學習的技術']
  },
  {
    category: '成果驗證',
    score: 65,
    maxScore: 100,
    description: '缺乏具體的成果證明和第三方驗證',
    comment: '結構清晰但版面略顯單調，建議優化視覺層次感',
    icon: '📋',
    suggestions: ['加入客戶推薦信或評價', '展示獲得的證書或認證', '補充作品集連結']
  }
];

// 智慧問答假資料
export const mockSmartQuestions: SmartQuestion[] = [
  {
    id: '1',
    question: '您在最近的專案中，具體負責了哪些核心功能的開發？能分享一下技術挑戰和解決方案嗎？',
    category: '作品項目',
    priority: 'high',
    followUpQuestions: [
      '這個專案的用戶規模大約是多少？',
      '您在這個專案中最自豪的技術突破是什麼？'
    ]
  },
  {
    id: '2',
    question: '在您的工作經歷中，有沒有帶來具體業績提升的例子？比如提高了多少效率或節省了多少成本？',
    category: '工作經歷',
    priority: 'high',
    followUpQuestions: [
      '這個改善是如何被主管或同事認可的？',
      '您是否因此獲得了任何獎勵或升遷機會？'
    ]
  },
  {
    id: '3',
    question: '您希望在未來3-5年內達到什麼樣的職業目標？這與您目前的技能發展方向是否一致？',
    category: '專業摘要',
    priority: 'medium',
    followUpQuestions: [
      '您認為達成這個目標還需要補強哪些技能？',
      '有沒有正在進行的學習計畫？'
    ]
  },
  {
    id: '4',
    question: '您有沒有一些作品或專案的作品集可以展示？或者有客戶、同事的推薦？',
    category: '成果驗證',
    priority: 'high',
    followUpQuestions: [
      '這些作品最能展現您哪方面的能力？',
      '是否有量化的成果數據可以分享？'
    ]
  },
  {
    id: '5',
    question: '在團隊合作中，您通常扮演什麼角色？有沒有領導或協調團隊的經驗？',
    category: '工作經歷',
    priority: 'medium',
    followUpQuestions: [
      '您是如何處理團隊中的意見分歧的？',
      '有沒有跨部門協作的經驗？'
    ]
  }
];

// AI鼓勵話語
export const mockEncouragements = [
  '很棒的分享！這個經驗非常有價值。',
  '這是一個很好的例子，能展現您的專業能力。',
  '感謝您的詳細說明，這些資訊對履歷優化很有幫助。',
  '您的經驗很豐富，我們可以進一步優化表達方式。',
  '這個回答很有說服力，讓我們繼續深入了解。',
  '非常好！這樣的具體數據會讓履歷更有吸引力。',
  '您的思考很深入，這些洞察很有價值。',
  '完美！這正是雇主想要看到的能力證明。'
];

// 根據缺失的評分項目生成對應問題
export function generateQuestionsForLowScores(scores: AnalysisScore[]): SmartQuestion[] {
  const lowScoreCategories = scores
    .filter(score => score.score < 80)
    .map(score => score.category);
  
  return mockSmartQuestions.filter(question => 
    lowScoreCategories.some(category => 
      question.category.includes(category) || 
      category.includes(question.category)
    )
  );
}

// 模擬API調用 - 獲取分析評分
export async function fetchAnalysisScores(): Promise<AnalysisScore[]> {
  // 模擬API延遲
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return [
    {
      category: "個人資訊",
      score: 85,
      maxScore: 100,
      description: "基本資訊完整度和專業性評估",
      comment: "聯絡資訊完整，專業形象良好，建議加強個人品牌描述",
      icon: "👤",
      suggestions: ['建議加入LinkedIn個人檔案連結', '可以考慮加入個人網站']
    },
    {
      category: "技能專長", 
      score: 78,
      maxScore: 100,
      description: "技術技能和軟技能的展示效果",
      comment: "技能列表豐富但缺乏具體證明，建議添加技能等級或認證",
      icon: "🛠️",
      suggestions: ['增加3-5年的具體工作經驗描述', '強調核心專業技能', '加入職涯目標']
    },
    {
      category: "工作經驗",
      score: 72,
      maxScore: 100,
      description: "工作經歷的完整性和相關性",
      comment: "經驗描述較為簡單，缺乏量化成果和具體貢獻說明",
      icon: "💼",
      suggestions: ['用數字量化工作成果', '突出核心責任和貢獻', '增加獲得的認可或獎勵']
    },
    {
      category: "項目作品",
      score: 88,
      maxScore: 100,
      description: "項目展示的質量和多樣性",
      comment: "項目展示豐富且具有代表性，技術棧覆蓋面廣",
      icon: "🚀",
      suggestions: ['加入項目規模和影響力數據', '詳述技術挑戰和解決方案', '補充團隊協作經驗']
    },
    {
      category: "教育背景",
      score: 90,
      maxScore: 100,
      description: "學歷和相關課程的匹配度",
      comment: "教育背景與目標職位高度匹配，學習成果突出",
      icon: "🎓",
      suggestions: ['可以按熟練程度分類展示', '加入最新學習的技術']
    },
    {
      category: "整體結構",
      score: 75,
      maxScore: 100,
      description: "履歷版面設計和信息組織",
      comment: "結構清晰但版面略顯單調，建議優化視覺層次感",
      icon: "📋",
      suggestions: ['加入客戶推薦信或評價', '展示獲得的證書或認證', '補充作品集連結']
    }
  ];
}

// 模擬API調用 - 獲取智慧問題
export async function fetchSmartQuestions(scores: AnalysisScore[]): Promise<SmartQuestion[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return generateQuestionsForLowScores(scores);
}

// 模擬API調用 - 生成AI回應
export async function generateAIResponse(userMessage: string, questionContext: SmartQuestion): Promise<{ encouragement: string; nextQuestion?: SmartQuestion }> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const encouragement = mockEncouragements[Math.floor(Math.random() * mockEncouragements.length)];
  
  // 根據上下文選擇下一個問題
  const remainingQuestions = mockSmartQuestions.filter(q => q.id !== questionContext.id);
  const nextQuestion = remainingQuestions.length > 0 
    ? remainingQuestions[Math.floor(Math.random() * remainingQuestions.length)]
    : undefined;
  
  return {
    encouragement,
    nextQuestion
  };
} 