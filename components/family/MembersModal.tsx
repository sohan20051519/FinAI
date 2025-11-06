import React, { useState } from 'react';
import { FamilyMember } from '../../services/familyService';
import { supabase } from '../../lib/supabase';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { XCircleIcon } from '../icons/Icons';

interface MembersModalProps {
  members: FamilyMember[];
  isAdmin: boolean;
  currentUserId: string | null;
  groupId: string;
  onClose: () => void;
  onRemoveMember: (memberId: string) => void;
  onAddMember: (userEmailOrId: string) => void;
  loading?: boolean;
}

const MembersModal: React.FC<MembersModalProps> = ({
  members,
  isAdmin,
  currentUserId,
  groupId,
  onClose,
  onRemoveMember,
  onAddMember,
  loading = false,
}) => {
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(groupId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleAddMemberClick = () => {
    if (!isAdmin) return;
    setShowAddMember(true);
  };

  const handleAddMemberSubmit = () => {
    if (memberEmail.trim()) {
      onAddMember(memberEmail.trim());
      setMemberEmail('');
      setShowAddMember(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Full screen backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <Card className="relative w-full max-w-md max-h-[80vh] flex flex-col !bg-white !opacity-100 shadow-2xl border-2 border-outline/20 z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-outline/30">
          <h2 className="text-2xl font-semibold text-on-surface">👥 Members</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-variant/30 rounded-full transition-colors"
            aria-label="Close"
          >
            <XCircleIcon className="h-6 w-6 text-on-surface-variant" />
          </button>
        </div>

        {/* Join Code Section */}
        <div className="mb-4 pb-4 border-b border-outline/30">
          <label className="block text-sm font-medium text-on-surface-variant mb-2">
            Share Code
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={groupId}
              readOnly
              className="flex-1 bg-surface-variant/50 p-3 rounded-lg border border-outline/30 text-on-surface font-mono text-sm"
            />
            <button
              onClick={handleCopyCode}
              className="px-4 py-3 bg-primary text-on-primary rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              title="Copy share code"
            >
              {copied ? (
                <>
                  <span>✓</span>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-on-surface-variant mt-2">
            Share this code with others to let them join your family group
          </p>
        </div>

        <div className="flex-1 overflow-y-auto mb-4">
          {members.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-on-surface-variant">No members yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex justify-between items-center p-4 bg-surface-variant/30 rounded-lg hover:bg-surface-variant/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                      <span className="text-on-primary-container font-semibold text-sm">
                        {(member.user_name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-on-surface truncate">
                        {member.user_name || 'Unknown User'}
                        {member.user_id === currentUserId && (
                          <span className="text-xs text-primary ml-2">(You)</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                          {member.role === 'parent' && '👑 Parent'}
                          {member.role === 'child' && '👶 Child'}
                          {member.role === 'viewer' && '👁️ Viewer'}
                        </span>
                        {member.can_edit && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container">
                            Can Edit
                          </span>
                        )}
                        {!member.can_edit && member.can_view && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container">
                            View Only
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1 truncate">
                        ID: {member.user_id.substring(0, 16)}...
                      </p>
                    </div>
                  </div>
                  {isAdmin && member.user_id !== currentUserId && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveMember(member.id);
                      }}
                      className="!px-3 !py-1.5 text-xs !bg-error-container !text-on-error-container ml-2 flex-shrink-0"
                      title="Remove member"
                      disabled={loading}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="pt-4 border-t border-outline/30">
            {showAddMember ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="Enter user ID or email"
                  className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMemberSubmit()}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddMemberSubmit();
                    }}
                    disabled={loading || !memberEmail.trim()}
                    className="flex-1"
                  >
                    {loading ? 'Adding...' : 'Add Member'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAddMember(false);
                      setMemberEmail('');
                    }}
                    className="flex-1 !bg-secondary-container !text-on-secondary-container"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleAddMemberClick}
                className="w-full"
                disabled={loading}
              >
                + Add Member
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default MembersModal;

