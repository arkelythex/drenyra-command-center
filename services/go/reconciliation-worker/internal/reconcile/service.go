package reconcile

type Entry struct {
	Reference   string `json:"reference"`
	AmountCents int64  `json:"amountCents"`
}

type Request struct {
	SourceA        []Entry `json:"sourceA"`
	SourceB        []Entry `json:"sourceB"`
	ToleranceCents int64   `json:"toleranceCents"`
}

type Mismatch struct {
	Reference string `json:"reference"`
	Left      int64  `json:"left"`
	Right     int64  `json:"right"`
}

type Result struct {
	Matched            int        `json:"matched"`
	MissingInSourceA   []Entry    `json:"missingInSourceA"`
	MissingInSourceB   []Entry    `json:"missingInSourceB"`
	AmountMismatches   []Mismatch `json:"amountMismatches"`
	TotalDiscrepancies int        `json:"totalDiscrepancies"`
}

func Reconcile(request Request) Result {
	if request.ToleranceCents < 0 {
		request.ToleranceCents = 0
	}

	aByRef := make(map[string]Entry, len(request.SourceA))
	bByRef := make(map[string]Entry, len(request.SourceB))

	for _, entry := range request.SourceA {
		aByRef[entry.Reference] = entry
	}
	for _, entry := range request.SourceB {
		bByRef[entry.Reference] = entry
	}

	result := Result{
		MissingInSourceA: make([]Entry, 0),
		MissingInSourceB: make([]Entry, 0),
		AmountMismatches: make([]Mismatch, 0),
	}

	for reference, aEntry := range aByRef {
		bEntry, ok := bByRef[reference]
		if !ok {
			result.MissingInSourceB = append(result.MissingInSourceB, aEntry)
			continue
		}

		diff := aEntry.AmountCents - bEntry.AmountCents
		if diff < 0 {
			diff = -diff
		}

		if diff <= request.ToleranceCents {
			result.Matched++
			continue
		}

		result.AmountMismatches = append(result.AmountMismatches, Mismatch{
			Reference: reference,
			Left:      aEntry.AmountCents,
			Right:     bEntry.AmountCents,
		})
	}

	for reference, bEntry := range bByRef {
		if _, ok := aByRef[reference]; ok {
			continue
		}
		result.MissingInSourceA = append(result.MissingInSourceA, bEntry)
	}

	result.TotalDiscrepancies = len(result.MissingInSourceA) + len(result.MissingInSourceB) + len(result.AmountMismatches)
	return result
}
