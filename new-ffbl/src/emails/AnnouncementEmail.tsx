import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Heading,
  Hr,
  Preview,
} from '@react-email/components';
import * as React from 'react';

interface AnnouncementEmailProps {
  title: string;
  content: string;
  authorName?: string;
}

export const AnnouncementEmail = ({
  title,
  content,
  authorName = "The Commissioner",
}: AnnouncementEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* FFBL Brand Accent Bar */}
          <div style={accentBar} />
          
          <div style={contentPadding}>
            <Heading style={h1}>{title}</Heading>
            
            <Text style={text}>{content}</Text>
            
            <Hr style={hr} />
            
            <Text style={footer}>
              This is an official announcement from <strong>{authorName}</strong>.<br />
              Please do not reply directly to this email, nobody is listening to you...
            </Text>
          </div>
        </Container>
      </Body>
    </Html>
  );
};

// Styles mapped directly to Premium Clubhouse Tailwind values
const main = {
  backgroundColor: '#f8fafc', // bg-slate-50
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  maxWidth: '600px',
  backgroundColor: '#ffffff', // bg-white
  borderRadius: '12px',       // rounded-xl
  border: '1px solid #e2e8f0',// border-slate-200
  marginTop: '40px',
  marginBottom: '40px',
  overflow: 'hidden',         // Keeps the accent bar inside the border radius
};

const accentBar = {
  backgroundColor: '#2563eb', // bg-blue-600
  height: '6px',
  width: '100%',
};

const contentPadding = {
  padding: '32px 32px 40px',
};

const h1 = {
  color: '#0f172a',           // text-slate-900
  fontSize: '24px',
  fontWeight: '900',          // font-black
  letterSpacing: '-0.025em',  // tracking-tight
  margin: '0 0 24px',
  padding: '0',
};

const text = {
  color: '#475569',           // text-slate-600
  fontSize: '16px',
  lineHeight: '26px',
  whiteSpace: 'pre-wrap' as const,
};

const hr = {
  borderColor: '#e2e8f0',     // border-slate-200
  margin: '32px 0 24px',
};

const footer = {
  color: '#94a3b8',           // text-slate-400
  fontSize: '12px',
  lineHeight: '18px',
};

export default AnnouncementEmail;