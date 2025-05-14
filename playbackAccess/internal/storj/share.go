// Package storj provides utilities for generating public shared links using Storj for the playback access API.
package storj

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"storj.io/uplink"
	"storj.io/uplink/edge"
)

const defaultExpiration = 4 * time.Hour

// CreatePublicSharedLink generates a public shared link for a given video object.
// It uses the Storj edge service to create a publicly accessible link.
//
// Parameters:
//   - ctx: context for the operation
//   - accessGrant: the Storj access grant
//   - bucketName: the name of the bucket containing the video
//   - objectKey: the key/path of the video object
//
// Returns:
//   - string: the public URL for the video
//   - error: any error that occurred during the process
func CreatePublicSharedLink(ctx context.Context, accessGrant, bucketName, objectKey string) (string, error) {
	log.Printf("Creating public shared link for bucket: %s, object: %s", bucketName, objectKey)

	// Define configuration for the storj sharing site
	config := edge.Config{
		AuthServiceAddress: "auth.storjshare.io:7777",
	}

	// Parse access grant
	access, err := uplink.ParseAccess(accessGrant)
	if err != nil {
		return "", fmt.Errorf("could not parse access grant: %w", err)
	}

	// Restrict access to the specified paths
	restrictedAccess, err := access.Share(
		uplink.Permission{
			AllowDownload: true,
			NotAfter:      time.Now().Add(defaultExpiration),
		},
		uplink.SharePrefix{
			Bucket: bucketName,
			Prefix: objectKey,
		})
	if err != nil {
		return "", fmt.Errorf("could not restrict access grant: %w", err)
	}

	// Register access with the edge service
	credentials, err := config.RegisterAccess(ctx, restrictedAccess, &edge.RegisterAccessOptions{Public: true})
	if err != nil {
		return "", fmt.Errorf("could not register access: %w", err)
	}

	// Create the public link
	url, err := edge.JoinShareURL("https://link.storjshare.io", credentials.AccessKeyID, bucketName, objectKey, nil)
	if err != nil {
		return "", fmt.Errorf("could not create a shared link: %w", err)
	}

	// Convert to raw URL
	rawUrl := strings.Replace(url, "/s/", "/raw/", 1)
	log.Printf("Public shared link created: %s", rawUrl)

	return rawUrl, nil
}

// GetStorjConfig retrieves Storj configuration from environment variables.
func GetStorjConfig() (accessGrant, bucket string) {
	return os.Getenv("LINK_SHARE_ACCESS_GRANT"), os.Getenv("S3_VIDEO_BUCKET")
}
