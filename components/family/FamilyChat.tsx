import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { familyService, FamilyGroup, FamilyMember } from '../../services/familyService';
import { familyChatService, familyJoinRequestService, FamilyChatMessage, FamilyJoinRequest } from '../../services/familyChatService';
import { groceryListsService } from '../../services/supabaseService';
import { GroceryItem } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import ConfirmDialog from '../ui/ConfirmDialog';
import MembersModal from './MembersModal';
import { ArrowDownTrayIcon, TrashIcon, PaperClipIcon, MicrophoneIcon, PhotoIcon, ShoppingCartIcon, UsersIcon, XCircleIcon } from '../icons/Icons';

const FamilyChat: React.FC = () => {
  const { authUser } = useAppState();
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [messages, setMessages] = useState<FamilyChatMessage[]>([]);
  const [joinRequests, setJoinRequests] = useState<FamilyJoinRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // UI States
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [showGroceryPicker, setShowGroceryPicker] = useState(false);
  const [savedGroceryLists, setSavedGroceryLists] = useState<any[]>([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState(false);
  const [showDeleteMemberDialog, setShowDeleteMemberDialog] = useState(false);
  const [pendingDeleteGroupId, setPendingDeleteGroupId] = useState<string | null>(null);
  const [pendingDeleteMemberId, setPendingDeleteMemberId] = useState<string | null>(null);
  const [expandedGroceryLists, setExpandedGroceryLists] = useState<Set<string>>(new Set());
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const [lastViewedTimestamps, setLastViewedTimestamps] = useState<Map<string, string>>(new Map());
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const groupMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authUser) {
      loadFamilyGroups();
      getCurrentUserId();
    }
  }, [authUser]);

  // Subscribe to all groups for unread message tracking
  useEffect(() => {
    if (!authUser || familyGroups.length === 0) return;

    // Subscribe to messages for all groups
    const channels = familyGroups.map(group => {
      const channelName = `family_chat_unread_${group.id}`;
      return supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'family_chat_messages',
            filter: `family_group_id=eq.${group.id}`,
          },
          (payload) => {
            const newMessage = payload.new as any;
            const groupId = newMessage.family_group_id;
            
            // Only count as unread if not currently viewing this group
            if (currentGroup?.id !== groupId) {
              setUnreadCounts(prev => {
                const newMap = new Map(prev);
                const currentCount = newMap.get(groupId) || 0;
                newMap.set(groupId, currentCount + 1);
                return newMap;
              });
            }
          }
        )
        .subscribe();
    });

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [authUser, familyGroups, currentGroup]);

  useEffect(() => {
    if (currentGroup) {
      loadMembers();
      loadMessages().then(() => {
        // Mark messages as read when viewing the group
        const now = new Date().toISOString();
        setLastViewedTimestamps(prev => {
          const newMap = new Map(prev);
          newMap.set(currentGroup.id, now);
          return newMap;
        });
        // Clear unread count for current group
        setUnreadCounts(prev => {
          const newMap = new Map(prev);
          newMap.set(currentGroup.id, 0);
          return newMap;
        });
      });
      // Always load join requests to show count (button only visible to admins)
      loadJoinRequests();
      
      // Subscribe to real-time updates
      const channelName = `family_chat_${currentGroup.id}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'family_chat_messages',
            filter: `family_group_id=eq.${currentGroup.id}`,
          },
          (payload) => {
            console.log('New message received:', payload);
            // Reload messages when a new one is inserted
            loadMessages().then(() => {
              setTimeout(() => scrollToBottom(), 100);
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'family_chat_messages',
            filter: `family_group_id=eq.${currentGroup.id}`,
          },
          (payload) => {
            console.log('Message updated:', payload);
            loadMessages();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'family_chat_messages',
            filter: `family_group_id=eq.${currentGroup.id}`,
          },
          (payload) => {
            console.log('Message deleted:', payload);
            loadMessages();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'family_join_requests',
            filter: `family_group_id=eq.${currentGroup.id}`,
          },
          (payload) => {
            console.log('New join request received:', payload);
            loadJoinRequests();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'family_join_requests',
            filter: `family_group_id=eq.${currentGroup.id}`,
          },
          (payload) => {
            console.log('Join request updated:', payload);
            loadJoinRequests();
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to real-time updates');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Channel subscription error');
          }
        });

      return () => {
        console.log('Unsubscribing from channel:', channelName);
        supabase.removeChannel(channel);
      };
    }
  }, [currentGroup, isAdmin]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close attachment menu and group menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false);
      }
      if (groupMenuRef.current && !groupMenuRef.current.contains(event.target as Node)) {
        setShowGroupMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCurrentUserId = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting current user ID:', error);
        setCurrentUserId(null);
        return;
      }
      if (user) {
        setCurrentUserId(user.id);
      } else {
        setCurrentUserId(null);
      }
    } catch (error) {
      console.error('Error getting current user ID:', error);
      setCurrentUserId(null);
    }
  };

  const loadFamilyGroups = async () => {
    if (!authUser) return;
    
    try {
      setLoading(true);
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;
      
      const groups = await familyService.getUserFamilyGroups(userId);
      setFamilyGroups(groups);
      
      // Calculate initial unread counts for all groups
      const newUnreadCounts = new Map<string, number>();
      for (const group of groups) {
        if (group.id === currentGroup?.id) {
          // Current group has no unread messages
          newUnreadCounts.set(group.id, 0);
        } else {
          // Get last message timestamp for this group
          const lastViewed = lastViewedTimestamps.get(group.id);
          if (lastViewed) {
            // Count messages after last viewed timestamp
            const { data: messages } = await supabase
              .from('family_chat_messages')
              .select('id, created_at')
              .eq('family_group_id', group.id)
              .gt('created_at', lastViewed)
              .order('created_at', { ascending: false });
            
            newUnreadCounts.set(group.id, messages?.length || 0);
          } else {
            // If never viewed, count all messages
            const { data: messages } = await supabase
              .from('family_chat_messages')
              .select('id')
              .eq('family_group_id', group.id);
            
            newUnreadCounts.set(group.id, messages?.length || 0);
          }
        }
      }
      setUnreadCounts(newUnreadCounts);
      
      // Set first group as current if none selected
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
    if (!currentGroup) return;
    
    try {
      const membersList = await familyService.getFamilyMembers(currentGroup.id);
      setMembers(membersList || []);
      
      // Check if current user is admin (creator or parent)
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (userId) {
        const isCreator = currentGroup.created_by === userId;
        const isParent = membersList.some(m => m.user_id === userId && m.role === 'parent');
        setIsAdmin(isCreator || isParent);
        setIsCreator(isCreator);
      }
    } catch (err: any) {
      console.error('Error loading members:', err);
      setMembers([]);
    }
  };

  const loadMessages = async () => {
    if (!currentGroup) return;
    
    try {
      const msgs = await familyChatService.getChatMessages(currentGroup.id);
      console.log('Loaded messages:', msgs.length);
      setMessages(msgs);
      // Scroll to bottom after loading
      setTimeout(() => scrollToBottom(), 100);
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages. Please refresh the page.');
      setMessages([]);
    }
  };

  const loadJoinRequests = async () => {
    if (!currentGroup) return;
    
    try {
      // Load join requests for all users (to show count), but only admins can view/approve
      const requests = await familyJoinRequestService.getJoinRequests(currentGroup.id);
      setJoinRequests(requests);
    } catch (err: any) {
      console.error('Error loading join requests:', err);
      setJoinRequests([]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (date: string) => {
    const msgDate = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const msgDateOnly = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());

    if (msgDateOnly.getTime() === today.getTime()) {
      return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (msgDateOnly.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return msgDate.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  const groupMessagesByDate = (msgs: FamilyChatMessage[]) => {
    const grouped: { [key: string]: FamilyChatMessage[] } = {};
    msgs.forEach(msg => {
      const date = new Date(msg.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      
      let dateKey: string;
      if (msgDate.getTime() === todayDate.getTime()) {
        dateKey = 'Today';
      } else if (msgDate.getTime() === yesterdayDate.getTime()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
      }
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(msg);
    });
    return grouped;
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

      const newGroup = await familyService.createFamilyGroup(familyName.trim(), userId);
      await loadFamilyGroups();
      setCurrentGroup(newGroup);
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
      setError('Please enter a share code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('Not authenticated');

      await familyJoinRequestService.createJoinRequest(joinCode.trim(), userId);
      // Keep modal open so user can see the success message
      setJoinCode('');
      setSuccess('Join request sent! Waiting for admin approval.');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to join family group');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string, userId: string) => {
    try {
      setLoading(true);
      const reviewerId = (await supabase.auth.getUser()).data.user?.id;
      if (!reviewerId || !currentGroup) return;

      await familyJoinRequestService.approveJoinRequest(requestId, reviewerId, currentGroup.id, userId);
      await loadJoinRequests();
      await loadMembers();
      setSuccess('Join request approved!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setLoading(true);
      const reviewerId = (await supabase.auth.getUser()).data.user?.id;
      if (!reviewerId) return;

      await familyJoinRequestService.rejectJoinRequest(requestId, reviewerId);
      await loadJoinRequests();
      setSuccess('Join request rejected');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentGroup || !currentUserId || isSending) {
      if (!currentGroup) setError('Please select a family group');
      if (!currentUserId) setError('Please sign in to send messages');
      return;
    }

    const messageToSend = messageText.trim();
    
    try {
      setIsSending(true);
      setError(null);
      
      console.log('Attempting to send message:', {
        groupId: currentGroup.id,
        userId: currentUserId,
        message: messageToSend.substring(0, 50)
      });
      
      // Send the message
      const sentMessage = await familyChatService.sendTextMessage(currentGroup.id, currentUserId, messageToSend);
      
      console.log('Message sent, response:', sentMessage);
      
      // Clear input immediately for better UX
      setMessageText('');
      
      // Wait a moment for the database to commit
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Reload messages to ensure all users see it
      await loadMessages();
      
      // Scroll to bottom after a brief delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom();
      }, 200);
      
      setSuccess('Message sent!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error('Error sending message:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      const errorMessage = err.message || err.details || 'Failed to send message. Please try again.';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
      // Restore message text on error
      setMessageText(messageToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentGroup || !currentUserId) {
      if (!currentGroup) setError('Please select a family group');
      if (!currentUserId) setError('Please sign in to send images');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsSending(true);
      setError(null);
      setSuccess(null);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          await familyChatService.sendImageMessage(currentGroup.id, currentUserId, base64String, file.name);
          await loadMessages();
          setSuccess('Image sent!');
          setTimeout(() => setSuccess(null), 2000);
        } catch (err: any) {
          console.error('Error sending image:', err);
          const errorMsg = err.message || 'Failed to send image';
          if (!errorMsg.toLowerCase().includes('bucket')) {
            setError(errorMsg);
            setTimeout(() => setError(null), 5000);
          }
        } finally {
          setIsSending(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.onerror = () => {
        setError('Failed to read image file');
        setIsSending(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image');
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await handleVoiceUpload(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err: any) {
      setError('Failed to start recording. Please allow microphone access.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleVoiceUpload = async (blob: Blob) => {
    if (!currentGroup || !currentUserId) {
      if (!currentGroup) setError('Please select a family group');
      if (!currentUserId) setError('Please sign in to send voice messages');
      return;
    }

    try {
      setIsSending(true);
      setError(null);
      setSuccess(null);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          await familyChatService.sendVoiceMessage(currentGroup.id, currentUserId, base64String, 'Voice message');
          await loadMessages();
          setSuccess('Voice message sent!');
          setTimeout(() => setSuccess(null), 2000);
        } catch (err: any) {
          console.error('Error sending voice message:', err);
          const errorMsg = err.message || 'Failed to send voice message';
          if (!errorMsg.toLowerCase().includes('bucket')) {
            setError(errorMsg);
            setTimeout(() => setError(null), 5000);
          }
        } finally {
          setIsSending(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read voice file');
        setIsSending(false);
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      console.error('Error uploading voice message:', err);
      setError(err.message || 'Failed to upload voice message');
      setIsSending(false);
    }
  };

  const loadSavedGroceryLists = async () => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;
      
      const lists = await groceryListsService.getGroceryLists(userId);
      setSavedGroceryLists(lists);
      setShowGroceryPicker(true);
    } catch (err: any) {
      console.error('Error loading grocery lists:', err);
    }
  };

  const handleShareGroceryList = async (listId: string) => {
    try {
      setIsSending(true);
      setError(null);
      setSuccess(null);
      
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId || !currentGroup) {
        setError('Please select a family group and sign in');
        return;
      }

      const list = await groceryListsService.getGroceryList(userId, listId);
      if (list) {
        await familyChatService.shareGroceryList(currentGroup.id, userId, list.items);
        await loadMessages();
        // Keep modal open so user can share more lists if needed
        setSuccess('Grocery list shared!');
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError('Grocery list not found');
      }
    } catch (err: any) {
      console.error('Error sharing grocery list:', err);
      const errorMsg = err.message || 'Failed to share grocery list';
      if (!errorMsg.toLowerCase().includes('bucket')) {
        setError(errorMsg);
        setTimeout(() => setError(null), 5000);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleAddMember = async (userEmailOrId: string) => {
    if (!userEmailOrId.trim() || !currentGroup || !isAdmin) {
      setError('Only admins can add members');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await familyService.addFamilyMemberByEmail(currentGroup.id, userEmailOrId.trim());
      await loadMembers();
      setSuccess('Member added successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error adding member:', err);
      const errorMsg = err.message || 'Failed to add member';
      if (!errorMsg.toLowerCase().includes('bucket')) {
        setError(errorMsg);
        setTimeout(() => setError(null), 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (!isAdmin) {
      setError('Only admins can remove members');
      return;
    }
    
    setPendingDeleteMemberId(memberId);
    setShowDeleteMemberDialog(true);
  };

  const confirmRemoveMember = async () => {
    if (!pendingDeleteMemberId) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', pendingDeleteMemberId);

      if (error) throw error;

      await loadMembers();
      setSuccess('Member removed successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
    } finally {
      setLoading(false);
      setShowDeleteMemberDialog(false);
      setPendingDeleteMemberId(null);
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    setPendingDeleteGroupId(groupId);
    setShowDeleteGroupDialog(true);
  };

  const confirmDeleteGroup = async () => {
    if (!pendingDeleteGroupId) return;

    try {
      setLoading(true);
      setError(null);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Not authenticated');
      }
      const userId = user.id;

      console.log('Deleting group:', pendingDeleteGroupId, 'by user:', userId);
      await familyService.deleteFamilyGroup(pendingDeleteGroupId, userId);
      console.log('Group deleted successfully');
      
      await loadFamilyGroups();
      if (currentGroup?.id === pendingDeleteGroupId) {
        setCurrentGroup(null);
        setMembers([]);
        setMessages([]);
      }
      setSuccess('Family group deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting group:', err);
      setError(err.message || 'Failed to delete family group');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
      setShowDeleteGroupDialog(false);
      setPendingDeleteGroupId(null);
    }
  };

  const getGroupInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getLastMessage = (group: FamilyGroup) => {
    // This would need to fetch the last message for each group
    // For now, return a placeholder
    return 'Tap to view messages';
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="w-full h-full flex bg-surface overflow-hidden">
      {/* Left Sidebar - Chat List */}
      <div className="w-80 md:w-96 border-r border-outline/20 bg-surface flex flex-col flex-shrink-0 min-h-0">
        {/* Top Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-outline/20 bg-surface flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
              <span className="text-on-primary-container font-semibold text-sm">👨‍👩‍👧‍👦</span>
            </div>
            <h1 className="text-lg font-semibold text-on-surface">Family Groups</h1>
          </div>
          <button className="p-2 hover:bg-surface-variant/30 rounded-full transition-colors">
            <svg className="w-5 h-5 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Create/Join Buttons */}
        <div className="px-4 py-3 border-b border-outline/20 bg-surface-variant/20 flex-shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="flex-1 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              + Create Group
            </button>
            <button
              onClick={() => setShowJoin(true)}
              className="flex-1 px-4 py-2 bg-surface-variant text-on-surface-variant rounded-lg text-sm font-medium hover:bg-surface-variant/80 transition-colors"
            >
              Join Group
            </button>
          </div>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-4 py-2">
            <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Your Groups</div>
            {loading && familyGroups.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : familyGroups.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-on-surface-variant">No family groups yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {familyGroups.map((group) => {
                  const isActive = currentGroup?.id === group.id;
                  const unreadCount = unreadCounts.get(group.id) || 0;
                  return (
                    <div
                      key={group.id}
                      onClick={() => setCurrentGroup(group)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        isActive ? 'bg-primary-container/30' : 'hover:bg-surface-variant/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 relative ${
                          isActive ? 'bg-primary' : 'bg-surface-variant'
                        }`}>
                          <span className={`font-semibold text-sm ${
                            isActive ? 'text-on-primary' : 'text-on-surface-variant'
                          }`}>
                            {getGroupInitial(group.name)}
                          </span>
                          {!isActive && unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-error text-on-error text-xs font-bold rounded-full">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={`text-sm font-medium truncate ${
                              isActive ? 'text-on-surface' : 'text-on-surface'
                            }`}>
                              {group.name}
                            </h3>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!isActive && unreadCount > 0 && (
                                <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-error text-on-error text-xs font-bold rounded-full">
                                  {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                              )}
                              <span className="text-xs text-on-surface-variant">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-on-surface-variant truncate">{getLastMessage(group)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-surface">
        {currentGroup ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-4 md:px-6 flex items-center justify-between bg-surface border-b border-outline/20 flex-shrink-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-on-primary font-semibold text-base">
                    {getGroupInitial(currentGroup.name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-on-surface truncate">{currentGroup.name}</h2>
                  <p className="text-xs text-on-surface-variant">Online • {members.length} members</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowMembersModal(true)}
                  className="p-2 hover:bg-surface-variant/30 rounded-full transition-colors"
                  title="View members"
                >
                  <UsersIcon className="h-5 w-5 text-on-surface-variant" />
                </button>
                {isAdmin && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRequestsModal(true);
                        loadJoinRequests();
                      }}
                      className="p-2 hover:bg-surface-variant/30 rounded-full transition-colors relative"
                      title="View join requests"
                    >
                      <svg className="w-5 h-5 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {joinRequests.length > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1 flex items-center justify-center bg-error text-on-error text-xs font-bold rounded-full">
                          {joinRequests.length > 99 ? '99+' : joinRequests.length}
                        </span>
                      )}
                    </button>
                  </div>
                )}
                <div className="relative" ref={groupMenuRef}>
                  <button
                    onClick={() => setShowGroupMenu(!showGroupMenu)}
                    className="p-2 hover:bg-surface-variant/30 rounded-full transition-colors"
                    title="More options"
                  >
                    <svg className="w-5 h-5 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  {showGroupMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-lg shadow-lg border border-outline/20 z-50 overflow-hidden">
                      {isCreator && (
                        <button
                          onClick={() => {
                            handleDeleteGroup(currentGroup.id);
                            setShowGroupMenu(false);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-error hover:bg-error-container/30 transition-colors flex items-center gap-2"
                        >
                          <span>🗑️</span>
                          <span>Delete Group</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Join Requests Modal (Admin Only) */}
            {showRequestsModal && isAdmin && (
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRequestsModal(false)}></div>
                <Card className="relative w-full max-w-md max-h-[80vh] flex flex-col !bg-white !opacity-100 shadow-2xl border-2 border-outline/20 z-10" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-outline/30">
                    <h2 className="text-2xl font-semibold text-on-surface">📋 Join Requests</h2>
                    <button
                      onClick={() => setShowRequestsModal(false)}
                      className="p-2 hover:bg-surface-variant/30 rounded-full transition-colors"
                      aria-label="Close"
                    >
                      <XCircleIcon className="h-6 w-6 text-on-surface-variant" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto mb-4">
                    {joinRequests.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-on-surface-variant">No pending requests</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {joinRequests.map((req) => (
                          <div key={req.id} className="flex items-center justify-between p-4 bg-surface-variant/30 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-on-surface truncate">{req.user_name || 'Unknown User'}</p>
                              <p className="text-xs text-on-surface-variant">Requested {new Date(req.requested_at).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApproveRequest(req.id, req.user_id);
                                }}
                                className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                                disabled={loading}
                              >
                                Approve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectRequest(req.id);
                                }}
                                className="px-3 py-1.5 bg-surface-variant text-on-surface-variant rounded-lg text-xs font-medium hover:bg-surface-variant/80 transition-colors"
                                disabled={loading}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* Messages Area */}
            <div 
              ref={chatContainerRef} 
              className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 min-h-0"
              style={{ scrollBehavior: 'smooth' }}
            >
              {Object.keys(groupedMessages).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-base text-on-surface-variant mb-1">No messages yet</p>
                  <p className="text-sm text-on-surface-variant/70">Start the conversation!</p>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
                  <div key={dateKey}>
                    {/* Date Separator */}
                    <div className="flex items-center justify-center my-4">
                      <div className="px-3 py-1 bg-surface-variant rounded-full">
                        <span className="text-xs font-medium text-on-surface-variant">{dateKey}</span>
                      </div>
                    </div>
                    {/* Messages for this date */}
                    {dateMessages.map((msg) => {
                      const isOwnMessage = msg.user_id === currentUserId;
                      const messageTime = formatMessageTime(msg.created_at);
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}
                        >
                          <div className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2 ${
                            isOwnMessage 
                              ? 'bg-primary text-on-primary rounded-tr-sm' 
                              : 'bg-surface-variant text-on-surface rounded-tl-sm'
                          }`}>
                            {!isOwnMessage && (
                              <p className="text-xs font-semibold mb-1 opacity-90">{msg.user_name}</p>
                            )}
                            {msg.message_type === 'text' && (
                              <p className="text-sm md:text-base break-words whitespace-pre-wrap">{msg.content}</p>
                            )}
                            {msg.message_type === 'image' && msg.file_url && (
                              <div>
                                <img 
                                  src={msg.file_url} 
                                  alt={msg.file_name || 'Image'} 
                                  className="max-w-full rounded-xl mb-2 max-h-64 object-contain" 
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                                {msg.file_name && <p className="text-xs opacity-80">{msg.file_name}</p>}
                              </div>
                            )}
                            {msg.message_type === 'voice' && msg.file_url && (
                              <div className="flex flex-col gap-2">
                                <audio 
                                  src={msg.file_url} 
                                  controls 
                                  className="max-w-full"
                                  onError={(e) => {
                                    console.error('Error loading audio:', e);
                                  }}
                                />
                                {msg.file_name && <p className="text-xs opacity-80">{msg.file_name}</p>}
                              </div>
                            )}
                            {msg.message_type === 'grocery_list' && msg.grocery_list_data && (
                              <div className={`rounded-lg p-3 cursor-pointer transition-colors ${
                                isOwnMessage ? 'bg-primary-container/30 hover:bg-primary-container/40' : 'bg-surface/50 hover:bg-surface/60'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const newExpanded = new Set(expandedGroceryLists);
                                if (newExpanded.has(msg.id)) {
                                  newExpanded.delete(msg.id);
                                } else {
                                  newExpanded.add(msg.id);
                                }
                                setExpandedGroceryLists(newExpanded);
                              }}>
                                <p className={`text-sm font-semibold mb-2 flex items-center justify-between gap-2 ${
                                  isOwnMessage ? 'text-on-primary' : 'text-on-surface'
                                }`}>
                                  <span className="flex items-center gap-2">
                                    <ShoppingCartIcon className="h-4 w-4" />
                                    Grocery List ({msg.grocery_list_data.length} items)
                                  </span>
                                  <span className="text-xs opacity-70">
                                    {expandedGroceryLists.has(msg.id) ? '▼' : '▶'}
                                  </span>
                                </p>
                                {expandedGroceryLists.has(msg.id) && (
                                  <ul className={`text-xs space-y-1 mt-2 ${
                                    isOwnMessage ? 'text-on-primary' : 'text-on-surface'
                                  }`}>
                                    {msg.grocery_list_data.map((item, i) => (
                                      <li key={i} className="flex items-center gap-2 py-1">
                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                          isOwnMessage ? 'bg-on-primary' : 'bg-primary'
                                        }`}></span>
                                        <span className="flex-1">{item.item}</span>
                                        <span className="text-xs opacity-70">{item.quantity}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                {!expandedGroceryLists.has(msg.id) && msg.grocery_list_data.length > 0 && (
                                  <ul className={`text-xs space-y-1 ${
                                    isOwnMessage ? 'text-on-primary' : 'text-on-surface'
                                  }`}>
                                    {msg.grocery_list_data.slice(0, 5).map((item, i) => (
                                      <li key={i} className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                          isOwnMessage ? 'bg-on-primary' : 'bg-primary'
                                        }`}></span>
                                        <span>{item.item} - {item.quantity}</span>
                                      </li>
                                    ))}
                                    {msg.grocery_list_data.length > 5 && (
                                      <li className={`mt-2 text-xs ${
                                        isOwnMessage ? 'text-on-primary/70' : 'text-on-surface-variant'
                                      }`}>
                                        Click to view all {msg.grocery_list_data.length} items...
                                      </li>
                                    )}
                                  </ul>
                                )}
                              </div>
                            )}
                            <div className={`flex items-center gap-1 mt-1 ${
                              isOwnMessage ? 'justify-end' : 'justify-start'
                            }`}>
                              <span className="text-xs opacity-70">{messageTime}</span>
                              {isOwnMessage && (
                                <span className="text-xs opacity-70">✔</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Area */}
            <div className="px-4 md:px-6 py-3 bg-surface border-t border-outline/20 flex-shrink-0">
              {error && !error.toLowerCase().includes('bucket') && (
                <div className="mb-3 p-3 bg-error-container border border-error rounded-lg flex items-start justify-between gap-2">
                  <p className="text-sm text-on-error-container flex-1 break-words">{error}</p>
                  <button 
                    onClick={() => setError(null)} 
                    className="text-on-error-container hover:opacity-70 transition-opacity flex-shrink-0"
                    title="Dismiss"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
              {success && (
                <div className="mb-3 p-3 bg-primary-container border border-primary rounded-lg">
                  <p className="text-sm text-on-primary-container break-words">{success}</p>
                </div>
              )}
              <div className="flex items-end gap-2">
                {/* Attachment Button */}
                <div className="relative" ref={attachmentMenuRef}>
                  <button
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    className="p-2 hover:bg-surface-variant/30 rounded-full transition-colors"
                    title="Attach"
                  >
                    <PaperClipIcon className="h-5 w-5 text-on-surface-variant" />
                  </button>
                  {showAttachmentMenu && (
                    <div className="absolute bottom-full left-0 mb-2 bg-surface rounded-lg shadow-lg border border-outline/20 py-2 min-w-[160px] z-10">
                      <button
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowAttachmentMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-variant/30 flex items-center gap-2"
                      >
                        <PhotoIcon className="h-4 w-4" />
                        Photo Or Video
                      </button>
                      <button
                        onClick={() => {
                          loadSavedGroceryLists();
                          setShowAttachmentMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-variant/30 flex items-center gap-2"
                      >
                        <ShoppingCartIcon className="h-4 w-4" />
                        Grocery List
                      </button>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {/* Message Input */}
                <div className="flex-1 bg-surface-variant/50 rounded-full px-4 py-2.5 border border-transparent focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Write a message for ${currentGroup.name}...`}
                    className="w-full bg-transparent text-on-surface text-sm md:text-base placeholder:text-on-surface-variant focus:outline-none"
                    disabled={isSending}
                  />
                </div>
                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    className="p-2 hover:bg-surface-variant/30 rounded-full transition-colors"
                    title="Emoji"
                  >
                    <svg className="w-5 h-5 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-surface-variant/30 rounded-full transition-colors"
                    title="Photo"
                    disabled={isSending || !currentGroup || !currentUserId}
                  >
                    <PhotoIcon className="h-5 w-5 text-on-surface-variant" />
                  </button>
                  <button
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    className={`p-2 rounded-full transition-colors ${
                      isRecording 
                        ? 'bg-error text-on-error' 
                        : 'hover:bg-surface-variant/30 text-on-surface-variant'
                    }`}
                    title={isRecording ? 'Stop recording' : 'Voice message'}
                    disabled={(isSending && !isRecording) || !currentGroup || !currentUserId}
                  >
                    <MicrophoneIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={isSending || !messageText.trim() || !currentGroup || !currentUserId}
                    className="p-2 bg-primary text-on-primary rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Send"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 min-h-0 overflow-y-auto">
            <div className="text-center max-w-md">
              <div className="text-7xl mb-6">👨‍👩‍👧‍👦</div>
              <h2 className="text-2xl font-semibold text-on-surface mb-2">Welcome to Family Groups</h2>
              <p className="text-base text-on-surface-variant mb-6">
                Create a new family group or join an existing one to start collaborating with your family.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={() => setShowCreate(true)} 
                  className="px-6 py-3 bg-primary text-on-primary rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  + Create Group
                </button>
                <button 
                  onClick={() => setShowJoin(true)} 
                  className="px-6 py-3 bg-surface-variant text-on-surface-variant rounded-lg font-medium hover:bg-surface-variant/80 transition-colors"
                >
                  Join Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Members Modal */}
      {showMembersModal && currentGroup && (
        <MembersModal
          members={members}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          groupId={currentGroup.id}
          onClose={() => setShowMembersModal(false)}
          onRemoveMember={handleRemoveMember}
          onAddMember={handleAddMember}
          loading={loading}
        />
      )}

      {/* Create Family Modal */}
      {showCreate && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={() => { setShowCreate(false); setFamilyName(''); }}>
          {/* Full screen backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <Card className="relative w-full max-w-md !bg-white !opacity-100 shadow-2xl border-2 border-outline/20 z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-on-surface">Create Family Group</h2>
              <button
                onClick={() => { setShowCreate(false); setFamilyName(''); }}
                className="p-2 hover:bg-surface-variant/30 rounded-full transition-colors"
                aria-label="Close"
              >
                <XCircleIcon className="h-6 w-6 text-on-surface-variant" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">
                  Family Name
                </label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Enter family name"
                  className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/20 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateFamily()}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setShowCreate(false); setFamilyName(''); }} 
                  className="flex-1 px-4 py-2 bg-surface-variant text-on-surface-variant rounded-lg font-medium hover:bg-surface-variant/80 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateFamily} 
                  disabled={loading || !familyName.trim()} 
                  className="flex-1 px-4 py-2 bg-primary text-on-primary rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Spinner /> : 'Create'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Join Family Modal */}
      {showJoin && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          {/* Full screen backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowJoin(false); setJoinCode(''); }}></div>
          <Card className="relative w-full max-w-md !bg-white !opacity-100 shadow-2xl border-2 border-outline/20 z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-on-surface">Join Family Group</h2>
              <button
                onClick={() => { setShowJoin(false); setJoinCode(''); }}
                className="p-2 hover:bg-surface-variant/30 rounded-full transition-colors"
                aria-label="Close"
              >
                <XCircleIcon className="h-6 w-6 text-on-surface-variant" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">
                  Share Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter share code"
                  className="w-full bg-surface-variant/50 p-3 rounded-lg border border-outline/20 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinFamily()}
                  autoFocus
                />
                <p className="text-xs text-on-surface-variant mt-2">
                  Ask the group admin for the share code to join their family group.
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setShowJoin(false); setJoinCode(''); }} 
                  className="flex-1 px-4 py-2 bg-surface-variant text-on-surface-variant rounded-lg font-medium hover:bg-surface-variant/80 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinFamily();
                  }} 
                  disabled={loading || !joinCode.trim()} 
                  className="flex-1 px-4 py-2 bg-primary text-on-primary rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Spinner /> : 'Request Join'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Grocery List Picker Modal */}
      {showGroceryPicker && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          {/* Full screen backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowGroceryPicker(false)}></div>
          <Card className="relative w-full max-w-md max-h-[80vh] flex flex-col !bg-white !opacity-100 shadow-2xl border-2 border-outline/20 z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-outline/20">
              <h2 className="text-2xl font-semibold text-on-surface">Select Grocery List</h2>
              <button
                onClick={() => setShowGroceryPicker(false)}
                className="p-2 hover:bg-surface-variant/30 rounded-full transition-colors"
                aria-label="Close"
              >
                <XCircleIcon className="h-6 w-6 text-on-surface-variant" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto mb-4 min-h-0">
              {savedGroceryLists.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCartIcon className="h-12 w-12 text-on-surface-variant/50 mx-auto mb-3" />
                  <p className="text-on-surface-variant mb-1">No saved grocery lists</p>
                  <p className="text-xs text-on-surface-variant/70">Save a grocery list first to share it</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedGroceryLists.map((list) => (
                    <div
                      key={list.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareGroceryList(list.id);
                      }}
                      className="p-4 bg-surface-variant/30 rounded-lg cursor-pointer hover:bg-surface-variant/50 transition-colors"
                    >
                      <p className="font-medium text-on-surface mb-1">{list.name}</p>
                      <p className="text-xs text-on-surface-variant">{list.items.length} items</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowGroceryPicker(false)} 
              className="w-full px-4 py-2 bg-surface-variant text-on-surface-variant rounded-lg font-medium hover:bg-surface-variant/80 transition-colors"
            >
              Cancel
            </button>
          </Card>
        </div>
      )}

      {/* Delete Group Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteGroupDialog}
        title="Delete Family Group"
        message="Are you sure you want to delete this family group? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={confirmDeleteGroup}
        onCancel={() => {
          setShowDeleteGroupDialog(false);
          setPendingDeleteGroupId(null);
        }}
      />

      {/* Delete Member Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteMemberDialog}
        title="Remove Member"
        message="Are you sure you want to remove this member from the family group?"
        confirmText="Remove"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={confirmRemoveMember}
        onCancel={() => {
          setShowDeleteMemberDialog(false);
          setPendingDeleteMemberId(null);
        }}
      />
    </div>
  );
};

export default FamilyChat;
