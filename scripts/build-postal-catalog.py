"""Build the local postal lookup from the documented SEPOMEX UTF-8 pipe file.
Usage: python3 scripts/build-postal-catalog.py /path/to/sepomex_db.csv
No network or credentials are used. See src/data/README.md for provenance.
"""
import csv
import gzip
import json
import sys
from pathlib import Path

grouped = {}
for row in csv.reader(Path(sys.argv[1]).open(encoding='utf-8'), delimiter='|'):
    if len(row) < 5 or len(row[0]) != 5 or not row[0].isdigit():
        raise ValueError('Invalid catalog row')
    groups = grouped.setdefault(row[0], {})
    groups.setdefault((row[4], row[3]), set()).add(row[1])
catalog = {
    cp: [{'state': state, 'municipality': municipality, 'colonies': sorted(colonies)}
         for (state, municipality), colonies in groups.items()]
    for cp, groups in sorted(grouped.items())
}
raw = json.dumps(catalog, ensure_ascii=False, separators=(',', ':')).encode()
output = Path(__file__).resolve().parent.parent / 'src/data/mx-postal.json.gz'
output.write_bytes(gzip.compress(raw, mtime=0))
print(f'{len(catalog)} postal codes; {output.stat().st_size} bytes')
