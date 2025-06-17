import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Runnable } from "@langchain/core/runnables";
import { ChatOpenAI } from '@langchain/openai';
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
    DOCUMENTS: ['txt', 'md', 'json', 'csv'] // 這些需要轉換為文字
} as const;

export type SupportedFileType = keyof typeof SUPPORTED_FILE_TYPES;

// 文檔上傳介面
export interface DocumentUpload {
    file: File | Buffer;
    fileName: string;
    fileType: string;
    content?: string; // 預處理的文字內容
}

export interface FileAnalysisOptions {
    documents: DocumentUpload[];
    additionalText?: string;
    useVision?: boolean; // 是否使用 Vision 模型處理圖片/PDF
}

// 移除舊的 resumeAnalysisConfig，改用動態配置
export const DEFAULT_CONFIG: AIConfig = {
    modelName: DEFAULT_AI_CONFIG.modelName,
    temperature: DEFAULT_AI_CONFIG.temperature ?? 0.1,
    systemPrompt: generateSystemPrompt(SCORE_CATEGORIES),
    maxConcurrency: DEFAULT_AI_CONFIG.maxConcurrency
};

// 定義回應的 Schema
export const ResumeAnalysisSchema = z.object({
    projects: z.array(z.object({
        name: z.string().describe("項目名稱").optional(),
        description: z.string().describe("技術挑戰與解決方案").optional(),
        technologies: z.array(z.string()).describe("使用的技術").optional(),
        role: z.string().describe("擔任角色").optional(),
        contribution: z.string().describe("貢獻").optional(),
        duration: z.string().describe("進行期間").optional()
    })),
    expertise: z.array(z.string()).describe("完整技術聯集列表"),
    projects_summary: z.string().describe("項目摘要").optional(),
    expertise_summary: z.string().describe("技能摘要").optional(),
    work_experiences: z.array(z.object({
        company: z.string().describe("公司名稱").optional(),
        position: z.string().describe("職位").optional(),
        duration: z.string().describe("工作期間").optional(),
        description: z.string().describe("工作描述").optional(),
        contribution: z.string().describe("個人貢獻").optional(),
        technologies: z.array(z.string()).describe("使用的技術").optional()
    })),
    work_experiences_summary: z.string().describe("工作經驗摘要").optional(),
    education_background: z.array(z.object({
        institution: z.string().describe("學校名稱").optional(),
        degree: z.string().describe("學位").optional(),
        major: z.string().describe("主修科系").optional(),
        duration: z.string().describe("在學期間").optional(),
        gpa: z.string().describe("成績").optional(),
        courses: z.array(z.string()).describe("相關課程").optional(),
        achievements: z.array(z.string()).describe("學術成就").optional()
    })),
    education_summary: z.string().describe("教育背景摘要").optional(),
    achievements: z.array(z.string()).describe("成就列表").optional(),
    achievements_summary: z.string().describe("成就摘要").optional(),
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

export interface OpenAIClientOptions {
    apiKey: string;
    config?: AIConfig;
}

/**
 * Dynamically converts a Zod schema to JSON Schema format for LangChain structured output
 * This ensures that any changes to the Zod schema are automatically reflected in the JSON schema
 */
function zodToJsonSchema(zodSchema: z.ZodSchema): Record<string, unknown> {
    console.log('🔄 [Schema Converter] Converting Zod schema to JSON schema dynamically');
    
    function convertZodType(schema: z.ZodSchema): Record<string, unknown> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const zodType = schema._def as any; // Use any for internal Zod types
        
        // Handle ZodObject
        if (zodType.typeName === 'ZodObject') {
            const shape = zodType.shape();
            const properties: Record<string, unknown> = {};
            const required: string[] = [];
            
            for (const [key, value] of Object.entries(shape)) {
                const fieldSchema = value as z.ZodSchema;
                properties[key] = convertZodType(fieldSchema);
                
                // Check if field is required (not optional)
                if (!fieldSchema.isOptional()) {
                    required.push(key);
                }
            }
            
            return {
                type: "object",
                properties,
                ...(required.length > 0 && { required })
            };
        }
        
        // Handle ZodArray
        if (zodType.typeName === 'ZodArray') {
            return {
                type: "array",
                items: convertZodType(zodType.type)
            };
        }
        
        // Handle ZodString
        if (zodType.typeName === 'ZodString') {
            const result: Record<string, unknown> = { type: "string" };
            if (zodType.description) {
                result.description = zodType.description;
            }
            return result;
        }
        
        // Handle ZodNumber
        if (zodType.typeName === 'ZodNumber') {
            const result: Record<string, unknown> = { type: "number" };
            if (zodType.description) {
                result.description = zodType.description;
            }
            return result;
        }
        
        // Handle ZodBoolean
        if (zodType.typeName === 'ZodBoolean') {
            const result: Record<string, unknown> = { type: "boolean" };
            if (zodType.description) {
                result.description = zodType.description;
            }
            return result;
        }
        
        // Handle ZodOptional
        if (zodType.typeName === 'ZodOptional') {
            return convertZodType(zodType.innerType);
        }
        
        // Handle ZodNullable
        if (zodType.typeName === 'ZodNullable') {
            const innerSchema = convertZodType(zodType.innerType);
            if (typeof innerSchema === 'object' && innerSchema !== null && 'type' in innerSchema) {
                return {
                    ...innerSchema,
                    type: [innerSchema.type, "null"]
                };
            }
            return innerSchema;
        }
        
        // Handle ZodUnion (for nullable types)
        if (zodType.typeName === 'ZodUnion') {
            const options = zodType.options;
            // Check if it's a union with null (nullable)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const hasNull = options.some((opt: z.ZodSchema) => (opt._def as any).typeName === 'ZodNull');
            if (hasNull && options.length === 2) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const nonNullOption = options.find((opt: z.ZodSchema) => (opt._def as any).typeName !== 'ZodNull');
                if (nonNullOption) {
                    const innerSchema = convertZodType(nonNullOption);
                    if (typeof innerSchema === 'object' && innerSchema !== null && 'type' in innerSchema) {
                        return {
                            ...innerSchema,
                            type: [innerSchema.type, "null"]
                        };
                    }
                }
            }
            // For other unions, return the first option (simplified)
            return convertZodType(options[0]);
        }
        
        // Default fallback
        console.warn(`⚠️ [Schema Converter] Unsupported Zod type: ${zodType.typeName}, defaulting to string`);
        return { type: "string" };
    }
    
    const convertedSchema = convertZodType(zodSchema);
    const jsonSchema = {
        title: "DynamicSchema",
        description: "Dynamically generated schema from Zod",
        ...convertedSchema
    };
    
    console.log('✅ [Schema Converter] Successfully converted Zod schema to JSON schema');
    
    // Safe access to properties
    const properties = 'properties' in jsonSchema ? jsonSchema.properties : {};
    if (properties && typeof properties === 'object') {
        console.log('📋 [Schema Converter] Generated schema keys:', Object.keys(properties));
    }
    
    return jsonSchema;
}

