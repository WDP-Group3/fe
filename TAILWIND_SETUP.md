# Hướng dẫn cài đặt Tailwind CSS v4

## Vấn đề
Tailwind CSS v4 đã thay đổi cách sử dụng với PostCSS. Plugin PostCSS đã được tách ra thành package riêng.

## Giải pháp

### Bước 1: Cài đặt package
Chạy lệnh sau trong thư mục `fe`:

```bash
npm install -D @tailwindcss/postcss
```

Hoặc nếu dùng yarn:
```bash
yarn add -D @tailwindcss/postcss
```

### Bước 2: Kiểm tra cấu hình
Đảm bảo các file sau đã được cấu hình đúng:

**postcss.config.js** (đã đúng):
```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
}
```

**src/index.css** (đã được cập nhật):
```css
@import 'tailwindcss';
```

### Bước 3: Chạy lại dev server
Sau khi cài đặt, restart dev server:
```bash
npm run dev
```

## Lưu ý
- Tailwind CSS v4 sử dụng `@import 'tailwindcss'` thay vì `@tailwind` directives
- PostCSS config đã được cập nhật để sử dụng `@tailwindcss/postcss`
- Nếu vẫn gặp lỗi, thử xóa `node_modules` và `package-lock.json`, sau đó chạy `npm install` lại

## Alternative: Sử dụng Tailwind v3 (nếu gặp vấn đề)
Nếu muốn sử dụng Tailwind v3 (ổn định hơn), có thể downgrade:

```bash
npm install -D tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0
```

Và cập nhật lại `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Và `postcss.config.js`:
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

