import { useEffect, useState, useMemo, useContext } from 'react';
import { Box, Typography, CircularProgress, LinearProgress } from '@mui/material';
import { PeerRoom } from 'lib/PeerRoom';
import { useRtcConfig } from 'hooks/useRtcConfig';
import { trackerUrls } from 'config/trackerUrls';
import { usePeerAction } from 'hooks/usePeerAction';
import { PeerAction } from 'models/network';
import { AdmissionRequestPayload, AdmissionVote, AdmissionVotePayload } from 'models/chat';
import { SettingsContext } from 'contexts/SettingsContext';

interface LobbyProps {
  userId: string;
  roomId: string;
  secret: string;
  onAdmissionResult: (result: 'admitted' | 'denied') => void;
}

export const Lobby = ({ userId, roomId, secret, onAdmissionResult }: LobbyProps) => {
  const { getUserSettings } = useContext(SettingsContext);
  const { customUsername } = getUserSettings();
  const { rtcConfig } = useRtcConfig();
  const [status, setStatus] = useState('Connecting to the lobby...');
  const [totalVoters, setTotalVoters] = useState(0);
  const [votes, setVotes] = useState<Map<string, AdmissionVote>>(new Map());

  const lobbyRoomId = `${roomId}-lobby`;

  const lobbyRoom = useMemo(() => {
    const config = { appId: 'ghostbat-lobby', relayUrls: trackerUrls, rtcConfig, password: secret };
    return new PeerRoom(config, lobbyRoomId);
  }, [lobbyRoomId, rtcConfig, secret]);

  const [sendAdmissionRequest] = usePeerAction<AdmissionRequestPayload>({
    peerRoom: lobbyRoom,
    peerAction: PeerAction.ADMISSION_REQUEST,
    onReceive: () => {}, // Lobi kullanıcısı bu mesajı almaz
  });

  usePeerAction<AdmissionVotePayload>({
    peerRoom: lobbyRoom,
    peerAction: PeerAction.ADMISSION_VOTE,
    onReceive: (payload) => {
      if (payload.requestingUserId !== userId) return;

      setVotes(prev => new Map(prev).set(payload.voterId, payload.vote));

      if (payload.vote === 'deny') {
        setStatus('Your request has been denied.');
        lobbyRoom.leaveRoom();
        setTimeout(() => onAdmissionResult('denied'), 2000);
      }
    },
  });

  useEffect(() => {
    let peerCount = 0;
    
    lobbyRoom.onPeerJoin('LOBBY', (peerId) => {
      peerCount = Object.keys(lobbyRoom.getPeers()).length;
      setTotalVoters(peerCount);
      setStatus(`Connected. Waiting for ${peerCount} member(s) to vote...`);

      // Odaya ilk giren biz değilsek, istek gönder
      if (peerCount > 0) {
        sendAdmissionRequest({
          requestingUserId: userId,
          requestingUsername: customUsername || userId,
        });
      } else {
        // Odaya ilk giren biziz, direkt kabul edilmeliyiz.
        setStatus('Creating room... You are the first member.');
        lobbyRoom.leaveRoom();
        setTimeout(() => onAdmissionResult('admitted'), 1000);
      }
    });

    lobbyRoom.onPeerLeave('LOBBY', () => {
       peerCount = Object.keys(lobbyRoom.getPeers()).length;
       setTotalVoters(peerCount);
    });

    return () => {
      lobbyRoom.leaveRoom();
    };
  }, [lobbyRoom, userId, customUsername, sendAdmissionRequest, onAdmissionResult]);

  useEffect(() => {
    const admittedVotes = Array.from(votes.values()).filter(v => v === 'admit').length;
    if (totalVoters > 0 && admittedVotes === totalVoters) {
      setStatus('Your request has been approved! Joining room...');
      lobbyRoom.leaveRoom();
      setTimeout(() => onAdmissionResult('admitted'), 1000);
    } else if (totalVoters > 0) {
        setStatus(`Waiting for approval... (${admittedVotes}/${totalVoters} approved)`);
    }
  }, [votes, totalVoters, onAdmissionResult, lobbyRoom]);

  const progress = totalVoters > 0 ? (votes.size / totalVoters) * 100 : 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        p: 3,
      }}
    >
      <CircularProgress sx={{ mb: 3 }} />
      <Typography variant="h6">{status}</Typography>
      {totalVoters > 0 && <LinearProgress variant="determinate" value={progress} sx={{ width: '50%', mt: 2 }} />}
    </Box>
  );
};
