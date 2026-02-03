import os
from dotenv import load_dotenv
import redis
from redis import Redis

load_dotenv()

class RedisClient:
    def __init__(self):
        self.client: Redis = None
    
    def connect(self):
        """Connect to Redis"""
        try:
            redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
            
            self.client = redis.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
                retry_on_timeout=True
            )
            
            # Test connection
            self.client.ping()
            print("Redis client connected successfully")
        except Exception as e:
            print(f"Error connecting to Redis: {e}")
            raise e
    
    def get_client(self) -> Redis:
        """Get Redis client"""
        if not self.client:
            self.connect()
        return self.client
    
    def close(self):
        """Close Redis connection"""
        if self.client:
            self.client.close()
            print("Redis connection closed")

# Singleton instance
redis_client = RedisClient()

def get_redis() -> Redis:
    """Get Redis client instance"""
    return redis_client.get_client()
