from django.core.management.base import BaseCommand, CommandError
from cheep_misc.misc import update_openrtx_firmwares_available

class Command(BaseCommand):
    help = 'Update OpenRTX firmwares available'
    def handle(self, *args, **options):
        update_openrtx_firmwares_available()
