# UI Components - Hướng dẫn sử dụng

Tất cả các UI components đã được chuẩn hóa về màu sắc, kích thước để đồng nhất trong toàn bộ dự án.

## Form Controls

### Input
```jsx
import { Input } from '../components/ui';

// Basic
<Input label="Email" placeholder="email@example.com" />

// With size variants
<Input size="sm" label="Small Input" />
<Input size="md" label="Medium Input" /> // default
<Input size="lg" label="Large Input" />

// With icons
<Input
  leftIcon={<SearchIcon />}
  rightIcon={<ClearIcon />}
  label="Search"
/>

// With error
<Input
  label="Email"
  error="Email không hợp lệ"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// Disabled
<Input label="Email" disabled value="readonly@example.com" />
```

### Select
```jsx
import { Select } from '../components/ui';

<Select
  label="Role"
  options={[
    { value: 'STUDENT', label: 'Học viên' },
    { value: 'STAFF', label: 'Nhân viên' },
  ]}
  placeholder="Chọn vai trò"
  size="md"
/>

// With error
<Select
  label="Role"
  error="Vui lòng chọn vai trò"
  options={options}
/>
```

### Textarea
```jsx
import { Textarea } from '../components/ui';

<Textarea
  label="Mô tả"
  rows={4}
  maxLength={500}
  showCount
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>
```

### Checkbox
```jsx
import { Checkbox } from '../components/ui';

<Checkbox
  label="Tôi đồng ý với điều khoản"
  checked={agreed}
  onChange={(e) => setAgreed(e.target.checked)}
/>

// Multiple checkboxes
{options.map((option) => (
  <Checkbox
    key={option.id}
    label={option.label}
    checked={selected.includes(option.id)}
    onChange={(e) => handleToggle(option.id, e.target.checked)}
  />
))}
```

### Radio
```jsx
import { Radio } from '../components/ui';

<Radio
  label="Nam"
  name="gender"
  value="male"
  checked={gender === 'male'}
  onChange={(e) => setGender(e.target.value)}
/>

<Radio
  label="Nữ"
  name="gender"
  value="female"
  checked={gender === 'female'}
  onChange={(e) => setGender(e.target.value)}
/>
```

### Switch
```jsx
import { Switch } from '../components/ui';

<Switch
  label="Nhận thông báo"
  checked={notifications}
  onChange={(e) => setNotifications(e.target.checked)}
/>
```

### DatePicker
```jsx
import { DatePicker } from '../components/ui';

<DatePicker
  label="Ngày sinh"
  value={birthDate}
  onChange={(e) => setBirthDate(e.target.value)}
  min="1900-01-01"
  max={new Date().toISOString().split('T')[0]}
/>
```

### FileUpload
```jsx
import { FileUpload } from '../components/ui';

<FileUpload
  label="Upload hồ sơ"
  accept=".pdf,.doc,.docx"
  multiple
  maxSize={5 * 1024 * 1024} // 5MB
  onChange={(files) => setFiles(files)}
/>

// Single file
<FileUpload
  label="Avatar"
  accept="image/*"
  maxSize={2 * 1024 * 1024} // 2MB
  onChange={(file) => setAvatar(file)}
/>
```

### SearchInput
```jsx
import { SearchInput } from '../components/ui';

<SearchInput
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  onSearch={(term) => handleSearch(term)}
  onClear={() => setSearchTerm('')}
  placeholder="Tìm kiếm học viên..."
/>
```

## Pagination

```jsx
import { Pagination } from '../components/ui';

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  total={totalItems}
  pageSize={pageSize}
  onPageChange={(page) => setCurrentPage(page)}
  onPageSizeChange={(size) => {
    setPageSize(size);
    setCurrentPage(1);
  }}
  showPageSize
  showInfo
/>
```

## Size Variants

Tất cả form controls hỗ trợ 3 kích thước:
- `sm`: Small (h-8, text-xs)
- `md`: Medium (h-10, text-sm) - **Default**
- `lg`: Large (h-12, text-base)

## Màu sắc đồng nhất

- **Primary**: Indigo-600
- **Error**: Rose-600
- **Success**: Emerald-600
- **Warning**: Amber-600
- **Border**: Slate-200 (normal), Indigo-400 (focus), Rose-300 (error)
- **Background**: White (normal), Rose-50 (error), Slate-50 (disabled)

## States

Tất cả components hỗ trợ:
- **Normal**: Border slate-200, bg white
- **Focus**: Border indigo-400, ring indigo-100
- **Error**: Border rose-300, bg rose-50
- **Disabled**: Border slate-200, bg slate-50, opacity-50

## Best Practices

1. Luôn sử dụng `size` prop để đồng nhất kích thước
2. Sử dụng `label` và `error` props để hiển thị thông tin
3. Sử dụng `required` prop cho các trường bắt buộc
4. Sử dụng `helperText` để hướng dẫn người dùng
5. Kiểm tra `disabled` state khi cần thiết

