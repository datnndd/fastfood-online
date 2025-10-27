# import_locations.py
import os
import django
import json
from pathlib import Path

# --- Django Setup ---
# Replace 'your_project_name.settings' with the actual path to your settings file
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
# --- End Django Setup ---

# Import your models AFTER Django setup
from accounts.models import Province, Ward

def import_data(json_file_path: Path):
    """
    Imports province and ward data from a JSON file into Django models.
    """
    if not json_file_path.is_file():
        print(f"Error: JSON file not found at {json_file_path}")
        return

    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {json_file_path}")
        return
    except Exception as e:
        print(f"An error occurred opening or reading the file: {e}")
        return

    province_count = 0
    ward_count = 0
    updated_provinces = 0
    updated_wards = 0

    print("Starting data import...")

    for province_data in data:
        province_name = province_data.get('tentinhmoi')
        province_code = province_data.get('matinhBNV')

        if not province_name or not province_code:
            print(f"Skipping province entry due to missing name or code: {province_data}")
            continue

        try:
            # Use update_or_create to avoid duplicates if the script is run multiple times
            # It finds a Province by 'code' or creates a new one if it doesn't exist.
            # If it exists, it updates the 'name' if it's different.
            province_obj, created = Province.objects.update_or_create(
                code=str(province_code), # Ensure code is a string
                defaults={'name': province_name}
            )

            if created:
                province_count += 1
                print(f"  Created Province: {province_name} ({province_code})")
            else:
                updated_provinces += 1
                # Optional: print(f"  Updated Province: {province_name} ({province_code})")


            wards_data = province_data.get('phuongxa', [])
            for ward_data in wards_data:
                ward_name = ward_data.get('tenphuongxa')
                ward_code = ward_data.get('maphuongxa')

                if not ward_name or ward_code is None:
                    print(f"Skipping ward entry in {province_name} due to missing name or code: {ward_data}")
                    continue

                try:
                    # Use update_or_create for wards as well.
                    # It finds a Ward by the combination of 'province' and 'code'
                    # or creates a new one. Updates 'name' if it exists.
                    _, ward_created = Ward.objects.update_or_create(
                        province=province_obj,
                        code=str(ward_code), # Ensure code is a string
                        defaults={'name': ward_name}
                    )

                    if ward_created:
                        ward_count += 1
                        # Optional: print(f"    - Created Ward: {ward_name} ({ward_code})")
                    else:
                        updated_wards +=1
                        # Optional: print(f"    - Updated Ward: {ward_name} ({ward_code})")

                except Exception as e:
                    print(f"Error creating/updating ward '{ward_name}' ({ward_code}) in province '{province_name}': {e}")

        except Exception as e:
            print(f"Error creating/updating province '{province_name}' ({province_code}): {e}")

    print("\nImport finished!")
    print(f"  Provinces created: {province_count}")
    print(f"  Provinces updated: {updated_provinces}")
    print(f"  Wards created:     {ward_count}")
    print(f"  Wards updated:     {updated_wards}")
    print(f"  Total Wards processed: {ward_count + updated_wards}")


if __name__ == "__main__":
    # Get the directory where the script is located
    script_dir = Path(__file__).resolve().parent
    # Assume the JSON file is in the same directory as the script
    json_path = script_dir / 'danhmucxaphuong.json'
    import_data(json_path)