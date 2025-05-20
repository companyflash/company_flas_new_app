'use client';

import { useState } from 'react';
import { sendInvite } from '../../lib/inviteService';

export default function InviteButton({ userId, email }) {
  const [status, setStatus] = useState(null);
  const [sentAt, setSentAt] = useState(null);

  const handleClick = async () => {
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

  if (status === 'sent') {
    return <p>Invite sent at {sentAt}</p>;
  }

  return (
    <>
      <button onClick={handleClick} disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send Invite'}
      </button>
      {status === 'error' && (
        <p style={{ color: 'red' }}>Failed to send invite</p>
      )}
    </>
  );
}
