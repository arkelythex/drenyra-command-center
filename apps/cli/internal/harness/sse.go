package harness

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
)

// SSEClient streams SSE events from the mission protocol.
// Supports resumable cursors via lastEventID and reconnection.
type SSEClient struct {
	BaseURL   string
	AuthToken string
}

// SSESnapshotEvent represents a single SSE event with a mission snapshot.
type SSESnapshotEvent struct {
	ID        string          `json:"id"`
	MissionID string          `json:"missionId"`
	Sequence  int             `json:"sequence"`
	EventType string          `json:"eventType"`
	Snapshot  json.RawMessage `json:"snapshot"`
	CreatedAt string          `json:"createdAt"`
}

// NewSSEClient creates a new SSE client.
func NewSSEClient(baseURL, authToken string) *SSEClient {
	return &SSEClient{
		BaseURL:   baseURL,
		AuthToken: authToken,
	}
}

// WatchMission connects to the SSE stream for a mission and sends events to the channel.
// If lastEventID is non-empty, the stream resumes from that event.
// The context can be used to cancel the stream.
// Returns an error if the initial connection fails.
func (s *SSEClient) WatchMission(ctx context.Context, missionID, lastEventID string, events chan<- *SSESnapshotEvent) error {
	url := fmt.Sprintf("%s/api/v1/missions/%s/execute", s.BaseURL, missionID)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, nil)
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	if s.AuthToken != "" {
		req.Header.Set("Authorization", "Bearer "+s.AuthToken)
	}
	if lastEventID != "" {
		req.Header.Set("Last-Event-ID", lastEventID)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("connect: %w", err)
	}
	if resp.StatusCode != 200 {
		resp.Body.Close()
		return fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}
	if resp.Header.Get("Content-Type") != "text/event-stream" {
		resp.Body.Close()
		return fmt.Errorf("unexpected content type: %s", resp.Header.Get("Content-Type"))
	}

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()

		// Skip comments (keepalive)
		if line == "" || line[0] == ':' {
			continue
		}

		// Parse data line
		if len(line) > 6 && line[:6] == "data: " {
			data := line[6:]
			var event SSESnapshotEvent
			if err := json.Unmarshal([]byte(data), &event); err != nil {
				continue // skip malformed
			}
			select {
			case events <- &event:
			case <-ctx.Done():
				resp.Body.Close()
				return ctx.Err()
			}
		}

		// Check context after each line
		select {
		case <-ctx.Done():
			resp.Body.Close()
			return ctx.Err()
		default:
		}
	}

	resp.Body.Close()
	return scanner.Err()
}
