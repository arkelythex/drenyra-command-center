package cmd

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/harness"
	"github.com/spf13/cobra"
)

var closeWatchF = struct {
	jsonl  bool
	follow bool
	cursor string
}{}

var closeWatchCmd = &cobra.Command{
	Use:   "watch <mission-id>",
	Short: "Watch mission execution in real time",
	Long: `Stream mission execution events via SSE.

Displays live updates as the mission progresses through gates,
exceptions, and approval states. Use --jsonl for machine-readable output.

Examples:
  drenyra close watch mis_123
  drenyra close watch mis_123 --jsonl
  drenyra close watch mis_123 --cursor event_42   # resume from event
`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.Load()
		if err != nil {
			return fmt.Errorf("config: %w", err)
		}

		missionID := args[0]
		events := make(chan *harness.SSESnapshotEvent, 16)

		ctx, cancel := context.WithCancel(cmd.Context())
		defer cancel()

		// Handle SIGINT/SIGTERM cleanly
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		go func() {
			<-sigCh
			cancel()
		}()

		// Start SSE client
		sseClient := harness.NewSSEClient(cfg.Harness.API, cfg.Harness.APIKey)
		go func() {
			lastEventID := closeWatchF.cursor
			for {
				err := sseClient.WatchMission(ctx, missionID, lastEventID, events)
				if err == context.Canceled || err == context.DeadlineExceeded {
					return
				}
				if err != nil && closeWatchF.follow {
					// Reconnect after short delay
					time.Sleep(2 * time.Second)
					lastEventID = closeWatchF.cursor
					continue
				}
				if err != nil {
					fmt.Fprintf(os.Stderr, "watch error: %v\n", err)
					return
				}
				return
			}
		}()

		// Process events
		count := 0
		for event := range events {
			count++
			lastEvent := event.ID
			_ = lastEvent // available for cursor tracking

			if closeWatchF.jsonl {
				data, _ := json.Marshal(event)
				fmt.Fprintln(os.Stdout, string(data))
			} else {
				t := event.CreatedAt
				if len(t) > 19 {
					t = t[:19]
				} else if t == "" {
					t = time.Now().Format("15:04:05")
				}
				fmt.Fprintf(os.Stderr, "[%s] %s\n", t, event.EventType)
			}

			// Feed back last event ID for reconnection
			closeWatchF.cursor = event.ID
		}

		if count == 0 {
			fmt.Fprintln(os.Stderr, "No events received.")
		}

		return nil
	},
}

func init() {
	closeWatchCmd.Flags().BoolVar(&closeWatchF.jsonl, "jsonl", false, "JSON Lines output")
	closeWatchCmd.Flags().BoolVarP(&closeWatchF.follow, "follow", "f", true, "Reconnect on disconnection")
	closeWatchCmd.Flags().StringVar(&closeWatchF.cursor, "cursor", "", "Resume from event ID")
	closeCmd.AddCommand(closeWatchCmd)
}
