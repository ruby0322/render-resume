import { Heading, Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import BaseEmailTemplate, { BRAND_COLORS, emailStyles } from './BaseEmailTemplate';

interface SignupEmailTemplateProps {
  token: string;
  redirectTo: string;
  userName?: string;
}

export const SignupEmailTemplate: React.FC<SignupEmailTemplateProps> = ({
  token,
  redirectTo,
  userName = '您',
}) => {
  return (
    <BaseEmailTemplate
      preview="確認您的帳戶並開始製作出色的履歷"
    >
      <Section style={emailStyles.header}>
        <Text style={emailStyles.logo}>✨ RenderResume</Text>
        <Heading style={emailStyles.headerTitle}>歡迎加入！</Heading>
        <Text style={emailStyles.headerSubtitle}>
          讓我們確認您的帳戶，開始製作出色的履歷。
        </Text>
      </Section>
      
      <Section style={emailStyles.content}>
        <Text style={{ fontSize: '16px', marginBottom: '20px', margin: '0 0 20px 0' }}>
          {userName} 您好！👋<br /><br />
          歡迎使用 RenderResume！我們很興奮能幫助您創建專業的 AI 履歷，讓您在競爭中脫穎而出。
        </Text>
        
        <Section style={emailStyles.codeContainer}>
          <Text style={emailStyles.codeLabel}>您的確認碼：</Text>
          <Text style={emailStyles.verificationCode}>{token}</Text>
        </Section>
        
        <Section style={{ textAlign: 'center' }}>
          <Text style={{ margin: '20px 0', color: BRAND_COLORS.textLight }}>
            點擊下方按鈕確認您的電子郵件並開始使用：
          </Text>
          
          <Link href={redirectTo} style={emailStyles.ctaButton}>
            確認電子郵件並開始使用
          </Link>
        </Section>
        
        <Section style={emailStyles.infoBox}>
          <Heading as="h3" style={{ color: BRAND_COLORS.primary, marginBottom: '10px', margin: '0 0 10px 0' }}>
            🚀 接下來什麼？
          </Heading>
          <Text style={{ margin: 0, paddingLeft: '20px', color: BRAND_COLORS.text }}>
            • 上傳您的現有履歷或從頭開始<br />
            • 獲得 AI 驅動的改進建議<br />
            • 下載專業的 PDF 版本<br />
            • 與潛在雇主分享您的履歷
          </Text>
        </Section>
      </Section>
      
      <Section style={emailStyles.footer}>
        <Text style={emailStyles.footerText}>
          <strong>重要提醒：</strong>此確認碼將於 1 小時後過期，以確保安全性。
        </Text>
        <Text style={emailStyles.footerText}>
          如果您沒有建立 RenderResume 帳戶，您可以安全地忽略此電子郵件。
        </Text>
        <Text style={{ ...emailStyles.footerText, marginTop: '20px' }}>
          需要協助？回覆此電子郵件或造訪我們的{' '}
          <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/support`} style={emailStyles.link}>
            支援中心
          </Link>。
        </Text>
      </Section>
    </BaseEmailTemplate>
  );
}; 