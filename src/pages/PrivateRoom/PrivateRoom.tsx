import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Typography, Box } from '@mui/material'

import { Room } from 'components/Room'
import { ShellContext } from 'contexts/ShellContext'
import { notification } from 'services/Notification'
import { PasswordPrompt } from 'components/PasswordPrompt'
import { encryption } from 'services/Encryption'
import { Lobby } from 'components/Lobby' // Yeni eklenecek bileşen

type AdmissionState = 'AWAITING_PASSWORD' | 'IN_LOBBY' | 'ADMITTED' | 'DENIED';

interface PrivateRoomProps {
  userId: string;
}

export function PrivateRoom({ userId }: PrivateRoomProps) {
  const { roomId = '' } = useParams()
  const { setTitle } = useContext(ShellContext)

  const [admissionState, setAdmissionState] = useState<AdmissionState>('AWAITING_PASSWORD');
  
  const urlParams = new URLSearchParams(window.location.hash.substring(1))
  if (window.location.hash.length > 0)
    window.history.replaceState(window.history.state, '', '#')
  
  const [secret, setSecret] = useState(urlParams.get('secret') ?? '')

  useEffect(() => {
    notification.requestPermission()
  }, [])

  useEffect(() => {
    setTitle(`Private Room: ${roomId}`)
  }, [roomId, setTitle])

  useEffect(() => {
    if (secret) {
      setAdmissionState('IN_LOBBY');
    }
  }, [secret]);

  const handlePasswordEntered = async (password: string) => {
    if (password.length !== 0) {
      const newSecret = await encryption.encodePassword(roomId, password);
      setSecret(newSecret);
      setAdmissionState('IN_LOBBY');
    }
  }

  const handleAdmissionResult = (result: 'admitted' | 'denied') => {
    if (result === 'admitted') {
      setAdmissionState('ADMITTED');
    } else {
      setAdmissionState('DENIED');
    }
  }

  if (urlParams.has('pwd') && !urlParams.has('secret') && admissionState === 'AWAITING_PASSWORD') {
    handlePasswordEntered(urlParams.get('pwd') ?? '')
  }

  const awaitingSecret = secret.length === 0;

  if (awaitingSecret && admissionState === 'AWAITING_PASSWORD') {
    return <PasswordPrompt isOpen={true} onPasswordEntered={handlePasswordEntered} />;
  }

  if (admissionState === 'IN_LOBBY') {
    return <Lobby userId={userId} roomId={roomId} secret={secret} onAdmissionResult={handleAdmissionResult} />;
  }
  
  if (admissionState === 'ADMITTED') {
    return <Room userId={userId} roomId={roomId} password={secret} />;
  }

  if (admissionState === 'DENIED') {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          Access Denied
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Your request to join the room was denied by its current members.
        </Typography>
      </Box>
    );
  }

  return <PasswordPrompt isOpen={true} onPasswordEntered={handlePasswordEntered} />;
}
