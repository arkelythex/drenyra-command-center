import { useForm } from 'react-hook-form';
import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { vendorSchema, type CreateVendorDTO } from '@/lib/schemas/vendor.schema';
import { useActiveCompanyContext } from '@/lib/use-active-company-context';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { buildVendorFormDefaults } from './vendor-form-defaults';

interface VendorFormProps {
  defaultValues?: Partial<CreateVendorDTO>;
  onSubmit: (data: CreateVendorDTO) => void;
  isLoading?: boolean;
}

export const VendorForm = ({ defaultValues, onSubmit, isLoading }: VendorFormProps) => {
  const { companyContext } = useActiveCompanyContext();
  const resolvedDefaultValues = useMemo(
    () => buildVendorFormDefaults(companyContext.companyId, defaultValues),
    [companyContext.companyId, defaultValues],
  );

  const form = useForm<CreateVendorDTO>({
    resolver: zodResolver(vendorSchema.omit({ id: true, createdAt: true, updatedAt: true })),
    defaultValues: resolvedDefaultValues,
  });

  useEffect(() => {
    if (defaultValues?.companyId) return;
    form.setValue('companyId', companyContext.companyId, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [companyContext.companyId, defaultValues?.companyId, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="taxId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-label font-black uppercase tracking-widest text-muted-foreground">
                  RUC *
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="20123456789" className="h-11 bg-background border-border font-mono text-xs" maxLength={11} />
                </FormControl>
                <FormMessage className="text-label" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="legalName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-label font-black uppercase tracking-widest text-muted-foreground">
                  Razón Social *
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Proveedor SAC" className="h-11 bg-background border-border font-mono text-xs" />
                </FormControl>
                <FormMessage className="text-label" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="tradeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-label font-black uppercase tracking-widest text-muted-foreground">
                Nombre Comercial
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nombre comercial (opcional)" className="h-11 bg-background border-border font-mono text-xs" />
              </FormControl>
              <FormMessage className="text-label" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-label font-black uppercase tracking-widest text-muted-foreground">
                Dirección *
              </FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Av. Principal 123, Lima" className="min-h-[80px] bg-background border-border font-mono text-xs resize-none" />
              </FormControl>
              <FormMessage className="text-label" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-label font-black uppercase tracking-widest text-muted-foreground">
                  Email *
                </FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="contacto@proveedor.com" className="h-11 bg-background border-border font-mono text-xs" />
                </FormControl>
                <FormMessage className="text-label" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-label font-black uppercase tracking-widest text-muted-foreground">
                  Teléfono
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="+51 999 999 999" className="h-11 bg-background border-border font-mono text-xs" />
                </FormControl>
                <FormMessage className="text-label" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-label font-black uppercase tracking-widest text-muted-foreground">
                  Persona de Contacto
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nombre del contacto" className="h-11 bg-background border-border font-mono text-xs" />
                </FormControl>
                <FormMessage className="text-label" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="paymentTerms"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-label font-black uppercase tracking-widest text-muted-foreground">
                  Plazo de Pago (días)
                </FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="30" className="h-11 bg-background border-border font-mono text-xs" onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                </FormControl>
                <FormMessage className="text-label" />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full h-11 font-black text-xs bg-primary hover:bg-primary/90">
          {isLoading ? 'GUARDANDO...' : 'GUARDAR PROVEEDOR'}
        </Button>
      </form>
    </Form>
  );
};
