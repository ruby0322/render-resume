import { z } from 'zod';
import {
    DEFAULT_AI_CONFIG,
    SCORE_CATEGORIES,
    generateSystemPrompt
} from './config/resume-analysis-config';

// 重新導出 AIConfig，保持向後兼容
export interface AIConfig {
    modelName: string;
    temperature: number;
    systemPrompt: string;
    maxConcurrency?: number;
}

// 支援的文檔類型
export const SUPPORTED_FILE_TYPES = {
    PDF: ['pdf'],
    IMAGES: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    DOCUMENTS: ['txt', 'md', 'json', 'csv']
} as const;

export type SupportedFileType = keyof typeof SUPPORTED_FILE_TYPES;

// 文檔上傳介面
export interface DocumentUpload {
    file: File | Buffer;
    fileName: string;
    fileType: string;
    content?: string;
}

export interface FileAnalysisOptions {
    documents: DocumentUpload[];
    additionalText?: string;
    useVision?: boolean;
}

// 使用動態配置
export const DEFAULT_CONFIG: AIConfig = {
    modelName: DEFAULT_AI_CONFIG.modelName,
    temperature: DEFAULT_AI_CONFIG.temperature ?? 0.2,
    systemPrompt: generateSystemPrompt(SCORE_CATEGORIES),
    maxConcurrency: DEFAULT_AI_CONFIG.maxConcurrency
};

// 定義回應的 Schema - 簡化版本，符合 OpenAI API 要求
export const ResumeAnalysisSchema = z.object({
    projects: z.array(z.object({
        name: z.string().describe("項目名稱"),
        description: z.string().describe("技術挑戰與解決方案"),
        technologies: z.array(z.string()).describe("使用的技術"),
        role: z.string().describe("擔任角色"),
        contribution: z.string().describe("貢獻"),
        duration: z.string().describe("進行期間")
    })),
    expertise: z.array(z.string()).describe("完整技術聯集列表"),
    projects_summary: z.string().describe("項目摘要"),
    expertise_summary: z.string().describe("技能摘要"),
    work_experiences: z.array(z.object({
        company: z.string().describe("公司名稱"),
        position: z.string().describe("職位"),
        duration: z.string().describe("工作期間"),
        description: z.string().describe("工作描述"),
        contribution: z.string().describe("個人貢獻"),
        technologies: z.array(z.string()).describe("使用的技術")
    })),
    work_experiences_summary: z.string().describe("工作經驗摘要"),
    education_background: z.array(z.object({
        institution: z.string().describe("學校名稱"),
        degree: z.string().describe("學位"),
        major: z.string().describe("主修科系"),
        duration: z.string().describe("在學期間"),
        gpa: z.string().describe("成績"),
        courses: z.array(z.string()).describe("相關課程"),
        achievements: z.array(z.string()).describe("學術成就")
    })),
    education_summary: z.string().describe("教育背景摘要"),
    achievements: z.array(z.string()).describe("成就列表"),
    achievements_summary: z.string().describe("成就摘要"),
    missing_content: z.object({
        critical_missing: z.array(z.string()).describe("關鍵缺失項目"),
        recommended_additions: z.array(z.string()).describe("建議補充內容"),
        impact_analysis: z.string().describe("缺失內容對整體評估的影響分析"),
        priority_suggestions: z.array(z.string()).describe("優先補強建議")
    }).describe("缺失內容分析"),
    scores: z.array(z.object({
        category: z.string().describe("評分類別"),
        grade: z.enum(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'] as const).describe('Grade (A+, A, A-, B+, B, B-, C+, C, C-, D, F)'),
        description: z.string().describe("評分描述"),
        comment: z.string().describe("AI評語"),
        icon: z.string().describe("圖示表情符號"),
        suggestions: z.array(z.string()).describe("改進建議")
    })).describe("技術履歷細節完整度評分列表")
});

export type ResumeAnalysisResult = z.infer<typeof ResumeAnalysisSchema>;

// OpenAI API 介面定義
interface OpenAIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{
        type: 'text' | 'image_url';
        text?: string;
        image_url?: {
            url: string;
            detail?: string;
        };
    }>;
}

interface OpenAIChatCompletionRequest {
    model: string;
    messages: OpenAIMessage[];
    temperature?: number;
    max_tokens?: number;
    response_format?: {
        type: 'json_object' | 'json_schema';
        json_schema?: {
            name: string;
            schema: Record<string, unknown>;
            strict?: boolean;
        };
    };
    seed?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    user?: string;
}

interface OpenAIChatCompletionChoice {
    index: number;
    message: {
        role: string;
        content: string;
    };
    finish_reason: string;
}

interface OpenAIChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: OpenAIChatCompletionChoice[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    system_fingerprint?: string;
}

export interface NativeOpenAIClientOptions {
    apiKey: string;
    config?: AIConfig;
    baseURL?: string;
}

/**
 * Simple JSON Schema for OpenAI compatibility
 * Uses json_object mode instead of json_schema for better compatibility
 */
function getSimpleJsonSchema(): Record<string, unknown> {
    console.log('🔄 [Native OpenAI Client] Using simplified JSON object mode for OpenAI compatibility');
    
    // Return a simple description for json_object mode
    return {
        type: "object",
        description: "Resume analysis result with structured fields for projects, expertise, work experiences, education, achievements, missing content analysis, and detailed scores"
    };
}

/**
 * Native OpenAI Client with Direct API Integration
 * 
 * This client directly calls OpenAI's REST API while maintaining all LangChain configurations:
 * 
 * Features:
 * - Direct OpenAI API calls using fetch
 * - Structured output using OpenAI's native JSON schema mode
 * - Vision model support for image and PDF processing
 * - Automatic JSON schema conversion from Zod schemas
 * - Comprehensive error handling and validation
 * - Maintains compatibility with existing LangChain-based code
 * - Uses exact same configuration and prompts as LangChain version
 */
export class NativeOpenAIClient {
    private apiKey: string;
    private config: AIConfig;
    private baseURL: string;
    private jsonSchema: Record<string, unknown>;