/**
 * OpenAI Client with Enhanced Validation
 * 
 * This client implements a dual-layer validation approach:
 * 1. PRIMARY: LangChain native structured output validation
 *    - Uses withStructuredOutput() for automatic JSON schema validation
 *    - Leverages OpenAI's JSON mode for more reliable structured responses
 *    - Provides better error handling and automatic retries
 * 
 * 2. SECONDARY: Zod validation as a fallback layer
 *    - Validates the LangChain output against TypeScript types
 *    - Provides additional type safety and runtime validation
 *    - Handles edge cases and data transformation (e.g., achievements format)
 * 
 * Fallback Strategy:
 * - If LangChain structured output fails, falls back to manual JSON parsing
 * - If Zod validation fails but LangChain validation passes, uses LangChain result
 * - Comprehensive error logging for debugging validation issues
 * 
 * Features:
 * - Automatic schema conversion from Zod to JSON Schema for LangChain
 * - Post-processing for achievement format normalization
 * - Detailed logging for validation success/failure tracking
 * - Graceful degradation to original parsing methods
 */
export class OpenAIClient {
    private chatModel: ChatOpenAI;
    private visionModel: ChatOpenAI;
    private structuredChatModel: Runnable; // LangChain structured output model
    private structuredVisionModel: Runnable; // LangChain structured output model
    private config: AIConfig;
    private jsonParser: JsonOutputParser;

