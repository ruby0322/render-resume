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
                    
                    const processedObj = processEmptyFields(resultObj);
                    
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
                    };
                    
                    processEmptyFields(resultObj);
                    
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
                    
                    try {
                        const revalidatedResult = ResumeAnalysisSchema.parse(resultObj);
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
                        return { ...defaultResult, ...resultObj } as ResumeAnalysisResult;
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