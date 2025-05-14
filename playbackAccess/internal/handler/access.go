// Package handler provides HTTP request handlers for the playback access API.
package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/loop/playbackAccess/internal/auth"
	"github.com/loop/playbackAccess/internal/model"
	"github.com/loop/playbackAccess/internal/redis"
	redisgo "github.com/redis/go-redis/v9"
)

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

	// Check token and get video metadata if tokenId is provided
	if req.TokenId != "" {
		tokenKey := fmt.Sprintf("token:%s", req.TokenId)
		videoStoreStr, err := rdb.GetVideoMetadata(tokenKey)
		if err != nil {
			if err == redisgo.Nil {
				handleErr(w, "Video metadata not found", err, http.StatusNotFound)
			} else {
				handleErr(w, "Error fetching video metadata", err, http.StatusInternalServerError)
			}
			return
		}

		var videoStore model.VideoStore
		if err := json.Unmarshal([]byte(videoStoreStr), &videoStore); err != nil {
			handleErr(w, "Error parsing video metadata", err, http.StatusInternalServerError)
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
		if err := handleLitAction(r.Context(), rdb, signedMessage, tokenId, authSigAddress); err != nil {
			handleErr(w, err.Error(), nil, http.StatusUnauthorized)
			return
		}
		isAuthorized = true
		// videoId is set in handleLitAction

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

// handleErr sends an error response to the client
func handleErr(w http.ResponseWriter, msg string, err error, status int) {
	log.Printf("Error: %s: %v", msg, err)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(model.ErrorResponse{Msg: msg})
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
	if err := rdb.SetAccess(accessKey); err != nil {
		return fmt.Errorf("error setting access: %w", err)
	}

	return nil
}

// createAndSendPublicSharedLink creates and sends a public shared link
func createAndSendPublicSharedLink(w http.ResponseWriter, videoId string) {
	// TODO: Implement actual link creation
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"url": fmt.Sprintf("https://example.com/video/%s", videoId),
	})
}
