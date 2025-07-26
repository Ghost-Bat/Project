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
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient } = configureChains(
  [polygon],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'GhostBat',
  projectId: 'YOUR_PROJECT_ID',
  chains
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
});


;<ThemeProvider theme={createTheme()} />
ReactDOM.createRoot(document.createElement('div')).render(
  <SyntaxHighlighter language="" children={''} />
)

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <WagmiConfig config={wagmiConfig}>
    <RainbowKitProvider chains={chains}>
      <Init />
    </RainbowKitProvider>
  </WagmiConfig>
)

reportWebVitals()
