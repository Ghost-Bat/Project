import './polyfills'
import ReactDOM from 'react-dom/client'
import 'typeface-roboto'
import 'modern-normalize/modern-normalize.css'
import './index.css'

import { ThemeProvider, createTheme } from '@mui/material/styles'
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter'

import Init from './Init'
import reportWebVitals from './reportWebVitals'

// --- WEB3 ve REACT QUERY IMPORT'LARI ---
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiConfig } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // YENİ IMPORT

// --- WEB3 ve REACT QUERY KONFİGÜRASYONU ---
const queryClient = new QueryClient(); // YENİ: QueryClient'ı oluştur

const config = getDefaultConfig({
  appName: 'GhostBat',
  projectId: 'YOUR_PROJECT_ID', // WalletConnect Cloud'dan aldığınız ID'yi buraya yapıştırın
  chains: [polygon],
  ssr: false, 
});

// --- ÖNBELLEKLEME İÇİN GEÇİCİ RENDER'LAR ---
;<ThemeProvider theme={createTheme()} />
ReactDOM.createRoot(document.createElement('div')).render(
  <SyntaxHighlighter language="" children={''} />
)

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

// Uygulamayı QueryClientProvider ile de sarmalayın
root.render(
  <WagmiConfig config={config}>
    <RainbowKitProvider>
      <QueryClientProvider client={queryClient}>
        <Init />
      </QueryClientProvider>
    </RainbowKitProvider>
  </WagmiConfig>
)

reportWebVitals()