    constructor(options: NativeOpenAIClientOptions) {
        console.log('🤖 [Native OpenAI Client] Initializing with options:', {
            modelName: options.config?.modelName || DEFAULT_CONFIG.modelName,
            temperature: options.config?.temperature || DEFAULT_CONFIG.temperature,
            hasSystemPrompt: !!(options.config?.systemPrompt),
            dynamicPrompt: !options.config?.systemPrompt,
            baseURL: options.baseURL || 'https://api.openai.com/v1'
        });

        this.apiKey = options.apiKey;
        this.baseURL = options.baseURL || 'https://api.openai.com/v1';
        
        // 使用提供的配置或預設配置，並動態生成 system prompt
        this.config = {
            ...DEFAULT_CONFIG,
            ...options.config
        };
        
        // 如果沒有提供 systemPrompt，則動態生成
        if (!options.config?.systemPrompt) {
            this.config.systemPrompt = generateSystemPrompt(SCORE_CATEGORIES);
        }

        console.log('📋 [Native OpenAI Client] Final config:', {
            modelName: this.config.modelName,
            temperature: this.config.temperature,
            promptLength: this.config.systemPrompt?.length || 0
        });

        // Pre-generate JSON schema for structured output
        try {
            this.jsonSchema = getSimpleJsonSchema();
            console.log('✅ [Native OpenAI Client] JSON schema pre-generated successfully');
        } catch (error) {
            console.warn('⚠️ [Native OpenAI Client] Failed to pre-generate JSON schema:', error);
            this.jsonSchema = {};
        }
    }

    // 智能解析 AI 回應中的 JSON
    private parseAIResponse(content: string): unknown {
        console.log('🔍 [Native OpenAI Client] Starting smart JSON parsing');
        
        // 移除所有可能的 markdown 代碼塊標記
        let cleanContent = content;
        
        // 處理 ```json...``` 格式
        const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
        const jsonBlockMatch = cleanContent.match(jsonBlockRegex);
        if (jsonBlockMatch) {
            console.log('📋 [Native OpenAI Client] Found JSON code block, extracting...');
            cleanContent = jsonBlockMatch[1];
        }
        
        // 處理單獨的 ``` 包圍的內容
        const codeBlockRegex = /```\s*([\s\S]*?)\s*```/;
        const codeBlockMatch = cleanContent.match(codeBlockRegex);
        if (codeBlockMatch && !jsonBlockMatch) {
            console.log('📋 [Native OpenAI Client] Found generic code block, extracting...');
            cleanContent = codeBlockMatch[1];
        }
        
        // 尋找 JSON 對象 - 從第一個 { 到最後一個 }
        const jsonObjectRegex = /\{[\s\S]*\}/;
        const jsonObjectMatch = cleanContent.match(jsonObjectRegex);
        if (jsonObjectMatch) {
            console.log('📋 [Native OpenAI Client] Found JSON object pattern');
            cleanContent = jsonObjectMatch[0];
        }
        
        // 清理常見的非 JSON 字符
        cleanContent = cleanContent
            .replace(/^[^\{]*/, '') // 移除開頭非 { 的字符
            .replace(/[^\}]*$/, '') // 移除結尾非 } 的字符
            .trim();
        
        console.log('🧹 [Native OpenAI Client] Cleaned content length:', cleanContent.length);
        console.log('🧹 [Native OpenAI Client] First 100 chars:', cleanContent.substring(0, 100));
        
        try {
            const parsed = JSON.parse(cleanContent);
            console.log('✅ [Native OpenAI Client] Successfully parsed JSON');
            return parsed;
        } catch (error) {
            console.error('❌ [Native OpenAI Client] JSON parsing failed:', error);
            console.log('📄 [Native OpenAI Client] Failed content:', cleanContent);
            throw new Error(`無法解析 AI 回應中的 JSON: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // 檢查文件類型
    private getFileType(fileName: string): SupportedFileType | null {
        console.log(`🔍 [Native OpenAI Client] Analyzing file type for: "${fileName}"`);
        const extension = fileName.split('.').pop()?.toLowerCase();
        console.log(`🔍 [Native OpenAI Client] Extracted extension: "${extension}"`);
        
        if (!extension) {
            console.log(`❌ [Native OpenAI Client] No extension found for: "${fileName}"`);
            return null;
        }

        for (const [type, extensions] of Object.entries(SUPPORTED_FILE_TYPES)) {
            console.log(`🔍 [Native OpenAI Client] Checking type "${type}" with extensions:`, extensions);
            if ((extensions as readonly string[]).includes(extension)) {
                console.log(`✅ [Native OpenAI Client] Match found: "${fileName}" -> type "${type}"`);
                return type as SupportedFileType;
            }
        }
        
        console.log(`❌ [Native OpenAI Client] No matching type found for extension "${extension}" in file "${fileName}"`);
        return null;
    }

    // 將文件轉換為 base64
    private async fileToBase64(file: File): Promise<string> {
        if (file instanceof File) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            return buffer.toString('base64');
        }
        throw new Error('Invalid file type');
    }

    // 直接調用 OpenAI API
    private async callOpenAI(request: OpenAIChatCompletionRequest): Promise<OpenAIChatCompletionResponse> {
        console.log('🚀 [Native OpenAI Client] Making direct API call to OpenAI');
        console.log('📋 [Native OpenAI Client] Request details:', {
            model: request.model,
            messagesCount: request.messages.length,
            hasResponseFormat: !!request.response_format,
            temperature: request.temperature
        });

        const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ [Native OpenAI Client] API call failed:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData}`);
        }

        const data = await response.json() as OpenAIChatCompletionResponse;
        console.log('✅ [Native OpenAI Client] API call successful:', {
            id: data.id,
            model: data.model,
            choices: data.choices.length,
            usage: data.usage
        });

        return data;
    }

