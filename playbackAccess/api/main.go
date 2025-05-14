// Package main provides the main entry point for the playback access API.
// This API handles video access control and authentication, supporting both public
// and protected videos. It integrates with Redis for caching and access control,
// PostgreSQL for video metadata storage, and Storj for video delivery.
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/loop/playbackAccess/internal/auth"
	"github.com/loop/playbackAccess/internal/db"
	"github.com/loop/playbackAccess/internal/model"
	"github.com/loop/playbackAccess/internal/redis"
	"github.com/loop/playbackAccess/internal/storj"
	redisgo "github.com/redis/go-redis/v9"
)

var ctx = context.Background()

// handleErr sends an error response to the client with appropriate status code and message.
// It logs the error for debugging purposes and returns a JSON response to the client.
func handleErr(w http.ResponseWriter, msg string, err error, status int) {
	log.Printf("Error: %s: %v", msg, err)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(model.ErrorResponse{Msg: msg})
}

// createAndSendPublicSharedLink generates a public access link for a video using Storj.
// It retrieves the Storj configuration, constructs the object path, and creates a
// publicly accessible link for the video content.
func createAndSendPublicSharedLink(w http.ResponseWriter, videoId string) {
	accessGrant, bucket := storj.GetStorjConfig()
	objectPath := videoId + "/data/"

	url, err := storj.CreatePublicSharedLink(ctx, accessGrant, bucket, objectPath)
	if err != nil {
		handleErr(w, "Failed to create public shared link", err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"data": url})
}

// getVideoMetadata retrieves video metadata from Redis cache or PostgreSQL database.
// It first attempts to fetch the metadata from Redis. If not found, it queries the
// database and caches the result in Redis for future requests.
//
// Flow:
// 1. Construct Redis key using tokenId
// 2. Try to get metadata from Redis
// 3. If found in Redis, parse and return
// 4. If not in Redis, query database
// 5. Cache database result in Redis
// 6. Return metadata
func getVideoMetadata(rdb *redis.Client, dbClient *db.Client, tokenId string) (*model.VideoStore, error) {
	tokenKey := fmt.Sprintf("token:%s", tokenId)

	// Try to get metadata from Redis first
	videoStoreStr, err := rdb.GetVideoMetadata(tokenKey)
	if err == nil {
		var videoStore model.VideoStore
		if err := json.Unmarshal([]byte(videoStoreStr), &videoStore); err != nil {
			return nil, fmt.Errorf("error parsing video metadata from Redis: %w", err)
		}
		return &videoStore, nil
	}

	// If not in Redis, try database
	if err == redisgo.Nil {
		videoStore, err := dbClient.GetVideoMetadata(tokenId)
		if err != nil {
			return nil, fmt.Errorf("error getting video metadata from database: %w", err)
		}

		// Store in Redis for future requests
		if err := rdb.SetVideoMetadata(tokenKey, videoStore); err != nil {
			log.Printf("Warning: failed to cache video metadata in Redis: %v", err)
		}

		return videoStore, nil
	}

	return nil, fmt.Errorf("error fetching video metadata from Redis: %w", err)
}

