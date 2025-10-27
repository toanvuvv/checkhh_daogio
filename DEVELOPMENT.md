# 🚀 Development Guide - React + Electron

## Tổng quan

Ứng dụng này được xây dựng với:
- **Electron**: Desktop app framework
- **React**: UI library
- **React Router**: Client-side routing
- **Vite**: Build tool và dev server
- **Context API**: State management

## 📁 Cấu trúc Project

```
Electron - dao gio/
├── src/
│   ├── main.js                    # Electron main process
│   ├── main/
│   │   └── preload.js            # Preload script
│   ├── renderer/
│   │   ├── src/                  # React app source
│   │   │   ├── App.jsx           # Root component
│   │   │   ├── index.jsx         # Entry point
│   │   │   ├── pages/            # Pages components
│   │   │   ├── components/       # Reusable components
│   │   │   ├── context/          # Context providers
│   │   │   ├── hooks/            # Custom hooks
│   │   │   └── styles/           # CSS files
│   │   └── (old files)           # Legacy files (sẽ xóa sau)
│   ├── utils/                     # Backend utilities
│   └── config/                    # Configuration files
├── dist/                          # Build output
│   └── renderer/                  # React build output
├── scripts/                       # Build scripts
├── vite.config.js                # Vite configuration
├── package.json                  # Dependencies & scripts
└── index.html                    # Vite entry point
```

## 🛠️ Development Workflow

### 1. Installation
```bash
npm install
```

### 2. Development Mode

#### Option A: Chạy cả Vite dev server và Electron
```bash
# Terminal 1: Start Vite dev server
npm run dev:react

# Terminal 2: Start Electron
npm run dev
```

Ưu điểm:
- Hot Module Replacement (HMR)
- Fast refresh khi sửa code
- Better debugging

#### Option B: Chỉ chạy Electron (đơn giản hơn)
```bash
# Build React app trước
npm run build:react

# Chạy Electron
npm start
```

Ưu điểm:
- Đơn giản hơn (1 terminal)
- Giống production mode

### 3. Production Build
```bash
# Build React app và Electron app
npm run build

# Hoặc build riêng từng bước
npm run build:react       # Build React only
npm run build:production  # Build Electron only
```

## 📝 Coding Guidelines

### 1. Component Structure
```jsx
// src/renderer/src/components/example/MyComponent.jsx
import React from 'react';
import styles from '../../styles/components/MyComponent.module.css';

const MyComponent = ({ prop1, prop2 }) => {
    return (
        <div className={styles.container}>
            {/* Component content */}
        </div>
    );
};

export default MyComponent;
```

### 2. Using Context
```jsx
import { useLicense } from '../hooks/useLicense';

const MyComponent = () => {
    const { isValid, licenseInfo } = useLicense();
    
    return <div>{isValid ? 'Valid' : 'Invalid'}</div>;
};
```

### 3. Using Electron API
```jsx
const MyComponent = () => {
    const handleClick = async () => {
        const result = await window.electronAPI.someFunction();
        console.log(result);
    };
    
    return <button onClick={handleClick}>Click me</button>;
};
```

### 4. CSS Strategy
- **Global styles**: `src/renderer/src/styles/global.css`
- **Component-specific**: `*.module.css` files
- **Naming**: Use camelCase for class names in modules

### 5. State Management
- **Local state**: `useState` for component-level state
- **Global state**: Context API for app-level state
- **Server state**: Custom hooks with `useEffect`

## 🎨 Adding New Features

### 1. Adding a New Page
```bash
# Create page file
# src/renderer/src/pages/NewPage.jsx

# Add route in App.jsx
<Route path="new" element={<NewPage />} />

# Add nav item in Sidebar.jsx
{ id: 'new', label: '🆕 New Page', path: '/new' }
```

### 2. Adding a New Component
```bash
# Create component file
# src/renderer/src/components/category/NewComponent.jsx

# Create CSS module if needed
# src/renderer/src/styles/components/NewComponent.module.css

# Import and use in pages
import NewComponent from '../components/category/NewComponent';
```

### 3. Adding New Context
```bash
# Create context file
# src/renderer/src/context/NewContext.jsx

# Create custom hook
# src/renderer/src/hooks/useNew.js

# Add provider in App.jsx
<NewProvider>
    {children}
</NewProvider>
```

## 🐛 Debugging

### 1. React DevTools
- Install [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- Open DevTools trong Electron (F12)

### 2. Electron DevTools
```javascript
// In development mode
mainWindow.webContents.openDevTools();
```

### 3. Console Logging
```javascript
// Client-side (renderer)
console.log('Renderer:', data);

// Server-side (main process)
console.log('Main:', data);
```

### 4. Common Issues

#### Issue: Hot reload không hoạt động
**Solution**: Restart Vite dev server
```bash
npm run dev:react
```

#### Issue: Changes không được reflect
**Solution**: Clear cache và rebuild
```bash
rm -rf dist/renderer
npm run build:react
```

#### Issue: Cannot find module
**Solution**: Check import paths và file extensions (.jsx vs .js)

## 📦 Dependencies

### Production Dependencies
- `react`: UI library
- `react-dom`: React DOM renderer
- `react-router-dom`: Client-side routing
- `axios`: HTTP client
- `crypto-js`: Encryption utilities

### Development Dependencies
- `vite`: Build tool
- `@vitejs/plugin-react`: Vite React plugin
- `electron`: Desktop framework
- `electron-builder`: App packager

## 🚢 Deployment

### Build for Production
```bash
npm run build:production
```

### Packaging
```bash
npm run dist
```

Output sẽ ở thư mục `dist/`

## 📚 Resources

- [React Documentation](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Electron Documentation](https://www.electronjs.org/)
- [Context API](https://react.dev/reference/react/useContext)

## 💡 Best Practices

1. **Keep components small and focused**: Mỗi component nên có một responsibility duy nhất
2. **Use custom hooks**: Extract reusable logic into custom hooks
3. **Avoid prop drilling**: Use Context API for deeply nested data
4. **Keep styles modular**: Use CSS modules for component-specific styles
5. **Test frequently**: Test sau mỗi feature mới
6. **Document complex logic**: Add comments for complex code
7. **Follow naming conventions**: Use consistent naming for files and components

## 🎯 Next Steps

1. ✅ Complete migration to React
2. ⏳ Add unit tests
3. ⏳ Add integration tests
4. ⏳ Improve error handling
5. ⏳ Add loading states
6. ⏳ Optimize performance
7. ⏳ Add more features

Happy coding! 🚀
