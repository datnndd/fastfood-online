import os
import django
import time
from django.db import connection, reset_queries

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from catalog.models import MenuItem, Combo
from catalog.serializers import MenuItemListSerializer, ComboListSerializer
from rest_framework.test import APIRequestFactory

def benchmark_menu_items():
    print("--- Benchmarking MenuItem List (Limit 50) ---")
    reset_queries()
    start_time = time.time()
    
    # Simulate the viewset's queryset
    queryset = MenuItem.objects.select_related("category").all().order_by('id')[:50]
    serializer = MenuItemListSerializer(queryset, many=True)
    data = serializer.data
    
    end_time = time.time()
    query_count = len(connection.queries)
    
    print(f"Time taken: {end_time - start_time:.4f}s")
    print(f"Queries: {query_count}")
    # Print unique query signatures to detect N+1
    signatures = {}
    for q in connection.queries:
        sql = q['sql'].split('WHERE')[0] if 'WHERE' in q['sql'] else q['sql']
        signatures[sql] = signatures.get(sql, 0) + 1
    
    for sql, count in signatures.items():
        print(f"Count: {count} | SQL: {sql[:100]}...")

def benchmark_combos():
    print("\n--- Benchmarking Combo List (Limit 50) ---")
    reset_queries()
    start_time = time.time()
    
    # Simulate the viewset's queryset logic
    queryset = Combo.objects.select_related("category").order_by('-created_at')[:50]
    
    serializer = ComboListSerializer(queryset, many=True)
    data = serializer.data
    
    end_time = time.time()
    query_count = len(connection.queries)
    
    print(f"Time taken: {end_time - start_time:.4f}s")
    print(f"Queries: {query_count}")
    
    signatures = {}
    for q in connection.queries:
        sql = q['sql'].split('WHERE')[0] if 'WHERE' in q['sql'] else q['sql']
        signatures[sql] = signatures.get(sql, 0) + 1
    
    for sql, count in signatures.items():
        print(f"Count: {count} | SQL: {sql[:100]}...")

def benchmark_counts():
    print("\n--- Benchmarking Counts ---")
    reset_queries()
    start_time = time.time()
    c1 = MenuItem.objects.count()
    end_time = time.time()
    print(f"MenuItem count: {c1} (Time: {end_time - start_time:.4f}s)")
    
    start_time = time.time()
    c2 = Combo.objects.count()
    end_time = time.time()
    print(f"Combo count: {c2} (Time: {end_time - start_time:.4f}s)")

def benchmark_categories():
    from catalog.serializers import CategoryListSerializer
    from catalog.models import Category
    print("\n--- Benchmarking Category List ---")
    reset_queries()
    start_time = time.time()
    
    queryset = Category.objects.all()
    serializer = CategoryListSerializer(queryset, many=True)
    data = serializer.data
    
    end_time = time.time()
    query_count = len(connection.queries)
    
    print(f"Categories: {len(data)} (Time: {end_time - start_time:.4f}s)")
    print(f"Queries: {query_count}")

if __name__ == "__main__":
    benchmark_menu_items()
    benchmark_combos()
    benchmark_counts()
    benchmark_categories()
