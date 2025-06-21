import express from 'express';
import prisma from '../config/db';

const router = express.Router();

/**
 * Health check endpoint
 * Used by Azure DevOps pipeline to verify the application is running correctly
 */
router.get('/', async (req, res) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Return health status with components
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        database: 'connected',
        api: 'running'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

export default router;
