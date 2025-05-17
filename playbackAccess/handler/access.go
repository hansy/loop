// Package handler provides HTTP request handlers for the playback access API.
package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime/debug"
	"strings"
	"time"

	"github.com/loop/playbackAccess/auth"
	"github.com/loop/playbackAccess/db"
	"github.com/loop/playbackAccess/model"
	"github.com/loop/playbackAccess/redis"
	"github.com/loop/playbackAccess/storj"
	redisgo "github.com/redis/go-redis/v9"
)

var ctx = context.Background()

// GetVideoMetadata retrieves video metadata from Redis cache or PostgreSQL database.
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
func GetVideoMetadata(rdb *redis.Client, dbClient *db.Client, tokenId string) (*model.VideoStore, error) {
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

// Handler handles video playback access requests.
// It processes incoming requests, verifies authentication,
// checks access permissions, and generates video access links.
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
		HandleErr(w, http.StatusBadRequest, "Failed to read request body", err, "BAD_REQUEST", nil)
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
		HandleErr(w, http.StatusInternalServerError, "Failed to initialize Redis client", err, "INTERNAL_ERROR", nil)
		return
	}

	// Initialize database client
	dbClient, err := db.NewClient()
	if err != nil {
		HandleErr(w, http.StatusInternalServerError, "Failed to initialize database client", err, "INTERNAL_ERROR", nil)
		return
	}
	defer dbClient.Close()

	// Check token and get video metadata if tokenId is provided
	if req.TokenId != "" {
		videoStore, err := GetVideoMetadata(rdb, dbClient, req.TokenId)
		if err != nil {
			HandleErr(w, http.StatusInternalServerError, "Error fetching video metadata", err, "INTERNAL_ERROR", nil)
			return
		}

		videoId = videoStore.Id
		visibility = videoStore.Visibility
	}

	// Handle public videos
	if visibility == "public" {
		CreateAndSendPublicSharedLink(w, videoId)
		return
	}

	// Verify signature
	if !auth.VerifySignature(signedMessage, sig, authSigAddress) {
		HandleErr(w, http.StatusUnauthorized, "Unauthorized", nil, "UNAUTHORIZED", nil)
		return
	}

	isAuthorized := false

	// Handle different authentication methods
	switch derivedVia {
	case "lit.action":
		if err := handleLitAction(r.Context(), rdb, signedMessage, tokenId, authSigAddress); err != nil {
			HandleErr(w, http.StatusUnauthorized, err.Error(), err, "UNAUTHORIZED_LIT_ACTION", nil)
			return
		}
		isAuthorized = true
		// videoId is set in handleLitAction

	case "loop.web3.auth":
		accessKey := fmt.Sprintf("access:%s:%s", tokenId, authSigAddress)
		val, err := rdb.GetAccess(accessKey)
		if err != nil {
			if err == redisgo.Nil {
				HandleErr(w, http.StatusUnauthorized, "Unauthorized", nil, "UNAUTHORIZED", nil)
			} else {
				HandleErr(w, http.StatusInternalServerError, "Error checking access", err, "INTERNAL_ERROR_REDIS", nil)
			}
			return
		}
		log.Printf("Access value: %s\n", val)
		isAuthorized = true

	default:
		HandleErr(w, http.StatusUnauthorized, "Unauthorized", nil, "UNAUTHORIZED", nil)
		return
	}

	if isAuthorized {
		CreateAndSendPublicSharedLink(w, videoId)
		return
	}

	HandleErr(w, http.StatusUnauthorized, "Unauthorized", nil, "UNAUTHORIZED", nil)
}

// HandleErr sends a standardized error response to the client.
// It logs the original error for internal diagnostics and constructs a JSON response
// conforming to the StandardizedErrorResponse structure.
func HandleErr(w http.ResponseWriter, httpStatusCode int, publicErrMsg string, internalErr error, errCode string, errDetails interface{}) {
	log.Printf("Error: %s: %v", publicErrMsg, internalErr)

	detail := model.StandardizedErrorDetail{
		Message: publicErrMsg,
		Code:    errCode,
		Details: errDetails,
	}

	if os.Getenv("APP_ENV") != "production" && internalErr != nil {
		detail.Stack = string(debug.Stack())
	}

	response := model.StandardizedErrorResponse{
		Success: false,
		Error:   detail,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(httpStatusCode)
	if encodeErr := json.NewEncoder(w).Encode(response); encodeErr != nil {
		// Fallback if JSON encoding fails
		log.Printf("Critical: Failed to encode error response: %v", encodeErr)
		http.Error(w, "{\"success\":false,\"error\":{\"message\":\"Error encoding response\"}}", http.StatusInternalServerError)
	}
}

// handleLitAction processes authentication via lit.action
func handleLitAction(ctx context.Context, rdb *redis.Client, signedMessage, tokenId, authSigAddress string) error {
	var parsedMessage model.SignedMessage
	if err := json.Unmarshal([]byte(signedMessage), &parsedMessage); err != nil {
		return fmt.Errorf("failed to parse signed message: %w", err)
	}

	log.Printf("Parsed signed message: %+v", parsedMessage)

	// Convert userAddress to lowercase
	parsedMessage.UserAddress = strings.ToLower(parsedMessage.UserAddress)

	// Check expiration
	if time.Now().UnixMilli() > parsedMessage.Exp {
		return fmt.Errorf("expired")
	}

	// Check nonce
	nonceKey := fmt.Sprintf("nonce:%s", parsedMessage.Nonce)
	_, err := rdb.Get(ctx, nonceKey).Result()
	if err == nil {
		return fmt.Errorf("nonce already used")
	} else if err != redisgo.Nil {
		return fmt.Errorf("error checking nonce: %w", err)
	}

	// Add nonce to Redis
	if err := rdb.SetNonce(nonceKey, parsedMessage.Exp); err != nil {
		return fmt.Errorf("error setting nonce: %w", err)
	}

	// Add access to Redis
	accessKey := fmt.Sprintf("access:%s:%s", parsedMessage.VideoTokenId, parsedMessage.UserAddress)
	if err := rdb.SetAccess(accessKey, parsedMessage.Exp); err != nil {
		return fmt.Errorf("error setting access: %w", err)
	}

	return nil
}

// CreateAndSendPublicSharedLink generates a public access link for a video using Storj.
// It retrieves the Storj configuration, constructs the object path, and creates a
// publicly accessible link for the video content.
func CreateAndSendPublicSharedLink(w http.ResponseWriter, videoId string) {
	accessGrant, bucket := storj.GetStorjConfig()
	objectPath := videoId + "/data/"

	url, err := storj.CreatePublicSharedLink(ctx, accessGrant, bucket, objectPath)
	if err != nil {
		HandleErr(w, http.StatusInternalServerError, "Failed to create public shared link", err, "INTERNAL_ERROR", nil)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"data": url})
}
