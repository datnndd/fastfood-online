# cart/management/commands/update_cart_totals.py
from django.core.management.base import BaseCommand
from cart.models import CartItem, CartCombo


class Command(BaseCommand):
    help = 'Updates cached total fields for all CartItems and CartCombos'

    def handle(self, *args, **options):
        self.stdout.write('Updating CartItem totals...')
        
        items = CartItem.objects.select_related('menu_item').prefetch_related('selected_options')
        item_count = items.count()
        updated_items = 0
        
        for item in items:
            try:
                # Force recalculation and save
                item.item_total = item.calculate_total()
                item.save(update_fields=['item_total'])
                updated_items += 1
                if updated_items % 50 == 0:
                    self.stdout.write(f'  Updated {updated_items}/{item_count} items')
            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(f'Failed to update CartItem {item.id}: {e}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated_items} cart items')
        )
        
        self.stdout.write('Updating CartCombo totals...')
        
        combos = CartCombo.objects.select_related('combo')
        combo_count = combos.count()
        updated_combos = 0
        
        for combo_item in combos:
            try:
                # Force recalculation and save
                combo_item.combo_total = combo_item.calculate_total()
                combo_item.save(update_fields=['combo_total'])
                updated_combos += 1
                if updated_combos % 50 == 0:
                    self.stdout.write(f'  Updated {updated_combos}/{combo_count} combos')
            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(f'Failed to update CartCombo {combo_item.id}: {e}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated_combos} cart combos')
        )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Total: Updated {updated_items} items and {updated_combos} combos'
            )
        )
