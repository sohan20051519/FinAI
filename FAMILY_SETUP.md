# Family Collaboration Setup Guide

## How to Connect with Families - Easy Steps

### Step 1: Run the Database Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/uhvecwmzwcyoskuxlwqu
2. Click **SQL Editor** → **New Query**
3. Copy and paste the entire contents of `supabase_family_collaboration.sql`
4. Click **Run**

This creates the necessary tables for family groups, members, and shared grocery lists.

### Step 2: Create or Join a Family

#### Option A: Create a New Family Group

1. Go to the **Family** page (click "Family" in the sidebar or bottom nav)
2. Click **Create Family** button
3. Enter a family name (e.g., "The Smith Family")
4. Click **Create**
5. You'll see your **Family Code** - share this with family members!

#### Option B: Join an Existing Family

1. Go to the **Family** page
2. Click **Join Family** button
3. Enter the **Family Code** (the family group ID)
4. Click **Join**

### Step 3: Add Family Members

1. On the Family page, you'll see **Your User ID** at the top
2. Click **Copy** to copy your User ID
3. Share your User ID with family members
4. They should share their User ID with you
5. In your family group, enter their User ID in the "Add Family Member" field
6. Click **Add**

### Step 4: Share Grocery Lists

1. Go to **Planner** → **AI Grocery Cart** tab
2. Generate a grocery list (or use an existing one)
3. Click **Share with Family** button
4. Select which family group to share with
5. The list will be visible to all family members!

## Role-Based Access

- **👑 Parents**: Can edit grocery lists, add/remove members
- **👶 Children**: Can view grocery lists (read-only)
- **👁️ Viewers**: Can only view shared lists

## Quick Tips

- **Your User ID** is displayed at the top of the Family page - always copy this to share with family
- **Family Code** is the group ID - share this to let others join your family
- Family members can see shared grocery lists in real-time
- Parents can edit lists, kids can only view them

## Troubleshooting

- **Can't find user?** Make sure they've signed up and are logged in
- **Can't join family?** Double-check the Family Code (it's a UUID)
- **Can't see shared lists?** Make sure you're a member of the family group

Enjoy connecting with your family! 👨‍👩‍👧‍👦



