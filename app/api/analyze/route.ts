import type { DocumentUpload } from '@/lib/openai-client-native';
import { createNativeOpenAIClient, processTextFile, SUPPORTED_FILE_TYPES, validateFileType } from '@/lib/openai-client-native';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log('🚀 [API] POST /api/analyze - Request received (using Native OpenAI Client)');
    
    try {
        const contentType = request.headers.get('content-type') || '';
        console.log('📋 [API] Content-Type:', contentType);
        
        // 處理文件上傳 (multipart/form-data)
        if (contentType.includes('multipart/form-data')) {
            console.log('📁 [API] Handling file upload request');
            return await handleFileUpload(request);
        }
        
        console.log('📝 [API] Handling JSON request');
        // 處理 JSON 請求 (文字分析或自定義提示)
        const body = await request.json();
        console.log('📋 [API] Request body keys:', Object.keys(body));
        
        const { resume, text, systemPrompt, userPrompt } = body;

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('❌ [API] OPENAI_API_KEY is not configured');
            return NextResponse.json(
                { error: 'OpenAI API 配置錯誤' },
                { status: 500 }
            );
        }

        console.log('🤖 [API] Creating Native OpenAI client');
        const client = createNativeOpenAIClient(apiKey);

        // 如果提供了自定義提示，使用自定義分析
        if (systemPrompt && userPrompt) {
            console.log('🎯 [API] Using custom prompt analysis');
            const result = await client.customPrompt(systemPrompt, userPrompt);
            console.log('✅ [API] Custom prompt analysis completed');
            return NextResponse.json({
                success: true,
                data: { result },
                type: 'custom_prompt'
            });
        }

        // 標準履歷分析
        if (!resume) {
            console.error('❌ [API] Missing required parameter: resume');
            return NextResponse.json(
                { error: '缺少必要參數: resume' },
                { status: 400 }
            );
        }

        console.log('📄 [API] Starting standard resume analysis');
        console.log('📋 [API] Resume content length:', resume.length);
        console.log('📋 [API] Additional text:', text ? 'provided' : 'none');
        
        const result = await client.analyzeResume(resume, text);
        console.log('✅ [API] Resume analysis completed');
        
        return NextResponse.json({
            success: true,
            data: result,
            type: 'text_analysis'
        });

    } catch (error) {
        console.error('❌ [API] Resume analysis error:', error);
        if (error instanceof Error) {
            console.error('❌ [API] Error message:', error.message);
            console.error('❌ [API] Error stack:', error.stack);
        }
        return NextResponse.json(
            { 
                error: '履歷分析失敗',
                details: error instanceof Error ? error.message : '未知錯誤'
            },
            { status: 500 }
        );
    }
}

// 處理文件上傳的函數
async function handleFileUpload(request: NextRequest) {
    console.log('📁 [API] Starting file upload handling');
    
    try {
        const formData = await request.formData();
        console.log('📋 [API] FormData received');
        
        const files = formData.getAll('files') as File[];
        const additionalText = formData.get('additionalText') as string;
        const useVision = formData.get('useVision') === 'true';

        console.log('📊 [API] Upload details:', {
            filesCount: files.length,
            fileNames: files.map(f => f.name),
            fileSizes: files.map(f => f.size),
            additionalText: additionalText ? 'provided' : 'none',
            useVision
        });

        if (files.length === 0) {
            console.error('❌ [API] No files uploaded');
            return NextResponse.json(
                { error: '沒有上傳任何文件' },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('❌ [API] OPENAI_API_KEY is not configured');
            return NextResponse.json(
                { error: 'OpenAI API 配置錯誤' },
                { status: 500 }
            );
        }

        console.log('🔍 [API] Starting file validation and processing');
        // 驗證文件類型並處理文件
        const documents: DocumentUpload[] = [];
        
        for (const file of files) {
            console.log(`📄 [API] Processing file: ${file.name} (${file.size} bytes)`);
            
            if (!validateFileType(file.name)) {
                console.error(`❌ [API] Unsupported file type: ${file.name}`);
                return NextResponse.json(
                    { error: `不支援的文件類型: ${file.name}` },
                    { status: 400 }
                );
            }

            // 檢查文件大小 (10MB 限制)
            if (file.size > 10 * 1024 * 1024) {
                console.error(`❌ [API] File too large: ${file.name} (${file.size} bytes)`);
                return NextResponse.json(
                    { error: `文件過大: ${file.name} (最大 10MB)` },
                    { status: 400 }
                );
            }

            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            console.log(`📋 [API] File extension: ${fileExtension} for ${file.name}`);
            
            let content: string | undefined;

            // 對於文字文檔，預先讀取內容
            if (fileExtension && (SUPPORTED_FILE_TYPES.DOCUMENTS as readonly string[]).includes(fileExtension)) {
                console.log(`📝 [API] Reading text content for: ${file.name}`);
                try {
                    content = await processTextFile(file);
                    console.log(`✅ [API] Text content read successfully, length: ${content.length} for ${file.name}`);
                } catch (error) {
                    console.error(`❌ [API] Failed to read text file ${file.name}:`, error);
                    return NextResponse.json(
                        { error: `無法讀取文件 ${file.name}: ${error instanceof Error ? error.message : '未知錯誤'}` },
                        { status: 400 }
                    );
                }
            }

            documents.push({
                file,
                fileName: file.name,
                fileType: file.type,
                content
            });
            
            console.log(`✅ [API] Document prepared: ${file.name}`);
        }

        console.log('🤖 [API] Creating Native OpenAI client for document analysis');
        const client = createNativeOpenAIClient(apiKey);
        
        console.log('🚀 [API] Starting document analysis');
        const result = await client.analyzeDocuments({
            documents,
            additionalText: additionalText || undefined,
            useVision
        });
        
        console.log('✅ [API] Document analysis completed successfully');
        console.log('📊 [API] Analysis result keys:', Object.keys(result));
        console.log('📊 [API] Analysis result:', result);

        return NextResponse.json({
            success: true,
            data: result,
            type: 'document_analysis',
            metadata: {
                filesProcessed: files.length,
                fileNames: files.map(f => f.name),
                useVision,
                totalSize: files.reduce((sum, file) => sum + file.size, 0)
            }
        });

    } catch (error) {
        console.error('❌ [API] File upload error:', error);
        if (error instanceof Error) {
            console.error('❌ [API] Error message:', error.message);
            console.error('❌ [API] Error stack:', error.stack);
        }
        return NextResponse.json(
            { 
                error: '文件分析失敗',
                details: error instanceof Error ? error.message : '未知錯誤'
            },
            { status: 500 }
        );
    }
} 