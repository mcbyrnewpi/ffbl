// src/emails/MagicLinkEmail.tsx
import { Html, Head, Preview, Body, Container, Section, Text, Button } from '@react-email/components';
import * as React from 'react';

interface MagicLinkEmailProps {
  url: string;
  host: string;
}

export const MagicLinkEmail = ({ url, host }: MagicLinkEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Log in to FFBL</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>Franklin Fantasy Baseball League</Text>
          </Section>
          <Section style={content}>
            <Text style={paragraph}>Here is your magic link to log into FFBL.</Text>
            <Text style={paragraph}>
              Click the button below to securely log in. Your link will expire in 24 hours.
            </Text>
            <Section style={btnContainer}>
              <Button href={url} style={button}>
                Sign In to Clubhouse
              </Button>
            </Section>
            <Text style={footer}>
              If you didn't request this email, you can safely ignore it.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Vanilla CSS objects (React Email compiles these inline for strict email clients)
const main = { backgroundColor: '#f4f1ea', fontFamily: 'system-ui, -apple-system, sans-serif' };
const container = { margin: '0 auto', padding: '20px 0 48px', width: '580px', maxWidth: '100%' };
const header = { backgroundColor: '#1e3a8a', padding: '32px 24px', borderRadius: '8px 8px 0 0', textAlign: 'center' as const };

const headerText = { 
  color: '#ffffff', 
  fontSize: '28px', 
  fontWeight: '800', 
  margin: '0', 
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  letterSpacing: '-0.5px'
};

const content = { backgroundColor: '#ffffff', padding: '32px', borderRadius: '0 0 8px 8px', border: '1px solid #e2e8f0' };
const paragraph = { fontSize: '16px', lineHeight: '24px', color: '#334155' };
const btnContainer = { textAlign: 'center' as const, marginTop: '32px', marginBottom: '32px' };

const button = { 
  backgroundColor: '#2563eb', 
  borderRadius: '6px', 
  color: '#fff', 
  fontSize: '16px', 
  fontWeight: 'bold', 
  textDecoration: 'none', 
  textAlign: 'center' as const, 
  display: 'inline-block', 
  padding: '14px 32px' 
};

const footer = { fontSize: '12px', color: '#94a3b8', textAlign: 'center' as const, marginTop: '48px' };

export default MagicLinkEmail;