// Handler processes incoming requests for video access.
// It handles authentication, authorization, and video access link generation.
//
// Request Flow:
// 1. Validate request method and parse body
// 2. Initialize Redis and database clients
// 3. Retrieve video metadata if tokenId provided
// 4. Handle public videos immediately
// 5. Verify request signature
// 6. Process authentication based on derivedVia:
//   - lit.action: Handle Lit Protocol authentication
//   - loop.web3.auth: Verify existing access
//
// 7. Generate and return access link if authorized
//
// Authentication Methods:
// - lit.action: Uses Lit Protocol for authentication
//   - Verifies message signature
//   - Checks message expiration
//   - Prevents replay attacks using nonces
//   - Grants access in Redis
//
// - loop.web3.auth: Simple access verification
//   - Checks Redis for existing access
//   - No additional verification needed
func Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var req model.RequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		handleErr(w, "Failed to read request body", err, http.StatusBadRequest)
		return
	}

	log.Printf("Request body: %+v", req)

	authSig := req.AuthSig
	tokenId := req.TokenId
	sig := authSig.Sig
	derivedVia := authSig.DerivedVia
	signedMessage := authSig.SignedMessage
	authSigAddress := strings.ToLower(authSig.Address)

	log.Printf("AuthSig Address: %s", authSigAddress)
	videoId := ""
	visibility := "protected"

	// Initialize Redis client
	rdb, err := redis.NewClient()
	if err != nil {
		handleErr(w, "Failed to initialize Redis client", err, http.StatusInternalServerError)
		return
	}

	// Initialize database client
	dbClient, err := db.NewClient()
	if err != nil {
		handleErr(w, "Failed to initialize database client", err, http.StatusInternalServerError)
		return
	}
	defer dbClient.Close()

	// Check token and get video metadata if tokenId is provided
	if req.TokenId != "" {
		videoStore, err := getVideoMetadata(rdb, dbClient, req.TokenId)
		if err != nil {
			handleErr(w, "Error fetching video metadata", err, http.StatusInternalServerError)
			return
		}

		videoId = videoStore.Id
		visibility = videoStore.Visibility
	}

	// Handle public videos
	if visibility == "public" {
		createAndSendPublicSharedLink(w, videoId)
		return
	}

	// Verify signature
	if !auth.VerifySignature(signedMessage, sig, authSigAddress) {
		handleErr(w, "Unauthorized", nil, http.StatusUnauthorized)
		return
	}

	isAuthorized := false

	// Handle different authentication methods
	switch derivedVia {
	case "lit.action":
		var parsedMessage model.SignedMessage
		if err := json.Unmarshal([]byte(signedMessage), &parsedMessage); err != nil {
			handleErr(w, "Failed to parse signed message", err, http.StatusBadRequest)
			return
		}

		log.Printf("Parsed signed message: %+v", parsedMessage)

		// Convert userAddress to lowercase
		parsedMessage.UserAddress = strings.ToLower(parsedMessage.UserAddress)

		// Check expiration
		if time.Now().UnixMilli() > parsedMessage.Exp {
			handleErr(w, "Expired", nil, http.StatusUnauthorized)
			return
		}

		// Check nonce
		nonceKey := fmt.Sprintf("nonce:%s", parsedMessage.Nonce)
		_, err := rdb.Get(ctx, nonceKey).Result()
		if err == nil {
			handleErr(w, "Nonce already used", nil, http.StatusUnauthorized)
			return
		} else if err != redisgo.Nil {
			handleErr(w, "Error checking nonce", err, http.StatusInternalServerError)
			return
		}

		// Add nonce to Redis
		if err := rdb.SetNonce(nonceKey, parsedMessage.Exp); err != nil {
			handleErr(w, "Error setting nonce", err, http.StatusInternalServerError)
			return
		}

		// Add access to Redis
		accessKey := fmt.Sprintf("access:%s:%s", parsedMessage.VideoTokenId, parsedMessage.UserAddress)
		if err := rdb.SetAccess(accessKey); err != nil {
			handleErr(w, "Error setting access", err, http.StatusInternalServerError)
			return
		}

		isAuthorized = true
		videoId = parsedMessage.VideoId

	case "loop.web3.auth":
		accessKey := fmt.Sprintf("access:%s:%s", tokenId, authSigAddress)
		val, err := rdb.GetAccess(accessKey)
		if err != nil {
			if err == redisgo.Nil {
				handleErr(w, "Unauthorized", nil, http.StatusUnauthorized)
			} else {
				handleErr(w, "Error checking access", err, http.StatusInternalServerError)
			}
			return
		}
		log.Printf("Access value: %s\n", val)
		isAuthorized = true

	default:
		handleErr(w, "Unauthorized", nil, http.StatusUnauthorized)
		return
	}

	if isAuthorized {
		createAndSendPublicSharedLink(w, videoId)
		return
	}

	handleErr(w, "Unauthorized", nil, http.StatusUnauthorized)
}

// main initializes and starts the HTTP server.
// It sets up CORS middleware and routes, then listens for incoming requests.
func main() {
	// Set up CORS middleware
	corsMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

			// Handle preflight requests
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	}

	// Set up routes
	mux := http.NewServeMux()
	mux.HandleFunc("/", Handler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, corsMiddleware(mux)); err != nil {
		log.Fatal(err)
	}
}
