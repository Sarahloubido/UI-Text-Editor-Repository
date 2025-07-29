import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables
const FIGMA_CLIENT_ID = process.env.FIGMA_CLIENT_ID;
const FIGMA_CLIENT_SECRET = process.env.FIGMA_CLIENT_SECRET;
const FIGMA_REDIRECT_URI = process.env.FIGMA_REDIRECT_URI;

// Validate required environment variables
if (!FIGMA_CLIENT_ID || !FIGMA_CLIENT_SECRET || !FIGMA_REDIRECT_URI) {
  console.error('Missing required environment variables:');
  console.error('- FIGMA_CLIENT_ID:', !!FIGMA_CLIENT_ID);
  console.error('- FIGMA_CLIENT_SECRET:', !!FIGMA_CLIENT_SECRET);
  console.error('- FIGMA_REDIRECT_URI:', !!FIGMA_REDIRECT_URI);
  process.exit(1);
}

// Route 1: Redirect to Figma OAuth
app.get('/api/auth/figma', (req, res) => {
  const scope = 'file_read';
  const state = Math.random().toString(36).substring(2, 15); // Random state for security
  
  const figmaAuthUrl = new URL('https://www.figma.com/oauth');
  figmaAuthUrl.searchParams.append('client_id', FIGMA_CLIENT_ID);
  figmaAuthUrl.searchParams.append('redirect_uri', FIGMA_REDIRECT_URI);
  figmaAuthUrl.searchParams.append('scope', scope);
  figmaAuthUrl.searchParams.append('state', state);
  figmaAuthUrl.searchParams.append('response_type', 'code');

  console.log('Redirecting to Figma OAuth:', figmaAuthUrl.toString());
  res.redirect(figmaAuthUrl.toString());
});

// Route 2: Handle Figma OAuth callback
app.get('/api/auth/figma/callback', async (req, res) => {
  const { code, state, error } = req.query;

  // Handle OAuth errors
  if (error) {
    console.error('Figma OAuth error:', error);
    return res.redirect(`/dashboard?error=${encodeURIComponent(error as string)}`);
  }

  // Validate code parameter
  if (!code) {
    console.error('No authorization code received');
    return res.redirect('/dashboard?error=no_code');
  }

  try {
    console.log('Exchanging code for access token...');
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://www.figma.com/api/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: FIGMA_CLIENT_ID,
        client_secret: FIGMA_CLIENT_SECRET,
        redirect_uri: FIGMA_REDIRECT_URI,
        code: code as string,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      return res.redirect('/dashboard?error=token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.error('No access token in response:', tokenData);
      return res.redirect('/dashboard?error=no_access_token');
    }

    console.log('Successfully obtained access token');
    
    // Redirect to dashboard with the access token
    const dashboardUrl = new URL('/dashboard', req.get('origin') || 'http://localhost:5173');
    dashboardUrl.searchParams.append('token', tokenData.access_token);
    
    if (tokenData.refresh_token) {
      dashboardUrl.searchParams.append('refresh_token', tokenData.refresh_token);
    }
    
    res.redirect(dashboardUrl.toString());
    
  } catch (error) {
    console.error('Error during token exchange:', error);
    res.redirect('/dashboard?error=server_error');
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: {
      hasClientId: !!FIGMA_CLIENT_ID,
      hasClientSecret: !!FIGMA_CLIENT_SECRET,
      hasRedirectUri: !!FIGMA_REDIRECT_URI,
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`🔗 Figma OAuth endpoint: http://localhost:${PORT}/api/auth/figma`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

export default app;