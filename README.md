## 1) Chạy Docker tại gốc repo:
docker compose up -d
## 2) Backend
cd backend
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt      
### Migrate, seed, tạo admin
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
### Chạy Backend
python manage.py runserver 8000

## 3) frontend: đang lỗi
