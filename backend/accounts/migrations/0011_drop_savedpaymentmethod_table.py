# Generated manually to drop SavedPaymentMethod table

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0010_user_stripe_customer_id_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                "DROP TABLE IF EXISTS accounts_savedpaymentmethod CASCADE;",
            ],
            reverse_sql=[
                # Cannot reverse this operation
            ],
        ),
    ]


