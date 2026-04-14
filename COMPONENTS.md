# Component Library Documentation

Reusable components for the LocalPro Raffle application. All components are built with TypeScript and Tailwind CSS for consistency and type safety.

## Components

### Button

Versatile button component with multiple sizes, variants, and states.

**Sizes:**
- `sm`: `px-4 py-2 text-sm` - Small inline buttons
- `md`: `px-6 py-2 text-base` - Medium default buttons
- `lg`: `px-6 py-3 text-base` - Large form submission buttons

**Variants:**
- `primary`: Blue button (primary actions)
- `secondary`: Gray button (cancel/secondary actions)
- `success`: Green button (positive actions)
- `danger`: Red button (destructive actions)
- `warning`: Yellow button (warnings)
- `ghost`: Transparent with border (secondary actions on backgrounds)

**Usage:**

```tsx
import { Button } from '@/components';

// Basic button
<Button>Click me</Button>

// With variant and size
<Button variant="success" size="lg" width="full">
  Submit
</Button>

// Loading state
<Button loading>Processing...</Button>

// With icon and custom className
<Button icon={<StarIcon />} className="my-custom-class">
  Favorite
</Button>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `variant` | `'primary' \| 'secondary' \| 'success' \| 'danger' \| 'warning' \| 'ghost'` | `'primary'` | Button style |
| `width` | `'auto' \| 'full'` | `'auto'` | Button width |
| `loading` | `boolean` | `false` | Show loading spinner and disable button |
| `icon` | `React.ReactNode` | - | Icon to display before text |
| `...props` | `ButtonHTMLAttributes<HTMLButtonElement>` | - | Native button props |

---

### Input

Form input component with built-in label, error state, and help text.

**Features:**
- Built-in label with required indicator
- Error state styling (red border + background)
- Help text support
- Icon support
- Disabled state
- Full TypeScript support

**Usage:**

```tsx
import { Input } from '@/components';

// Basic input
<Input type="text" placeholder="Enter text" />

// With label and validation
<Input
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  error={errors.email}
  required
/>

// With help text
<Input
  label="Password"
  type="password"
  helpText="At least 8 characters"
  required
/>

// With icon
<Input
  label="Search"
  icon={<SearchIcon />}
  placeholder="Search raffles..."
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Input label text |
| `error` | `string` | - | Error message (displays in red) |
| `helpText` | `string` | - | Helper text below input |
| `required` | `boolean` | - | Shows `*` next to label |
| `icon` | `React.ReactNode` | - | Icon to display inside input |
| `...props` | `InputHTMLAttributes<HTMLInputElement>` | - | Native input props |

---

### FormField

Wrapper component for grouping label, input, and validation messages.

**Features:**
- Consistent label styling
- Error message display
- Help text support
- Required indicator
- Flexible child components

**Usage:**

```tsx
import { FormField, Input } from '@/components';

<FormField label="Prize Name" required error={errors.prizeName}>
  <Input
    type="text"
    placeholder="e.g., First Prize"
    value={prizeName}
    onChange={(e) => setPrizeName(e.target.value)}
  />
</FormField>

// With textarea
<FormField label="Description" helpText="Optional">
  <textarea
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
    rows={4}
  />
</FormField>

// With select
<FormField label="Status" required>
  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
    <option>Draft</option>
    <option>Active</option>
  </select>
</FormField>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | Yes | Field label text |
| `error` | `string` | No | Error message |
| `helpText` | `string` | No | Helper text |
| `required` | `boolean` | No | Shows `*` next to label |
| `children` | `React.ReactNode` | Yes | Form control element |

---

## Color System

All components use standardized Tailwind colors:

| Purpose | Color | Usage |
|---------|-------|-------|
| **Primary** | Blue-600/700 | Main actions, links |
| **Secondary** | Gray-300/400 | Cancel, cancel, secondary |
| **Success** | Green-600/700 | Positive actions |
| **Danger** | Red-600/700 | Destructive actions |
| **Warning** | Yellow-600/700 | Warnings |
| **Ghost** | White with opacity | Secondary on colored backgrounds |

---

## Button Size System

### Quick Reference

```
SMALL:       px-4 py-2 text-sm
MEDIUM:      px-6 py-2 text-base (default)
LARGE:       px-6 py-3 text-base (forms)
FULL-SMALL:  w-full px-4 py-2 text-sm
FULL-MEDIUM: w-full px-6 py-2 text-base
FULL-LARGE:  w-full px-6 py-3 text-base
```

---

## Common Patterns

### Form Submission
```tsx
<form onSubmit={handleSubmit} className="space-y-6">
  <FormField label="Name" required error={errors.name}>
    <Input
      type="text"
      placeholder="Enter name"
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
  </FormField>

  <div className="flex gap-4">
    <Button type="submit" size="lg" width="full" loading={saving}>
      Save
    </Button>
    <Button type="button" variant="secondary" size="lg" width="full" onClick={onCancel}>
      Cancel
    </Button>
  </div>
</form>
```

### Action Buttons
```tsx
<div className="flex gap-3">
  <Button variant="success">✓ Approve</Button>
  <Button variant="danger">✗ Reject</Button>
  <Button variant="ghost" size="sm">Edit</Button>
</div>
```

### Modal Actions
```tsx
<div className="flex gap-4 mt-6">
  <Button variant="primary" width="full">
    Continue
  </Button>
  <Button variant="secondary" width="full">
    Cancel
  </Button>
</div>
```

---

## Migration Guide

### Before (Old approach)
```tsx
<button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
  Click me
</button>
```

### After (New approach)
```tsx
<Button>Click me</Button>
```

### Before (Form input)
```tsx
<input
  type="text"
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
  placeholder="Enter text"
/>
```

### After (Form input)
```tsx
<Input
  label="Your Field"
  placeholder="Enter text"
  required
/>
```

---

## Best Practices

1. **Use semantic variants** - Always choose the variant that matches the action intent
2. **Consistent sizes** - Use `md` for most buttons, `lg` for forms, `sm` for inline actions
3. **Width for context** - Use `width="full"` only when context requires (modals, forms)
4. **Loading states** - Always show loading state for async actions
5. **Error handling** - Always provide error messages to Input/FormField components
6. **Accessibility** - All components support standard HTML attributes (aria-*, role, etc.)

---

## Troubleshooting

### "Component not found" error
Make sure you're importing from the correct path:
```tsx
// ✓ Correct
import { Button, Input } from '@/components';

// ✗ Wrong
import Button from '@/components/Button';
```

### Styles not applying
Ensure Tailwind CSS is properly configured and the components directory is included in `tailwind.config.ts`:
```ts
content: [
  './components/**/*.{js,ts,jsx,tsx}',
  './app/**/*.{js,ts,jsx,tsx}',
]
```

### TypeScript errors
Make sure you're using the exported types:
```tsx
import { Button, type ButtonProps } from '@/components';

const MyButton: React.FC<ButtonProps> = (props) => {
  return <Button {...props} />;
};
```

---

## Future Enhancements

- [ ] Select component
- [ ] Textarea component
- [ ] Checkbox component
- [ ] Radio button component
- [ ] Toast/Notification component
- [ ] Modal/Dialog component
- [ ] Badge component
- [ ] Loading skeleton component
