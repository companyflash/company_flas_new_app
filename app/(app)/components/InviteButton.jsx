import { useState } from 'react';
import { sendInvite } from '../lib/inviteService'; // or wherever you place it

export default function InviteButton({ userId, email }) {
  const [status, setStatus] = useState(null);
  const [sentAt, setSentAt] = useState(null);

  const onClick = async () => {
    setStatus('sending');
    try {
      const invite = await sendInvite(userId, email);
      setSentAt(new Date(invite.sent_at).toLocaleString());
      setStatus('sent');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div>
      {status === 'sent' ? (
        <p>Invite sent at {sentAt}</p>
      ) : (
        <button onClick={onClick} disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send Invite'}
        </button>
      )}
      {status === 'error' && <p style={{ color: 'red' }}>Failed to send invite</p>}
    </div>
  );
}
