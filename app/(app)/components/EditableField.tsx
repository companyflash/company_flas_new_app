// app/(app)/components/EditableField.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (newValue: string) => Promise<void>;
  inputType?: React.InputHTMLAttributes<HTMLInputElement>['type'];
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export default function EditableField({
  label,
  value,
  onSave,
  inputType = 'text',
  inputProps,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep draft in sync when value changes externally
  useEffect(() => {
    setDraft(value);
  }, [value]);

  // Click outside to cancel edit
  useEffect(() => {
    if (!isEditing) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsEditing(false);
        setError(null);
        setDraft(value);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isEditing, value]);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSave(draft);
      setIsEditing(false);
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setDraft(value);
    setError(null);
    setIsEditing(false);
  };

  return (
    <div ref={containerRef} className="space-y-2">
      <label className="block text-gray-700 font-medium">{label}</label>

      {isEditing ? (
        <div className="flex items-center space-x-2">
          <input
            type={inputType}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="flex-grow border rounded px-3 py-2"
            {...inputProps}
          />
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Confirm'}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-gray-800">{value}</span>
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit
          </button>
        </div>
      )}

      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
