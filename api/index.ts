import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ 
    message: 'نظام إدارة المشاريع الإنشائية',
    status: 'running',
    timestamp: new Date().toISOString()
  });
}