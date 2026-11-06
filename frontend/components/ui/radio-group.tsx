import * as React from 'react';
import { cn } from '@/lib/utils';

const RadioGroupContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
}>({
  value: '',
  onValueChange: () => {},
});

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: string; onValueChange?: (value: string) => void; disabled?: boolean }
>(({ className, value, onValueChange, children, disabled, ...props }, ref) => {
  const [selected, setSelected] = React.useState(value || '');
  const handleValueChange = (newValue: string) => {
    setSelected(newValue);
    onValueChange?.(newValue);
  };

  return (
    <RadioGroupContext.Provider value={{ value: selected || '', onValueChange: handleValueChange }}>
      <div ref={ref} className={cn(className)} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
});
RadioGroup.displayName = 'RadioGroup';

const RadioGroupItem = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { value: string }
>(({ className, id, value, ...props }, ref) => {
  const { onValueChange } = React.useContext(RadioGroupContext);

  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-center space-x-2 cursor-pointer',
        className
      )}
    >
      <input
        ref={ref}
        type="radio"
        id={id}
        name="radio-group"
        value={value}
        checked={false}
        onChange={() => onValueChange(value)}
        className="h-4 w-4 text-primary border border-input focus:ring-none"
        {...props}
      />
    </label>
  );
});
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };