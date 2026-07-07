package memory

import "fmt"

// MutateKind selects CLI memory subcommand behavior.
type MutateKind int

const (
	MutateAdd MutateKind = iota
	MutateReplace
	MutateRemove
)

// ParseTarget parses memory|user|mem|u.
func ParseTarget(s string) (Target, error) {
	switch s {
	case "memory", "mem", "m":
		return TargetMemory, nil
	case "user", "u":
		return TargetUser, nil
	default:
		return "", fmt.Errorf("invalid target %q — use memory or user", s)
	}
}

// PathFor returns the backing file for a target.
func (st *Store) PathFor(target Target) (string, error) {
	return st.pathFor(target)
}
