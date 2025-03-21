import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API: /api/admin/check-admin - Method:', req.method);
  
  if (req.method === 'GET') {
    try {
      // Get user from session
      const supabase = createClient(req, res);
      console.log('Checking user authentication...');
      
      // Get the user from the session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Authentication error:', authError);
        return res.status(401).json({ 
          error: 'Authentication error', 
          message: authError.message,
          details: 'Session may have expired. Please log in again.'
        });
      }
      
      if (!user) {
        console.log('Unauthorized: No user found in session');
        return res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Please log in to access this feature',
          details: 'No user found in the current session'
        });
      }
      
      console.log('User authenticated:', user.id);
      
      try {
        // Check if the user has admin role
        console.log('Checking admin status for user:', user.id);
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        
        if (!dbUser) {
          console.log('User not found in database:', user.id);
          
          // Create user record if it doesn't exist
          try {
            console.log('Attempting to create user record in database');
            await prisma.user.create({
              data: {
                id: user.id,
                email: user.email || '',
                isAdmin: false, // Default to non-admin
              },
            });
            console.log('User record created successfully');
            
            return res.status(403).json({ 
              error: 'Forbidden', 
              message: 'Admin privileges required',
              details: 'Your account has been created, but admin access is required for this page'
            });
          } catch (createError) {
            console.error('Error creating user record:', createError);
            return res.status(403).json({ 
              error: 'Forbidden', 
              message: 'User not found in database and could not be created',
              details: 'Please contact an administrator'
            });
          }
        }
        
        console.log('User found in database, isAdmin:', dbUser.isAdmin);
        
        if (!dbUser.isAdmin) {
          console.log('Unauthorized: User does not have admin privileges');
          return res.status(403).json({ 
            error: 'Forbidden', 
            message: 'Admin privileges required',
            details: 'Your account does not have administrator permissions'
          });
        }
        
        // User is an admin
        console.log('Admin check successful for user:', user.id);
        return res.status(200).json({ isAdmin: true });
        
      } catch (dbError) {
        console.error('Database error checking admin status:', dbError);
        return res.status(500).json({ 
          error: 'Database Error', 
          message: 'Failed to check admin status in database',
          details: 'There was an error connecting to the database'
        });
      }
      
    } catch (error) {
      console.error('Unexpected error checking admin status:', error);
      return res.status(500).json({ 
        error: 'Server Error', 
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (req.method === 'POST') {
    // This endpoint will handle requests to become an admin
    try {
      const supabase = createClient(req, res);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Authentication required',
          details: authError?.message || 'No user found in session'
        });
      }
      
      // Check if there are any users with admin privileges
      const adminCount = await prisma.user.count({
        where: { isAdmin: true }
      });
      
      // Get the current user
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      
      if (!dbUser) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found in database',
          details: 'Your account is not properly registered in the system'
        });
      }
      
      // If there are no admins yet, make this user an admin
      if (adminCount === 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isAdmin: true }
        });
        
        console.log(`User ${user.id} has been granted admin privileges as the first admin`);
        
        return res.status(200).json({
          success: true,
          message: 'Admin privileges granted',
          details: 'You are now an administrator as the first user in the system'
        });
      } else {
        // There are already admins, so we can't automatically grant admin privileges
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Cannot grant admin privileges',
          details: 'Admin users already exist in the system. Please contact an existing administrator.'
        });
      }
    } catch (error) {
      console.error('Error in admin request:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Failed to process admin request',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }
}