export function createMemoryApi(store) {
    return {
        mem_save: (input) => store.save(input),
        mem_search: (query) => store.search(query),
        mem_context: (query) => store.context(query),
    };
}
//# sourceMappingURL=memory-api.js.map