    async analyzeDocuments(options: FileAnalysisOptions): Promise<ResumeAnalysisResult> {
        console.log('🚀 [Native OpenAI Client] Starting document analysis with native client');
        
        const { documents, additionalText, useVision = false } = options;
        
        if (!documents || documents.length === 0) {
            throw new Error('沒有提供文件進行分析');
        }

        try {
            const messages: OpenAIMessage[] = [
                {
                    role: 'system',
                    content: this.config.systemPrompt
                }
            ];

            let hasImages = false;
            let textContent = '';
            
            // 處理文件
            for (const doc of documents) {
                const fileType = this.getFileType(doc.fileName);
                
                if (!fileType) {
                    console.warn(`Unsupported file type: ${doc.fileName}`);
                    continue;
                }

                if (fileType === 'DOCUMENTS') {
                    // 文字檔案
                    if (doc.content) {
                        textContent += `檔案 ${doc.fileName}:\n${doc.content}\n\n`;
                    } else if (doc.file instanceof File) {
                        const content = await processTextFile(doc.file);
                        textContent += `檔案 ${doc.fileName}:\n${content}\n\n`;
                    }
                } else if ((fileType === 'IMAGES' || fileType === 'PDF') && useVision) {
                    // 圖像或 PDF (使用視覺功能)
                    hasImages = true;
                    if (doc.file instanceof File) {
                        const base64 = await this.fileToBase64(doc.file);
                        const mimeType = doc.file.type || (fileType === 'PDF' ? 'application/pdf' : 'image/jpeg');
                        
                        messages.push({
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: `請分析檔案 ${doc.fileName}:`
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:${mimeType};base64,${base64}`,
                                        detail: 'high'
                                    }
                                }
                            ]
                        });
                    }
                }
            }

            // 新增主要分析請求
            let userPrompt = '';
            if (textContent) {
                userPrompt += `請分析以下文件內容：\n\n${textContent}`;
            }
            
            if (additionalText) {
                userPrompt += `\n\n額外資訊：\n${additionalText}`;
            }

            if (hasImages) {
                userPrompt += '\n\n請同時分析上面提供的圖像檔案。';
            }

            userPrompt += `

請以 JSON 格式回傳履歷分析結果，包含以下欄位：
- projects: 專案列表（每個專案包含 name, description, technologies, duration, role, contribution）
- projects_summary: 專案摘要
- expertise: 技能列表
- expertise_summary: 技能摘要
- work_experiences: 工作經驗列表（每個經驗包含 company, position, duration, description, contribution, technologies）
- work_experiences_summary: 工作經驗摘要
- education_background: 教育背景列表（每個教育經歷包含 institution, degree, major, duration, gpa, courses, achievements）
- education_summary: 教育背景摘要
- achievements: 成就列表
- achievements_summary: 成就摘要
- missing_content: 缺失內容分析（包含 critical_missing, recommended_additions, impact_analysis, priority_suggestions）
- scores: 評分列表（每個評分包含 category, grade, description, comment, icon, suggestions）

**重要提醒 - 必須包含所有 6 個評分類別**：
scores 陣列必須包含以下 6 個評分類別，每個都必須有評分：
1. 「技術深度與廣度」- icon: 💻
2. 「項目複雜度與影響力」- icon: 🚀  
3. 「專業經驗完整度」- icon: 💼
4. 「教育背景」- icon: 🎓
5. 「成果與驗證」- icon: 🏆
6. 「整體專業形象」- icon: ✨

**重要提醒 - 評分欄位的 comment 格式要求**：
在 scores 的 comment 欄位中，必須包含完整的 Chain of Thought 推理過程，格式如下：
"【推理過程】觀察：候選人展示了...證據。STAR分析：S-情境描述完整，T-任務明確，A-行動具體，R-結果量化。對照標準：符合A+等第的...要求。權衡判斷：技術深度和廣度都...。【最終評分】A+ - 技術領域頂尖專家，引領技術趨勢。【改進建議】建議..."

特別注意：
1. 對於履歷內容，請盡可能保留所有詳細資訊
2. 僅整合明確提及的資訊，缺失資料必須留空
3. 嚴禁基於部分資訊進行推理或產生幻覺
4. 在 missing_content 中明確指出缺失的關鍵履歷要素
5. 使用 STAR 原則評估項目和工作經驗的完整性
6. 評分的 comment 欄位必須嚴格遵循 CoT 推理格式，包含【推理過程】、【最終評分】、【改進建議】三個部分
7. 對於完全無法提取內容的項目，仍要給予評分與回饋，但評分為 F
8. **必須確保 scores 陣列包含上述所有 6 個類別，不可遺漏任何一個**

**強制 F 評分規則**：
- 如果「技術深度與廣度」類別完全無法從履歷中提取到任何技能、專案技術棧或工作中使用的技術，必須給予 F 評分
- 如果「項目複雜度與影響力」類別完全無法提取到任何專案或項目經驗，必須給予 F 評分  
- 如果「專業經驗完整度」類別完全無法提取到任何工作經驗，必須給予 F 評分
- 如果「教育背景」類別完全無法提取到任何教育資訊，必須給予 F 評分
- 如果「成果與驗證」類別完全無法提取到任何成就、獎項或證書，必須給予 F 評分
- 如果「整體專業形象」類別因為履歷內容嚴重不足無法評估，必須給予 F 評分
- F 評分的 comment 必須明確說明「完全無法提取相關內容」作為評分理由

請確保回傳有效的 JSON 格式。`;

            messages.push({
                role: 'user',
                content: userPrompt
            });

            console.log('🚀 [Native OpenAI Client] Using JSON object mode for document analysis...');
            
            const request: OpenAIChatCompletionRequest = {
                model: this.config.modelName,
                messages,
                temperature: this.config.temperature,
                response_format: {
                    type: 'json_object'
                }
            };

            // 直接調用 OpenAI API
            const response = await this.callOpenAI(request);
            
            if (!response.choices || response.choices.length === 0) {
                throw new Error('No choices in OpenAI response');
            }

            const content = response.choices[0].message.content;
            if (!content) {
                throw new Error('No content in OpenAI response');
            }

            // 解析結果
            let parsedResult: unknown;
            try {
                parsedResult = JSON.parse(content);
                console.log('✅ [Native OpenAI Client] OpenAI JSON parsing successful');
            } catch (parseError) {
                console.warn('⚠️ [Native OpenAI Client] JSON parsing failed, trying smart parsing:', parseError);
                parsedResult = this.parseAIResponse(content);
            }

            // 使用 Zod 驗證結果
            try {
                const validatedResult = ResumeAnalysisSchema.parse(parsedResult);
                console.log('✅ [Native OpenAI Client] Zod validation passed');
                return validatedResult;
            } catch (zodError) {
                console.warn('⚠️ [Native OpenAI Client] Zod validation failed, attempting post-processing:', zodError);
                
                // 後處理空白欄位和 achievements 格式
                if (parsedResult && typeof parsedResult === 'object' && parsedResult !== null) {
                    const resultObj = parsedResult as Record<string, unknown>;
                    
                    // 處理 achievements 格式
                    if (resultObj.achievements && Array.isArray(resultObj.achievements) && 
                        resultObj.achievements.length > 0 && 
                        typeof resultObj.achievements[0] === 'object') {
                        
                        console.log('🔄 [Native OpenAI Client] Converting achievements from object array to string array');
                        resultObj.achievements = resultObj.achievements.map((item: unknown) => {
                            if (typeof item === 'object' && item !== null) {
                                const achievementObj = item as Record<string, unknown>;
                                return String(achievementObj.description || achievementObj.achievement || achievementObj.title || achievementObj.name) || JSON.stringify(item);
                            }
                            return String(item);
                        });
                    }
                    
                    // 處理 missing_content 中的字符串轉數組
                    if (resultObj.missing_content && typeof resultObj.missing_content === 'object' && resultObj.missing_content !== null) {
                        const missingContent = resultObj.missing_content as Record<string, unknown>;
                        
                        // 將字符串轉換為數組
                        const stringToArray = (value: unknown): string[] => {
                            if (Array.isArray(value)) return value.map(String);
                            if (typeof value === 'string') {
                                // 嘗試解析為 JSON 數組或用分隔符拆分
                                try {
                                    const parsed = JSON.parse(value);
                                    if (Array.isArray(parsed)) return parsed.map(String);
                                } catch {
                                    // 如果不是 JSON，嘗試用常見分隔符拆分
                                    if (value.includes(',')) return value.split(',').map(s => s.trim());
                                    if (value.includes(';')) return value.split(';').map(s => s.trim());
                                    if (value.includes('、')) return value.split('、').map(s => s.trim());
                                    return [value]; // 如果無法拆分，作為單個元素
                                }
                            }
                            return [];
                        };
                        
                        missingContent.critical_missing = stringToArray(missingContent.critical_missing);
                        missingContent.recommended_additions = stringToArray(missingContent.recommended_additions);
                        missingContent.priority_suggestions = stringToArray(missingContent.priority_suggestions);
                        
                        console.log('🔄 [Native OpenAI Client] Fixed missing_content array formats');
                    }
                    
                    // 處理 scores 中的 suggestions 字符串轉數組
                    if (resultObj.scores && Array.isArray(resultObj.scores)) {
                        resultObj.scores = resultObj.scores.map((score: unknown) => {
                            if (typeof score === 'object' && score !== null) {
                                const scoreObj = score as Record<string, unknown>;
                                if (scoreObj.suggestions && typeof scoreObj.suggestions === 'string') {
                                    try {
                                        // 嘗試解析為 JSON
                                        const parsed = JSON.parse(scoreObj.suggestions as string);
                                        if (Array.isArray(parsed)) {
                                            scoreObj.suggestions = parsed.map(String);
                                        } else {
                                            scoreObj.suggestions = [String(parsed)];
                                        }
                                    } catch {
                                        // 如果不是 JSON，嘗試用分隔符拆分
                                        const suggestions = scoreObj.suggestions as string;
                                        if (suggestions.includes(',')) {
                                            scoreObj.suggestions = suggestions.split(',').map(s => s.trim());
                                        } else if (suggestions.includes(';')) {
                                            scoreObj.suggestions = suggestions.split(';').map(s => s.trim());
                                        } else if (suggestions.includes('、')) {
                                            scoreObj.suggestions = suggestions.split('、').map(s => s.trim());
                                        } else {
                                            scoreObj.suggestions = [suggestions];
                                        }
                                    }
                                }
                                return scoreObj;
                            }
                            return score;
                        });
                        
                        console.log('🔄 [Native OpenAI Client] Fixed scores suggestions array formats');
                    }
                    
                    // 處理空白欄位
                    const processEmptyFields = (obj: Record<string, unknown>) => {
                        if (obj.projects && Array.isArray(obj.projects)) {
                            obj.projects = obj.projects.map((project: unknown) => {
                                if (typeof project === 'object' && project !== null) {
                                    const p = project as Record<string, unknown>;
                                    return {
                                        name: p.name || '',
                                        description: p.description || '',
                                        technologies: Array.isArray(p.technologies) ? p.technologies : [],
                                        duration: p.duration || '',
                                        role: p.role || '',
                                        contribution: p.contribution || ''
                                    };
                                }
                                return project;
                            });
                        }
                        
                        if (obj.work_experiences && Array.isArray(obj.work_experiences)) {
                            obj.work_experiences = obj.work_experiences.map((exp: unknown) => {
                                if (typeof exp === 'object' && exp !== null) {
                                    const e = exp as Record<string, unknown>;
                                    return {
                                        company: e.company || '',
                                        position: e.position || '',
                                        duration: e.duration || '',
                                        description: e.description || '',
                                        contribution: e.contribution || '',
                                        technologies: Array.isArray(e.technologies) ? e.technologies : []
                                    };
                                }
                                return exp;
                            });
                        }
                        
                        if (obj.education_background && Array.isArray(obj.education_background)) {
                            obj.education_background = obj.education_background.map((edu: unknown) => {
                                if (typeof edu === 'object' && edu !== null) {
                                    const ed = edu as Record<string, unknown>;
                                    return {
                                        institution: ed.institution || '',
                                        degree: ed.degree || '',
                                        major: ed.major || '',
                                        duration: ed.duration || '',
                                        gpa: ed.gpa || '',
                                        courses: Array.isArray(ed.courses) ? ed.courses : [],
                                        achievements: Array.isArray(ed.achievements) ? ed.achievements : []
                                    };
                                }
                                return edu;
                            });
                        }
                        
                        return obj;
                    };
                    
                    // 先處理空白欄位，然後強制 F 評分
                    const processedObj = this.enforceFailingGradesForMissingContent(processEmptyFields(resultObj));
                    
                    // 重新驗證
                    try {
                        const revalidatedResult = ResumeAnalysisSchema.parse(processedObj);
                        console.log('✅ [Native OpenAI Client] Zod validation passed after post-processing');
                        return revalidatedResult;
                    } catch {
                        console.warn('⚠️ [Native OpenAI Client] Final Zod validation failed, providing default values');
                        
                        // 提供預設值以防最終驗證失敗
                        const defaultResult: ResumeAnalysisResult = {
                            projects: [],
                            projects_summary: processedObj.projects_summary as string || '尚未提供專案資訊',
                            expertise: Array.isArray(processedObj.expertise) ? processedObj.expertise as string[] : [],
                            expertise_summary: processedObj.expertise_summary as string || '尚未提供技能資訊',
                            work_experiences: [],
                            work_experiences_summary: processedObj.work_experiences_summary as string || '尚未提供工作經驗',
                            education_background: [],
                            education_summary: processedObj.education_summary as string || '尚未提供教育背景',
                            achievements: Array.isArray(processedObj.achievements) ? processedObj.achievements as string[] : [],
                            achievements_summary: processedObj.achievements_summary as string || '尚未提供成就資訊',
                            missing_content: (processedObj.missing_content as {
                                critical_missing: string[];
                                recommended_additions: string[];
                                impact_analysis: string;
                                priority_suggestions: string[];
                            }) || {
                                critical_missing: ['完整的履歷內容'],
                                recommended_additions: ['詳細的工作經驗', '專案描述', '技能列表'],
                                impact_analysis: '缺乏關鍵資訊影響整體評估',
                                priority_suggestions: ['補充工作經驗詳情', '加強專案描述']
                            },
                            scores: Array.isArray(processedObj.scores) ? (processedObj.scores as Array<{
                                category: string;
                                grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
                                description: string;
                                comment: string;
                                icon: string;
                                suggestions: string[];
                            }>) : []
                        };
                        
                        console.log('🔄 [Native OpenAI Client] Returning default values due to validation failure');
                        return defaultResult;
                    }
                }
                
                return parsedResult as ResumeAnalysisResult;
            }
            
        } catch (error) {
            console.error("Native OpenAI document analysis error:", error);
            throw new Error(`文件分析失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
        }
    }

    // 強制對無法提取內容的項目給予 F 評分的通用方法
    private enforceFailingGradesForMissingContent(obj: Record<string, unknown>): Record<string, unknown> {
        console.log('🔍 [Native OpenAI Client] Enforcing F grades for missing content...');
        
        // 檢查各個履歷內容區塊的完整性
        const hasProjects = obj.projects && Array.isArray(obj.projects) && obj.projects.length > 0 &&
            obj.projects.some((p: unknown) => p && typeof p === 'object' && 
                Object.values(p as Record<string, unknown>).some(val => val && String(val).trim() !== ''));
        
        const hasWorkExperiences = obj.work_experiences && Array.isArray(obj.work_experiences) && obj.work_experiences.length > 0 &&
            obj.work_experiences.some((exp: unknown) => exp && typeof exp === 'object' && 
                Object.values(exp as Record<string, unknown>).some(val => val && String(val).trim() !== ''));
        
        const hasEducation = obj.education_background && Array.isArray(obj.education_background) && obj.education_background.length > 0 &&
            obj.education_background.some((edu: unknown) => edu && typeof edu === 'object' && 
                Object.values(edu as Record<string, unknown>).some(val => val && String(val).trim() !== ''));
        
        const hasExpertise = obj.expertise && Array.isArray(obj.expertise) && obj.expertise.length > 0 &&
            obj.expertise.some((skill: unknown) => skill && String(skill).trim() !== '');
        
        const hasAchievements = obj.achievements && Array.isArray(obj.achievements) && obj.achievements.length > 0 &&
            obj.achievements.some((achievement: unknown) => achievement && String(achievement).trim() !== '');

        // 檢查履歷內容的整體完整性
        const hasAnyMeaningfulContent = hasProjects || hasWorkExperiences || hasEducation || hasExpertise || hasAchievements;
        
        // 檢查摘要內容的完整性
        const hasProjectsSummary = obj.projects_summary && String(obj.projects_summary).trim() !== '' && 
            !String(obj.projects_summary).includes('無相關資訊') && !String(obj.projects_summary).includes('尚未提供');
        
        const hasWorkSummary = obj.work_experiences_summary && String(obj.work_experiences_summary).trim() !== '' && 
            !String(obj.work_experiences_summary).includes('無相關資訊') && !String(obj.work_experiences_summary).includes('尚未提供');
        
        const hasEducationSummary = obj.education_summary && String(obj.education_summary).trim() !== '' && 
            !String(obj.education_summary).includes('無相關資訊') && !String(obj.education_summary).includes('尚未提供');
        
        const hasAchievementsSummary = obj.achievements_summary && String(obj.achievements_summary).trim() !== '' && 
            !String(obj.achievements_summary).includes('無相關資訊') && !String(obj.achievements_summary).includes('尚未提供');
        
        console.log('📊 [Native OpenAI Client] Content analysis:', {
            hasProjects,
            hasWorkExperiences,
            hasEducation,
            hasExpertise,
            hasAchievements,
            hasAnyMeaningfulContent,
            hasProjectsSummary,
            hasWorkSummary,
            hasEducationSummary,
            hasAchievementsSummary
        });
        
        // 確保 scores 存在且為陣列
        if (!obj.scores || !Array.isArray(obj.scores)) {
            obj.scores = [];
        }
        
        // 處理每個評分項目，對缺失內容強制給予 F 評分
        obj.scores = (obj.scores as Array<unknown>).map((score: unknown) => {
            if (typeof score === 'object' && score !== null) {
                const scoreObj = score as Record<string, unknown>;
                const category = String(scoreObj.category || '').toLowerCase();
                const categoryId = String(scoreObj.category || '');
                
                let shouldBeF = false;
                let missingReason = '';
                let correctIcon = '❌'; // 預設圖示
                
                // 根據類別檢查相關內容是否缺失，並設置正確的圖示
                if (category.includes('技術') || category.includes('technical') || category.includes('深度') || category.includes('廣度')) {
                    correctIcon = '💻';
                    if (!hasExpertise && !hasProjects && !hasWorkExperiences) {
                        shouldBeF = true;
                        missingReason = '完全無法提取技術相關內容，包括技能列表、專案經驗和工作經驗中的技術使用';
                    }
                }
                
                if (category.includes('項目') || category.includes('project') || category.includes('專案') || category.includes('複雜度') || category.includes('影響力')) {
                    correctIcon = '🚀';
                    if (!hasProjects && !hasProjectsSummary) {
                        shouldBeF = true;
                        missingReason = '完全無法提取專案/項目經驗相關內容';
                    }
                }
                
                if (category.includes('專業') || category.includes('工作') || category.includes('experience') || category.includes('professional') || category.includes('經驗')) {
                    correctIcon = '💼';
                    if (!hasWorkExperiences && !hasWorkSummary) {
                        shouldBeF = true;
                        missingReason = '完全無法提取工作經驗相關內容';
                    }
                }
                
                if (category.includes('教育') || category.includes('學歷') || category.includes('education') || category.includes('背景')) {
                    correctIcon = '🎓';
                    if (!hasEducation && !hasEducationSummary) {
                        shouldBeF = true;
                        missingReason = '完全無法提取教育背景相關內容';
                    }
                }

                if (category.includes('成就') || category.includes('獎項') || category.includes('achievement') || category.includes('award') || 
                    category.includes('成果') || category.includes('驗證') || categoryId.includes('achievements_validation')) {
                    correctIcon = '🏆';
                    if (!hasAchievements && !hasAchievementsSummary) {
                        shouldBeF = true;
                        missingReason = '完全無法提取成就、獎項或成果驗證相關內容';
                    }
                }

                if (category.includes('表達') || category.includes('格式') || category.includes('presentation') || category.includes('format') || category.includes('履歷')) {
                    correctIcon = '📝';
                    // 對於履歷表達與格式類別，如果完全沒有任何有意義的內容，則給予 F
                    if (!hasAnyMeaningfulContent) {
                        shouldBeF = true;
                        missingReason = '履歷完全無法提取任何有意義的內容，無法評估表達能力與格式品質';
                    }
                }

                if (category.includes('整體') || category.includes('綜合') || category.includes('overall') || category.includes('comprehensive') ||
                    category.includes('專業形象') || category.includes('professional_image') || categoryId.includes('professional_image')) {
                    correctIcon = '✨';
                    // 對於整體評估類別，如果沒有足夠的內容進行綜合評估
                    if (!hasAnyMeaningfulContent || (!hasWorkExperiences && !hasProjects && !hasEducation)) {
                        shouldBeF = true;
                        missingReason = '履歷內容嚴重不足，無法進行整體綜合評估或專業形象評定';
                    }
                }
                
                // 如果該項目應該為 F，強制修改評分
                if (shouldBeF) {
                    console.log(`⚠️ [Native OpenAI Client] Forcing F grade for category: ${scoreObj.category} - ${missingReason}`);
                    
                    scoreObj.grade = 'F';
                    scoreObj.description = '內容嚴重缺失，無法進行有效評估';
                    scoreObj.comment = `【推理過程】履歷分析過程中發現：${missingReason}。根據評分標準，當完全無法提取相關內容時，必須給予最低評分。這不是候選人能力的直接反映，而是履歷資訊提供不足的結果。內容檢查結果顯示該類別對應的履歷區塊為空白或無效。對照標準：F 等第適用於「完全不符合要求」或「無相關資訊」的情況。【最終評分】F - 資訊嚴重不足，無法進行有效評估。【改進建議】強烈建議補充完整的${String(scoreObj.category)}相關資訊，包括詳細描述、具體成果和量化指標，確保履歷內容的完整性和可讀性，重新整理履歷格式以提高資訊提取效率。`;
                    scoreObj.icon = correctIcon;
                    scoreObj.suggestions = [
                        `補充完整的${String(scoreObj.category)}相關資訊`,
                        '提供具體的描述和量化成果',
                        '確保履歷內容的完整性和可讀性',
                        '重新整理履歷格式以提高資訊提取效率',
                        '檢查履歷是否包含必要的基本資訊'
                    ];
                } else {
                    // 即使不是 F 評分，也確保有正確的圖示
                    if (!scoreObj.icon || scoreObj.icon === '❌') {
                        scoreObj.icon = correctIcon;
                    }
                }
                
                return scoreObj;
            }
            return score;
        });
        
        console.log('✅ [Native OpenAI Client] Completed F grade enforcement for missing content');
        
        // 確保所有必要的評分類別都存在
        const requiredCategories = [
            { name: '技術深度與廣度', icon: '💻' },
            { name: '項目複雜度與影響力', icon: '🚀' },
            { name: '專業經驗完整度', icon: '💼' },
            { name: '教育背景', icon: '🎓' },
            { name: '成果與驗證', icon: '🏆' },
            { name: '整體專業形象', icon: '✨' }
        ];
        
        const existingCategories = (obj.scores as Array<unknown>).map((score: unknown) => {
            if (typeof score === 'object' && score !== null) {
                return String((score as Record<string, unknown>).category || '');
            }
            return '';
        });
        
        // 檢查缺失的類別並添加
        for (const required of requiredCategories) {
            const exists = existingCategories.some(existing => 
                existing.includes(required.name) || 
                existing.toLowerCase().includes(required.name.toLowerCase())
            );
            
            if (!exists) {
                console.log(`⚠️ [Native OpenAI Client] Missing category: ${required.name}, adding default F grade`);
                
                // 根據類別判斷是否應該為 F
                let shouldBeF = false;
                let missingReason = '';
                let gradeToAssign = 'F';
                
                if (required.name.includes('技術')) {
                    shouldBeF = !hasExpertise && !hasProjects && !hasWorkExperiences;
                    missingReason = '完全無法提取技術相關內容，包括技能列表、專案經驗和工作經驗中的技術使用';
                } else if (required.name.includes('項目') || required.name.includes('複雜度')) {
                    shouldBeF = !hasProjects && !hasProjectsSummary;
                    missingReason = '完全無法提取專案/項目經驗相關內容';
                } else if (required.name.includes('專業') || required.name.includes('經驗')) {
                    shouldBeF = !hasWorkExperiences && !hasWorkSummary;
                    missingReason = '完全無法提取工作經驗相關內容';
                } else if (required.name.includes('教育')) {
                    shouldBeF = !hasEducation && !hasEducationSummary;
                    missingReason = '完全無法提取教育背景相關內容';
                    // 教育背景可能不是 F，如果有基本資訊
                    if (hasEducation || hasEducationSummary) {
                        shouldBeF = false;
                        gradeToAssign = 'B';
                        missingReason = '教育背景資訊基本完整，但缺乏詳細描述';
                    }
                } else if (required.name.includes('成果') || required.name.includes('驗證')) {
                    shouldBeF = !hasAchievements && !hasAchievementsSummary;
                    missingReason = '完全無法提取成就、獎項或成果驗證相關內容';
                } else if (required.name.includes('整體') || required.name.includes('專業形象')) {
                    shouldBeF = !hasAnyMeaningfulContent || (!hasWorkExperiences && !hasProjects && !hasEducation);
                    missingReason = '履歷內容嚴重不足，無法進行整體綜合評估或專業形象評定';
                }
                
                if (!shouldBeF && gradeToAssign === 'F') {
                    gradeToAssign = 'C';
                    missingReason = `${required.name}相關內容不足，需要改進`;
                }
                
                const defaultScore = {
                    category: required.name,
                    grade: gradeToAssign,
                    description: shouldBeF ? '內容嚴重缺失，無法進行有效評估' : '內容不足，需要改進',
                    comment: shouldBeF ? 
                        `【推理過程】履歷分析過程中發現：${missingReason}。根據評分標準，當完全無法提取相關內容時，必須給予最低評分。這不是候選人能力的直接反映，而是履歷資訊提供不足的結果。內容檢查結果顯示該類別對應的履歷區塊為空白或無效。對照標準：F 等第適用於「完全不符合要求」或「無相關資訊」的情況。【最終評分】F - 資訊嚴重不足，無法進行有效評估。【改進建議】強烈建議補充完整的${required.name}相關資訊，包括詳細描述、具體成果和量化指標，確保履歷內容的完整性和可讀性，重新整理履歷格式以提高資訊提取效率。` :
                        `【推理過程】履歷分析過程中發現：${missingReason}。雖然有基本資訊，但詳細程度不足以進行深入評估。對照標準：符合 ${gradeToAssign} 等第的基本要求，但有改進空間。【最終評分】${gradeToAssign} - 基本符合要求，但需要完善。【改進建議】建議補充更詳細的${required.name}相關資訊，提升履歷內容的豐富度和說服力。`,
                    icon: required.icon,
                    suggestions: [
                        `補充完整的${required.name}相關資訊`,
                        '提供具體的描述和量化成果',
                        '確保履歷內容的完整性和可讀性',
                        '重新整理履歷格式以提高資訊提取效率',
                        '檢查履歷是否包含必要的基本資訊'
                    ]
                };
                
                (obj.scores as Array<unknown>).push(defaultScore);
            }
        }
        
        console.log(`✅ [Native OpenAI Client] Ensured all ${requiredCategories.length} categories exist. Total scores: ${(obj.scores as Array<unknown>).length}`);
        
        return obj;
    }

    async analyzeResume(resumeContent: string, additionalText?: string): Promise<ResumeAnalysisResult> {
        console.log('🚀 [Native OpenAI Client] Starting resume analysis');
        
        const messages: OpenAIMessage[] = [
            {
                role: 'system',
                content: this.config.systemPrompt
            },
            {
                role: 'user',
                content: `請分析以下履歷內容並以 JSON 格式回傳結果：

履歷內容：
${resumeContent}

額外資訊：
${additionalText || "無"}

請以 JSON 格式回傳分析結果，包含以下欄位：
- projects: 專案列表（每個專案包含 name, description, technologies, duration, role, contribution）
- projects_summary: 專案摘要
- expertise: 技能列表
- expertise_summary: 技能摘要
- work_experiences: 工作經驗列表（每個經驗包含 company, position, duration, description, contribution, technologies）
- work_experiences_summary: 工作經驗摘要
- education_background: 教育背景列表（每個教育經歷包含 institution, degree, major, duration, gpa, courses, achievements）
- education_summary: 教育背景摘要
- achievements: 成就列表
- achievements_summary: 成就摘要
- missing_content: 缺失內容分析（包含 critical_missing, recommended_additions, impact_analysis, priority_suggestions）
- scores: 評分列表（每個評分包含 category, grade, description, comment, icon, suggestions）

**重要提醒 - 必須包含所有 6 個評分類別**：
scores 陣列必須包含以下 6 個評分類別，每個都必須有評分：
1. 「技術深度與廣度」- icon: 💻
2. 「項目複雜度與影響力」- icon: 🚀  
3. 「專業經驗完整度」- icon: 💼
4. 「教育背景」- icon: 🎓
5. 「成果與驗證」- icon: 🏆
6. 「整體專業形象」- icon: ✨

**重要提醒 - 評分欄位的 comment 格式要求**：
在 scores 的 comment 欄位中，必須包含完整的 Chain of Thought 推理過程，格式如下：
"【推理過程】觀察：候選人展示了...證據。STAR分析：S-情境描述完整，T-任務明確，A-行動具體，R-結果量化。對照標準：符合A+等第的...要求。權衡判斷：技術深度和廣度都...。【最終評分】A+ - 技術領域頂尖專家，引領技術趨勢。【改進建議】建議..."

### 具體化分析要求
在進行評分分析時，必須遵循以下具體化原則：

**推理過程具體化要求**：
1. **教育背景分析**：具體提及學校名稱、科系、相關修課科目（如資料結構、演算法分析、系統程式設計等），並分析這些課程與目標職位的關聯性
2. **項目經驗分析**：明確指出項目名稱、使用的具體技術棧、架構設計特點、解決的具體問題，分析技術選型的合理性和創新點
3. **工作經驗分析**：詳細描述在特定公司的具體職責、參與的產品功能模組、團隊規模、取得的量化成果
4. **技術能力分析**：具體評估每項技術的熟練程度證據，如框架使用深度、架構設計能力、問題解決複雜度
5. **成長軌跡分析**：追蹤候選人從學生到專業人士的發展路徑，分析職業選擇的邏輯性和成長速度

**改進建議具體化要求**：
1. **內容重整建議**：針對履歷中具體的項目描述、工作經歷段落，提出重新撰寫或調整的具體方向
2. **技術補強建議**：基於現有技術棧，指出需要學習的具體技術、框架版本、實作深度
3. **經驗缺口填補**：明確指出履歷中缺失的關鍵經驗類型（如 CI/CD 流程、微服務架構、大數據處理等），並建議具體的學習或實作方向
4. **格式優化建議**：針對履歷的特定段落或項目描述，提供具體的改寫範例或結構調整建議
5. **證據強化建議**：建議補充具體的量化指標、專案成果截圖、程式碼範例連結、技術文章等證明材料

特別注意：
1. 對於履歷內容，請盡可能保留所有詳細資訊
2. 僅整合明確提及的資訊，缺失資料必須留空
3. 嚴禁基於部分資訊進行推理或產生幻覺
4. 在 missing_content 中明確指出缺失的關鍵履歷要素
5. 使用 STAR 原則評估項目和工作經驗的完整性
6. 評分的 comment 欄位必須嚴格遵循 CoT 推理格式，包含【推理過程】、【最終評分】、【改進建議】三個部分
7. 對於完全無法提取內容的項目，仍要給予評分與回饋，但評分為 F

**強制 F 評分規則**：
- 如果「技術深度與廣度」類別完全無法從履歷中提取到任何技能、專案技術棧或工作中使用的技術，必須給予 F 評分
- 如果「項目複雜度與影響力」類別完全無法提取到任何專案或項目經驗，必須給予 F 評分  
- 如果「專業經驗完整度」類別完全無法提取到任何工作經驗，必須給予 F 評分
- 如果「教育背景」類別完全無法提取到任何教育資訊，必須給予 F 評分
- 如果「成果與驗證」類別完全無法提取到任何成就、獎項或證書，必須給予 F 評分
- 如果「整體專業形象」類別因為履歷內容嚴重不足無法評估，必須給予 F 評分
- F 評分的 comment 必須明確說明「完全無法提取相關內容」作為評分理由

請確保回傳有效的 JSON 格式。`
            }
        ];

        try {
            console.log('🚀 [Native OpenAI Client] Using JSON object mode for resume analysis...');
            
            const request: OpenAIChatCompletionRequest = {
                model: this.config.modelName,
                messages,
                temperature: this.config.temperature,
                response_format: {
                    type: 'json_object'
                }
            };

            const response = await this.callOpenAI(request);
            const content = response.choices[0].message.content;
            
            if (!content) {
                throw new Error('No content in response');
            }

            let parsedResult: unknown;
            try {
                parsedResult = JSON.parse(content);
                console.log('✅ [Native OpenAI Client] JSON object mode successful for resume analysis');
            } catch (parseError) {
                console.warn('⚠️ [Native OpenAI Client] JSON parsing failed, trying smart parsing:', parseError);
                parsedResult = this.parseAIResponse(content);
            }

            // 使用 Zod 驗證
            try {
                const validatedResult = ResumeAnalysisSchema.parse(parsedResult);
                console.log('✅ [Native OpenAI Client] Zod validation passed for resume analysis');
                return validatedResult;
            } catch (zodError) {
                console.warn('⚠️ [Native OpenAI Client] Zod validation failed for resume analysis, attempting post-processing:', zodError);
                
                // 後處理 achievements
                if (parsedResult && typeof parsedResult === 'object' && parsedResult !== null) {
                    const resultObj = parsedResult as Record<string, unknown>;
                    
                    // 處理可能為空的字段
                    const processEmptyFields = (obj: Record<string, unknown>) => {
                        for (const [key, value] of Object.entries(obj)) {
                            if (value === null || value === undefined || value === '') {
                                if (key.includes('summary') || typeof obj[key] === 'string') {
                                    obj[key] = '無相關資訊';
                                } else if (Array.isArray(obj[key]) || key.includes('experiences') || key.includes('background') || key.includes('achievements') || key.includes('scores')) {
                                    obj[key] = [];
                                } else if (typeof obj[key] === 'object') {
                                    obj[key] = {};
                                }
                            }
                        }
                        return obj;
                    };
                    
                    // 處理 achievements 格式
                    if (resultObj.achievements && Array.isArray(resultObj.achievements) && 
                        resultObj.achievements.length > 0 && 
                        typeof resultObj.achievements[0] === 'object') {
                        
                        console.log('🔄 [Native OpenAI Client] Converting achievements from object array to string array');
                        resultObj.achievements = resultObj.achievements.map((item: unknown) => {
                            if (typeof item === 'object' && item !== null) {
                                const achievementObj = item as Record<string, unknown>;
                                return String(achievementObj.description || achievementObj.achievement || achievementObj.title || achievementObj.name) || JSON.stringify(item);
                            }
                            return String(item);
                        });
                    }
                    
                    // 處理 missing_content 中的字符串轉數組
                    if (resultObj.missing_content && typeof resultObj.missing_content === 'object' && resultObj.missing_content !== null) {
                        const missingContent = resultObj.missing_content as Record<string, unknown>;
                        
                        // 將字符串轉換為數組
                        const stringToArray = (value: unknown): string[] => {
                            if (Array.isArray(value)) return value.map(String);
                            if (typeof value === 'string') {
                                // 嘗試解析為 JSON 數組或用分隔符拆分
                                try {
                                    const parsed = JSON.parse(value);
                                    if (Array.isArray(parsed)) return parsed.map(String);
                                } catch {
                                    // 如果不是 JSON，嘗試用常見分隔符拆分
                                    if (value.includes(',')) return value.split(',').map(s => s.trim());
                                    if (value.includes(';')) return value.split(';').map(s => s.trim());
                                    if (value.includes('、')) return value.split('、').map(s => s.trim());
                                    return [value]; // 如果無法拆分，作為單個元素
                                }
                            }
                            return [];
                        };
                        
                        missingContent.critical_missing = stringToArray(missingContent.critical_missing);
                        missingContent.recommended_additions = stringToArray(missingContent.recommended_additions);
                        missingContent.priority_suggestions = stringToArray(missingContent.priority_suggestions);
                        
                        console.log('🔄 [Native OpenAI Client] Fixed missing_content array formats');
                    }
                    
                    // 處理 scores 中的 suggestions 字符串轉數組
                    if (resultObj.scores && Array.isArray(resultObj.scores)) {
                        resultObj.scores = resultObj.scores.map((score: unknown) => {
                            if (typeof score === 'object' && score !== null) {
                                const scoreObj = score as Record<string, unknown>;
                                if (scoreObj.suggestions && typeof scoreObj.suggestions === 'string') {
                                    try {
                                        // 嘗試解析為 JSON
                                        const parsed = JSON.parse(scoreObj.suggestions as string);
                                        if (Array.isArray(parsed)) {
                                            scoreObj.suggestions = parsed.map(String);
                                        } else {
                                            scoreObj.suggestions = [String(parsed)];
                                        }
                                    } catch {
                                        // 如果不是 JSON，嘗試用分隔符拆分
                                        const suggestions = scoreObj.suggestions as string;
                                        if (suggestions.includes(',')) {
                                            scoreObj.suggestions = suggestions.split(',').map(s => s.trim());
                                        } else if (suggestions.includes(';')) {
                                            scoreObj.suggestions = suggestions.split(';').map(s => s.trim());
                                        } else if (suggestions.includes('、')) {
                                            scoreObj.suggestions = suggestions.split('、').map(s => s.trim());
                                        } else {
                                            scoreObj.suggestions = [suggestions];
                                        }
                                    }
                                }
                                return scoreObj;
                            }
                            return score;
                        });
                        
                        console.log('🔄 [Native OpenAI Client] Fixed scores suggestions array formats');
                    }
                    
                    // 先處理空白欄位，然後強制 F 評分
                    const processedObj = this.enforceFailingGradesForMissingContent(processEmptyFields(resultObj));
                    
                    try {
                        const revalidatedResult = ResumeAnalysisSchema.parse(processedObj);
                        console.log('✅ [Native OpenAI Client] Zod validation passed after post-processing for resume analysis');
                        return revalidatedResult;
                    } catch {
                        console.warn('⚠️ [Native OpenAI Client] Final Zod validation failed, providing default values');
                        
                        // 提供默認值以滿足 required 字段
                        const defaultResult: ResumeAnalysisResult = {
                            projects: [],
                            expertise: [],
                            projects_summary: '無相關資訊',
                            expertise_summary: '無相關資訊',
                            work_experiences: [],
                            work_experiences_summary: '無相關資訊',
                            education_background: [],
                            education_summary: '無相關資訊',
                            achievements: [],
                            achievements_summary: '無相關資訊',
                            missing_content: {
                                critical_missing: ['履歷資訊不完整'],
                                recommended_additions: ['建議補充更多資訊'],
                                impact_analysis: '資訊不足，無法進行完整分析',
                                priority_suggestions: ['請提供更詳細的履歷資訊']
                            },
                            scores: []
                        };
                        
                        // 合併有效的字段
                        return { ...defaultResult, ...processedObj } as ResumeAnalysisResult;
                    }
                }
                
                return parsedResult as ResumeAnalysisResult;
            }
            
        } catch (error) {
            console.error('❌ [Native OpenAI Client] Resume analysis failed:', error);
            throw new Error(`履歷分析失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
        }
    }

    async customPrompt(systemPrompt: string, userInput: string): Promise<string> {
        console.log('🚀 [Native OpenAI Client] Making custom prompt call');
        
        const messages: OpenAIMessage[] = [
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: userInput
            }
        ];

        try {
            const request: OpenAIChatCompletionRequest = {
                model: this.config.modelName,
                messages,
                temperature: this.config.temperature
            };

            const response = await this.callOpenAI(request);
            const content = response.choices[0].message.content;
            
            if (!content) {
                throw new Error('No content in response');
            }

            return content;
        } catch (error) {
            console.error("Native OpenAI custom prompt error:", error);
            throw new Error(`AI 請求失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
        }
    }
}

// 便利函數：快速創建客戶端實例
export function createNativeOpenAIClient(apiKey: string, config?: AIConfig): NativeOpenAIClient {
    return new NativeOpenAIClient({ apiKey, config });
}

// 文件處理工具函數
export async function processTextFile(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('utf-8');
}

export function validateFileType(fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension) return false;

    return Object.values(SUPPORTED_FILE_TYPES).some(types => 
        (types as readonly string[]).includes(extension)
    );
} 