import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface InvoiceSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

export const InvoiceSearch = ({ value, onChange, onSearch }: InvoiceSearchProps) => {
  return (
    <div className="relative flex-1 group">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-foreground transition-colors" />
      <Input
        placeholder="Buscar por número de factura, cliente..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSearch();
          }
        }}
        className="pl-10"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
          onClick={() => {
            onChange('');
            // Trigger search immediately when clearing
            setTimeout(onSearch, 0); 
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
