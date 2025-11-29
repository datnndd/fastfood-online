from django.core.management.base import BaseCommand
from catalog.models import Combo

class Command(BaseCommand):
    help = 'Updates cached stock and price fields for all Combos'

    def handle(self, *args, **options):
        combos = Combo.objects.all()
        count = combos.count()
        self.stdout.write(f"Found {count} combos to update...")
        
        updated = 0
        for combo in combos:
            try:
                combo.update_calculated_fields()
                updated += 1
                if updated % 10 == 0:
                    self.stdout.write(f"Updated {updated}/{count}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Failed to update combo {combo.id}: {e}"))
        
        self.stdout.write(self.style.SUCCESS(f"Successfully updated {updated} combos"))
