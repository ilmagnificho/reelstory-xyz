import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API: /api/admin/check-admin - Method:', req.method);
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from session
    const supabase = createClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('Unauthorized: No user found in session');
      return res.status(401).json({ error: 'Unauthorized: Please log in to access this feature' });
    }
    
    // Check if the user has admin role
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    
    if (!dbUser || !dbUser.isAdmin) {
      console.log('Unauthorized: User does not have admin privileges');
      return res.status(403).json({ error: 'Forbidden: Admin privileges required' });
    }
    
    // User is an admin
    return res.status(200).json({ isAdmin: true });
    
  } catch (error) {
    console.error('Error checking admin status:', error);
    return res.status(500).json({ error: 'Failed to check admin status' });
  }
}