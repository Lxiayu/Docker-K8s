import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TimeRangeSelectorProps {
  value: string
  onChange: (value: string) => void
  options?: { label: string; value: string }[]
}

const defaultOptions = [
  { label: '今天', value: 'today' },
  { label: '近7天', value: '7days' },
  { label: '近30天', value: '30days' },
  { label: '近90天', value: '90days' },
  { label: '近一年', value: '1year' },
]

export function TimeRangeSelector({
  value,
  onChange,
  options = defaultOptions,
}: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(option.value)}
          className={cn(
            'transition-all',
            value === option.value && 'shadow-md'
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
