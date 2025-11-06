import { supabase } from '../lib/supabase';

export interface FamilyGroup {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_group_id: string;
  user_id: string;
  role: 'parent' | 'child' | 'viewer';
  can_edit: boolean;
  can_view: boolean;
  user_email?: string;
  user_name?: string;
}

export interface SharedGroceryList {
  id: string;
  family_group_id: string;
  created_by: string;
  name: string;
  items: any[];
  created_at: string;
}

export const familyService = {
  // Create a new family group
  async createFamilyGroup(name: string, userId: string): Promise<FamilyGroup> {
    const { data, error } = await supabase
      .from('family_groups')
      .insert({
        name,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating family group:', error);
      throw error;
    }

    // Add creator as parent member
    await supabase
      .from('family_members')
      .insert({
        family_group_id: data.id,
        user_id: userId,
        role: 'parent',
        can_edit: true,
        can_view: true,
      });

    return data;
  },

  // Get user's family groups
  async getUserFamilyGroups(userId: string): Promise<FamilyGroup[]> {
    // First get groups where user is creator
    const { data: createdGroups, error: createdError } = await supabase
      .from('family_groups')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (createdError) {
      console.error('Error fetching created family groups:', createdError);
    }

    // Then get groups where user is a member
    const { data: memberGroups, error: memberError } = await supabase
      .from('family_members')
      .select('family_group_id, family_groups(*)')
      .eq('user_id', userId);

    if (memberError) {
      console.error('Error fetching member family groups:', memberError);
    }

    // Combine and deduplicate
    const allGroups: FamilyGroup[] = [];
    const groupIds = new Set<string>();

    // Add created groups
    if (createdGroups) {
      createdGroups.forEach((group: any) => {
        if (!groupIds.has(group.id)) {
          allGroups.push(group);
          groupIds.add(group.id);
        }
      });
    }

    // Add member groups
    if (memberGroups) {
      memberGroups.forEach((member: any) => {
        if (member.family_groups && !groupIds.has(member.family_groups.id)) {
          allGroups.push(member.family_groups);
          groupIds.add(member.family_groups.id);
        }
      });
    }

    // Sort by created_at descending
    return allGroups.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  // Get family group by ID
  async getFamilyGroup(groupId: string): Promise<FamilyGroup | null> {
    const { data, error } = await supabase
      .from('family_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) {
      console.error('Error fetching family group:', error);
      return null;
    }

    return data;
  },

  // Get family members for a group
  async getFamilyMembers(groupId: string): Promise<FamilyMember[]> {
    // First, fetch members
    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_group_id', groupId)
      .order('created_at', { ascending: false });

    if (membersError) {
      console.error('Error fetching family members:', membersError);
      return [];
    }

    if (!members || members.length === 0) {
      return [];
    }

    // Get unique user IDs
    const userIds = [...new Set(members.map((member: any) => member.user_id))];
    
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

    // Map members with user names
    return members.map((member: any) => {
      const profile = profileMap.get(member.user_id);
      
      return {
        ...member,
        user_email: undefined,
        user_name: profile?.name || `User ${member.user_id.substring(0, 8)}`,
      };
    });
  },

  // Add family member by email (simplified - user needs to provide their user ID)
  async addFamilyMemberByEmail(groupId: string, emailOrUserId: string, role: 'parent' | 'child' | 'viewer' = 'child'): Promise<void> {
    // Try to find user by checking if it's a UUID or email
    // For now, we'll use a simpler approach - ask user to share their user ID
    // In production, you'd want to use a proper user lookup
    
    // Check if it looks like a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let userId = emailOrUserId.trim();
    
    if (!uuidRegex.test(userId)) {
      // If not a UUID, try to find user by email in user_profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id')
        .limit(1);
      
      // For now, we'll require the user ID directly
      throw new Error('Please use the user ID. Ask the person to go to Family page and share their user ID from the URL or their profile.');
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      throw new Error('User is already a member of this family.');
    }

    // Add as member
    const { error } = await supabase
      .from('family_members')
      .insert({
        family_group_id: groupId,
        user_id: userId,
        role,
        can_edit: role === 'parent',
        can_view: true,
      });

    if (error) {
      console.error('Error adding family member:', error);
      throw error;
    }
  },

  // Join family group by code (simplified - using group ID)
  async joinFamilyGroup(groupId: string, userId: string, role: 'parent' | 'child' | 'viewer' = 'child'): Promise<void> {
    // Check if already a member
    const { data: existing } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      throw new Error('You are already a member of this family.');
    }

    // Add as member
    const { error } = await supabase
      .from('family_members')
      .insert({
        family_group_id: groupId,
        user_id: userId,
        role,
        can_edit: role === 'parent',
        can_view: true,
      });

    if (error) {
      console.error('Error joining family group:', error);
      throw error;
    }
  },

  // Share grocery list with family
  async shareGroceryList(groupId: string, userId: string, name: string, items: any[]): Promise<SharedGroceryList> {
    const { data, error } = await supabase
      .from('shared_grocery_lists')
      .insert({
        family_group_id: groupId,
        created_by: userId,
        name,
        items: items,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sharing grocery list:', error);
      throw error;
    }

    return data;
  },

  // Get shared grocery lists for a family
  async getSharedGroceryLists(groupId: string): Promise<SharedGroceryList[]> {
    const { data, error } = await supabase
      .from('shared_grocery_lists')
      .select('*')
      .eq('family_group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shared grocery lists:', error);
      return [];
    }

    return data || [];
  },

  // Delete family group (only creator can delete)
  async deleteFamilyGroup(groupId: string, userId: string): Promise<void> {
    console.log('deleteFamilyGroup called:', { groupId, userId });
    
    // Verify user is the creator
    const { data: group, error: groupError } = await supabase
      .from('family_groups')
      .select('created_by')
      .eq('id', groupId)
      .single();

    if (groupError) {
      console.error('Error fetching group:', groupError);
      throw new Error('Family group not found');
    }

    if (!group) {
      throw new Error('Family group not found');
    }

    console.log('Group found:', group, 'User ID:', userId);
    
    if (group.created_by !== userId) {
      throw new Error('Only the creator can delete the family group');
    }

    // Delete family group (cascade will delete members, shared lists, chat messages, and join requests)
    const { error } = await supabase
      .from('family_groups')
      .delete()
      .eq('id', groupId);

    if (error) {
      console.error('Error deleting family group:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error(error.message || 'Failed to delete family group. Please check RLS policies.');
    }
    
    console.log('Family group deleted successfully');
  },
};

