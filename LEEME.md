# Retro Green Salón · sitio web

Sitio de Retro Green Salón (Av. Emilio Caraffa 2086, Córdoba), publicado gratis con GitHub Pages
en **https://peluqueriagreen.com**, con un panel en `/admin` para que el dueño cambie fotos, horarios
y cualquier texto de la página sin tocar código.

- Cuenta de GitHub: `senxrgreep-hub` · repositorio: `pagweb-` (<https://github.com/senxrgreep-hub/pagweb->)
- Dominio: `peluqueriagreen.com` (registrado en DonWeb, vence el 18/09/2027)

## Qué hay en esta carpeta

| Archivo / carpeta | Para qué sirve |
|---|---|
| `index.html` | La página. |
| `datos/fotos.json` | Las 5 fotos principales (portada, secciones, arcade, afiches). |
| `datos/galeria.json` | Las fotos de la galería, con etiqueta, título y descripción. |
| `datos/secciones.json` | Qué partes se muestran, en qué orden, y las secciones nuevas. |
| `datos/contacto.json` | El WhatsApp, el Instagram y la dirección del salón. |
| `datos/horarios.json` | Los días y horarios. |
| `datos/textos.json` | Todos los textos de la página (títulos, servicios, dirección, WhatsApp, etc.). |
| `img/` | Imágenes del sitio. Lo que sube el dueño desde el panel va a `img/subidas/`. |
| `admin/` | El panel: `sveltia-cms.js` (el programa del panel), su configuración (`admin/config.yml`) y la vista previa (`vista.css`, `vista.js`, `mapa.js`). |
| `CNAME` | El dominio del sitio para GitHub Pages. |
| `.nojekyll` | Le indica a GitHub que publique los archivos tal cual. No borrarlo. |

Si los archivos de `datos/` no se pueden leer (por ejemplo, abriendo `index.html` desde un pendrive),
la página muestra las fotos, horarios y textos que tiene escritos adentro. Lo mismo pasa campo por
campo: si en el panel se deja un texto vacío, queda el que ya estaba.

---

## Paso 1 · Cuenta de GitHub ✔

Cuenta `senxrgreep-hub`. Recomendado: activar la verificación en dos pasos
(Settings → Password and authentication).

## Paso 2 · Crear el repositorio ✔

1. En GitHub: **+ → New repository** → nombre `pagweb-` → **Public** → sin README → **Create repository**.
   (GitHub Pages gratis necesita que el repositorio sea público. El panel igual está protegido.)
2. Si la cuenta es del dueño: **Settings → Collaborators → Add people** → agregar la cuenta de Martín.

## Paso 3 · Subir los archivos ✔

Opción fácil: en el repositorio, **uploading an existing file**, arrastrar **todo el contenido** de esta
carpeta (incluidas `admin`, `datos`, `img` y los archivos `CNAME` y `.nojekyll`) y tocar **Commit changes**.

## Paso 4 · Activar GitHub Pages ✔

1. **Settings → Pages** → *Source*: **Deploy from a branch** → rama **main**, carpeta **/ (root)** → **Save**.
2. En *Custom domain* escribir `peluqueriagreen.com` → **Save**.

## Paso 5 · Apuntar el dominio en DonWeb

En DonWeb: **Mis Dominios → peluqueriagreen.com → Nameservers y Zona DNS**.
Dejar los nameservers de DonWeb y, en la **zona DNS**:

1. Borrar los registros **A** y **AAAA** que ya existan para `@` (los de DonWeb) y el **CNAME** o **A** de `www`.
2. Crear estos:

   | Tipo | Nombre | Valor |
   |---|---|---|
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | AAAA | @ | 2606:50c0:8000::153 |
   | AAAA | @ | 2606:50c0:8001::153 |
   | AAAA | @ | 2606:50c0:8002::153 |
   | AAAA | @ | 2606:50c0:8003::153 |
   | CNAME | www | senxrgreep-hub.github.io |

3. Esperar (puede tardar de minutos a unas horas). Cuando GitHub muestre el tilde verde en
   **Settings → Pages**, marcar **Enforce HTTPS**. El candado es gratis: no hace falta comprar
   el certificado que ofrece DonWeb (por eso DonWeb muestra "Salud del sitio: vulnerable").

## Paso 6 · Activar "Iniciar sesión con GitHub" en el panel ✔

GitHub Pages no puede guardar claves secretas, así que el inicio de sesión pasa por un
intermediario gratuito en Cloudflare: el **Worker** de Sveltia CMS Authenticator.

Worker creado ✔: **https://sveltia-cms-auth.senxrgreep.workers.dev** (ya cargado en `admin/config.yml`).
Callback para la OAuth App: **https://sveltia-cms-auth.senxrgreep.workers.dev/callback**

### 6.1 · Crear el Worker en Cloudflare

1. Crear una cuenta gratis en <https://dash.cloudflare.com/sign-up> y confirmar el email.
   No hace falta pasar el dominio a Cloudflare.
2. Abrir <https://github.com/sveltia/sveltia-cms-auth> y tocar el botón **Deploy to Cloudflare**.
3. Seguir el asistente: conectar la cuenta de GitHub y la de Cloudflare cuando lo pida, dejar el
   nombre `sveltia-cms-auth` y tocar **Deploy**. (Si Cloudflare pide elegir un subdominio
   `workers.dev`, poner algo como `peluqueriagreen`.)
4. Al terminar, en **Workers & Pages → sveltia-cms-auth** aparece la dirección del Worker, del estilo
   `https://sveltia-cms-auth.peluqueriagreen.workers.dev`. Copiarla.

### 6.2 · Crear la OAuth App en GitHub

Con la cuenta `senxrgreep-hub`: **Settings → Developer settings → OAuth Apps → New OAuth App**

- *Application name*: `Panel Retro Green`
- *Homepage URL*: `https://peluqueriagreen.com`
- *Authorization callback URL*: `DIRECCIÓN_DEL_WORKER/callback`
  (por ejemplo `https://sveltia-cms-auth.peluqueriagreen.workers.dev/callback`)
- **Register application** → **Generate a new client secret**. Copiar el *Client ID* y el *Client secret*.

### 6.3 · Cargar las claves en el Worker

En Cloudflare: **Workers & Pages → sveltia-cms-auth → Settings → Variables and Secrets → Add**

| Nombre | Tipo | Valor |
|---|---|---|
| `GITHUB_CLIENT_ID` | Text | el Client ID |
| `GITHUB_CLIENT_SECRET` | **Secret** | el Client secret |
| `ALLOWED_DOMAINS` | Text | `peluqueriagreen.com, www.peluqueriagreen.com` |

Guardar con **Deploy**. El *Client secret* va **solo** acá: no se manda por chat ni por email.

### 6.4 · Poner la dirección del Worker en el panel

En `admin/config.yml`, reemplazar
`https://sveltia-cms-auth.SUBDOMINIO_CLOUDFLARE.workers.dev` por la dirección del Worker.

Solo pueden guardar cambios las cuentas con permiso de escritura en el repositorio
(el dueño y los colaboradores). Cualquier otra persona que entre a `/admin` no pasa del inicio de sesión.

### 6.5 · El programa del panel vive acá adentro

El panel es Sveltia CMS. Antes se bajaba de internet (`unpkg.com`) cada vez que se abría, y si esa
dirección no se podía alcanzar —pasa con algunos operadores de celular— la pantalla quedaba **en
negro, sin decir nada**. Ahora el archivo está guardado en `admin/sveltia-cms.js` y se usa el del
sitio; las copias de internet quedaron solo como respaldo, y si nada carga aparece un cartel que
explica qué pasó en vez de una pantalla vacía.

Para actualizarlo más adelante (no hace falta seguido), se baja la última versión y se reemplaza
ese archivo:

```bash
npm pack @sveltia/cms
tar xzf sveltia-cms-*.tgz
cp package/dist/sveltia-cms.js admin/sveltia-cms.js
```

Conviene cambiar también el número de versión de las dos copias de respaldo en `admin/index.html`,
y abrir el panel una vez para comprobar que entra bien antes de dar por buena la actualización.

---

## Cómo usa el panel el dueño

1. Entrar a <https://peluqueriagreen.com/admin/> (también está el enlace **Acceso dueño** al pie de la página).
2. **Iniciar sesión con GitHub**.
3. **Contenido del sitio** → elegir **Secciones de la página**, **Teléfono y ubicación**,
   **Fotos principales**, **Galería**, **Horarios** o **Textos de la página**.
4. Tocar una foto → **subir una nueva** desde el celular o la compu. El panel la achica y la pasa a WebP.
5. **Guardar**. En 1–2 minutos la web se actualiza sola.

Desde el celular se usa igual: los campos quedan arriba y la página, abajo, en la ventanita de la
vista previa.

En **Secciones de la página** está la lista de las partes de la página, en el orden en que se ven.
Ahí se hace todo:

- **Apagar una parte**: el interruptor. Desaparece de la web y también del menú y del pie. No se borra
  nada: el contenido queda guardado y vuelve cuando se prende de nuevo.
- **Cambiar el orden**: arrastrando de las rayitas.
- **Agregar una sección nueva**: **Agregar → Sección nueva**. Se le pone título, texto, las fotos que
  se quieran y, si hace falta, un botón. Hay dos formas: *texto a la izquierda con las fotos a la
  derecha*, o *todo centrado*. Queda con los mismos colores y la misma tipografía que el resto.

  Las fotos se cargan una por una con **Agregar**, se ordenan con las flechitas y se sacan con la ✕.
  Con una sola foto se ve grande, como siempre; con varias se acomodan en dos columnas, y si queda
  una impar al final ocupa el ancho entero para no dejar un hueco.

Si el archivo se rompe o queda con menos de tres partes, la página se muestra completa, como está
escrita en el HTML.

**La vista previa.** Mientras se edita se ve la página de verdad, ya puesta en la parte que se está
tocando: en la compu, en una columna a la derecha; en el celular, en una ventanita abajo.

- **Nunca tapa los campos.** El panel se achica exactamente lo que mide la ventanita, así que lo que
  se está escribiendo siempre queda a la vista, incluso con el teclado abierto.
- **Cambia mientras se escribe.** Al tocar un campo, la vista salta a ese texto y lo marca con un
  recuadro verde; lo que se escribe aparece al instante, antes de guardar. Si un campo se deja vacío,
  la vista muestra el texto que ya estaba, igual que va a quedar la página.
- **Parte por parte.** Arriba dice qué parte se está editando. Tocando ese nombre se abre la lista de
  todas las partes de la página, con las apagadas marcadas, para ir a cualquiera de un toque.
- **Prender y apagar se ve al toque.** En *Secciones de la página*, el interruptor prende y apaga la
  parte en la vista en el momento, sin guardar.
- **Fotos y listas.** Se ven después de guardar: el panel avisa y enciende el botón ⟳ para volver a
  cargar la página cuando esté publicada.
- **Se acomoda.** En el celular se arrastra la rayita de arriba (o se toca ⇕) para agrandarla o
  achicarla, y queda del tamaño elegido para la próxima vez. Se esconde con la ✕ y vuelve con
  “Ver la página”.
- **Aparece solo cuando hace falta.** En la pantalla de inicio de sesión no se muestra: ahí el panel
  usa toda la pantalla, para que los botones de entrar queden cómodos.

En **Textos de la página** están todos los textos, agrupados por sección (portada, servicios, historia,
ubicación, pie de página, etc.). Se tocan las flechitas para abrir cada grupo y se escribe encima.
Tres campos hacen algo más que cambiar el texto:

En **Teléfono y ubicación** están los datos de contacto, que cambian en toda la página a la vez:

| Campo | Qué cambia además | Cómo se escribe |
|---|---|---|
| *Número de WhatsApp* | Los 14 botones de reservar y consultar. | Con el código del país: `+54 9 11 5975-8218`. |
| *Usuario de Instagram* | Los enlaces al perfil de Instagram. | `@retrogreen_salonn`, o pegando el enlace del perfil. |
| *Dirección* y *Ciudad* | Los enlaces a Google Maps. | Como se escribe normalmente. |



Si un texto se deja vacío, la página usa el que ya tenía. El diseño, los colores y las secciones no se
tocan desde el panel: para eso hay que pedirle un cambio a Martín.

## Qué no se puede romper desde el panel

Probado con lo peor que se puede llegar a guardar:

| Si el dueño… | La página… |
|---|---|
| Borra todos los textos y las fotos | Muestra los que tiene escritos adentro. No queda nada en blanco. |
| Escribe código HTML o `<script>` | Lo muestra como texto. No se ejecuta nada. |
| Escribe un texto larguísimo o una palabra sin espacios | La corta en varias líneas. No se descuadra ni en el celular. |
| Escribe el WhatsApp sin el código del país | Avisa al guardar; si igual queda mal, los botones siguen con el número anterior. |
| Pega el enlace completo de Instagram | Saca el usuario solo y arma bien el enlace. |
| Borra todas las fotos de la galería o todos los horarios | Vuelve a mostrar los que tenía. |
| Carga 9 fotos en la galería o 6 filas de horarios | Las acomoda igual, sin huecos. |
| Sube una foto que no existe o la borra del repositorio | Deja el hueco de esa foto, el resto sigue funcionando. |

El enlace del crédito del pie (el WhatsApp de Martín) no se toca desde el panel.

Cada cambio queda en el historial del repositorio, así que cualquier error se puede deshacer.

## Probar el panel en la compu (opcional)

Con Chrome o Edge, desde esta carpeta:

```bash
python -m http.server 8000
```

Abrir <http://localhost:8000/admin/> → **Trabajar con un repositorio local** → elegir esta carpeta.
Los cambios se guardan directamente en los archivos de `datos/` e `img/subidas/`.
