from django.core.management.base import BaseCommand, CommandError
from cheep_misc.misc import update_OEM_firmwares_available

class Command(BaseCommand):
    help = 'Update OEM firmwares available from radio_firmwares/'
    def handle(self, *args, **options):
        update_OEM_firmwares_available()
