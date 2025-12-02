"""
Management command to populate options for existing option groups.
This adds actual option choices to option groups that currently have no options.
"""
from django.core.management.base import BaseCommand
from catalog.models import OptionGroup, Option


class Command(BaseCommand):
    help = 'Populate options for existing option groups'

    def handle(self, *args, **options):
        self.stdout.write('Populating options for option groups...')
        
        # Common option mappings for different group types
        ice_options = {
            'Ít đá': 0,
            'Nhiều đá': 0,
            'Không đá': 0,
        }
        
        size_options = {
            'Size S': 0,
            'Size M': 3000,
            'Size L': 5000,
        }
        
        spicy_options = {
            'Không cay': 0,
            'Cay vừa': 0,
            'Cay nhiều': 0,
        }
        
        topping_options = {
            'Thêm phô mai': 5000,
            'Thêm trứng': 3000,
            'Thêm rau': 2000,
        }
        
        # Get all option groups without options
        empty_groups = OptionGroup.objects.filter(options__isnull=True).distinct()
        
        created_count = 0
        for group in empty_groups:
            group_name_lower = group.name.lower()
            options_to_create = None
            
            # Match group name to option set
            if 'đá' in group_name_lower or 'ice' in group_name_lower:
                options_to_create = ice_options
            elif 'size' in group_name_lower or 'cỡ' in group_name_lower:
                options_to_create = size_options
            elif 'cay' in group_name_lower or 'spicy' in group_name_lower:
                options_to_create = spicy_options
            elif 'topping' in group_name_lower or 'thêm' in group_name_lower:
                options_to_create = topping_options
            else:
                # Create a default option if we can't match
                Option.objects.create(
                    group=group,
                    name=group.name,
                    price_delta=0
                )
                created_count += 1
                self.stdout.write(f'  Created default option for: {group.name}')
                continue
            
            # Create matched options
            for opt_name, price_delta in options_to_create.items():
                Option.objects.create(
                    group=group,
                    name=opt_name,
                    price_delta=price_delta
                )
                created_count += 1
            
            self.stdout.write(f'  Created {len(options_to_create)} options for: {group.name}')
        
        self.stdout.write(self.style.SUCCESS(
            f'Successfully created {created_count} options for {empty_groups.count()} option groups'
        ))
