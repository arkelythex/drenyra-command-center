package version

import "fmt"

// Set at build time via -ldflags.
var (
	Version = "dev"
	Commit  = "none"
	Date    = "unknown"
)

// Short returns a one-line version string for Cobra and --version.
func Short() string {
	if Commit != "none" && len(Commit) >= 7 {
		return fmt.Sprintf("%s+%s", Version, Commit[:7])
	}
	return Version
}

// Long returns multi-line build metadata.
func Long() string {
	return fmt.Sprintf("drenyra %s\ncommit: %s\nbuilt: %s", Version, Commit, Date)
}
