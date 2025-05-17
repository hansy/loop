// Package db provides database client initialization and helper functions for the playback access API.
package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/lib/pq"
	"github.com/loop/playbackAccess/model"
)

// Config holds database connection pool settings
type Config struct {
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
}

// DefaultConfig returns the default database configuration
func DefaultConfig() Config {
	return Config{
		MaxOpenConns:    25,
		MaxIdleConns:    5,
		ConnMaxLifetime: 5 * time.Minute,
	}
}

// Client wraps the database client with additional context
type Client struct {
	db  *sql.DB
	ctx context.Context
}

// NewClient initializes and returns a database client.
// It reads the database URL from the DATABASE_URL environment variable.
func NewClient() (*Client, error) {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		return nil, fmt.Errorf("DATABASE_URL environment variable is not set")
	}

	// For local connections, disable SSL
	if strings.Contains(connStr, "localhost") || strings.Contains(connStr, "127.0.0.1") {
		if !strings.Contains(connStr, "sslmode=") {
			if strings.Contains(connStr, "?") {
				connStr += "&sslmode=disable"
			} else {
				connStr += "?sslmode=disable"
			}
		}
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("error connecting to database: %w", err)
	}

	// Get configuration from environment variables or use defaults
	config := DefaultConfig()
	if maxOpen := os.Getenv("DB_MAX_OPEN_CONNS"); maxOpen != "" {
		if n, err := strconv.Atoi(maxOpen); err == nil {
			config.MaxOpenConns = n
		}
	}
	if maxIdle := os.Getenv("DB_MAX_IDLE_CONNS"); maxIdle != "" {
		if n, err := strconv.Atoi(maxIdle); err == nil {
			config.MaxIdleConns = n
		}
	}
	if maxLifetime := os.Getenv("DB_CONN_MAX_LIFETIME"); maxLifetime != "" {
		if d, err := time.ParseDuration(maxLifetime); err == nil {
			config.ConnMaxLifetime = d
		}
	}

	// Apply connection pool settings
	db.SetMaxOpenConns(config.MaxOpenConns)
	db.SetMaxIdleConns(config.MaxIdleConns)
	db.SetConnMaxLifetime(config.ConnMaxLifetime)

	// Test the connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("error connecting to database: %w", err)
	}

	log.Printf("Connected to database with pool settings: maxOpen=%d, maxIdle=%d, maxLifetime=%v",
		config.MaxOpenConns, config.MaxIdleConns, config.ConnMaxLifetime)
	return &Client{db: db, ctx: context.Background()}, nil
}

// GetVideoMetadata retrieves video metadata from the database using the token ID.
func (c *Client) GetVideoMetadata(tokenId string) (*model.VideoStore, error) {
	query := `
		SELECT 
			v.metadata->>'visibility' as visibility,
			v.metadata->>'isDownloadable' as is_downloadable,
			v.metadata->>'id' as id,
			v.metadata->>'creator' as creator,
			v.metadata->'playbackAccess' as playback_access
		FROM videos v
		WHERE v.token_id = $1 AND v.status = 'ready'
	`

	var videoStore model.VideoStore
	var playbackAccessJSON []byte

	err := c.db.QueryRowContext(c.ctx, query, tokenId).Scan(
		&videoStore.Visibility,
		&videoStore.IsDownloadable,
		&videoStore.Id,
		&videoStore.Creator,
		&playbackAccessJSON,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("video not found for token ID: %s", tokenId)
		}
		return nil, fmt.Errorf("error querying video metadata: %w", err)
	}

	// Parse playback access if present
	if len(playbackAccessJSON) > 0 {
		var playbackAccess model.VideoAccess
		if err := json.Unmarshal(playbackAccessJSON, &playbackAccess); err != nil {
			return nil, fmt.Errorf("error parsing playback access: %w", err)
		}
		videoStore.PlaybackAccess = &playbackAccess
	}

	return &videoStore, nil
}

// Close closes the database connection.
func (c *Client) Close() error {
	return c.db.Close()
}
