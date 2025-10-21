# FastFoodOnline Setup Guide

## 1. Khởi động Docker
Tại thư mục gốc dự án, chạy:
```bash
docker compose up -d
```

## 2. Backend Setup
```bash
cd backend
python -m venv .venv
```
Kích hoạt môi trường ảo:
- **Ubuntu/Mac:**  
  ```bash
  source .venv/bin/activate
  ```
- **Windows:**  
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  .venv\Scripts\activate
  ```

Cài đặt thư viện:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

Khởi tạo database và tài khoản admin:
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

Chạy server backend:
```bash
python manage.py runserver 8000
```

## 3. Frontend Setup
Cài đặt Node.js nếu chưa có.

```bash
cd frontend
npm install
```
**Lưu ý:** Nếu gặp lỗi về `Path` trên Windows, chạy:
```powershell
$env:Path += ';C:\Program Files\nodejs;C:\Users\<username>\AppData\Roaming\npm'
```
Thay `<username>` bằng tên user của bạn.

Chạy frontend (dùng 2 terminal):
```bash
npm run css:dev
npm run dev
```

- Backend: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- Frontend: [http://localhost:5173/](http://localhost:5173/)

---

## Các lần chạy sau

### Backend
```bash
cd backend
# Kích hoạt môi trường ảo như trên
python manage.py runserver 8000
```
Nếu có thay đổi backend:
```bash
python manage.py makemigrations
python manage.py migrate
```

### Frontend
```bash
cd frontend
npm install
npm run css:dev
npm run dev
```
Nếu lỗi Path, chỉnh lại `$env:Path` như hướng dẫn trên.

---

## Nhiệm vụ cần thực hiện

- Xây dựng dashboard cho quản lý
- Xây dựng navBar và các trang tĩnh (tham khảo Jolibe)
- Thêm tính năng quản lý địa chỉ khi đặt hàng, phát triển chức năng thanh toán bằng thẻ
- Xây dựng dashboard hồ sơ cá nhân cho user

**Lưu ý:**  
Ảnh logo, banner lưu trong thư mục `frontend/src/assets`.

