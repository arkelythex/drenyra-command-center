package history

import (
	"strings"
)

// Search finds entries whose task contains query (case-insensitive), newest first.
func Search(query string, limit int) ([]Entry, error) {
	q := strings.TrimSpace(strings.ToLower(query))
	all, err := Recent(0)
	if err != nil {
		return nil, err
	}
	if q == "" {
		return tail(all, limit), nil
	}
	var matched []Entry
	for i := len(all) - 1; i >= 0; i-- {
		if strings.Contains(strings.ToLower(all[i].Task), q) {
			matched = append(matched, all[i])
			if limit > 0 && len(matched) >= limit {
				break
			}
		}
	}
	return matched, nil
}

// Last returns the most recent entry, if any.
func Last() (*Entry, error) {
	all, err := Recent(1)
	if err != nil {
		return nil, err
	}
	if len(all) == 0 {
		return nil, nil
	}
	e := all[len(all)-1]
	return &e, nil
}

// RecentTasks returns unique task strings, newest first (for prompt recall).
func RecentTasks(limit int) ([]string, error) {
	var (
		all []Entry
		err error
	)
	if limit > 0 {
		all, err = readRecentWindow(recentTaskLineScanLimit(limit))
	} else {
		all, err = Recent(0)
	}
	if err != nil {
		return nil, err
	}
	seen := make(map[string]struct{})
	var out []string
	for i := len(all) - 1; i >= 0; i-- {
		t := strings.TrimSpace(all[i].Task)
		if t == "" {
			continue
		}
		if _, ok := seen[t]; ok {
			continue
		}
		seen[t] = struct{}{}
		out = append(out, t)
		if limit > 0 && len(out) >= limit {
			break
		}
	}
	return out, nil
}

func recentTaskLineScanLimit(limit int) int {
	if limit <= 0 {
		return 0
	}
	scan := limit * 16
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

func tail(entries []Entry, limit int) []Entry {
	if limit <= 0 || len(entries) <= limit {
		return entries
	}
	return entries[len(entries)-limit:]
}
