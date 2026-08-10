# Prompts para generar imágenes de artículos — TodoPlástico

Genera una imagen por cada artículo listado abajo. Cada imagen debe guardarse en `public/articles/` con el nombre indicado.

## Instrucciones

- **Formato**: PNG, 1200x630px (ratio 1.91:1, ideal para Open Graph y tarjetas)
- **Estilo**: Fotografía industrial profesional, limpia, bien iluminada. Sin personas reconocibles.
- **Logo**: Todas las imágenes deben llevar el logo de TodoPlástico (`public/todoplastico-symbol.png`) en la esquina inferior derecha, con opacidad ~70%, tamaño pequeño (~80px), como marca de agua sutil. El logo es el archivo `todoplastico-symbol.png` del proyecto.
- **Paleta**: Tonos neutros industriales (blancos, grises, azul acero) con acentos del color AGAMA (verde #4CAF50 o azul claro #0EA5E9) donde encaje naturalmente
- **Contexto**: Ambiente de fábrica, almacén, línea de producción o laboratorio mexicano. Aspecto profesional B2B, no stock genérico.

Después de generar todas las imágenes, actualiza `src/lib/articles.ts` cambiando cada `cover:` al path correspondiente (ej: `"/articles/como-elegir-un-envase-plastico.png"`). Finalmente, borra este archivo (`scripts/generate-article-images.md`).

---

## Imágenes a generar

### 1. `public/articles/como-elegir-un-envase-plastico.png`
**Artículo**: Cómo elegir un envase plástico para tu producto
**Prompt**: Variedad de envases plásticos industriales (botellas PET, frascos HDPE, contenedores) ordenados en una mesa de laboratorio de control de calidad. Luz natural lateral. Fondo blanco difuso.

### 2. `public/articles/que-revisar-en-una-tarima-de-plastico.png`
**Artículo**: Qué revisar en una tarima de plástico
**Prompt**: Tarimas de plástico azules y negras apiladas en un almacén industrial. Un técnico con guantes inspecciona la superficie. Perspectiva ligeramente baja mostrando la estructura de la tarima.

### 3. `public/articles/reciclado-plastico-como-comparar-proveedores.png`
**Artículo**: Reciclado plástico: cómo comparar proveedores
**Prompt**: Pellets de plástico reciclado de distintos colores (blanco, negro, verde) en contenedores industriales. Al fondo, una línea de peletizado desenfocada. Tonos verdes y neutros.

### 4. `public/articles/maquinaria-para-transformacion-de-plastico.png`
**Artículo**: Maquinaria para transformación de plástico
**Prompt**: Inyectora de plástico industrial en operación, vista lateral. Molde abierto mostrando una pieza recién inyectada. Iluminación industrial cálida. Piso de fábrica limpio.

### 5. `public/articles/publicar-un-anuncio-b2b-que-genere-contactos.png`
**Artículo**: Cómo publicar un anuncio B2B que genere contactos
**Prompt**: Escritorio de oficina con laptop mostrando un formulario de publicación de productos. Junto a la laptop, muestras de productos plásticos (cubetas, envases). Ambiente profesional moderno.

### 6. `public/articles/como-el-color-impacta-la-percepcion.png`
**Artículo**: Cómo el color impacta la percepción de tu producto plástico
**Prompt**: Paleta de muestras de plástico inyectado en diferentes colores (rojo, azul, verde, amarillo, negro, blanco) dispuestas en abanico sobre fondo blanco. Acabado brillante y mate alternado. Estilo minimalista.

### 7. `public/articles/seo-para-empresas-plasticas.png`
**Artículo**: SEO básico para empresas de plásticos: cómo aparecer en Google
**Prompt**: Pantalla de computador mostrando gráficas de analítica web con tendencia ascendente. Al lado, un catálogo impreso de productos plásticos industriales. Escritorio de oficina ordenado.

### 8. `public/articles/optimizar-ciclo-de-inyeccion.png`
**Artículo**: Optimizar el ciclo de inyección: 5 ajustes rápidos
**Prompt**: Panel de control de una inyectora de plástico con pantalla digital mostrando parámetros (temperatura, presión, tiempo). Mano de técnico ajustando un dial. Close-up industrial.

### 9. `public/articles/como-vender-mas-en-todoplastico.png`
**Artículo**: Cómo vender más en TodoPlástico: guía para proveedores
**Prompt**: Vista cenital de productos plásticos variados (envases, cubetas, perfiles, tubería) organizados en grid sobre fondo blanco. Composición tipo catálogo profesional.

### 10. `public/articles/masterbatch-vs-pigmento.png`
**Artículo**: Masterbatch vs pigmento en polvo: cuándo usar cada uno
**Prompt**: Pellets de masterbatch de colores vibrantes (rojo, azul, amarillo, negro) junto a montículos de pigmento en polvo de los mismos colores. Disposición comparativa lado a lado sobre superficie blanca de laboratorio.

### 11. `public/articles/tipos-de-polietileno.png`
**Artículo**: Tipos de polietileno: HDPE, LDPE y LLDPE explicados
**Prompt**: Tres contenedores de laboratorio con pellets de polietileno (translúcido, blanco lechoso, transparente) etiquetados. Al lado, productos finales de cada tipo: botella rígida (HDPE), bolsa flexible (LDPE), film stretch (LLDPE).

### 12. `public/articles/como-reducir-merma-en-extrusion.png`
**Artículo**: Cómo reducir merma en extrusión de película
**Prompt**: Línea de extrusión de película de plástico en operación. Burbuja de película inflándose desde el dado. Operario monitoreando el grosor con instrumento de medición. Iluminación industrial.

### 13. `public/articles/normas-fitosanitarias-tarimas.png`
**Artículo**: Normas fitosanitarias y tarimas plásticas para exportación
**Prompt**: Tarimas de plástico con cajas de exportación apiladas en zona de carga de un almacén. Un sello de certificación fitosanitaria visible. Camión de transporte al fondo.

### 14. `public/articles/whatsapp-business-empresas-plasticas.png`
**Artículo**: WhatsApp Business para empresas de plásticos: cómo usarlo bien
**Prompt**: Smartphone mostrando una conversación de WhatsApp Business con catálogo de productos plásticos. Al lado, tarjetas de presentación y muestras de productos. Escritorio de vendedor industrial.

### 15. `public/articles/que-es-el-indice-de-fluidez-mfi.png`
**Artículo**: Qué es el índice de fluidez (MFI) y por qué importa
**Prompt**: Plastómetro (equipo de medición de MFI) en un laboratorio de control de calidad. Muestra de resina extruida saliendo del orificio del equipo. Ambiente de laboratorio técnico.

### 16. `public/articles/como-fotografiar-productos-plasticos.png`
**Artículo**: Cómo fotografiar productos plásticos para vender más
**Prompt**: Mini estudio de fotografía de producto: caja de luz con fondo blanco, un envase plástico en el centro, cámara en trípode apuntando al producto. Iluminación profesional LED.

### 17. `public/articles/diferencias-pvc-rigido-flexible.png`
**Artículo**: PVC rígido vs PVC flexible: diferencias y aplicaciones
**Prompt**: Tubería de PVC rígido blanca junto a una manguera de PVC flexible transparente. Cortes transversales mostrando la diferencia de grosor y rigidez. Superficie de taller.

### 18. `public/articles/errores-comunes-maquinaria-usada.png`
**Artículo**: 5 errores comunes al comprar maquinaria de plástico usada
**Prompt**: Inyectora de plástico usada en un taller. Primer plano de componentes con desgaste visible (husillo, boquilla). Inspector con tabla de verificación. Tonos metálicos y grises.

### 19. `public/articles/google-business-profile-industrial.png`
**Artículo**: Google Business Profile: la herramienta gratuita que tu empresa ignora
**Prompt**: Pantalla de tablet mostrando un perfil de Google Business de una empresa industrial (mapa, reseñas, fotos de fábrica). Escritorio con calculadora y carpeta de negocios.

### 20. `public/articles/aditivos-uv-plasticos-exterior.png`
**Artículo**: Aditivos UV para plásticos de exterior: lo esencial
**Prompt**: Comparativa de dos piezas plásticas expuestas al sol: una degradada y amarillenta (sin protección UV), otra en perfecto estado (con aditivo UV). Exterior soleado, planta industrial de fondo.

### 21. `public/articles/rotomoldeo-ventajas-aplicaciones.png`
**Artículo**: Rotomoldeo: ventajas, limitaciones y aplicaciones industriales
**Prompt**: Horno de rotomoldeo abierto mostrando un molde grande girando. Productos rotomoldeados terminados al lado: tanques de agua, kayak, juegos infantiles. Nave industrial.

### 22. `public/articles/como-escribir-descripcion-empresa-b2b.png`
**Artículo**: Cómo escribir la descripción de tu empresa B2B para atraer clientes
**Prompt**: Persona escribiendo en laptop, pantalla mostrando un editor de texto con perfil de empresa. Al lado, brochures de empresas industriales. Oficina moderna con estantería industrial.

### 23. `public/articles/plastico-grado-alimenticio.png`
**Artículo**: Plástico grado alimenticio: regulaciones en México
**Prompt**: Envases plásticos de grado alimenticio (contenedores transparentes, botellas, charolas) junto a documentos de certificación y sello de aprobación sanitaria. Mesa de laboratorio.

### 24. `public/articles/termoformado-vs-inyeccion.png`
**Artículo**: Termoformado vs inyección: qué conviene para tu producto
**Prompt**: Dos mitades de imagen: izquierda muestra lámina termoformada con charolas, derecha muestra molde de inyección con piezas técnicas. División limpia. Ambiente de producción.

### 25. `public/articles/tendencias-plasticos-2026.png`
**Artículo**: Tendencias en plásticos para 2026 en México
**Prompt**: Collage industrial moderno: robot colaborativo junto a línea de extrusión, productos de plástico reciclado verde, panel solar sobre nave industrial. Aspecto futurista pero realista.

### 26. `public/articles/como-cotizar-un-molde-de-inyeccion.png`
**Artículo**: Cómo cotizar un molde de inyección sin sorpresas
**Prompt**: Molde de inyección de acero abierto sobre una mesa de taller metálica. Junto al molde, una cotización impresa con calculadora. Detalle de las cavidades del molde.

### 27. `public/articles/linkedin-para-ventas-b2b.png`
**Artículo**: LinkedIn para ventas B2B en el sector plástico
**Prompt**: Monitor mostrando un perfil profesional de LinkedIn con publicaciones sobre industria plástica. Detrás, fábrica desenfocada visible por la ventana de la oficina.

### 28. `public/articles/bolsas-biodegradables-vs-oxodegradables.png`
**Artículo**: Bolsas biodegradables vs oxodegradables: diferencias reales
**Prompt**: Dos tipos de bolsas plásticas lado a lado: una verde semi-transparente (biodegradable) y una convencional (oxodegradable). Al fondo, planta con hojas verdes sugiriendo sustentabilidad. Superficie de madera.

### 29. `public/articles/mantenimiento-preventivo-inyectora.png`
**Artículo**: Mantenimiento preventivo de una inyectora: checklist esencial
**Prompt**: Técnico de mantenimiento con overol y guantes inspeccionando el sistema hidráulico de una inyectora. Herramientas ordenadas en mesa auxiliar. Checklist en portapapeles.

### 30. `public/articles/dispersion-de-color-problemas.png`
**Artículo**: Dispersión de color en plásticos: problemas comunes y soluciones
**Prompt**: Piezas plásticas inyectadas mostrando defectos de color: rayas, puntos no dispersos, variación de tono. Junto a ellas, una pieza con dispersión perfecta y uniforme. Lupa de inspección.

### 31. `public/articles/packaging-sustentable.png`
**Artículo**: Packaging sustentable sin perder funcionalidad
**Prompt**: Empaques plásticos sustentables (charolas de rPET, bolsas compostables, envases de pared delgada) junto a productos frescos empacados. Estética limpia y verde. Mesa de presentación.

### 32. `public/articles/ferias-industriales-plasticos-2026.png`
**Artículo**: Ferias industriales de plásticos en México 2026
**Prompt**: Stand de exposición en feria industrial: maquinaria de plástico exhibida, banners, muestras de producto. Visitantes profesionales caminando por los pasillos. Centro de convenciones.

### 33. `public/articles/como-calcular-costo-pieza-inyectada.png`
**Artículo**: Cómo calcular el costo de una pieza inyectada
**Prompt**: Pieza plástica inyectada sobre una báscula de precisión. Al lado, calculadora, pellets de resina, y una hoja con cálculo de costos desglosado. Mesa de oficina de producción.

### 34. `public/articles/email-marketing-b2b-industrial.png`
**Artículo**: Email marketing B2B para el sector industrial: lo que sí funciona
**Prompt**: Pantalla de laptop mostrando un newsletter industrial con fotos de productos plásticos, métricas de apertura y clics. Taza de café al lado. Oficina industrial moderna.

### 35. `public/articles/pet-reciclado-rpet.png`
**Artículo**: PET reciclado (rPET): aplicaciones y oportunidades en México
**Prompt**: Botellas PET trituradas (flakes) en contenedor industrial, junto a productos terminados de rPET: fibra textil, envases transparentes, lámina. Ciclo de reciclaje visual.

### 36. `public/articles/soplado-de-envases-parametros.png`
**Artículo**: Soplado de envases: parámetros clave del proceso
**Prompt**: Máquina sopladora de botellas en operación. Preforma PET entrando al molde, botella terminada saliendo por el otro lado. Detalle del proceso con iluminación industrial.

### 37. `public/articles/pagina-web-empresa-industrial.png`
**Artículo**: La página web mínima viable para una empresa industrial
**Prompt**: Monitor de escritorio mostrando una página web industrial sencilla y profesional: logo, catálogo de productos plásticos, formulario de contacto. Diseño limpio y moderno.

### 38. `public/articles/polipropileno-usos-ventajas.png`
**Artículo**: Polipropileno: usos, ventajas y consideraciones de proceso
**Prompt**: Productos de polipropileno variados: contenedores transparentes, autopartes, fibras, tapas de botella. Pellets de PP en el centro. Disposición radial sobre fondo blanco.

### 39. `public/articles/cubetas-industriales-guia-compra.png`
**Artículo**: Cubetas industriales: guía de compra por capacidad y uso
**Prompt**: Cubetas de plástico de diferentes tamaños (5L, 10L, 19L, 20L) en fila, de distintos colores (blanco, azul, negro, rojo). Vista frontal con etiquetas de capacidad visibles. Almacén limpio.

### 40. `public/articles/nearshoring-oportunidades-plasticos.png`
**Artículo**: Nearshoring: oportunidades para la industria del plástico en México
**Prompt**: Vista aérea de un parque industrial moderno en México. Naves industriales con logos de empresas de plástico. Camiones de transporte en zona de carga. Paisaje semiárido mexicano.

### 41. `public/articles/colorimetria-basica-transformadores.png`
**Artículo**: Colorimetría básica para transformadores de plástico
**Prompt**: Espectrofotómetro portátil midiendo el color de una placa plástica. Pantalla del equipo mostrando valores L*a*b*. Placas de referencia de color en la mesa de laboratorio.

### 42. `public/articles/como-elegir-proveedor-bolsas.png`
**Artículo**: Cómo elegir un proveedor de bolsas plásticas
**Prompt**: Rollos de bolsas plásticas industriales (polietileno, transparentes y de color) en estantería de almacén. Un comprador revisando muestras de diferente calibre.

### 43. `public/articles/automatizacion-planta-plasticos.png`
**Artículo**: Automatización en planta de plásticos: por dónde empezar
**Prompt**: Brazo robótico retirando piezas plásticas de un molde de inyección abierto. Banda transportadora con piezas terminadas. Panel de control con pantalla HMI. Planta moderna.

### 44. `public/articles/redes-sociales-empresas-industriales.png`
**Artículo**: Redes sociales para empresas industriales: lo que vale la pena
**Prompt**: Smartphone con app de Instagram mostrando publicación de fábrica de plásticos. Junto al teléfono, productos plásticos fotografiados profesionalmente listos para publicar.

### 45. `public/articles/tuberia-pead-vs-pvc.png`
**Artículo**: Tubería PEAD vs PVC: cuándo usar cada material
**Prompt**: Tubería de PEAD negra (corrugada y lisa) junto a tubería de PVC blanca de distintos diámetros. Corte transversal mostrando espesor de pared. Zona de construcción/obra.

### 46. `public/articles/control-calidad-piezas-plasticas.png`
**Artículo**: Control de calidad en piezas plásticas: lo esencial
**Prompt**: Inspector de calidad usando calibrador vernier para medir una pieza plástica inyectada. Mesa de inspección con piezas aprobadas y rechazadas separadas. Laboratorio de QC.

### 47. `public/articles/economia-circular-plasticos.png`
**Artículo**: Economía circular en plásticos: de la teoría a la práctica
**Prompt**: Diagrama visual con objetos reales: producto plástico nuevo → uso → recolección → triturado → pellets reciclados → nuevo producto. Disposición circular sobre fondo verde claro.

### 48. `public/articles/catalogo-digital-empresa-plastica.png`
**Artículo**: Cómo crear un catálogo digital para tu empresa plástica
**Prompt**: Tablet mostrando un catálogo digital interactivo de productos plásticos con fotos profesionales, precios y especificaciones. Productos físicos al lado para comparar.

### 49. `public/articles/defectos-inyeccion-rechupe-rebaba.png`
**Artículo**: Defectos en inyección: rechupe, rebaba y líneas de unión
**Prompt**: Primer plano macro de tres piezas plásticas con defectos visibles: una con rechupe (hundimiento), otra con rebaba en la línea de partición, otra con línea de unión marcada. Fondo neutro.

### 50. `public/articles/materiales-barrera-envases.png`
**Artículo**: Materiales barrera en envases plásticos: EVOH, nylon y multicapa
**Prompt**: Corte transversal de envase multicapa mostrando las diferentes capas (PE, EVOH, nylon, tie layers). Junto al corte, envases terminados para alimentos. Laboratorio de packaging.

### 51. `public/articles/certificaciones-iso-industria-plastica.png`
**Artículo**: Certificaciones ISO para la industria plástica: cuáles importan
**Prompt**: Certificados ISO enmarcados en pared de oficina industrial. Al frente, mesa de junta con documentos de auditoría. Planta de producción visible por la ventana.

### 52. `public/articles/precios-resinas-plasticas.png`
**Artículo**: Precios de resinas plásticas: cómo se determinan y cómo negociar
**Prompt**: Sacos de resina plástica (25kg) apilados en tarima dentro de almacén. Etiquetas de precio y especificaciones visibles. Montacargas al fondo. Gráfica de precios en tablet.

### 53. `public/articles/maquila-inyeccion-plastico-mexico.png`
**Artículo**: Maquila de inyección de plástico en México: cómo encontrar el socio correcto
**Prompt**: Fila de inyectoras operando en planta de maquila. Operarios monitoreando producción. Cajas de producto terminado empacado listo para envío. Nave industrial grande y organizada.

### 54. `public/articles/sillas-plasticas-industriales.png`
**Artículo**: Sillas de plástico para negocio: guía de compra
**Prompt**: Sillas de plástico apilables de distintos colores (blanco, negro, rojo, azul) en exhibición. Contexto de restaurante, evento o negocio. Exterior con luz natural.

### 55. `public/articles/impresion-sobre-plastico-metodos.png`
**Artículo**: Impresión sobre plástico: serigrafía, tampografía, hot stamping e IML
**Prompt**: Cuatro productos plásticos con diferentes tipos de impresión: envase con serigrafía, cubeta con tampografía, tapa con hot stamping dorado, contenedor con etiqueta IML. Vista frontal comparativa.
