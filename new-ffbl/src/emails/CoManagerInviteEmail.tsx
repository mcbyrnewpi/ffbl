// src/emails/CoManagerInviteEmail.tsx
import { Html, Head, Body, Container, Text, Link, Preview, Section, Img } from '@react-email/components';

interface Props {
  teamName: string;
  inviterName: string;
  inviteeName: string;
  loginUrl: string;
}

export default function CoManagerInviteEmail({ teamName, inviterName, inviteeName, loginUrl }: Props) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
             <Img
               src="https://res.cloudinary.com/dzd6ndt5u/image/upload/q_auto/f_auto/v1776464781/FFBLLogo_evb63q.png"
               width="150"
               alt="FFBL Logo"
               style={logo}
             />
          </Section>
          <Text style={heading}>Welcome to the Big Leagues, {inviteeName}.</Text>
          <Text style={paragraph}>
            <strong>{inviterName}</strong> has officially invited you to join the <strong>{teamName}</strong> as a Co-Manager in the Franklin Fantasy Baseball League.
          </Text>
          <Section style={buttonContainer}>
            <Link href={loginUrl} style={button}>
              Access FFBL
            </Link>
          </Section>
          <Text style={footer}>
             *Note: If you do not already have an FFBL account, clicking the link above will guide you through our secure Magic Link login process.*
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// --- Styles (Using your existing FFBL branding) ---
const main = { backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' };
const container = { margin: '0 auto', padding: '20px 0 48px', width: '580px' };
const header = { padding: '24px', backgroundColor: '#0f172a', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', textAlign: 'center' as const };
const logo = { margin: '0 auto' };
const heading = { fontSize: '24px', fontWeight: '900', color: '#0f172a', padding: '24px 24px 0', margin: '0' };
const paragraph = { fontSize: '16px', lineHeight: '24px', color: '#334155', padding: '0 24px' };
const buttonContainer = { padding: '24px', textAlign: 'center' as const };
const button = { backgroundColor: '#2563eb', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '14px 24px' };
const footer = { fontSize: '12px', fontStyle: 'italic', color: '#94a3b8', padding: '0 24px', marginTop: '24px' };