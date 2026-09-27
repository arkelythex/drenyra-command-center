export declare abstract class BaseBuilder<TProps, TBuilt = TProps> {
    protected data: Partial<TProps>;
    constructor(defaults: Partial<TProps>);
    protected set(fields: Partial<TProps>): this;
    abstract build(): TBuilt;
}
//# sourceMappingURL=base.builder.d.ts.map