    constructor(options: OpenAIClientOptions) {
        console.log('🤖 [OpenAI Client] Initializing with options:', {
            modelName: options.config?.modelName || DEFAULT_CONFIG.modelName,
            temperature: options.config?.temperature || DEFAULT_CONFIG.temperature,
            hasSystemPrompt: !!(options.config?.systemPrompt),
            dynamicPrompt: !options.config?.systemPrompt
        });

        // 使用提供的配置或預設配置，並動態生成 system prompt
        this.config = {
            ...DEFAULT_CONFIG,
            ...options.config
        };
        
        // 如果沒有提供 systemPrompt，則動態生成
        if (!options.config?.systemPrompt) {
            this.config.systemPrompt = generateSystemPrompt(SCORE_CATEGORIES);
        }

        console.log('📋 [OpenAI Client] Final config:', {
            modelName: this.config.modelName,
            temperature: this.config.temperature,
            promptLength: this.config.systemPrompt?.length || 0
        });
        
        // Initialize JSON parser for LangChain structured output
        this.jsonParser = new JsonOutputParser();
        
        this.chatModel = new ChatOpenAI({
            apiKey: options.apiKey,
            temperature: this.config.temperature,
            modelName: this.config.modelName,
        });

        // Vision 模型用於處理圖片和 PDF
        this.visionModel = new ChatOpenAI({
            apiKey: options.apiKey,
            temperature: this.config.temperature,
            modelName: "gpt-4o-mini", // 使用支援 Vision 的模型
        });

        // Initialize structured output models with LangChain native validation
        try {
            console.log('🔄 [OpenAI Client] Dynamically generating JSON schema from Zod schema...');
            
            // Dynamically convert Zod schema to JSON schema
            const dynamicJsonSchema = zodToJsonSchema(ResumeAnalysisSchema);
            
            console.log('✅ [OpenAI Client] Dynamic JSON schema generated successfully');
            console.log('📋 [OpenAI Client] Schema structure:', JSON.stringify(dynamicJsonSchema, null, 2));

            // Create structured output models using LangChain native format validation
            this.structuredChatModel = this.chatModel.withStructuredOutput(dynamicJsonSchema, {
                method: "json_mode"
            });
            
            this.structuredVisionModel = this.visionModel.withStructuredOutput(dynamicJsonSchema, {
                method: "json_mode"
            });
            
            console.log('✅ [OpenAI Client] LangChain structured output models initialized successfully with dynamic schema');
        } catch (error) {
            console.warn('⚠️ [OpenAI Client] Failed to initialize structured output models, falling back to regular models:', error);
            // Fallback to regular models if structured output fails
            this.structuredChatModel = this.chatModel;
            this.structuredVisionModel = this.visionModel;
        }
    }

