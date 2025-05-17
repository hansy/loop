// Package model provides data models for the playback access API.
package model

// Video represents a video entity
type Video struct {
	Id string `json:"id"`
}

// AccessRequestBody represents the request body for access requests
type AccessRequestBody struct {
	Data Video `json:"data"`
}

// AuthSig represents authentication signature data
type AuthSig struct {
	Sig           string `json:"sig"`
	DerivedVia    string `json:"derivedVia"`
	SignedMessage string `json:"signedMessage"`
	Address       string `json:"address"`
}

// RequestBody represents the main request body
type RequestBody struct {
	TokenId string  `json:"tokenId"`
	AuthSig AuthSig `json:"authSig"`
}

// SignedMessage represents a signed message for authentication
type SignedMessage struct {
	UserAddress  string `json:"userAddress"`
	VideoId      string `json:"videoId"`
	VideoTokenId string `json:"videoTokenId"`
	Nonce        string `json:"nonce"`
	Exp          int64  `json:"exp"`
}

// VideoSource represents a video source
type VideoSource struct {
	Id   string `json:"id"`
	Src  string `json:"src"`
	Type string `json:"type"`
}

// VideoCoverImage represents a video cover image
type VideoCoverImage struct {
	Width  int    `json:"width"`
	Height int    `json:"height"`
	Src    string `json:"src"`
}

// VideoPrice represents the price of a video
type VideoPrice struct {
	Amount              string `json:"amount"`
	Currency            string `json:"currency"`
	DenominatedSubunits string `json:"denominatedSubunits"`
}

// VideoAccess represents video access control
type VideoAccess struct {
	ACL               interface{} `json:"acl"`
	Type              string      `json:"type"`
	Ciphertext        string      `json:"ciphertext,omitempty"`
	DataToEncryptHash string      `json:"dataToEncryptHash,omitempty"`
}

// VideoStore represents video metadata stored in Redis
type VideoStore struct {
	Id             string       `json:"id"`
	Visibility     string       `json:"visibility"`
	IsDownloadable bool         `json:"isDownloadable"`
	Creator        string       `json:"creator"`
	PlaybackAccess *VideoAccess `json:"playbackAccess,omitempty"`
}

// StandardizedErrorDetail represents the detailed error information.
// It includes a user-friendly message, an optional error code for programmatic handling,
// optional additional details, and a stack trace for debugging in non-production environments.
type StandardizedErrorDetail struct {
	Message string      `json:"message"`
	Code    string      `json:"code,omitempty"`
	Details interface{} `json:"details,omitempty"`
	Stack   string      `json:"stack,omitempty"`
}

// StandardizedErrorResponse is the structure for all API error responses.
// It clearly indicates failure and wraps the error details.
type StandardizedErrorResponse struct {
	Success bool                    `json:"success"` // Always false for errors
	Error   StandardizedErrorDetail `json:"error"`
}
