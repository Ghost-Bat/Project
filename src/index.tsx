import './polyfills'
import ReactDOM from 'react-dom/client'
import 'typeface-roboto'
import 'modern-normalize/modern-normalize.css'
import './index.css'

import { ThemeProvider, createTheme } from '@mui/material/styles'
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter'

import Init from './Init'
import reportWebVitals from './reportWebVitals'

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiConfig } from 'wagmi';
import { polygon } from 'wagmi/chains';

const config = getDefaultConfig({
  appName: 'GhostBat',
  projectId: 'YOUR_PROJECT_ID',
  chains: [polygon],
  ssr: false,
});

;<ThemeProvider theme={createTheme()} />
ReactDOM.createRoot(document.createElement('div')).render(
  <SyntaxHighlighter language="" children={''} />
)

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <WagmiConfig config={config}>
    <RainbowKitProvider>
      <Init />
    </RainbowKitProvider>
  </WagmiConfig>
)

reportWebVitals()
