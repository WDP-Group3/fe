# Components Documentation

## Cấu trúc thư mục

```
components/
├── common/          # Common components (layout, typography, etc.)
├── ui/              # UI components (buttons, inputs, modals, etc.)
├── forms/           # Form components
└── layout/          # Layout components
```

## Common Components

### Layout Components

#### Container
Wrapper component với max-width và padding tự động.

```jsx
import { Container } from '../components/common';

<Container size="lg">
  {/* content */}
</Container>
```

Props:
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full' (default: 'lg')
- `className`: Additional CSS classes

#### Grid
Grid layout với responsive columns.

```jsx
import { Grid } from '../components/common';

<Grid cols={3} gap={4}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Grid>
```

Props:
- `cols`: 1 | 2 | 3 | 4 (default: 1)
- `gap`: 2 | 3 | 4 | 6 | 8 (default: 4)
- `className`: Additional CSS classes

#### Stack
Flex container với direction và spacing.

```jsx
import { Stack } from '../components/common';

<Stack direction="row" spacing={4} align="center">
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>
```

Props:
- `direction`: 'row' | 'column' (default: 'column')
- `spacing`: 2 | 3 | 4 | 6 | 8 (default: 4)
- `align`: 'start' | 'center' | 'end' | 'stretch' (default: 'start')
- `className`: Additional CSS classes

#### Box
Container với padding.

```jsx
import { Box } from '../components/common';

<Box padding="lg">
  Content
</Box>
```

Props:
- `padding`: 'none' | 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `className`: Additional CSS classes

### Typography

#### Typography
Text component với variants.

```jsx
import { Typography } from '../components/common';

<Typography variant="h1">Heading 1</Typography>
<Typography variant="body">Body text</Typography>
```

Variants: h1, h2, h3, h4, h5, h6, body, body2, caption, overline

### Other Common Components

- **PageHeader**: Page header với breadcrumbs và actions
- **Card**: Card container với header, body, footer
- **Avatar**: User avatar với initials fallback
- **Badge**: Badge component với variants
- **Divider**: Divider với optional text
- **Spacer**: Spacing component
- **Skeleton**: Loading skeleton

## UI Components

### Form Components

#### Button
```jsx
import { Button } from '../components/ui';

<Button variant="primary" size="md" loading={false}>
  Click me
</Button>
```

Variants: primary, secondary, danger, success, outline, ghost
Sizes: sm, md, lg

#### Input
```jsx
import { Input } from '../components/ui';

<Input
  label="Email"
  required
  error={errors.email}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

#### Select
```jsx
import { Select } from '../components/ui';

<Select
  label="Role"
  options={[
    { value: 'STUDENT', label: 'Học viên' },
    { value: 'STAFF', label: 'Nhân viên' },
  ]}
  value={role}
  onChange={(e) => setRole(e.target.value)}
/>
```

#### Textarea
```jsx
import { Textarea } from '../components/ui';

<Textarea
  label="Description"
  rows={4}
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>
```

### Modal & Dialog

#### Modal
```jsx
import { Modal } from '../components/ui';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Modal Title"
  size="md"
>
  Content
</Modal>
```

#### ConfirmDialog
```jsx
import { ConfirmDialog } from '../components/ui';

<ConfirmDialog
  isOpen={isOpen}
  onClose={handleClose}
  onConfirm={handleConfirm}
  title="Xác nhận"
  message="Bạn có chắc chắn muốn xóa?"
  variant="danger"
/>
```

### Other UI Components

- **Tabs**: Tab navigation
- **Tooltip**: Tooltip component
- **Dropdown**: Dropdown menu
- **Accordion**: Accordion/collapse
- **Loading**: Loading spinner
- **ErrorMessage**: Error display
- **EmptyState**: Empty state display
- **Toast**: Toast notification
- **StatCard**: Statistics card
- **StatusBadge**: Status badge
- **ProgressBar**: Progress bar
- **DataTable**: Data table

## Form Components

#### FormGroup
```jsx
import { FormGroup } from '../components/forms';

<FormGroup label="Email" required error={errors.email}>
  <Input value={email} onChange={...} />
</FormGroup>
```

#### FormRow
```jsx
import { FormRow } from '../components/forms';

<FormRow cols={2} gap={4}>
  <FormGroup label="First Name">
    <Input />
  </FormGroup>
  <FormGroup label="Last Name">
    <Input />
  </FormGroup>
</FormRow>
```

## Permissions

Sử dụng utility functions để check permissions:

```jsx
import { canEditProfile, canViewProfile } from '../utils/permissions';

const canEdit = canEditProfile(currentUser, targetUser);
const canView = canViewProfile(currentUser, targetUser);
```

Rules:
- **Admin**: Có thể edit/view tất cả profiles
- **Student/Instructor**: Chỉ edit/view profile của chính mình
- **Sale/Staff**: Edit/view profile của chính mình + học viên được phân công
- **Guest**: Không có quyền

## Best Practices

1. Luôn sử dụng common components thay vì tạo mới
2. Sử dụng Container, Grid, Stack cho layout
3. Sử dụng FormGroup và FormRow cho forms
4. Check permissions trước khi hiển thị edit button
5. Sử dụng Typography cho text thay vì thẻ HTML trực tiếp
6. Sử dụng Spacer cho spacing thay vì margin classes

