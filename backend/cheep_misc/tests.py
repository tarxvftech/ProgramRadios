from django.test import TestCase

import cheep_misc.misc as misc

# Create your tests here.
class OpenRTXFirmwareFetchTests(TestCase):
    def setUp(self):
        ...
    def test_openrtx_nightlies_fetch(self):
        # misc.pull_openrtx_nightlies()
    def test_openrtx_releases(self):
        misc.update_openrtx_firmwares_available()

