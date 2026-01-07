# Frontend Project - WDP

## Cấu trúc dự án

```
fe/
├── public/                 # Static files
├── src/
│   ├── assets/            # Assets (images, icons, fonts)
│   │   ├── images/
│   │   └── icons/
│   ├── components/        # React components
│   │   ├── common/        # Reusable common components
│   │   ├── features/      # Feature-specific components
│   │   └── layouts/       # Layout components
│   ├── config/            # Configuration files
│   ├── constants/         # Application constants
│   ├── context/           # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── styles/            # Global styles
│   ├── utils/             # Utility functions
│   ├── App.jsx            # Main App component
│   ├── main.jsx           # Entry point
│   └── index.css          # Global CSS
├── .env.example           # Environment variables example
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Cài đặt

```bash
npm install
```

## Chạy dự án

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Cấu trúc thư mục chi tiết

### `/components`
- **common/**: Các component dùng chung (Button, Input, Modal, etc.)
- **features/**: Các component theo tính năng (UserProfile, ProductCard, etc.)
- **layouts/**: Các component layout (Header, Footer, Sidebar, MainLayout)

### `/pages`
Các component đại diện cho các trang/route của ứng dụng

### `/services`
Các service để gọi API và xử lý logic liên quan đến backend

### `/hooks`
Custom React hooks để tái sử dụng logic

### `/utils`
Các hàm tiện ích (formatters, validators, helpers)

### `/constants`
Các hằng số của ứng dụng (API endpoints, routes, storage keys)

### `/config`
Cấu hình ứng dụng (API URLs, feature flags)

### `/context`
React Context providers cho state management

## Environment Variables

Copy `.env.example` thành `.env` và cấu hình các biến môi trường cần thiết.

