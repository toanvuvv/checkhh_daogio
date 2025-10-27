# 🧪 Hướng dẫn Test React App

## Chuẩn bị

1. Đảm bảo đã build React app:
```bash
npm run build:react
```

2. Kiểm tra build output:
```bash
ls dist/renderer/
```
Bạn sẽ thấy:
- `index.html`
- `assets/` (chứa JS và CSS files)

## Test trong Production Mode

### Bước 1: Start Electron app
```bash
npm start
```

### Bước 2: Kiểm tra các tính năng

#### ✅ Test License Management
1. App sẽ hiển thị License Form nếu chưa có license
2. Nhập license key và click "Activate License"
3. Kiểm tra Device ID có hiển thị đúng không
4. Sau khi activate thành công, app sẽ chuyển sang Welcome Page

#### ✅ Test Navigation
1. Click vào "🏠 Welcome" - Kiểm tra Welcome Page
2. Click vào "🔐 License Management" - Kiểm tra License Management Page
3. Click vào "🛒 Shopee Management" - Kiểm tra Shopee Management Page
4. Click vào "👋 Hello World" - Kiểm tra Hello World Page

#### ✅ Test Shopee Management
1. Vào Shopee Management Page
2. Test User Management:
   - Nhập username, session ID, cookies
   - Click "Lưu User Data"
   - Kiểm tra user có xuất hiện trong danh sách không
3. Test Product Analysis:
   - Chọn user từ dropdown
   - Nhập product links
   - Click "Phân tích sản phẩm"
   - Kiểm tra progress bar
   - Kiểm tra results table
4. Test Filter:
   - Nhập điều kiện filter (commission, price, stock)
   - Click "Áp dụng lọc"
   - Kiểm tra kết quả có được filter đúng không
   - Test "Lưu config hiện tại"
   - Test apply saved configs

#### ✅ Test License Management Page
1. Vào License Management Page
2. Click "Refresh License Info" - Kiểm tra thông tin license
3. Click "Force Validate" - Kiểm tra validation
4. Click "Clear Cache & Validate" - Kiểm tra clear cache
5. Click "Deactivate License" - Kiểm tra deactivate (cẩn thận!)

## Test trong Development Mode

### Bước 1: Start Vite dev server
```bash
npm run dev:react
```

### Bước 2: Start Electron (terminal khác)
```bash
npm run dev
```

### Bước 3: Test Hot Module Replacement
1. Mở một file component (ví dụ: `src/renderer/src/pages/WelcomePage.jsx`)
2. Thay đổi nội dung text
3. Lưu file
4. Kiểm tra app có tự động reload không

## Test Cases chi tiết

### 1. License Flow
- [ ] App hiển thị License Form khi chưa có license
- [ ] Device ID hiển thị đúng
- [ ] Activate license thành công với key hợp lệ
- [ ] Activate license thất bại với key không hợp lệ
- [ ] Sau activate thành công, chuyển sang Welcome Page
- [ ] Sidebar hiển thị sau khi có license
- [ ] Force Validate hoạt động
- [ ] Clear Cache & Validate hoạt động
- [ ] Deactivate license hoạt động

### 2. Navigation
- [ ] Click vào mỗi nav item chuyển đúng page
- [ ] Active state hiển thị đúng
- [ ] URL (memory) cập nhật đúng
- [ ] Không thể navigate khi chưa có license (trừ License page)

### 3. User Management
- [ ] Lưu user data thành công
- [ ] User hiển thị trong danh sách
- [ ] Xóa user thành công
- [ ] Clear all users thành công
- [ ] Validation các fields hoạt động

### 4. Product Analysis
- [ ] Chọn user từ dropdown
- [ ] Parse product links
- [ ] Progress bar hiển thị đúng
- [ ] Results hiển thị trong table
- [ ] Search sản phẩm hoạt động

### 5. Filter
- [ ] Apply filter hoạt động
- [ ] Clear filter hoạt động
- [ ] Lưu config hoạt động
- [ ] Apply saved config hoạt động
- [ ] Delete config hoạt động
- [ ] Filter summary hiển thị đúng

### 6. Export & Copy
- [ ] Export to Excel hoạt động
- [ ] Copy links hoạt động
- [ ] Export filtered results hoạt động
- [ ] Copy filtered links hoạt động

## Common Issues & Solutions

### Issue 1: App không start
**Solution**: Kiểm tra xem đã build React app chưa
```bash
npm run build:react
```

### Issue 2: Blank screen
**Solution**: Mở DevTools (F12) và kiểm tra console errors

### Issue 3: License không hoạt động
**Solution**: Kiểm tra backend server có đang chạy không

### Issue 4: Vite dev server không connect
**Solution**: Kiểm tra port 3000 có bị chiếm không
```bash
netstat -ano | findstr :3000
```

## Báo cáo kết quả

Sau khi test xong, hãy báo cáo:
1. Các tính năng hoạt động tốt ✅
2. Các tính năng có vấn đề ❌
3. Bugs phát hiện được 🐛
4. Suggestions for improvement 💡
