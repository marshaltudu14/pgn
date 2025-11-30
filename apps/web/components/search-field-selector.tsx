/**
 * Search Field Selector Component
 * Allows users to select which field to search by (ID, Name, Email, Phone)
 * Accessible component with proper ARIA labels and keyboard navigation
 */

'use client';

import { useEmployeeStore } from '@/app/lib/stores/employeeStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SEARCH_FIELD_OPTIONS = [
  {
    value: 'human_readable_user_id',
    label: 'User ID',
  },
  {
    value: 'first_name',
    label: 'First Name',
  },
  {
    value: 'last_name',
    label: 'Last Name',
  },
  {
    value: 'email',
    label: 'Email',
  },
  {
    value: 'phone',
    label: 'Phone Number',
  },
];

type SearchFieldType = 'human_readable_user_id' | 'first_name' | 'last_name' | 'email' | 'phone';

interface SearchFieldSelectorProps {
  value?: SearchFieldType;
  onValueChange?: (value: SearchFieldType) => void;
  disabled?: boolean;
}

export function SearchFieldSelector({
  value,
  onValueChange,
  disabled = false
}: SearchFieldSelectorProps) {
  const store = useEmployeeStore();
  const filters = store?.filters;
  const setFilters = store?.setFilters;

  // Use internal store if no external value/change handler provided
  const selectedValue = value || filters?.searchField || 'human_readable_user_id';

  const handleValueChange = (newValue: SearchFieldType) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setFilters?.({ searchField: newValue });
    }
  };

  return (
    <Select
      value={selectedValue}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger
        className="w-48 cursor-pointer"
        aria-label="Select search field"
        data-testid="search-field-selector-trigger"
      >
        <SelectValue
          placeholder="Select field to search"
          aria-label={`Selected search field: ${SEARCH_FIELD_OPTIONS.find(opt => opt.value === selectedValue)?.label || 'None'}`}
        />
      </SelectTrigger>
      <SelectContent
        aria-label="Search field options"
        position="popper"
        align="start"
        data-testid="search-field-selector-content"
      >
        {SEARCH_FIELD_OPTIONS.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            aria-label={option.label}
            data-testid={`search-field-option-${option.value}`}
            data-search-field={option.value}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default SearchFieldSelector;