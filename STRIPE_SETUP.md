# Hướng dẫn Setup Stripe Payment

## Tổng quan
Tính năng thanh toán bằng thẻ qua Stripe đã được tích hợp vào ứng dụng. Khi người dùng chọn phương thức thanh toán "Thẻ" và nhấn "Đặt hàng", hệ thống sẽ tự động redirect đến trang thanh toán Stripe.

## Các thay đổi đã thực hiện

### Backend
1. **Thêm Stripe SDK** vào `requirements.txt`
2. **Cập nhật Order model** với các trường:
   - `stripe_checkout_session_id`: ID của session checkout Stripe
   - `stripe_payment_intent_id`: ID của payment intent từ Stripe
   - `stripe_payment_status`: Trạng thái thanh toán (paid, pending, etc.)

3. **Tạo các endpoints mới**:
   - `/api/orders/checkout/` - Cập nhật để hỗ trợ thanh toán Stripe
   - `/api/orders/stripe/webhook/` - Webhook để nhận thông báo từ Stripe

4. **Cập nhật `create_order_from_cart`** để hỗ trợ tạo order mà không xóa giỏ hàng ngay (cho thanh toán Stripe)

### Frontend
1. **Cập nhật CartPage** để redirect đến Stripe khi chọn thanh toán thẻ
2. **Tạo PaymentSuccessPage** - Trang hiển thị sau khi thanh toán thành công
3. **Tạo PaymentCancelPage** - Trang hiển thị khi người dùng hủy thanh toán
4. **Thêm routes** cho các trang payment callback

## Cài đặt

### 1. Cài đặt dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Cấu hình Stripe

Thêm các biến môi trường sau vào file `.env` của backend:

```env
STRIPE_SECRET_KEY=sk_test_...  # Secret key từ Stripe Dashboard
STRIPE_PUBLISHABLE_KEY=pk_test_...  # Publishable key từ Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook secret từ Stripe Dashboard
```

**Lưu ý**: 
- Sử dụng test keys khi phát triển
- Webhook secret chỉ có sau khi tạo webhook endpoint trong Stripe Dashboard

### 3. Chạy migrations

```bash
cd backend
python manage.py makemigrations orders
python manage.py migrate
```

### 4. Cấu hình Stripe Webhook

1. Đăng nhập vào [Stripe Dashboard](https://dashboard.stripe.com)
2. Vào **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Nhập URL: `https://your-domain.com/api/orders/stripe/webhook/`
   - Cho development local, sử dụng [Stripe CLI](https://stripe.com/docs/stripe-cli) hoặc [ngrok](https://ngrok.com) để forward webhook
5. Chọn events: `checkout.session.completed`, `payment_intent.succeeded`
6. Copy **Signing secret** và thêm vào `.env` như `STRIPE_WEBHOOK_SECRET`

### 5. Sử dụng Stripe CLI (cho development)

Cài đặt Stripe CLI và forward webhook đến local server:

```bash
# Cài đặt Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# hoặc download từ https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhook đến local server
stripe listen --forward-to localhost:8000/api/orders/stripe/webhook/
```

Copy webhook signing secret từ output và thêm vào `.env`.

## Luồng hoạt động

1. **Người dùng thêm món vào giỏ hàng**
2. **Chọn địa chỉ giao hàng** (nếu chưa có thì thêm mới)
3. **Chọn phương thức thanh toán "Thẻ"**
4. **Nhấn "Đặt hàng ngay"**
5. **Hệ thống tạo đơn hàng** (status: PREPARING)
6. **Tạo Stripe Checkout Session** và redirect đến Stripe
7. **Người dùng thanh toán trên Stripe**
8. **Stripe gửi webhook** đến backend khi thanh toán thành công
9. **Backend cập nhật order** với payment status = 'paid'
10. **Redirect về trang success** hoặc cancel

## Kiểm thử

### Test Cards (Stripe Test Mode)

Sử dụng các thẻ test sau trong Stripe Checkout:

- **Thành công**: `4242 4242 4242 4242`
- **Thất bại**: `4000 0000 0000 0002`
- **Cần xác thực 3D Secure**: `4000 0025 0000 3155`

CVV: Bất kỳ 3 chữ số  
Ngày hết hạn: Bất kỳ ngày trong tương lai

### Kiểm tra webhook

Xem logs trong Stripe Dashboard hoặc dùng Stripe CLI:

```bash
stripe listen --forward-to localhost:8000/api/orders/stripe/webhook/
```

## Xử lý lỗi

### Nếu tạo checkout session thất bại
- Order sẽ bị xóa tự động
- Giỏ hàng vẫn còn, người dùng có thể thử lại

### Nếu người dùng hủy thanh toán
- Order vẫn tồn tại nhưng chưa thanh toán
- Giỏ hàng đã bị xóa
- Có thể cần thêm logic để cleanup các order chưa thanh toán sau X giờ

### Nếu webhook không nhận được
- Order sẽ vẫn tồn tại nhưng `stripe_payment_status` sẽ là null
- Có thể tạo endpoint để verify payment status từ Stripe API

## Lưu ý quan trọng

1. **Currency**: Hiện tại sử dụng VND (vnd). Nếu muốn đổi, cập nhật trong `CreateStripeCheckoutView`
2. **Success/Cancel URLs**: Được tự động detect từ `HTTP_ORIGIN` header, fallback là `http://localhost:5173`
3. **Order Status**: Order được tạo với status `PREPARING` ngay cả khi chưa thanh toán. Có thể thêm status `PENDING_PAYMENT` nếu cần
4. **Cart Clearing**: Giỏ hàng chỉ được xóa sau khi tạo checkout session thành công (không phải sau khi thanh toán thành công)

## Cải tiến có thể thực hiện

1. Thêm status `PENDING_PAYMENT` cho orders chưa thanh toán
2. Tạo scheduled task để cleanup orders chưa thanh toán sau 24 giờ
3. Thêm endpoint để verify payment status từ Stripe API
4. Gửi email xác nhận khi thanh toán thành công
5. Thêm retry logic cho webhook failures
6. Logging tốt hơn cho debugging

