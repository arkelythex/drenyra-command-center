package history

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"time"
)

// Entry is one harness task invocation.
type Entry struct {
	At        time.Time `json:"at"`
	Task      string    `json:"task"`
	RootAgent string    `json:"rootAgent,omitempty"`
	AutoLevel string    `json:"autoLevel,omitempty"`
	TraceID   string    `json:"traceId,omitempty"`
	Status    string    `json:"status,omitempty"`
}

// Append writes one JSON line to ~/.drenyra/history.jsonl (best-effort).
func Append(e Entry) error {
	if e.At.IsZero() {
		e.At = time.Now().UTC()
	}
	path, err := Path()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o600)
	if err != nil {
		return err
	}
	defer f.Close()
	data, err := json.Marshal(e)
	if err != nil {
		return err
	}
	_, err = f.Write(append(data, '\n'))
	return err
}

// Path returns ~/.drenyra/history.jsonl
func Path() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".drenyra", "history.jsonl"), nil
}

// Recent reads up to limit latest entries (newest last).
func Recent(limit int) ([]Entry, error) {
	if limit <= 0 {
		return readAll()
	}

	entries, err := readRecentWindow(recentLineScanLimit(limit))
	if err != nil {
		return nil, err
	}
	if len(entries) <= limit {
		return entries, nil
	}
	return entries[len(entries)-limit:], nil
}

const (
	recentTailChunkSize = 64 * 1024
	recentTailMaxBytes  = 4 * 1024 * 1024
	recentMinLineScan   = 128
	recentMaxLineScan   = 4096
)

func readAll() ([]Entry, error) {
	path, err := Path()
	if err != nil {
		return nil, err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	return parseEntries(splitLines(data)), nil
}

func readRecentWindow(maxLines int) ([]Entry, error) {
	path, err := Path()
	if err != nil {
		return nil, err
	}
	f, err := os.Open(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	defer f.Close()

	info, err := f.Stat()
	if err != nil {
		return nil, err
	}
	lines, err := readTailLines(f, info.Size(), maxLines, recentTailMaxBytes)
	if err != nil {
		return nil, err
	}
	return parseEntries(lines), nil
}

func recentLineScanLimit(limit int) int {
	if limit <= 0 {
		return 0
	}
	scan := limit * 4
	if scan < recentMinLineScan {
		scan = recentMinLineScan
	}
	if scan > recentMaxLineScan && limit <= recentMaxLineScan {
		scan = recentMaxLineScan
	}
	if scan < limit {
		scan = limit
	}
	return scan
}

func readTailLines(f *os.File, fileSize int64, maxLines int, maxBytes int64) ([][]byte, error) {
	if fileSize <= 0 || maxLines == 0 || maxBytes <= 0 {
		return nil, nil
	}

	var data []byte
	remaining := fileSize
	var readBytes int64
	for remaining > 0 && readBytes < maxBytes {
		chunkSize := int64(recentTailChunkSize)
		if chunkSize > remaining {
			chunkSize = remaining
		}
		if readBytes+chunkSize > maxBytes {
			chunkSize = maxBytes - readBytes
		}
		remaining -= chunkSize

		chunk := make([]byte, chunkSize)
		if _, err := f.ReadAt(chunk, remaining); err != nil {
			return nil, err
		}
		data = append(chunk, data...)
		readBytes += chunkSize

		if remaining == 0 || countLines(data) > maxLines {
			break
		}
	}

	if remaining > 0 {
		if idx := bytes.IndexByte(data, '\n'); idx >= 0 {
			data = data[idx+1:]
		} else {
			return nil, nil
		}
	}

	lines := splitLines(data)
	if len(lines) <= maxLines {
		return lines, nil
	}
	return lines[len(lines)-maxLines:], nil
}

func countLines(data []byte) int {
	count := 0
	for _, b := range data {
		if b == '\n' {
			count++
		}
	}
	return count
}

func parseEntries(lines [][]byte) []Entry {
	var entries []Entry
	for _, line := range lines {
		if len(line) == 0 {
			continue
		}
		var e Entry
		if json.Unmarshal(line, &e) == nil {
			entries = append(entries, e)
		}
	}
	return entries
}

func splitLines(data []byte) [][]byte {
	var lines [][]byte
	start := 0
	for i, b := range data {
		if b == '\n' {
			lines = append(lines, data[start:i])
			start = i + 1
		}
	}
	if start < len(data) {
		lines = append(lines, data[start:])
	}
	return lines
}
