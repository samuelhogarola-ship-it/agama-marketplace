# Aportes de SuperEntrenador a TodoPlástico

## Alcance de la revisión

Se ha revisado `/Users/sam/Desktop/webs/super entrenador`, el marketplace Next.js de SuperEntrenador, y se ha comparado con la estructura actual de TodoPlástico.

La primera versión de TodoPlástico mantiene el contacto externo (web, teléfono, WhatsApp y email) y no incluye comunicación comprador-vendedor dentro de la plataforma. Por eso, las tablas, rutas y políticas de `messages` de SuperEntrenador quedan fuera de este alcance.

## Lo que ya aporta y encaja

### 1. Descubrimiento con filtros persistentes

SuperEntrenador usa filtros en la URL y un repositorio que aplica especialidad, ciudad, modalidad y orden. Es un patrón útil para TodoPlástico:

- `/buscar`: añadir categoría, tipo de publicación, ubicación y orden sin perder la búsqueda textual.
- `/empresas`: mantener filtros de empresa en URL y reutilizar un componente de filtros común.
- Filtros compartibles y rastreables, con estados vacíos que permitan limpiar o cambiar de criterio.

TodoPlástico ya tiene `q`, `category` y `location` en `/empresas`; falta llevar el mismo nivel de estructura al catálogo de anuncios.

### 2. Shape público explícito

SuperEntrenador lee perfiles públicos mediante `trainer_profiles_public` y reserva los campos sensibles para funciones autorizadas. TodoPlástico debe conservar una separación equivalente, adaptada a su decisión de mostrar contacto externo:

- shape público: empresa, ubicación, categorías, descripción, logo y canales publicados;
- shape de propietario: datos editables y estado propio;
- shape de administración: contacto, historial de moderación y decisiones operativas.

No se debe copiar el bloqueo de contacto de SuperEntrenador, porque aquí los canales externos son parte del producto. Sí conviene centralizar las consultas en repositorios para que las páginas no definan cada una sus propios `select`.

### 3. Revisión de cambios con trazabilidad

SuperEntrenador fuerza que una edición vuelva a `pending`, limpia la decisión anterior y guarda `reviewed_at` y `reviewed_by`. TodoPlástico ya reenvía los anuncios editados a moderación, pero todavía puede reforzar el circuito con:

- `reviewed_at` y `reviewed_by` en `mkt_listings`;
- un historial de decisiones administrativas separado de los eventos IA;
- una función/RPC de revisión autorizada en base de datos;
- una cola que muestre el último motivo, quién decidió y cuándo.

Esto es el aporte técnico de mayor valor para la siguiente iteración.

### 4. Fichas comparables

La ficha de entrenador hace visibles en la misma zona los atributos que permiten decidir rápido. En TodoPlástico conviene consolidar en la ficha de empresa/anuncio:

- tipo de publicación;
- categoría y ubicación;
- unidad y precio, cuando existan;
- empresa verificada;
- canales externos disponibles;
- galería con alt text y límite visible de fotografías.

La información debe seguir siendo escaneable, sin convertir la página en una ficha de producto transaccional.

### 5. Páginas de cobertura y SEO local

SuperEntrenador tiene ciudades como entidad de dominio, con páginas y metadata propias. Para TodoPlástico puede aportar páginas por estado/ciudad cuando haya suficiente oferta, por ejemplo `/ubicaciones/[slug]`, combinadas con categoría. No conviene generar páginas vacías desde el primer día: deben activarse sólo con contenido y anuncios publicados.

### 6. Calidad operativa

SuperEntrenador incorpora pruebas unitarias, comandos de verificación, auditoría de dependencias y controles de secretos. TodoPlástico ya tiene typecheck, build, lint, smoke tests y escaneo de secretos; el siguiente aporte razonable es añadir pruebas de filtros, permisos de propietario y transición de estados de moderación.

## Lo que no se debe trasladar

- `messages`, conversaciones, realtime o bandejas comprador-vendedor.
- Contacto desbloqueado después de login o pago.
- Copy de contratación o marketplace transaccional.
- Métricas propias de entrenadores como reseñas, rating o precio por sesión.
- La separación demo/producción de perfiles salvo que TodoPlástico vuelva a necesitar datos semilla públicos.

## Orden recomendado

1. Crear repositorios de lectura pública para empresas, anuncios y categorías.
2. Añadir filtros URL-backed a `/buscar` y un componente reutilizable para `/empresas`.
3. Añadir auditoría de revisión para anuncios y acciones admin protegidas por RPC/RLS.
4. Mejorar la ficha pública con atributos comparables y contacto externo medible.
5. Activar páginas locales sólo cuando exista oferta publicada suficiente.

## Decisión para la fase actual

El aporte inmediato más seguro es consolidar filtros y repositorios públicos. La auditoría de revisión debe entrar en la siguiente migración de datos. La mensajería de SuperEntrenador no se incorpora.
