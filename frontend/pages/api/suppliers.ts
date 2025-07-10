import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
  }
});

interface Supplier {
  id: string;
  url: string;
  name: string;
  riskScore: string;
  createdAt: string;
  updatedAt: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  let client;
  try {
    client = await pool.connect();
    const result = await client.query<Supplier>(`
      SELECT 
        id,
        url,
        name,
        "riskScore",
        "createdAt",
        "updatedAt"
      FROM "Supplier"
      ORDER BY "createdAt" DESC
    `);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      message: 'Error fetching suppliers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    if (client) client.release();
  }
}