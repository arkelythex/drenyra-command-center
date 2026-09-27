export class BaseBuilder {
    data;
    constructor(defaults) {
        this.data = { ...defaults };
    }
    set(fields) {
        this.data = { ...this.data, ...fields };
        return this;
    }
}
//# sourceMappingURL=base.builder.js.map