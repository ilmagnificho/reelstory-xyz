import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API: /api/admin/check-admin - Method:', req.method);
  
  if (req.method !== 'GET') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from session
    const supabase = createClient(req, res);
    console.log('Checking user authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Authentication error:', authError);
      return res.status(401).json({ error: 'Authentication error' });
    }
    
    if (!user) {
      console.log('Unauthorized: No user found in session');
      return res.status(401).json({ error: 'Unauthorized: Please log in to access this feature' });
    }
    
    console.log('User authenticated:', user.id);
    
    // Check if the user has admin role
    console.log('Checking admin status for user:', user.id);
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    
    if (!dbUser) {
      console.log('User not found in database:', user.id);
      return res.status(403).json({ error: 'Forbidden: User not found in database' });
    }
    
    console.log('User found in database, isAdmin:', dbUser.isAdmin);
    
    if (!dbUser.isAdmin) {
      console.log('Unauthorized: User does not have admin privileges');
      return res.status(403).json({ error: 'Forbidden: Admin privileges required' });
    }
    
    // User is an admin
    console.log('Admin check successful for user:', user.id);
    return res.status(200).json({ isAdmin: true });
    
  } catch (error) {
    console.error('Error checking admin status:', error);
    return res.status(500).json({ error: 'Failed to check admin status' });
  }
}