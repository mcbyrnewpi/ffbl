// src/emails/TradeAnnouncementEmail.tsx
import { Html, Head, Preview, Body, Container, Section, Text, Button } from '@react-email/components';
import * as React from 'react';

interface TradeAnnouncementEmailProps {
  subject: string;
  tradeDetails: { teamName: string; assets: string[] }[];
  tradeId: string;
  appUrl: string;
}

export const TradeAnnouncementEmail = ({ 
  subject, 
  tradeDetails, 
  tradeId,
  appUrl
}: TradeAnnouncementEmailProps) => {
  
  return (
    <Html>
      <Head />
      <Preview>The FFBL Media Network has graded the latest blockbuster trade.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>FFBL Trade Alert</Text>
          </Section>
          
          <Section style={content}>
            <Text style={heading}>🚨 A trade has just been finalized!</Text>
            <Text style={paragraph}>Here are the official details from the Commissioner's Office:</Text>
            
            <Section style={tradeBox}>
              {tradeDetails.map((detail, index) => (
                <div key={detail.teamName} style={{ marginBottom: index === tradeDetails.length - 1 ? '0' : '24px' }}>
                  <Text style={teamHeading}>
                    {detail.teamName} receives:
                  </Text>
                  <ul style={assetList}>
                    {detail.assets.map((asset, i) => (
                      <li key={i} style={{ marginBottom: '6px' }}>{asset}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </Section>

            <Section style={statheadTake}>
              <Text style={statheadHeading}>The Stathead's Take</Text>
              <Text style={quote}>
                "The FFBL Media Network writers have weighed in. The advanced metrics suggest this deal could fundamentally shift the balance of power..."
              </Text>
            </Section>

            <Section style={btnContainer}>
              <Button href={`${appUrl}/trades/${tradeId}`} style={button}>
                Read the Full AI Analysis
              </Button>
            </Section>
            
            <Text style={footer}>
              You are receiving this email because you are a manager in the Franklin Fantasy Baseball League.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Vanilla CSS objects
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
const heading = { fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px 0' };
const paragraph = { fontSize: '16px', lineHeight: '24px', color: '#334155', margin: '0 0 20px 0' };

const tradeBox = { backgroundColor: '#f8fafc', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '32px' };
const teamHeading = { fontWeight: 'bold', color: '#0f172a', margin: '0 0 12px 0', fontSize: '16px', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' };
const assetList = { margin: '0', paddingLeft: '20px', color: '#334155', lineHeight: '1.5', fontSize: '15px' };

const statheadTake = { borderTop: '2px solid #e2e8f0', paddingTop: '20px', marginTop: '10px' };
const statheadHeading = { fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 10px 0' };
const quote = { fontSize: '15px', lineHeight: '24px', color: '#475569', fontStyle: 'italic', margin: '0' };

const btnContainer = { textAlign: 'center' as const, marginTop: '40px', marginBottom: '32px' };

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

export default TradeAnnouncementEmail;