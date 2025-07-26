import { ChangeEvent, useContext, useEffect, useState } from 'react';
import {
  Box, Button, Divider, FormControlLabel, FormGroup, Paper, Switch, Typography,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Link
} from '@mui/material';
import useTheme from '@mui/material/styles/useTheme';
import FileReaderInput, { Result } from 'react-file-reader-input';
import { useAccount, useContractRead, useNetwork, useSwitchNetwork } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ethers } from 'ethers';

import { ConfirmDialog } from 'components/ConfirmDialog';
import { EnhancedConnectivityControl } from 'components/EnhancedConnectivityControl';
import { PeerNameDisplay } from 'components/PeerNameDisplay';
import { SoundSelector } from 'components/SoundSelector/SoundSelector';
import { isEnhancedConnectivityAvailable } from 'config/enhancedConnectivity';
import { SettingsContext } from 'contexts/SettingsContext';
import { ShellContext } from 'contexts/ShellContext';
import { StorageContext } from 'contexts/StorageContext';
import { notification } from 'services/Notification';
import { settings } from 'services/Settings';
import { encryption } from 'services/Encryption';
import { isErrorWithMessage } from 'lib/type-guards';

// PCHAT Token Bilgileri
const PCHAT_CONTRACT_ADDRESS = '0x1cddc4286bA71A2ed46b1aE2e7145323eC6f905A';
const REQUIRED_BALANCE = 100n; // 100 PCHAT
const PCHAT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
];

interface SettingsProps {
  userId: string;
}

