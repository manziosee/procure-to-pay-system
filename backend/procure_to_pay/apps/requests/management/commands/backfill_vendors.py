import os
import tempfile

from django.core.management.base import BaseCommand

from procure_to_pay.apps.requests.models import PurchaseRequest, Vendor
from procure_to_pay.apps.documents.services import DocumentProcessor


class Command(BaseCommand):
    help = (
        "Backfill the Vendor directory for requests that predate vendor-linking. "
        "First tries the vendor name already stored on proforma_data (cheap); for "
        "requests where that's empty but a proforma file is on record, re-runs AI "
        "extraction against the stored file to recover the vendor name."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--all-statuses',
            action='store_true',
            help='Backfill from every request, not just approved ones.',
        )

    def handle(self, *args, **options):
        queryset = PurchaseRequest.objects.filter(vendor__isnull=True)
        if not options['all_statuses']:
            queryset = queryset.filter(status='approved')

        processor = None
        linked = 0
        reprocessed = 0
        skipped_no_proforma = 0
        skipped_no_vendor_found = 0

        for request in queryset:
            vendor_name = (request.proforma_data or {}).get('vendor', '').strip()

            if not vendor_name or vendor_name.lower() in ('unknown vendor', 'unknown'):
                # proforma_data doesn't have a usable vendor name (often because this
                # request predates process_proforma persisting it) - re-extract from
                # the stored proforma file itself, if there is one.
                if not request.proforma_content and not request.proforma:
                    skipped_no_proforma += 1
                    continue

                if processor is None:
                    processor = DocumentProcessor()

                try:
                    if request.proforma_content:
                        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
                            tmp.write(request.proforma_content)
                            tmp.flush()
                            extracted = processor.process_proforma(tmp.name)
                        os.unlink(tmp.name)
                    else:
                        extracted = processor.process_proforma(request.proforma.path)
                except Exception as e:
                    self.stdout.write(self.style.WARNING(
                        f'  Request #{request.id} "{request.title}": extraction failed ({e})'
                    ))
                    skipped_no_vendor_found += 1
                    continue

                vendor_name = (extracted.get('vendor') or '').strip()
                if not vendor_name or vendor_name.lower() in ('unknown vendor', 'unknown'):
                    skipped_no_vendor_found += 1
                    continue

                request.proforma_data = extracted
                reprocessed += 1

            vendor, _ = Vendor.objects.get_or_create(
                name__iexact=vendor_name, defaults={'name': vendor_name}
            )
            request.vendor = vendor
            request.save(update_fields=['vendor', 'proforma_data'])
            linked += 1
            self.stdout.write(f'  Request #{request.id} "{request.title}" -> {vendor.name}')

        self.stdout.write(self.style.SUCCESS(
            f'Linked {linked} request(s) to a vendor ({reprocessed} via re-extraction). '
            f'Skipped {skipped_no_proforma} with no proforma on file, '
            f'{skipped_no_vendor_found} where extraction found no usable vendor name.'
        ))
