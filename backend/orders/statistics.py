from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg, Q, F
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from .models import Order, OrderItem
from catalog.models import MenuItem, Combo

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def revenue_statistics(request):
    """Thống kê doanh thu"""
    if request.user.role not in ['manager', 'staff']:
        return Response(
            {'detail': 'Bạn không có quyền truy cập'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from_date = request.GET.get('from_date')
    to_date = request.GET.get('to_date')
    order_status = request.GET.get('status', '')
    
    if not from_date or not to_date:
        return Response(
            {'detail': 'Vui lòng cung cấp from_date và to_date'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        from_date = datetime.strptime(from_date, '%Y-%m-%d').date()
        to_date = datetime.strptime(to_date, '%Y-%m-%d').date()
    except ValueError:
        return Response(
            {'detail': 'Định dạng ngày không hợp lệ (YYYY-MM-DD)'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Filter orders
    orders = Order.objects.filter(
        created_at__date__gte=from_date,
        created_at__date__lte=to_date
    )
    
    if order_status:
        orders = orders.filter(status=order_status)
    
    # Calculate statistics
    total_orders = orders.count()
    total_revenue = orders.aggregate(
        total=Sum('total_amount')
    )['total'] or Decimal('0')
    
    # Calculate average per day
    days_diff = (to_date - from_date).days + 1
    avg_per_day = total_revenue / days_diff if days_diff > 0 else Decimal('0')
    
    return Response({
        'total_orders': total_orders,
        'total_revenue': str(total_revenue),
        'avg_per_day': str(avg_per_day),
        'from_date': from_date.isoformat(),
        'to_date': to_date.isoformat(),
        'days': days_diff
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_statistics(request):
    """Thống kê đơn hàng chi tiết"""
    if request.user.role not in ['manager', 'staff']:
        return Response(
            {'detail': 'Bạn không có quyền truy cập'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from_date = request.GET.get('from_date')
    to_date = request.GET.get('to_date')
    order_status = request.GET.get('status', '')
    
    if not from_date or not to_date:
        return Response(
            {'detail': 'Vui lòng cung cấp from_date và to_date'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        from_date = datetime.strptime(from_date, '%Y-%m-%d').date()
        to_date = datetime.strptime(to_date, '%Y-%m-%d').date()
    except ValueError:
        return Response(
            {'detail': 'Định dạng ngày không hợp lệ'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    orders = Order.objects.filter(
        created_at__date__gte=from_date,
        created_at__date__lte=to_date
    )
    
    if order_status:
        orders = orders.filter(status=order_status)
    
    orders = orders.order_by('-created_at')[:100]  # Limit 100 orders
    
    orders_data = [{
        'id': order.id,
        'created_at': order.created_at.isoformat(),
        'status': order.status,
        'total_amount': str(order.total_amount),
        'customer': order.user.username if order.user else 'Guest'
    } for order in orders]
    
    return Response({
        'orders': orders_data,
        'total': len(orders_data)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def top_items_statistics(request):
    """Thống kê món ăn bán chạy"""
    if request.user.role not in ['manager', 'staff']:
        return Response(
            {'detail': 'Bạn không có quyền truy cập'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from_date = request.GET.get('from_date')
    to_date = request.GET.get('to_date')
    order_status = request.GET.get('status', '')
    
    if not from_date or not to_date:
        return Response(
            {'detail': 'Vui lòng cung cấp from_date và to_date'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        from_date = datetime.strptime(from_date, '%Y-%m-%d').date()
        to_date = datetime.strptime(to_date, '%Y-%m-%d').date()
    except ValueError:
        return Response(
            {'detail': 'Định dạng ngày không hợp lệ'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Filter order items
    order_items = OrderItem.objects.filter(
        order__created_at__date__gte=from_date,
        order__created_at__date__lte=to_date,
        menu_item__isnull=False
    )
    
    if order_status:
        order_items = order_items.filter(order__status=order_status)
    
    # Aggregate by menu item
    items_stats = order_items.values(
        'menu_item__id',
        'menu_item__name'
    ).annotate(
        quantity=Sum('quantity'),
        revenue=Sum(F('quantity') * F('price')),
        avg_price=Avg('price')
    ).order_by('-revenue')[:20]  # Top 20
    
    items_data = [{
        'id': item['menu_item__id'],
        'name': item['menu_item__name'],
        'quantity': item['quantity'],
        'revenue': str(item['revenue']),
        'avg_price': str(item['avg_price']),
        'emoji': '🍔'  # Default emoji
    } for item in items_stats]
    
    return Response({
        'items': items_data,
        'total': len(items_data)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def top_combos_statistics(request):
    """Thống kê combo bán chạy"""
    if request.user.role not in ['manager', 'staff']:
        return Response(
            {'detail': 'Bạn không có quyền truy cập'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from_date = request.GET.get('from_date')
    to_date = request.GET.get('to_date')
    order_status = request.GET.get('status', '')
    
    if not from_date or not to_date:
        return Response(
            {'detail': 'Vui lòng cung cấp from_date và to_date'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        from_date = datetime.strptime(from_date, '%Y-%m-%d').date()
        to_date = datetime.strptime(to_date, '%Y-%m-%d').date()
    except ValueError:
        return Response(
            {'detail': 'Định dạng ngày không hợp lệ'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Filter order items with combos
    order_items = OrderItem.objects.filter(
        order__created_at__date__gte=from_date,
        order__created_at__date__lte=to_date,
        combo__isnull=False
    )
    
    if order_status:
        order_items = order_items.filter(order__status=order_status)
    
    # Aggregate by combo
    combos_stats = order_items.values(
        'combo__id',
        'combo__name'
    ).annotate(
        quantity=Sum('quantity'),
        revenue=Sum(F('quantity') * F('price')),
        price=Avg('price')
    ).order_by('-revenue')[:20]  # Top 20
    
    combos_data = [{
        'id': combo['combo__id'],
        'name': combo['combo__name'],
        'quantity': combo['quantity'],
        'revenue': str(combo['revenue']),
        'price': str(combo['price'])
    } for combo in combos_stats]
    
    return Response({
        'combos': combos_data,
        'total': len(combos_data)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_report(request, format='pdf'):
    """Xuất báo cáo (placeholder - cần implement PDF/Excel generation)"""
    if request.user.role not in ['manager', 'staff']:
        return Response(
            {'detail': 'Bạn không có quyền truy cập'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from_date = request.GET.get('from_date')
    to_date = request.GET.get('to_date')
    
    if not from_date or not to_date:
        return Response(
            {'detail': 'Vui lòng cung cấp from_date và to_date'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # TODO: Implement actual PDF/Excel generation
    # For now, return a simple text response
    
    from django.http import HttpResponse
    
    content = f"Báo cáo thống kê từ {from_date} đến {to_date}\n"
    content += "Chức năng xuất báo cáo đang được phát triển.\n"
    
    response = HttpResponse(content, content_type='text/plain')
    response['Content-Disposition'] = f'attachment; filename="report-{from_date}-{to_date}.txt"'
    
    return response