export const Settings = ({ userId }: SettingsProps) => {
  const theme = useTheme();
  const { setTitle, showAlert, messageLog, setMessageLog } = useContext(ShellContext);
  const { updateUserSettings, getUserSettings } = useContext(SettingsContext);
  const { getPersistedStorage } = useContext(StorageContext);

  // Cüzdan ve Ağ Hook'ları
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  
  // Token Bakiye Kontrolü
  const { data: balance, isLoading: isBalanceLoading } = useContractRead({
    address: PCHAT_CONTRACT_ADDRESS,
    abi: PCHAT_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    enabled: isConnected && chain?.id === 137, // Sadece bağlıyken ve Polygon ağındayken çalış
    watch: true,
  });

  const hasSufficientBalance = balance ? (BigInt(balance.toString()) / BigInt(10**18)) >= REQUIRED_BALANCE : false;

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [operationType, setOperationType] = useState<'export' | 'import' | null>(null);
  const [fileToImport, setFileToImport] = useState<File | null>(null);

  const {
    playSoundOnNewMessage,
    showNotificationOnNewMessage,
    showActiveTypingStatus,
    isEnhancedConnectivityEnabled,
  } = getUserSettings();

  useEffect(() => {
    setTitle('Settings');
    notification.requestPermission();
  }, [setTitle]);

  const handleExportClick = () => {
    setOperationType('export');
    setIsPasswordDialogOpen(true);
  };

  const handleImportSelect = async ([[, file]]: Result[]) => {
    setFileToImport(file);
    setOperationType('import');
    setIsPasswordDialogOpen(true);
  };
  
  const handlePasswordConfirm = async () => {
    if (!password) {
      showAlert('Password cannot be empty.', { severity: 'error' });
      return;
    }
    
    if (operationType === 'export') {
      try {
        const userSettings = getUserSettings();
        const dataToExport = {
          profile: await settings.exportSettings(userSettings), // exportSettings'in JSON objesi döndürdüğünü varsayıyoruz
          history: messageLog,
        };
        const encryptedData = await encryption.encryptWithPassword(JSON.stringify(dataToExport), password);
        const blob = new Blob([encryptedData], { type: 'application/json;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.download = `ghostbat-backup-${timestamp}.json.enc`;
        link.click();
        showAlert('Data successfully encrypted and exported.', { severity: 'success' });
      } catch (e) {
        if (isErrorWithMessage(e)) showAlert(e.message, { severity: 'error' });
      }
    } else if (operationType === 'import' && fileToImport) {
        const fileReader = new FileReader();
        fileReader.onload = async (event) => {
            try {
                const encryptedData = event.target?.result as string;
                const decryptedString = await encryption.decryptWithPassword(encryptedData, password);
                const importedData = JSON.parse(decryptedString);

                // TODO: Gelen veriyi daha detaylı doğrula (zod, vs.)
                if (importedData.profile && importedData.history) {
                    await updateUserSettings(importedData.profile);
                    // Ana sohbet geçmişini güncelle (DM'ler için de mantık eklenebilir)
                    setMessageLog(importedData.history.groupMessageLog, null);
                    showAlert('Data successfully imported and restored.', { severity: 'success' });
                    // Sayfayı yenilemek en temizi olabilir
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    throw new Error("Invalid backup file format.");
                }
            } catch (error) {
                showAlert('Failed to decrypt or parse the file. Incorrect password or corrupted file.', { severity: 'error' });
            }
        };
        fileReader.readAsText(fileToImport);
    }
    
    // İşlem sonrası state'i temizle
    setIsPasswordDialogOpen(false);
    setPassword('');
    setOperationType(null);
    setFileToImport(null);
  };

  const renderDataSection = () => {
    if (!isConnected) {
      return (
        <Paper elevation={3} sx={{ p: 2, mb: 2, textAlign: 'center' }}>
          <Typography sx={{ mb: 2 }}>Please connect your wallet to manage your data.</Typography>
          <ConnectButton />
        </Paper>
      );
    }

    if (chain?.id !== 137) {
      return (
        <Paper elevation={3} sx={{ p: 2, mb: 2, textAlign: 'center' }}>
          <Typography sx={{ mb: 2 }}>Please switch to the Polygon network to proceed.</Typography>
          <Button variant="contained" onClick={() => switchNetwork?.(137)}>Switch to Polygon</Button>
        </Paper>
      );
    }

    if (isBalanceLoading) {
      return <Typography>Checking your PCHAT balance...</Typography>;
    }

    if (!hasSufficientBalance) {
      return (
         <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Typography color="error">Insufficient PCHAT Balance</Typography>
            <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
              You need at least 100 PCHAT tokens in your wallet to use the import/export feature.
            </Typography>
            <Button variant="contained" component={Link} href="https://uniswap.org/" target="_blank">
              Get PCHAT on Uniswap
            </Button>
        </Paper>
      )
    }

    // Bakiye yeterliyse butonları göster
    return (
      <>
        <Typography variant="h5" sx={{ mb: 1.5 }}>Export Profile & Chat History</Typography>
        <Typography sx={{ mb: 2 }}>
          Securely export your profile and all conversation histories into a single, password-encrypted file.
        </Typography>
        <Button variant="outlined" onClick={handleExportClick} sx={{ mb: 2 }}>Export Data</Button>

        <Typography variant="h5" sx={{ mb: 1.5 }}>Import Profile & Chat History</Typography>
        <Typography sx={{ mb: 2 }}>
          Restore your profile and conversations from a previously exported encrypted file.
        </Typography>
        <FileReaderInput as="text" onChange={handleImportSelect}>
          <Button color="warning" variant="outlined" sx={{ mb: 2 }}>Import Data</Button>
        </FileReaderInput>
      </>
    );
  };

  return (
    <Box sx={{ p: 2, mx: 'auto', maxWidth: theme.breakpoints.values.md }}>
      {/* Mevcut Chat ve Networking Bölümleri... */}
      <Typography variant="h3" sx={{ mb: 2 }}>Chat</Typography>
      {/* ... (buradaki mevcut Paper bileşenleri aynı kalacak) ... */}
      
      <Divider sx={{ my: 2 }} />
      <Typography variant="h3" sx={{ mb: 2 }}>Data Management</Typography>
      {renderDataSection()}

      <Dialog open={isPasswordDialogOpen} onClose={() => setIsPasswordDialogOpen(false)}>
        <DialogTitle>{operationType === 'export' ? 'Set Backup Password' : 'Enter Backup Password'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {operationType === 'export'
              ? 'Please set a strong password to encrypt your backup file. You will need this password to restore your data.'
              : 'Please enter the password you used to encrypt this backup file.'}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            variant="standard"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handlePasswordConfirm()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePasswordConfirm}>Confirm</Button>
        </DialogActions>
      </Dialog>
      
      {/* Mevcut Delete Data Bölümü... */}
      <Divider sx={{ my: 2 }} />
      {/* ... (Delete all profile data kısmı aynı kalacak) ... */}
    </Box>
  );
};
