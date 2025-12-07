from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg, Q, F, DecimalField
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
    
    # Calculate revenue only for COMPLETED orders
    revenue_orders = orders.filter(status='COMPLETED')
    total_revenue = revenue_orders.aggregate(
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
        total_quantity=Sum('quantity'),
        revenue=Sum(
            F('quantity') * F('unit_price'),
            output_field=DecimalField(max_digits=14, decimal_places=2)
        ),
        avg_price=Avg('unit_price')
    ).order_by('-revenue')[:20]  # Top 20
    
    items_data = [{
        'id': item['menu_item__id'],
        'name': item['menu_item__name'],
        'quantity': item['total_quantity'],
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
        total_quantity=Sum('quantity'),
        revenue=Sum(
            F('quantity') * F('unit_price'),
            output_field=DecimalField(max_digits=14, decimal_places=2)
        ),
        price=Avg('unit_price')
    ).order_by('-revenue')[:20]  # Top 20
    
    combos_data = [{
        'id': combo['combo__id'],
        'name': combo['combo__name'],
        'quantity': combo['total_quantity'],
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def revenue_chart_statistics(request):
    """Thống kê doanh thu cho biểu đồ"""
    if request.user.role not in ['manager', 'staff']:
        return Response(
            {'detail': 'Bạn không có quyền truy cập'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    timeframe = request.GET.get('timeframe', 'month')
    
    # Determine date range based on timeframe and filter value
    today = timezone.now().date()
    
    if timeframe == 'day':
        date_str = request.GET.get('date')
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else today
        except ValueError:
            target_date = today
            
        start_date = target_date
        end_date = target_date
        
        # Query for hourly data
        orders = Order.objects.filter(
            created_at__date=target_date,
            status='COMPLETED'
        ).annotate(
            hour=F('created_at__hour')
        ).values('hour').annotate(
            revenue=Sum('total_amount')
        ).order_by('hour')
        
        # Format data for 24 hours
        data = {h: 0 for h in range(24)}
        for item in orders:
            data[item['hour']] = item['revenue']
            
        labels = [f"{h:02d}h" for h in range(24)]
        values = [data[h] for h in range(24)]
        
    elif timeframe == 'month':
        month_str = request.GET.get('month') # Format: YYYY-MM
        try:
            if month_str:
                year, month = map(int, month_str.split('-'))
                start_date = datetime(year, month, 1).date()
            else:
                start_date = today.replace(day=1)
        except ValueError:
            start_date = today.replace(day=1)
            
        # Calculate end date (last day of month)
        if start_date.month == 12:
            end_date = datetime(start_date.year + 1, 1, 1).date() - timedelta(days=1)
        else:
            end_date = datetime(start_date.year, start_date.month + 1, 1).date() - timedelta(days=1)
            
        # Query for daily data
        orders = Order.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
            status='COMPLETED'
        ).annotate(
            day=F('created_at__day')
        ).values('day').annotate(
            revenue=Sum('total_amount')
        ).order_by('day')
        
        # Format data for all days in month
        days_in_month = (end_date - start_date).days + 1
        data = {d: 0 for d in range(1, days_in_month + 1)}
        for item in orders:
            data[item['day']] = item['revenue']
            
        labels = [f"{d}/{start_date.month}" for d in range(1, days_in_month + 1)]
        values = [data[d] for d in range(1, days_in_month + 1)]
        
    else: # year
        year_str = request.GET.get('year')
        try:
            year = int(year_str) if year_str else today.year
        except ValueError:
            year = today.year
            
        start_date = datetime(year, 1, 1).date()
        end_date = datetime(year, 12, 31).date()
        
        # Query for monthly data
        orders = Order.objects.filter(
            created_at__year=year,
            status='COMPLETED'
        ).annotate(
            month=F('created_at__month')
        ).values('month').annotate(
            revenue=Sum('total_amount')
        ).order_by('month')
        
        # Format data for 12 months
        data = {m: 0 for m in range(1, 13)}
        for item in orders:
            data[item['month']] = item['revenue']
            
        labels = [f"T{m}" for m in range(1, 13)]
        values = [data[m] for m in range(1, 13)]

    return Response({
        'labels': labels,
        'values': values,
        'timeframe': timeframe,
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def status_statistics(request):
    """Thống kê trạng thái đơn hàng"""
    if request.user.role not in ['manager', 'staff']:
        return Response(
            {'detail': 'Bạn không có quyền truy cập'},
            status=status.HTTP_403_FORBIDDEN
        )
        
    from_date = request.GET.get('from_date')
    to_date = request.GET.get('to_date')
    
    if not from_date or not to_date:
        # Default to today if not provided
        today = timezone.now().date()
        from_date = today.isoformat()
        to_date = today.isoformat()
        
    try:
        from_date_obj = datetime.strptime(from_date, '%Y-%m-%d').date()
        to_date_obj = datetime.strptime(to_date, '%Y-%m-%d').date()
    except ValueError:
        return Response(
            {'detail': 'Định dạng ngày không hợp lệ'},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    orders = Order.objects.filter(
        created_at__date__gte=from_date_obj,
        created_at__date__lte=to_date_obj
    )
    
    stats = orders.values('status').annotate(count=Count('id'))
    
    result = {
        'PREPARING': 0,
        'READY': 0,
        'DELIVERING': 0,
        'COMPLETED': 0,
        'CANCELLED': 0,
        'total': 0
    }
    
    total = 0
    for item in stats:
        status_key = item['status']
        count = item['count']
        if status_key in result:
            result[status_key] = count
            total += count
            
    result['total'] = total
    
    return Response(result)
