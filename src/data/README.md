# Catálogo postal mexicano

`mx-postal.json.gz` contiene 31.878 códigos postales y 158.864 asentamientos del catálogo SEPOMEX redistribuido por [IcaliaLabs/sepomex](https://github.com/IcaliaLabs/sepomex), revisión `3899c9e68c5ab46a9a789911d298833254a88b26`, descargado el 25 de septiembre de 2026 (Asia/Makassar). La descarga no implica que el catálogo esté actualizado a esa fecha. La licencia del proyecto de origen se conserva en `SEPOMEX-LICENSE`.

Fuente exacta: https://raw.githubusercontent.com/IcaliaLabs/sepomex/3899c9e68c5ab46a9a789911d298833254a88b26/lib/sepomex_db.csv
SHA-256 del fichero original: `3411a0be5e11c3613f16939ea85707901c2d66e4031914e4ca42bd146993dfee`.

Se conservan CP, estado, municipio y colonias. Los CP son texto para preservar ceros iniciales. Un CP puede tener varias colonias e incluso varios municipios; no se elige arbitrariamente uno. No incluye direcciones de clientes.

Para actualizar: descargar el fichero de una revisión verificada, ejecutar `python3 scripts/build-postal-catalog.py /ruta/sepomex_db.csv`, actualizar esta procedencia y correr las pruebas postales. El resultado comprimido es determinista.

Solo el servidor carga el catálogo. `/api/codigos-postales?cp=01000` devuelve exclusivamente las zonas de ese código. La configuración de Next incluye el archivo en el despliegue standalone; las pruebas de navegador consultan esa API en el build standalone. La captura manual permanece disponible para asentamientos nuevos o discrepancias del catálogo.

## Despliegue

Aplicar primero `supabase/migrations/0016_company_address.sql` al proyecto Supabase de TodoPlásticos (`tiynnllrcdhsvrzsdsct`). Es aditiva y compatible con la versión anterior. Verificar la columna y sus restricciones antes de fusionar/desplegar el formulario. La dirección completa no recibe permisos públicos de lectura; el propietario la lee por `mkt_my_company()`. `location` mantiene municipio y estado para el directorio existente.
