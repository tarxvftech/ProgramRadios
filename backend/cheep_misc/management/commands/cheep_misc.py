import sys
from django.core.management.base import BaseCommand, CommandError
import cheep_misc.misc as misc

class Command(BaseCommand):
    help = 'run functions as defined in cheep_misc/misc'
    def add_arguments(self, parser):
        parser.add_argument('commandlist', nargs='+', type=str)
    def handle(self, *args, **options):
        for each in sys.argv[2:]:
            print(each)
            if hasattr(misc, each):
                getattr(misc,each)()
            else:
                print("not found",each)
