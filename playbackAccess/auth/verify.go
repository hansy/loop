// Package auth provides authentication and signature verification utilities for the playback access API.
package auth

import (
	"encoding/hex"
	"fmt"
	"log"
	"strings"

	"github.com/ethereum/go-ethereum/crypto"
)

// VerifySignature verifies an Ethereum signature for a given message and address.
// Returns true if the signature is valid, false otherwise.
//
// Parameters:
//   - signedMessage: the original message that was signed
//   - sig: the signature in hex format (with or without 0x prefix)
//   - address: the expected Ethereum address of the signer
//
// Edge Cases:
//   - Handles signatures with or without 0x prefix
//   - Handles V value adjustment for Ethereum signatures
//   - Returns false for invalid signature length or decoding errors
func VerifySignature(signedMessage, sig, address string) bool {
	// Trim any whitespace from the signature
	sig = strings.TrimSpace(sig)

	// Remove the '0x' prefix if present
	sig = strings.TrimPrefix(sig, "0x")

	// Log the signature for debugging
	log.Printf("Verifying signature: %s", sig)

	// Decode the signature
	signature, err := hex.DecodeString(sig)
	if err != nil {
		log.Printf("Failed to decode signature: %v", err)
		return false
	}

	// Check the signature length
	if len(signature) != 65 {
		log.Printf("Invalid signature length: %d", len(signature))
		return false
	}

	// Adjust the V value if necessary
	if signature[64] == 27 || signature[64] == 28 {
		signature[64] -= 27
	}

	// Create the message hash
	msgHash := crypto.Keccak256Hash([]byte(fmt.Sprintf("\x19Ethereum Signed Message:\n%d%s", len(signedMessage), signedMessage)))

	// Recover the public key
	pubKey, err := crypto.SigToPub(msgHash.Bytes(), signature)
	if err != nil {
		log.Printf("Failed to recover public key: %v", err)
		return false
	}

	// Convert the public key to an address
	recoveredAddr := crypto.PubkeyToAddress(*pubKey).Hex()

	// Convert addresses to lowercase for comparison
	recoveredAddr = strings.ToLower(recoveredAddr)
	address = strings.ToLower(address)

	// Compare the recovered address with the provided address
	isValid := recoveredAddr == address
	log.Printf("Signature valid: %v", isValid)
	return isValid
}
