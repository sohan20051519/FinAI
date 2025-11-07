# Fix Member Removal and Display Names

## Issues Fixed

1. **Member removal not working**: Added DELETE policy for `family_members` table
2. **Names showing as "User" with numbers**: Added RLS policy to allow viewing family member profiles

## SQL Migrations to Run

Run these SQL scripts in your Supabase SQL Editor in this order:

### 1. Update `supabase_family_collaboration.sql`
The file has been updated with:
- DELETE policy for `family_members` allowing parents/creators to remove members
- Updated SELECT policy for `family_members` to allow all members to view other members

### 2. Update `supabase_migration.sql`
The file has been updated with:
- New RLS policy to allow viewing `user_profiles` of family members

## Steps to Apply

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the updated sections from `supabase_family_collaboration.sql`:
   - The new DELETE policy (lines 148-163)
   - The updated SELECT policy (lines 121-134)
3. Copy and paste the new policy from `supabase_migration.sql`:
   - The new "Users can view family member profiles" policy (lines 69-80)
4. Run each SQL block

## What This Fixes

- **Member Removal**: Parents and group creators can now actually remove members (not just show success message)
- **Display Names**: Real names from `user_profiles` will now show instead of "User" + numbers
- **Family Member Visibility**: All members can now see other members in their groups



