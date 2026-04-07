// src/emails/MagicLinkEmail.tsx
import { Html, Head, Preview, Body, Container, Section, Text, Link, Img } from '@react-email/components';
import * as React from 'react';

interface MagicLinkEmailProps {
  url: string;
  host: string;
}

export const MagicLinkEmail = ({ url, host }: MagicLinkEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Log in to the FFBL Clubhouse</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>⚾ FFBL CLUBHOUSE</Text>
          </Section>
          <Section style={content}>
            <Text style={paragraph}>Welcome back, Manager.</Text>
            <Text style={paragraph}>
              Click the button below to securely log in to {host}. This link will expire in 24 hours.
            </Text>
            <Section style={btnContainer}>
              <Link href={url} style={button}>
                Sign In to Clubhouse
              </Link>
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
const main = { backgroundColor: '#f4f1ea', fontFamily: 'system-ui, sans-serif' };
const container = { margin: '0 auto', padding: '20px 0 48px', width: '580px' };
const header = { backgroundColor: '#1e3a8a', padding: '24px', borderRadius: '8px 8px 0 0', textAlign: 'center' as const };
const headerText = { color: '#ffffff', fontSize: '24px', fontWeight: 'bold', margin: '0', letterSpacing: '4px' };
const content = { backgroundColor: '#ffffff', padding: '32px', borderRadius: '0 0 8px 8px', border: '1px solid #e2e8f0' };
const paragraph = { fontSize: '16px', lineHeight: '24px', color: '#334155' };
const btnContainer = { textAlign: 'center' as const, marginTop: '32px', marginBottom: '32px' };
const button = { backgroundColor: '#2563eb', borderRadius: '6px', color: '#fff', fontSize: '16px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'block', width: '100%', padding: '16px 0' };
const footer = { fontSize: '12px', color: '#94a3b8', textAlign: 'center' as const, marginTop: '48px' };

export default MagicLinkEmail;