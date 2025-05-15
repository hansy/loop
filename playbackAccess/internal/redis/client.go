// Package redis provides Redis client initialization and helper functions for the playback access API.
package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/loop/playbackAccess/internal/model"
	"github.com/redis/go-redis/v9"
)

// Client wraps the Redis client with additional context
type Client struct {
	*redis.Client
	ctx context.Context
}

// NewClient initializes and returns a Redis client.
// It reads the Redis URL from the REDIS_URL environment variable.
func NewClient() (*Client, error) {
	url := os.Getenv("REDIS_URL")
	if url == "" {
		return nil, fmt.Errorf("REDIS_URL environment variable is not set")
	}

	opts, err := redis.ParseURL(url)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Redis URL: %w", err)
	}

	client := redis.NewClient(opts)
	ctx := context.Background()

	// Test the connection
	ctxTimeout, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	_, err = client.Ping(ctxTimeout).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	log.Println("Successfully connected to Redis")
	return &Client{Client: client, ctx: ctx}, nil
}

// GetVideoMetadata retrieves video metadata from Redis using the token key.
func (c *Client) GetVideoMetadata(tokenKey string) (string, error) {
	return c.Get(c.ctx, tokenKey).Result()
}

// SetVideoMetadata stores video metadata in Redis.
func (c *Client) SetVideoMetadata(tokenKey string, videoStore *model.VideoStore) error {
	data, err := json.Marshal(videoStore)
	if err != nil {
		return fmt.Errorf("failed to marshal video metadata: %w", err)
	}

	return c.Set(c.ctx, tokenKey, data, 0).Err()
}

// SetNonce sets a nonce in Redis with expiration.
func (c *Client) SetNonce(nonceKey string, exp int64) error {
	return c.Set(c.ctx, nonceKey, exp, time.Until(time.UnixMilli(exp))).Err()
}

// SetAccess sets an access record in Redis with expiration.
func (c *Client) SetAccess(accessKey string, exp int64) error {
	return c.Set(c.ctx, accessKey, "t", time.Until(time.UnixMilli(exp))).Err()
}

// GetAccess retrieves an access record from Redis.
func (c *Client) GetAccess(accessKey string) (string, error) {
	return c.Get(c.ctx, accessKey).Result()
}
