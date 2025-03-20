import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const connection = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT) || 6379,
    // password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null, // for bullMQ

});

const imageQueue = new Queue('imageQueue', { connection });

export default imageQueue;