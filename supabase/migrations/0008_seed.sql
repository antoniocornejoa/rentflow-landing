-- ============================================================================
-- 0008 — Datos semilla: planes y contenido/tema por plantilla
-- Idempotente (on conflict do nothing / update). Precios en CLP entero.
-- ============================================================================

-- ── Planes comerciales (editables luego desde el panel) ──────────────────────
insert into public.planes (plan, nombre, precio, descripcion, features, orden) values
  ('basico', 'Básico', 29900, 'Landing profesional lista para captar clientes.',
   '["Landing con tu contenido","Botón de WhatsApp","Formulario de contacto","Reportes de leads"]'::jsonb, 1),
  ('pro', 'Pro', 69900, 'Todo lo del Básico más analítica y galería ampliada.',
   '["Todo lo del Básico","Galería y testimonios","Analítica de visitas","Reporte mensual por correo"]'::jsonb, 2),
  ('premium', 'Premium', 149000, 'Máxima presencia: catálogo/menú y soporte prioritario.',
   '["Todo lo del Pro","Catálogo o menú","Cotizador (inmobiliaria)","Soporte prioritario"]'::jsonb, 3)
on conflict (plan) do update
  set nombre = excluded.nombre,
      precio = excluded.precio,
      descripcion = excluded.descripcion,
      features = excluded.features,
      orden = excluded.orden;

-- ── Tema por defecto (aplica a las 4 plantillas al dar de alta) ──────────────
-- Colores neutros; el operador los ajusta por tenant en tenant_theme.
-- ── Contenido semilla mínimo VÁLIDO por plantilla (schema_version = 1) ───────
insert into public.plantilla_defaults (plantilla, content, theme) values
  (
    'servicios',
    $json${
      "schema_version": 1, "plantilla": "servicios", "locale": "es-CL",
      "orden": ["hero","confianza","servicios","galeria","testimonios","ubicacion","horarios","formulario"],
      "hero": {"titulo": "Tu negocio en Talca", "subtitulo": "Atención de calidad, cerca de ti.",
               "cta_primario": {"label": "Escríbenos por WhatsApp", "tipo": "whatsapp", "destino": "default"}},
      "servicios": {"variante": "tarjetas", "items": [{"nombre": "Servicio de ejemplo", "precio_desde": 10000}]},
      "whatsapp": {"numero": "+56900000000", "mensaje_prellenado": "Hola, quiero más información"},
      "seo": {"title": "Tu negocio en Talca", "description": "Servicios profesionales en Talca. Contáctanos por WhatsApp."},
      "formulario": {"campos": [{"nombre": "nombre", "etiqueta": "Nombre", "tipo": "texto", "requerido": true},
                                {"nombre": "telefono", "etiqueta": "Teléfono", "tipo": "telefono", "requerido": true}]}
    }$json$::jsonb,
    '{"colores": {"primary": "#0f766e", "bg": "#ffffff", "text": "#0f172a"}, "tipografia": {"heading": "Inter", "body": "Inter"}}'::jsonb
  ),
  (
    'gastronomia',
    $json${
      "schema_version": 1, "plantilla": "gastronomia", "locale": "es-CL",
      "orden": ["hero","menu","galeria","testimonios","ubicacion","horarios","formulario"],
      "hero": {"titulo": "Bienvenidos", "cta_primario": {"label": "Ver carta", "tipo": "ancla", "destino": "#menu"}},
      "menu": {"moneda": "CLP", "categorias": [{"nombre": "Categoría", "items": [{"nombre": "Plato de ejemplo", "precio": 5900}]}],
               "pedido_whatsapp": {"activo": true, "incluir_items": true, "mensaje_plantilla": "Hola, quiero pedir:"}},
      "whatsapp": {"numero": "+56900000000", "mensaje_prellenado": "Hola, quiero hacer un pedido"},
      "seo": {"title": "Restaurante en Talca", "description": "Cocina rica en Talca. Pide por WhatsApp."},
      "formulario": {"campos": [{"nombre": "nombre", "etiqueta": "Nombre", "tipo": "texto", "requerido": true}]}
    }$json$::jsonb,
    '{"colores": {"primary": "#b45309", "bg": "#fffdf7", "text": "#1c1917"}, "tipografia": {"heading": "Inter", "body": "Inter"}}'::jsonb
  ),
  (
    'inmobiliaria',
    $json${
      "schema_version": 1, "plantilla": "inmobiliaria", "locale": "es-CL",
      "orden": ["hero","confianza","tipologias","galeria","cotizador","ubicacion","form_corredora","formulario"],
      "hero": {"titulo": "Tu nuevo hogar en Talca", "cta_primario": {"label": "Cotizar", "tipo": "ancla", "destino": "#cotizador"}},
      "tipologias": {"items": [{"nombre": "Tipo A", "dormitorios": 2, "m2_utiles": 50, "precio_desde": 3000, "moneda": "UF", "disponibilidad": "disponible"}]},
      "cotizador": {"activo": true, "moneda": "UF", "pie_min_pct": 10, "tasa_anual": 4.5, "plazos_anios": [20,25,30],
                    "nota_legal": "Valores referenciales, no constituyen oferta."},
      "form_corredora": {"email_corredora": "ventas@ejemplo.cl", "asunto": "Nuevo interesado", "campos_extra": []},
      "whatsapp": {"numero": "+56900000000", "mensaje_prellenado": "Hola, me interesa el proyecto"},
      "seo": {"title": "Proyecto inmobiliario en Talca", "description": "Departamentos en Talca. Cotiza en línea."},
      "formulario": {"campos": [{"nombre": "nombre", "etiqueta": "Nombre", "tipo": "texto", "requerido": true},
                                {"nombre": "email", "etiqueta": "Email", "tipo": "email", "requerido": true}]}
    }$json$::jsonb,
    '{"colores": {"primary": "#1d4ed8", "bg": "#ffffff", "text": "#0f172a"}, "tipografia": {"heading": "Inter", "body": "Inter"}}'::jsonb
  ),
  (
    'retail',
    $json${
      "schema_version": 1, "plantilla": "retail", "locale": "es-CL",
      "orden": ["hero","confianza","catalogo","galeria","testimonios","ubicacion","horarios","formulario"],
      "hero": {"titulo": "Nuestra tienda", "cta_primario": {"label": "Ver catálogo", "tipo": "ancla", "destino": "#catalogo"}},
      "catalogo": {"moneda": "CLP", "mostrar_precios": true,
                   "consulta_whatsapp": {"activo": true, "incluir_producto": true, "mensaje_plantilla": "Hola, consulto por:"},
                   "categorias": [{"nombre": "Categoría", "items": [{"nombre": "Producto de ejemplo", "precio": 9990}]}]},
      "whatsapp": {"numero": "+56900000000", "mensaje_prellenado": "Hola, quiero consultar por un producto"},
      "seo": {"title": "Tienda en Talca", "description": "Productos y precios en Talca. Consulta por WhatsApp."},
      "formulario": {"campos": [{"nombre": "nombre", "etiqueta": "Nombre", "tipo": "texto", "requerido": true},
                                {"nombre": "telefono", "etiqueta": "Teléfono", "tipo": "telefono", "requerido": true}]}
    }$json$::jsonb,
    '{"colores": {"primary": "#7c3aed", "bg": "#ffffff", "text": "#0f172a"}, "tipografia": {"heading": "Inter", "body": "Inter"}}'::jsonb
  )
on conflict (plantilla) do update
  set content = excluded.content,
      theme = excluded.theme;
