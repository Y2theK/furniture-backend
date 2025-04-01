import { errorCode } from "../config/errorCode";
import { redis } from "../config/redisClient";

export const getOrSetCache = async (key: any, cb: any) => {
  try {
    const cachedData = await redis.get(key);

    if (cachedData) {
      console.log("Cache hit");
      return JSON.parse(cachedData);
    }
    console.log("Cache Miss");
    const freshData = await cb();
    await redis.setex(key, 60 * 60, JSON.stringify(freshData));
    return freshData;
  } catch (err) {
    console.log(err);
    const error: any = new Error("Record not exists.");
    error.status = 409;
    error.code = errorCode.invalid;
    throw error;
  }
};
