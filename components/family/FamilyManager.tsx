import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { familyService, FamilyGroup, FamilyMember } from '../../services/familyService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

const FamilyManager: React.FC = () => {
  const { authUser } = useAppState();
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Create/Join states
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadFamilyGroups();
    getCurrentUserId();
  }, []);

  const getCurrentUserId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error getting current user ID:', error);
    }
  };

  useEffect(() => {
    if (currentGroup) {
      loadMembers();
    } else {
      setMembers([]);
    }
  }, [currentGroup]);

  const loadFamilyGroups = async () => {
    if (!authUser) return;
    
    try {
      setLoading(true);
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;
      
      const groups = await familyService.getUserFamilyGroups(userId);
      setFamilyGroups(groups);
      if (groups.length > 0 && !currentGroup) {
        setCurrentGroup(groups[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load family groups');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    if (!currentGroup) {
      setMembers([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const membersList = await familyService.getFamilyMembers(currentGroup.id);
      setMembers(membersList || []);
    } catch (err: any) {
      console.error('Error loading members:', err);
      setError(err.message || 'Failed to load members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      setError('Please enter a family name');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const group = await familyService.createFamilyGroup(familyName.trim(), userId);
      await loadFamilyGroups(); // Reload all groups
      setCurrentGroup(group);
      setShowCreate(false);
      setFamilyName('');
      setSuccess('Family group created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create family group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a family code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('Not authenticated');

      await familyService.joinFamilyGroup(joinCode.trim(), userId);
      await loadFamilyGroups(); // Reload all groups
      // Find and set the joined group as current
      const groups = await familyService.getUserFamilyGroups(userId);
      const joinedGroup = groups.find(g => g.id === joinCode.trim());
      if (joinedGroup) {
        setCurrentGroup(joinedGroup);
      }
      setShowJoin(false);
      setJoinCode('');
      setSuccess('Successfully joined family group!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to join family group');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim() || !currentGroup) {
      setError('Please enter a user ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await familyService.addFamilyMemberByEmail(currentGroup.id, memberEmail.trim());
      await loadMembers(); // Reload members
      setMemberEmail('');
      setSuccess('Member added successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFamily = async (groupId: string) => {
    if (!window.confirm('Are you sure you want to delete this family group? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('Not authenticated');

      // Delete family group using service (service will verify creator)
      await familyService.deleteFamilyGroup(groupId, userId);

      await loadFamilyGroups(); // Reload groups
      if (currentGroup?.id === groupId) {
        setCurrentGroup(null);
        setMembers([]);
      }
      setSuccess('Family group deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete family group');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyShareCode = (groupId: string) => {
    navigator.clipboard.writeText(groupId);
    setSuccess('Share code copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-on-surface">👨‍👩‍👧‍👦 Family Groups</h1>
        <div className="flex gap-2">
          <Button onClick={() => { setShowCreate(true); setShowJoin(false); }} disabled={loading}>
            Create Family
          </Button>
          <Button onClick={() => { setShowJoin(true); setShowCreate(false); }} disabled={loading}>
            Join Family
          </Button>
        </div>
      </div>

      {/* Your User ID - Easy to Share */}
      {currentUserId && (
        <Card className="bg-primary-container/30 border-2 border-primary">
          <h3 className="text-lg font-semibold text-on-surface mb-2">📋 Your User ID</h3>
          <p className="text-sm text-on-surface-variant mb-2">
            Share this ID with family members so they can add you to their family group:
          </p>
          <div className="flex items-center gap-2 bg-surface p-3 rounded-lg">
            <code className="flex-1 font-mono text-sm text-on-surface break-all">{currentUserId}</code>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(currentUserId);
                setSuccess('User ID copied to clipboard!');
                setTimeout(() => setSuccess(null), 2000);
              }}
              className="text-xs"
            >
              Copy
            </Button>
          </div>
        </Card>
      )}

      {error && (
        <Card className="bg-error-container border-2 border-error p-4">
          <p className="text-on-error-container">{error}</p>
        </Card>
      )}

      {success && (
        <Card className="bg-tertiary-container border-2 border-tertiary p-4">
          <p className="text-on-tertiary-container">{success}</p>
        </Card>
      )}

      {/* Create Family Modal */}
      {showCreate && (
        <Card className="border-2 border-primary">
          <h2 className="text-xl font-semibold text-on-surface mb-4">Create New Family Group</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">
                Family Name
              </label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g., The Smith Family"
                className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 focus:border-primary focus:ring-primary text-on-surface"
                disabled={loading}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateFamily} disabled={loading || !familyName.trim()}>
                {loading ? <Spinner /> : 'Create'}
              </Button>
              <Button onClick={() => { setShowCreate(false); setFamilyName(''); }} disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Join Family Modal */}
      {showJoin && (
        <Card className="border-2 border-primary">
          <h2 className="text-xl font-semibold text-on-surface mb-4">Join Family Group</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">
                Family Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter family group ID"
                className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/30 focus:border-primary focus:ring-primary text-on-surface"
                disabled={loading}
              />
              <p className="text-xs text-on-surface-variant mt-1">
                Ask the family creator for the family group ID
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleJoinFamily} disabled={loading || !joinCode.trim()}>
                {loading ? <Spinner /> : 'Join'}
              </Button>
              <Button onClick={() => { setShowJoin(false); setJoinCode(''); }} disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Family Groups List */}
      {familyGroups.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-on-surface">Your Families</h2>
          {familyGroups.map((group) => (
            <Card
              key={group.id}
              className={`border-2 ${currentGroup?.id === group.id ? 'border-primary bg-primary-container/20' : 'border-outline/30'}`}
            >
              <div className="flex justify-between items-center">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    setCurrentGroup(group);
                    loadMembers(); // Reload members when switching
                  }}
                >
                  <h3 className="text-lg font-semibold text-on-surface">{group.name}</h3>
                  <p className="text-sm text-on-surface-variant">ID: {group.id.substring(0, 8)}...</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-2">
                    <p className="text-sm font-medium text-primary">Share Code</p>
                    <p className="text-xs text-on-surface-variant font-mono">{group.id.substring(0, 16)}...</p>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyShareCode(group.id);
                    }}
                    className="!px-3 !py-1 text-xs"
                    title="Copy share code"
                  >
                    📋 Copy
                  </Button>
                  {group.created_by === currentUserId && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFamily(group.id);
                      }}
                      className="!px-3 !py-1 text-xs !bg-error-container !text-on-error-container"
                      title="Delete family group"
                    >
                      🗑️ Delete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Current Family Details */}
      {currentGroup && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-on-surface">{currentGroup.name}</h2>
            <div className="flex items-center gap-2">
              <div className="bg-primary-container/30 px-3 py-1 rounded-lg">
                <p className="text-xs text-on-surface-variant">Share Code</p>
                <p className="text-sm font-mono text-primary font-semibold">{currentGroup.id}</p>
              </div>
              <Button
                onClick={() => handleCopyShareCode(currentGroup.id)}
                className="!px-3 !py-1 text-xs"
                title="Copy share code"
              >
                📋 Copy
              </Button>
              {currentGroup.created_by === currentUserId && (
                <Button
                  onClick={() => handleDeleteFamily(currentGroup.id)}
                  className="!px-3 !py-1 text-xs !bg-error-container !text-on-error-container"
                  title="Delete family group"
                >
                  🗑️ Delete
                </Button>
              )}
            </div>
          </div>

          {/* Add Member */}
          <div className="mb-6 p-4 bg-surface-variant/30 rounded-lg">
            <h3 className="text-lg font-medium text-on-surface mb-3">Add Family Member</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="Enter user ID (UUID)"
                className="flex-1 bg-surface-variant/50 p-2 rounded-lg border border-outline/30 focus:border-primary focus:ring-primary text-on-surface font-mono text-sm"
                disabled={loading}
              />
              <Button onClick={handleAddMember} disabled={loading || !memberEmail.trim()}>
                {loading ? <Spinner /> : 'Add'}
              </Button>
            </div>
            <p className="text-xs text-on-surface-variant mt-2">
              Ask the person to share their User ID. They can find it in their profile or by checking the browser console after logging in.
            </p>
          </div>

          {/* Members List */}
          <div>
            <h3 className="text-lg font-medium text-on-surface mb-3">Family Members</h3>
            {loading && members.length === 0 ? (
              <div className="text-center py-8">
                <Spinner />
              </div>
            ) : members.length === 0 ? (
              <p className="text-on-surface-variant text-center py-8">No members yet</p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex justify-between items-center p-3 bg-surface-variant/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-on-surface">{member.user_name || 'Unknown'}</p>
                      <p className="text-sm text-on-surface-variant">
                        ID: {member.user_id.substring(0, 8)}...
                        {member.role === 'parent' && ' 👑 Parent'}
                        {member.role === 'child' && ' 👶 Child'}
                        {member.role === 'viewer' && ' 👁️ Viewer'}
                      </p>
                    </div>
                    <div className="text-right">
                      {member.can_edit && (
                        <span className="text-xs bg-primary-container text-on-primary-container px-2 py-1 rounded-full">
                          Can Edit
                        </span>
                      )}
                      {!member.can_edit && member.can_view && (
                        <span className="text-xs bg-secondary-container text-on-secondary-container px-2 py-1 rounded-full">
                          View Only
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {familyGroups.length === 0 && !showCreate && !showJoin && (
        <Card className="text-center py-12">
          <p className="text-on-surface-variant mb-4">You don't have any family groups yet.</p>
          <Button onClick={() => setShowCreate(true)}>Create Your First Family</Button>
        </Card>
      )}
    </div>
  );
};

export default FamilyManager;