    // 智能解析 AI 回應中的 JSON
    private parseAIResponse(content: string): unknown {
        console.log('🔍 [OpenAI Client] Starting smart JSON parsing');
        
        // 移除所有可能的 markdown 代碼塊標記
        let cleanContent = content;
        
        // 處理 ```json...``` 格式
        const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
        const jsonBlockMatch = cleanContent.match(jsonBlockRegex);
        if (jsonBlockMatch) {
            console.log('📋 [OpenAI Client] Found JSON code block, extracting...');
            cleanContent = jsonBlockMatch[1];
        }
        
        // 處理單獨的 ``` 包圍的內容
        const codeBlockRegex = /```\s*([\s\S]*?)\s*```/;
        const codeBlockMatch = cleanContent.match(codeBlockRegex);
        if (codeBlockMatch && !jsonBlockMatch) {
            console.log('📋 [OpenAI Client] Found generic code block, extracting...');
            cleanContent = codeBlockMatch[1];
        }
        
        // 尋找 JSON 對象 - 從第一個 { 到最後一個 }
        const jsonObjectRegex = /\{[\s\S]*\}/;
        const jsonObjectMatch = cleanContent.match(jsonObjectRegex);
        if (jsonObjectMatch) {
            console.log('📋 [OpenAI Client] Found JSON object pattern');
            cleanContent = jsonObjectMatch[0];
        }
        
        // 清理常見的非 JSON 字符
        cleanContent = cleanContent
            .replace(/^[^\{]*/, '') // 移除開頭非 { 的字符
            .replace(/[^\}]*$/, '') // 移除結尾非 } 的字符
            .trim();
        
        console.log('🧹 [OpenAI Client] Cleaned content length:', cleanContent.length);
        console.log('🧹 [OpenAI Client] First 100 chars:', cleanContent.substring(0, 100));
        
        try {
            const parsed = JSON.parse(cleanContent);
            console.log('✅ [OpenAI Client] Successfully parsed JSON');
            return parsed;
        } catch (error) {
            console.error('❌ [OpenAI Client] JSON parsing failed:', error);
            console.log('📄 [OpenAI Client] Failed content:', cleanContent);
            throw new Error(`無法解析 AI 回應中的 JSON: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // 檢查文件類型
    private getFileType(fileName: string): SupportedFileType | null {
        console.log(`🔍 [OpenAI Client] Analyzing file type for: "${fileName}"`);
        const extension = fileName.split('.').pop()?.toLowerCase();
        console.log(`🔍 [OpenAI Client] Extracted extension: "${extension}"`);
        
        if (!extension) {
            console.log(`❌ [OpenAI Client] No extension found for: "${fileName}"`);
            return null;
        }

        for (const [type, extensions] of Object.entries(SUPPORTED_FILE_TYPES)) {
            console.log(`🔍 [OpenAI Client] Checking type "${type}" with extensions:`, extensions);
            if ((extensions as readonly string[]).includes(extension)) {
                console.log(`✅ [OpenAI Client] Match found: "${fileName}" -> type "${type}"`);
                return type as SupportedFileType;
            }
        }
        
        console.log(`❌ [OpenAI Client] No matching type found for extension "${extension}" in file "${fileName}"`);
        console.log(`🔍 [OpenAI Client] Available extensions:`, SUPPORTED_FILE_TYPES);
        return null;
    }

    // 將文件轉換為 base64（服務器端）
    private async fileToBase64(file: File): Promise<string> {
        if (file instanceof File) {
            // 在服務器端，File 對象需要轉換為 Buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            return buffer.toString('base64');
        }
        throw new Error('Invalid file type');
    }

    // 處理文檔上傳和分析
    async analyzeDocuments(options: FileAnalysisOptions): Promise<ResumeAnalysisResult> {
        const { documents, additionalText, useVision = true } = options;
        
        console.log('🔍 [OpenAI Client] Starting document analysis:', {
            documentsCount: documents.length,
            additionalText: additionalText ? 'provided' : 'none',
            useVision,
            fileNames: documents.map(d => d.fileName)
        });
        
        if (documents.length === 0) {
            throw new Error("至少需要上傳一個文檔");
        }

        // 準備消息內容
        const messageContent: Array<{
            type: "text" | "image_url";
            text?: string;
            image_url?: {
                url: string;
                detail: string;
            };
        }> = [];
        let textContent = "";

        for (const doc of documents) {
            console.log(`📄 [OpenAI Client] Processing document: ${doc.fileName}`);
            
            const fileType = this.getFileType(doc.fileName);
            console.log(`📋 [OpenAI Client] File type detected: ${fileType} for ${doc.fileName}`);
            
            if (!fileType) {
                throw new Error(`不支援的文件類型: ${doc.fileName}`);
            }

            if (fileType === 'PDF' || fileType === 'IMAGES') {
                if (useVision) {
                    console.log(`👁️ [OpenAI Client] Using Vision model for ${doc.fileName}`);
                    // 使用 Vision 模型處理圖片和 PDF
                    const base64Content = await this.fileToBase64(doc.file as File);
                    console.log(`📊 [OpenAI Client] Base64 content length: ${base64Content.length} for ${doc.fileName}`);
                    
                    const mimeType = fileType === 'PDF' ? 'application/pdf' : 
                                   doc.fileName.endsWith('.png') ? 'image/png' :
                                   doc.fileName.endsWith('.jpg') || doc.fileName.endsWith('.jpeg') ? 'image/jpeg' :
                                   doc.fileName.endsWith('.gif') ? 'image/gif' :
                                   doc.fileName.endsWith('.webp') ? 'image/webp' : 'image/jpeg';

                    console.log(`🎯 [OpenAI Client] MIME type: ${mimeType} for ${doc.fileName}`);

                    messageContent.push({
                        type: "image_url",
                        image_url: {
                            url: `data:${mimeType};base64,${base64Content}`,
                            detail: "high"
                        }
                    });
                } else {
                    throw new Error(`需要啟用 Vision 模型來處理 ${fileType} 文件`);
                }
            } else if (fileType === 'DOCUMENTS') {
                console.log(`📝 [OpenAI Client] Processing text document: ${doc.fileName}`);
                // 處理文字文檔
                if (doc.content) {
                    textContent += `\n\n=== ${doc.fileName} ===\n${doc.content}`;
                    console.log(`📄 [OpenAI Client] Text content length: ${doc.content.length} for ${doc.fileName}`);
                } else {
                    throw new Error(`文字文檔 ${doc.fileName} 需要提供內容`);
                }
            }
        }

        // 添加文字內容 - Enhanced prompt for structured output
        const promptText = `請分析以下履歷文檔並以 JSON 格式回傳結果：

${textContent}

${additionalText ? `\n額外資訊：\n${additionalText}` : ''}

請以 JSON 格式回傳分析結果，包含以下欄位：
- projects: 專案列表（每個專案包含 name, description, technologies, duration, role, contribution）
- projects_summary: 專案摘要
- expertise: 技能列表
- expertise_summary: 技能摘要
- work_experiences: 工作經驗列表（每個經驗包含 company, position, duration, description）
- work_experiences_summary: 工作經驗摘要
- education_background: 教育背景列表（每個教育經歷包含 institution, degree, major, duration, gpa, courses, achievements）
- education_summary: 教育背景摘要
- achievements: 成就列表
- achievements_summary: 成就摘要

請確保回傳有效的 JSON 格式。`;

        console.log(`📝 [OpenAI Client] Final prompt text length: ${promptText.length}`);
        console.log(`📝 [OpenAI Client] Message content items: ${messageContent.length}`);

        messageContent.unshift({
            type: "text",
            text: promptText
        });

        // 選擇適當的模型 - Try structured output first
        const useVisionModel = useVision && documents.some(doc => 
            ['PDF', 'IMAGES'].includes(this.getFileType(doc.fileName) || '')
        );

        console.log(`🤖 [OpenAI Client] Using model: ${useVisionModel ? 'Vision (gpt-4o-mini)' : 'Chat (gpt-4o-mini)'}`);

        try {
            console.log('🚀 [OpenAI Client] Attempting LangChain structured output...');
            
            // Select the appropriate structured model
            const selectedModel = useVisionModel ? this.structuredVisionModel : this.structuredChatModel;
            
            // Create prompt template for structured output
            const prompt = ChatPromptTemplate.fromMessages([
                ["system", this.config.systemPrompt],
                ["human", messageContent]
            ]);

            const chain = prompt.pipe(selectedModel);
            
            // Invoke with LangChain structured output
            const result = await chain.invoke({});
            console.log('✅ [OpenAI Client] LangChain structured output successful');
            
            // Validate with Zod as secondary validation
            try {
                const validatedResult = ResumeAnalysisSchema.parse(result);
                console.log('✅ [OpenAI Client] Zod secondary validation passed');
                return validatedResult;
            } catch (zodError) {
                console.warn('⚠️ [OpenAI Client] Zod secondary validation failed, but LangChain validation passed:', zodError);
                
                // Post-process achievements if needed
                if (result && typeof result === 'object' && result !== null) {
                    const resultObj = result as Record<string, unknown>;
                    if (resultObj.achievements && Array.isArray(resultObj.achievements) && 
                        resultObj.achievements.length > 0 && 
                        typeof resultObj.achievements[0] === 'object') {
                        
                        console.log('🔄 [OpenAI Client] Converting achievements from object array to string array');
                        resultObj.achievements = resultObj.achievements.map((item: unknown) => {
                            if (typeof item === 'object' && item !== null) {
                                const achievementObj = item as Record<string, unknown>;
                                return String(achievementObj.description || achievementObj.achievement || achievementObj.title || achievementObj.name) || JSON.stringify(item);
                            }
                            return String(item);
                        });
                    }
                    
                    // Try Zod validation again after post-processing
                    try {
                        const revalidatedResult = ResumeAnalysisSchema.parse(resultObj);
                        console.log('✅ [OpenAI Client] Zod validation passed after post-processing');
                        return revalidatedResult;
                    } catch {
                        console.warn('⚠️ [OpenAI Client] Final Zod validation failed, returning LangChain validated result');
                        return result as ResumeAnalysisResult;
                    }
                }
                
                return result as ResumeAnalysisResult;
            }
            
        } catch (structuredError) {
            console.warn('⚠️ [OpenAI Client] LangChain structured output failed, falling back to manual parsing:', structuredError);
            
            // Fallback to original manual parsing method
            const prompt = ChatPromptTemplate.fromMessages([
                ["system", this.config.systemPrompt],
                ["human", messageContent]
            ]);

            const model = useVisionModel ? this.visionModel : this.chatModel;
            const chain = prompt.pipe(model);

            try {
                console.log('🚀 [OpenAI Client] Sending request to OpenAI (fallback)...');
                const result = await chain.invoke({});
                console.log('📥 [OpenAI Client] Received response from OpenAI (fallback)');
                
                const content = result.content;
                if (typeof content !== 'string') {
                    throw new Error('AI 回應格式錯誤');
                }

                console.log('📝 [OpenAI Client] Response content length:', content.length);

                // 解析 JSON
                let parsedResult;
                try {
                    parsedResult = this.parseAIResponse(content);
                    console.log('✅ [OpenAI Client] JSON parsing successful (fallback)');
                    
                    // 檢查解析結果是否為對象
                    if (parsedResult && typeof parsedResult === 'object' && parsedResult !== null) {
                        console.log('🔍 [OpenAI Client] Parsed result keys:', Object.keys(parsedResult as Record<string, unknown>));
                        
                        // 檢查 achievements 的結構並進行自動轉換
                        const resultObj = parsedResult as Record<string, unknown>;
                        if (resultObj.achievements && Array.isArray(resultObj.achievements) && 
                            resultObj.achievements.length > 0 && 
                            typeof resultObj.achievements[0] === 'object') {
                            
                            console.log('🔄 [OpenAI Client] Converting achievements from object array to string array');
                            resultObj.achievements = resultObj.achievements.map((item: unknown) => {
                                if (typeof item === 'object' && item !== null) {
                                    const achievementObj = item as Record<string, unknown>;
                                    return String(achievementObj.description || achievementObj.achievement || achievementObj.title || achievementObj.name) || JSON.stringify(item);
                                }
                                return String(item);
                            });
                            console.log('✅ [OpenAI Client] Achievements converted successfully');
                        }
                    } else {
                        throw new Error('解析結果不是有效的對象');
                    }
                } catch (parseError) {
                    console.error('❌ [OpenAI Client] JSON parsing failed:', parseError);
                    throw new Error(`無法解析 AI 回應: ${parseError}`);
                }

                // 驗證結果
                try {
                    const validatedResult = ResumeAnalysisSchema.parse(parsedResult);
                    console.log('✅ [OpenAI Client] Zod validation successful (fallback)');
                    return validatedResult;
                } catch (zodError) {
                    console.error('❌ [OpenAI Client] Zod validation failed (fallback):', zodError);
                    console.log('📄 [OpenAI Client] Raw parsed result for debugging:', JSON.stringify(parsedResult, null, 2));
                    
                    // 提供更詳細的錯誤信息
                    if (zodError instanceof z.ZodError) {
                        const errorDetails = zodError.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
                        throw new Error(`資料格式驗證失敗: ${errorDetails}`);
                    }
                    throw new Error(`資料格式驗證失敗: ${zodError}`);
                }
            } catch (fallbackError) {
                console.error('❌ [OpenAI Client] Fallback analysis failed:', fallbackError);
                throw new Error(`分析失敗: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
            }
        }
    }

