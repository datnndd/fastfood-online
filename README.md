## 1) Chạy Docker tại gốc repo:
docker compose up -d
## 2) Backend
cd backend
python -m venv .venv
source .venv/bin/activate            # Windows: Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
                                                .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt      
### Migrate, seed, tạo admin
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
### Chạy Backend
python manage.py runserver 8000

## 3) frontend:
cài node.js

cd frontend
gõ thêm lệnh này khi tạo một terminal mới với frontend: $env:Path += ';C:\Program Files\nodejs;C:\Users\ddat2\AppData\Roaming\npm'
npm install
dùng 2 terminal
    npm run css:dev
    npm run dev

server: http://127.0.0.1:8000/
frontend: http://localhost:5173/

- Nhiệm vụ cần:
Xây dựng dashboard cho quản lý
Xay dựng navBar và các trang tĩnh của nó cần theo, tham khảo jolibe.
Xây dựng thêm tính năng thêm địa chỉ khi đặt hàng, phát triển chức năng thanh toán bằng thẻ
Xay dựng trang dashboard cho hồ sơ cá nhân của user.
Lưu ý: các ảnh logo, banner lưu trong thư mục frontend/src/assets.

