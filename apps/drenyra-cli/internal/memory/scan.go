package memory

import (
	"regexp"
	"strings"
)

// Entry delimiter — same as Hermes tools/memory_tool.py
const EntryDelimiter = "\n§\n"

var memoryThreatPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)ignore\s+(previous|all|above|prior)\s+instructions`),
	regexp.MustCompile(`(?i)you\s+are\s+now\s+`),
	regexp.MustCompile(`(?i)do\s+not\s+tell\s+the\s+user`),
	regexp.MustCompile(`(?i)system\s+prompt\s+override`),
	regexp.MustCompile(`(?i)disregard\s+(your|all|any)\s+(instructions|rules|guidelines)`),
	regexp.MustCompile(`(?i)curl\s+[^\n]*\$\{?\w*(KEY|TOKEN|SECRET|PASSWORD)`),
	regexp.MustCompile(`(?i)authorized_keys`),
}

func scanEntry(content string) string {
	for _, r := range content {
		if isInvisibleUnicode(r) {
			return "blocked: invisible unicode in memory entry (possible injection)"
		}
	}
	for _, p := range memoryThreatPatterns {
		if p.MatchString(content) {
			return "blocked: memory entry matches injection/exfil pattern (Hermes security scan)"
		}
	}
	return ""
}

func isInvisibleUnicode(r rune) bool {
	switch r {
	case '\u200b', '\u200c', '\u200d', '\u2060', '\ufeff',
		'\u202a', '\u202b', '\u202c', '\u202d', '\u202e':
		return true
	default:
		return false
	}
}

func normalizeEntry(content string) string {
	return strings.TrimSpace(content)
}

func isDuplicate(entries []string, content string) bool {
	for _, e := range entries {
		if e == content {
			return true
		}
	}
	return false
}
