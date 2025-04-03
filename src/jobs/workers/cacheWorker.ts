import { Worker } from "bullmq";

import { redis } from "../../config/redisClient";
import { errorCode } from "../../config/errorCode";

// Create a worker to process the image optimization job
const cacheWorker = new Worker(
  "cache-invalidation",
  async (job) => {
    const { pattern } = job.data;
    await invalidatedCache(pattern);
  },
  {
    connection: redis,
    concurrency: 5, // process 5 jobs concurrently
  }
);

cacheWorker.on("completed", (job) => {
  console.log(`Job completed with result ${job.id}`);
});

cacheWorker.on("failed", (job: any, err) => {
  console.log(`Job ${job.id} failed with ${err.message}`);
});

const invalidatedCache = async (pattern: string) => {
  try {
    // scan the key with pattern
    const stream = redis.scanStream({
      match: pattern,
      count: 100,
    });

    const pipeline = redis.pipeline(); // collect the commands
    let totalKey = 0;

    //process keys in batches
    stream.on("data", (keys: string[]) => {
      if (keys.length > 0) {
        keys.forEach((key) => {
          pipeline.del(key);
          totalKey++;
        });
      }
    });

    // warp stream events in a promise
    await new Promise<void>((resolve, reject) => {
      stream.on("end", async () => {
        try {
          if (totalKey > 0) {
            await pipeline.exec(); // exec the pipeline
            console.log(`invalidated: ${totalKey} keys`);
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      stream.on("error", (err) => {
        reject(err);
      });
    });
  } catch (err) {
    console.log("Cache Invalidation Error: ", err);
    const error: any = new Error("Record not exists.");
    error.status = 409;
    error.code = errorCode.invalid;
    throw error;
  }
};
