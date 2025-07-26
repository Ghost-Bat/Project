import { useContext, useEffect, useMemo, useState } from 'react';
import { PeerRoom } from 'lib/PeerRoom';
import { useRtcConfig } from 'hooks/useRtcConfig';
import { trackerUrls } from 'config/trackerUrls';
import { usePeerAction } from 'hooks/usePeerAction';
import { ShellContext } from 'contexts/ShellContext';
import { SettingsContext } from 'contexts/SettingsContext';
import { PeerAction } from 'models/network';
import { AdmissionRequestPayload, AdmissionVotePayload, PendingAdmission } from 'models/chat';
import { AdmissionDialog } from 'components/AdmissionDialog';

interface AdmissionControllerProps {
  roomId: string;
  secret: string;
}

export const AdmissionController = ({ roomId, secret }: AdmissionControllerProps) => {
  const { rtcConfig } = useRtcConfig();
  const { peerList, setPeerList } = useContext(ShellContext);
  const { getUserSettings } = useContext(SettingsContext);
  const { userId, customUsername } = getUserSettings();
  
  const [pendingAdmissions, setPendingAdmissions] = useState<Map<string, PendingAdmission>>(new Map());

  const lobbyRoomId = `${roomId}-lobby`;
  
  const lobbyRoom = useMemo(() => {
    const config = { appId: 'ghostbat-lobby', relayUrls: trackerUrls, rtcConfig, password: secret };
    return new PeerRoom(config, lobbyRoomId);
  }, [lobbyRoomId, rtcConfig, secret]);

  const [sendVote] = usePeerAction<AdmissionVotePayload>({
    peerRoom: lobbyRoom,
    peerAction: PeerAction.ADMISSION_VOTE,
    onReceive: () => {}, // Mevcut üyeler lobi kanalından oy almaz, ana kanaldan alır
  });

  // Ana odadaki diğer üyelere oyları bildirmek için
  const [broadcastVoteToPeers] = usePeerAction<AdmissionVotePayload>({
    peerRoom: useContext(ShellContext).peerRoomRef.current!, // Ana odayı kullan
    peerAction: PeerAction.ADMISSION_VOTE,
    onReceive: (payload) => {
      setPendingAdmissions(prev => {
        const newPending = new Map(prev);
        const request = newPending.get(payload.requestingUserId);
        if (request) {
          request.votes.set(payload.voterId, payload.vote);
          // Oylama sonucunu kontrol et
          checkVoteStatus(request);
        }
        return newPending;
      });
    }
  });

  usePeerAction<AdmissionRequestPayload>({
    peerRoom: lobbyRoom,
    peerAction: PeerAction.ADMISSION_REQUEST,
    onReceive: (payload, peerId) => {
      // Kendimizden gelen istekleri yoksay
      if (payload.requestingUserId === userId) return;

      setPendingAdmissions(prev => {
        const newPending = new Map(prev);
        // Eğer zaten bekleyen bir istek varsa, yenisini ekleme
        if (!newPending.has(payload.requestingUserId)) {
          newPending.set(payload.requestingUserId, {
            requestingUserId: payload.requestingUserId,
            requestingUsername: payload.requestingUsername,
            votes: new Map(),
          });
        }
        return newPending;
      });
    },
  });

  const checkVoteStatus = (request: PendingAdmission) => {
    // Birisi reddederse, istek anında reddedilir
    if (Array.from(request.votes.values()).includes('deny')) {
      handleVoteResult(request.requestingUserId, 'deny');
      return;
    }
    
    // Tüm mevcut üyeler oy kullandıysa ve hepsi kabul ettiyse, istek kabul edilir
    const totalVotersInRoom = peerList.length + 1; // Kendimiz dahil
    if (request.votes.size === totalVotersInRoom && Array.from(request.votes.values()).every(v => v === 'admit')) {
      handleVoteResult(request.requestingUserId, 'admit');
    }
  };
  
  const handleVote = (requestingUserId: string, vote: 'admit' | 'deny') => {
    const mainPeerId = useContext(ShellContext).peerRoomRef.current?.getPeers().find(p => p === userId) || userId;

    const votePayload: AdmissionVotePayload = {
      voterId: mainPeerId, // Kendi peerId'miz
      vote,
      requestingUserId,
    };

    // Oyu hem lobiye (yeni kullanıcıya) hem de ana odaya (diğer üyelere) gönder
    sendVote(votePayload);
    broadcastVoteToPeers(votePayload);

    // Kendi oyumuzu da ekleyerek durumu anında güncelleyelim
    setPendingAdmissions(prev => {
      const newPending = new Map(prev);
      const request = newPending.get(requestingUserId);
      if (request) {
        request.votes.set(mainPeerId, vote);
        checkVoteStatus(request);
      }
      return newPending;
    });
  };

  const handleVoteResult = (requestingUserId: string, result: 'admit' | 'deny') => {
     // Sonucu yeni kullanıcıya bildirmek için son bir kez lobiye gönderim yap
     const finalVotePayload: AdmissionVotePayload = {
        voterId: userId,
        vote: result,
        requestingUserId: requestingUserId
    };
    sendVote(finalVotePayload);

    // İsteği bekleyenler listesinden kaldır
    setPendingAdmissions(prev => {
      const newPending = new Map(prev);
      newPending.delete(requestingUserId);
      return newPending;
    });
  }

  useEffect(() => {
    // Bileşen kaldırıldığında lobi odasından ayrıl
    return () => {
      lobbyRoom.leaveRoom();
    };
  }, [lobbyRoom]);

  // Sadece ilk bekleyen isteği göster
  const firstPendingRequest = Array.from(pendingAdmissions.values())[0];

  return firstPendingRequest ? (
    <AdmissionDialog
      request={firstPendingRequest}
      onVote={(vote) => handleVote(firstPendingRequest.requestingUserId, vote)}
    />
  ) : null;
};