    async analyzeResume(resumeContent: string, additionalText?: string): Promise<ResumeAnalysisResult> {
        try {
            console.log('🚀 [OpenAI Client] Attempting LangChain structured output for resume analysis...');
            
            // Create prompt template for structured output
            const prompt = ChatPromptTemplate.fromMessages([
                ["system", this.config.systemPrompt],
                ["human", "請分析以下履歷內容並以 JSON 格式回傳結果：\n\n履歷內容：\n{resume_content}\n\n額外資訊：\n{additional_text}\n\n請以 JSON 格式回傳分析結果，包含以下欄位：\n- projects: 專案列表（每個專案包含 name, description, technologies, duration, role）\n- projects_summary: 專案摘要\n- expertise: 技能列表\n- expertise_summary: 技能摘要\n- work_experiences: 工作經驗列表（每個經驗包含 company, position, duration, description）\n- work_experiences_summary: 工作經驗摘要\n- education_background: 教育背景列表，每個教育經歷包含 institution, degree, major, duration, gpa, courses, achievements\n- education_summary: 教育背景摘要\n- achievements: 成就列表\n- achievements_summary: 成就摘要\n\n請確保回傳有效的 JSON 格式。"]
            ]);

            const chain = prompt.pipe(this.structuredChatModel);

            // Invoke with LangChain structured output
            const result = await chain.invoke({
                resume_content: resumeContent,
                additional_text: additionalText || "無"
            });

            console.log('✅ [OpenAI Client] LangChain structured output successful for resume analysis');
            
            // Validate with Zod as secondary validation
            try {
                const validatedResult = ResumeAnalysisSchema.parse(result);
                console.log('✅ [OpenAI Client] Zod secondary validation passed for resume analysis');
                return validatedResult;
            } catch (zodError) {
                console.warn('⚠️ [OpenAI Client] Zod secondary validation failed for resume analysis, but LangChain validation passed:', zodError);
                
                // Post-process achievements if needed
                if (result && typeof result === 'object' && result !== null) {
                    const resultObj = result as Record<string, unknown>;
                    if (resultObj.achievements && Array.isArray(resultObj.achievements) && 
                        resultObj.achievements.length > 0 && 
                        typeof resultObj.achievements[0] === 'object') {
                        
                        console.log('🔄 [OpenAI Client] Converting achievements from object array to string array');
                        resultObj.achievements = resultObj.achievements.map((item: unknown) => {
                            if (typeof item === 'object' && item !== null) {
                                const achievementObj = item as Record<string, unknown>;
                                return String(achievementObj.description || achievementObj.achievement || achievementObj.title || achievementObj.name) || JSON.stringify(item);
                            }
                            return String(item);
                        });
                    }
                    
                    // Try Zod validation again after post-processing
                    try {
                        const revalidatedResult = ResumeAnalysisSchema.parse(resultObj);
                        console.log('✅ [OpenAI Client] Zod validation passed after post-processing for resume analysis');
                        return revalidatedResult;
                    } catch {
                        console.warn('⚠️ [OpenAI Client] Final Zod validation failed for resume analysis, returning LangChain validated result');
                        return result as ResumeAnalysisResult;
                    }
                }
                
                return result as ResumeAnalysisResult;
            }
            
        } catch (structuredError) {
            console.warn('⚠️ [OpenAI Client] LangChain structured output failed for resume analysis, falling back to manual parsing:', structuredError);
            
            // Fallback to original manual parsing method
            const prompt = ChatPromptTemplate.fromMessages([
                ["system", this.config.systemPrompt],
                ["human", "請分析以下履歷內容：\n\n履歷內容：\n{resume_content}\n\n額外資訊：\n{additional_text}\n\n請嚴格按照上述格式回傳 JSON 結果。"]
            ]);

            const chain = prompt.pipe(this.chatModel);

            try {
                const result = await chain.invoke({
                    resume_content: resumeContent,
                    additional_text: additionalText || "無"
                });

                // 解析 AI 回應
                const content = result.content as string;
                
                // 使用智能解析方法
                const parsedResult = this.parseAIResponse(content);
                
                // 檢查 achievements 的結構並進行自動轉換
                if (parsedResult && typeof parsedResult === 'object' && parsedResult !== null) {
                    const resultObj = parsedResult as Record<string, unknown>;
                    
                    if (resultObj.achievements && Array.isArray(resultObj.achievements) && 
                        resultObj.achievements.length > 0 && 
                        typeof resultObj.achievements[0] === 'object') {
                        
                        console.log('🔄 [OpenAI Client] Converting achievements from object array to string array (fallback)');
                        resultObj.achievements = resultObj.achievements.map((item: unknown) => {
                            if (typeof item === 'object' && item !== null) {
                                const achievementObj = item as Record<string, unknown>;
                                return String(achievementObj.description || achievementObj.achievement || achievementObj.title || achievementObj.name) || JSON.stringify(item);
                            }
                            return String(item);
                        });
                    }
                } else {
                    throw new Error('解析結果不是有效的對象');
                }
                
                // 使用 Zod 驗證結果
                return ResumeAnalysisSchema.parse(parsedResult);
            } catch (fallbackError) {
                console.error("Resume analysis fallback error:", fallbackError);
                throw new Error(`履歷分析失敗: ${fallbackError instanceof Error ? fallbackError.message : '未知錯誤'}`);
            }
        }
    }

    async customPrompt(systemPrompt: string, userInput: string): Promise<string> {
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", systemPrompt],
            ["human", "{user_input}"]
        ]);

        const chain = prompt.pipe(this.chatModel);

        try {
            const result = await chain.invoke({
                user_input: userInput
            });

            return result.content as string;
        } catch (error) {
            console.error("Custom prompt error:", error);
            throw new Error(`AI 請求失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
        }
    }
}

// 便利函數：快速創建客戶端實例
export function createOpenAIClient(apiKey: string, config?: AIConfig): OpenAIClient {
    return new OpenAIClient({ apiKey, config });
}

// 文件處理工具函數
export async function processTextFile(file: File): Promise<string> {
    // 在服務器端使用 arrayBuffer 和 Buffer
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