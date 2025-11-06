import { supabase } from '../lib/supabase';
import { GroceryItem } from '../types';

export interface FamilyChatMessage {
  id: string;
  family_group_id: string;
  user_id: string;
  user_name?: string;
  message_type: 'text' | 'image' | 'voice' | 'grocery_list';
  content?: string;
  file_url?: string;
  file_name?: string;
  grocery_list_data?: GroceryItem[];
  created_at: string;
  updated_at: string;
}

export interface FamilyJoinRequest {
  id: string;
  family_group_id: string;
  user_id: string;
  user_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export const familyChatService = {
  // Get chat messages for a family group
  async getChatMessages(groupId: string, limit: number = 50): Promise<FamilyChatMessage[]> {
    console.log('Fetching messages for group:', groupId);
    
    // First, fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from('family_chat_messages')
      .select('*')
      .eq('family_group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (messagesError) {
      console.error('Error fetching chat messages:', messagesError);
      console.error('Error details:', JSON.stringify(messagesError, null, 2));
      return [];
    }

    if (!messages || messages.length === 0) {
      console.log('No messages found');
      return [];
    }

    console.log('Fetched messages:', messages.length);

    // Get unique user IDs
    const userIds = [...new Set(messages.map((msg: any) => msg.user_id))];
    
    // Fetch user profiles for all users
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, name')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
    }

    // Create a map of user_id to profile
    const profileMap = new Map();
    (profiles || []).forEach((profile: any) => {
      profileMap.set(profile.user_id, profile);
    });

    // Map messages with user names
    return messages.map((msg: any) => {
      const profile = profileMap.get(msg.user_id);
      
      return {
        id: msg.id,
        family_group_id: msg.family_group_id,
        user_id: msg.user_id,
        user_name: profile?.name || `User ${msg.user_id.substring(0, 8)}`,
        message_type: msg.message_type,
        content: msg.content,
        file_url: msg.file_url,
        file_name: msg.file_name,
        grocery_list_data: msg.grocery_list_data,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
      };
    }).reverse(); // Reverse to show oldest first
  },

  // Send a text message
  async sendTextMessage(groupId: string, userId: string, content: string): Promise<FamilyChatMessage> {
    console.log('Sending message:', { groupId, userId, content: content.substring(0, 50) });
    
    const { data, error } = await supabase
      .from('family_chat_messages')
      .insert({
        family_group_id: groupId,
        user_id: userId,
        message_type: 'text',
        content: content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('Message sent successfully:', data);
    return data as FamilyChatMessage;
  },

  // Send an image message (fileUrl can be base64 data URL or public URL)
  async sendImageMessage(groupId: string, userId: string, fileUrl: string, fileName: string): Promise<FamilyChatMessage> {
    const { data, error } = await supabase
      .from('family_chat_messages')
      .insert({
        family_group_id: groupId,
        user_id: userId,
        message_type: 'image',
        file_url: fileUrl, // Can be base64 data URL or public URL
        file_name: fileName,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending image:', error);
      throw error;
    }

    return data as FamilyChatMessage;
  },

  // Send a voice message (fileUrl can be base64 data URL or public URL)
  async sendVoiceMessage(groupId: string, userId: string, fileUrl: string, fileName: string): Promise<FamilyChatMessage> {
    const { data, error } = await supabase
      .from('family_chat_messages')
      .insert({
        family_group_id: groupId,
        user_id: userId,
        message_type: 'voice',
        file_url: fileUrl, // Can be base64 data URL or public URL
        file_name: fileName,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending voice message:', error);
      throw error;
    }

    return data as FamilyChatMessage;
  },

  // Share a grocery list
  async shareGroceryList(groupId: string, userId: string, groceryList: GroceryItem[]): Promise<FamilyChatMessage> {
    const { data, error } = await supabase
      .from('family_chat_messages')
      .insert({
        family_group_id: groupId,
        user_id: userId,
        message_type: 'grocery_list',
        grocery_list_data: groceryList,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sharing grocery list:', error);
      throw error;
    }

    return data as FamilyChatMessage;
  },

  // Delete a message
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('family_chat_messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },
};

export const familyJoinRequestService = {
  // Create a join request
  async createJoinRequest(groupId: string, userId: string): Promise<FamilyJoinRequest> {
    const { data, error } = await supabase
      .from('family_join_requests')
      .insert({
        family_group_id: groupId,
        user_id: userId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating join request:', error);
      throw error;
    }

    return data as FamilyJoinRequest;
  },

  // Get join requests for a group (only for admins)
  async getJoinRequests(groupId: string): Promise<FamilyJoinRequest[]> {
    // First, fetch join requests
    const { data: requests, error: requestsError } = await supabase
      .from('family_join_requests')
      .select('*')
      .eq('family_group_id', groupId)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching join requests:', requestsError);
      return [];
    }

    if (!requests || requests.length === 0) {
      return [];
    }

    // Get unique user IDs
    const userIds = [...new Set(requests.map((req: any) => req.user_id))];
    
    // Fetch user profiles for all users
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, name')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
    }

    // Create a map of user_id to profile
    const profileMap = new Map();
    (profiles || []).forEach((profile: any) => {
      profileMap.set(profile.user_id, profile);
    });

    // Map requests with user names
    return requests.map((req: any) => {
      const profile = profileMap.get(req.user_id);
      
      return {
        id: req.id,
        family_group_id: req.family_group_id,
        user_id: req.user_id,
        user_name: profile?.name || `User ${req.user_id.substring(0, 8)}`,
        status: req.status,
        requested_at: req.requested_at,
        reviewed_at: req.reviewed_at,
        reviewed_by: req.reviewed_by,
      };
    });
  },

  // Approve a join request
  async approveJoinRequest(requestId: string, reviewerId: string, groupId: string, userId: string): Promise<void> {
    // Update the request status
    const { error: updateError } = await supabase
      .from('family_join_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId,
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error approving join request:', updateError);
      throw updateError;
    }

    // Add user as a member
    const { error: memberError } = await supabase
      .from('family_members')
      .insert({
        family_group_id: groupId,
        user_id: userId,
        role: 'child',
        can_edit: false,
        can_view: true,
      });

    if (memberError) {
      console.error('Error adding member:', memberError);
      throw memberError;
    }
  },

  // Reject a join request
  async rejectJoinRequest(requestId: string, reviewerId: string): Promise<void> {
    const { error } = await supabase
      .from('family_join_requests')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId,
      })
      .eq('id', requestId);

    if (error) {
      console.error('Error rejecting join request:', error);
      throw error;
    }
  },

  // Get user's pending join requests
  async getUserPendingRequests(userId: string): Promise<FamilyJoinRequest[]> {
    const { data, error } = await supabase
      .from('family_join_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching user join requests:', error);
      return [];
    }

    return data || [];
  },
};

