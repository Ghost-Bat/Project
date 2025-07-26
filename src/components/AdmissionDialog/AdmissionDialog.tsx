import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material';
import { PeerNameDisplay } from 'components/PeerNameDisplay';
import { AdmissionVote, PendingAdmission } from 'models/chat';

interface AdmissionDialogProps {
  request: PendingAdmission;
  onVote: (vote: AdmissionVote) => void;
}

export const AdmissionDialog = ({ request, onVote }: AdmissionDialogProps) => {
  return (
    <Dialog open={true}>
      <DialogTitle>Admission Request</DialogTitle>
      <DialogContent>
        <DialogContentText>
          The user{' '}
          <Typography component="span" fontWeight="bold">
            <PeerNameDisplay>{request.requestingUsername}</PeerNameDisplay>
          </Typography>{' '}
          wants to join this private room.
        </DialogContentText>
        <DialogContentText sx={{ mt: 1 }}>
          All current members must admit them to grant access.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onVote('deny')} color="error">
          Deny
        </Button>
        <Button onClick={() => onVote('admit')} color="success" autoFocus>
          Admit
        </Button>
      </DialogActions>
    </Dialog>
  );
};
