package memory

import "testing"

func TestMetadataHermesBlocks(t *testing.T) {
	s := Snapshot{
		MemoryBlocks: "MEMORY block",
		UserBlocks:   "USER block",
		MemoryUsed:   10,
		UserUsed:     5,
		MemoryLimit:  2200,
		UserLimit:    1375,
	}
	m := Metadata(s)
	if m["memoryFormat"] != "hermes-v1" {
		t.Fatal("format tag")
	}
	if m["persistentMemory"] != "MEMORY block" {
		t.Fatal("blocks preferred")
	}
}

func TestParseTarget(t *testing.T) {
	if _, err := ParseTarget("memory"); err != nil {
		t.Fatal(err)
	}
	if _, err := ParseTarget("bogus"); err == nil {
		t.Fatal("expected error")
	}
}
