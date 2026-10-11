# Draft: Diseña la exportación del reporte anual de ventas

`async-report-504` · es · 1218 words · ~406 s of speech (~8,5 min with pauses)

## Question

Tu sistema tiene que generar el reporte anual de ventas y entregárselo al usuario.
¿Cómo lo diseñas? Como en un proyecto real: primero algo simple que funcione, y lo
mejoramos cuando haga falta.

## How this video teaches

- **Progressive build, like sprints.** Every version is a working system you could ship.
  The video never announces a format ("en vivo", "por niveles", "nivel 1"): it just
  builds, and moves on with a natural question — "¿y qué pasa si la empresa crece?" —
  that brings in the next scenario.
- **One diagram that grows.** Every piece enters when the narration needs it, saying
  **what it does** and **why it is there**; arrows show **how the pieces talk**.
- **Each turn of the story:** a version that works → "¿qué pasa si…?" (a card with the
  new number) → what breaks and why → the improvement.
- If a piece can't be justified in one clause, it doesn't go in the diagram.

## Versions (internal map; never said as "niveles")

| Versión | Pregunta que la dispara | Diseño | Su límite |
| --- | --- | --- | --- |
| Simple | Empresa pequeña: 10 mil ventas, 5 usuarios | Frontend → backend (API REST) → base de datos, síncrono | Si tarda más que el timeout de lo que hay delante |
| Asíncrona | "¿Y si la empresa crece?" 50M ventas, tarda minutos | 202 + ID, cola, worker, S3 con enlace temporal, aviso | Si el worker falla: reintentos, cola de errores y worker idempotente |
| Robusta | "¿Y si el worker falla?" | Reintentos con espera creciente, DLQ, idempotencia | Muchos piden el mismo reporte a la vez (trabajo repetido, no tráfico) |
| Precalculada | "¿Y si 200 piden el mismo el lunes a las 9?" | Deduplicar + límite por usuario; un cron lo genera de noche y todos lo bajan de S3 | Si cada usuario tiene sus filtros, vuelves a la cola |
| Regla | "¿Cuándo basta lo simple?" | Síncrono si responde en 1–3 s y hay poco tráfico; asíncrono si supera el timeout o es impredecible | — |

## Scenes
1. **Diseña la exportación del reporte anual de ventas** (title) — Pregunta de entrevista: tu sistema tiene que generar el reporte anual de ventas y entregárselo al usuario. ¿Cómo lo diseñas? Como en un proyecto real: primero algo simple que funcione, y lo mejoramos cuando haga falta.
   _Visual:_ Tag "Pregunta de entrevista", título y subtítulo visibles desde el primer fotograma. Mientras habla aparecen tarjetas al ritmo de la voz: "Ventas" → "Reporte anual" → "Usuario" → "?", con flechas que se dibujan y un punto que recorre la fila.

### Versión simple

2. **10 mil ventas** (callout) — Empecemos con una empresa pequeña: diez mil ventas al año y cinco personas que usan el sistema.
   _Visual:_ Tarjeta "10 mil ventas · al año · 5 personas usan el sistema" (sonido de impacto).

3. **El frontend** (board) — Empecemos por lo mínimo. Primero, el frontend: la app web que corre en el navegador del usuario. Muestra las ventas y el botón de descargar. Pero el navegador no puede hablar directo con la base de datos: sería darle las llaves a cualquiera.
   _Visual:_ Diagrama vacío → aparece "Frontend" (app web, en el navegador); nota "Navegador → base de datos ✕".

4. **El backend** (board) — Por eso existe el backend: un servidor con la lógica, y el único con permiso para tocar la base de datos. El frontend le habla a través de su API REST: las rutas a las que le hace pedidos. Y la base de datos guarda las ventas.
   _Visual:_ Aparece "Backend" con subtítulo "API REST" (nota "Lógica + permisos"), luego "Base de datos" (nota "Guarda las ventas").

5. **Cómo se hablan** (board) — ¿Cómo se hablan? El usuario pulsa descargar y el frontend le hace una petición HTTP a la API. La API consulta la base, arma el archivo y lo devuelve en la respuesta. Pides y esperas en la misma conexión: eso es síncrono.
   _Visual:_ Paquetes Frontend → API "GET /reporte", API → base "consulta", base → API "ventas", API → Frontend "reporte.csv"; nota "Síncrono: pides y esperas".

6. **¿Hace falta más?** (board) — Con diez mil ventas, esto tarda un par de segundos. ¿Hace falta algo más? No. Cada pieza extra es algo más que mantener y que puede fallar. Esta versión funciona, y ya la puedes entregar. En una entrevista, empezar así es justo lo que buscan.
   _Visual:_ Vista completa de la versión simple, todo en verde; notas "Tarda segundos → *listo*", "Versión simple: *funciona y se entrega*".

### ¿Y si la empresa crece?

7. **50M ventas** (callout) — Pero, ¿qué pasa si la empresa crece? Cincuenta millones de ventas. Generar el reporte ya no tarda segundos: tarda minutos. ¿Aguanta este diseño?
   _Visual:_ "50M ventas · ¿Y si la empresa crece? El reporte tarda minutos" sobre el diagrama atenuado (sonido de reloj).

8. **Lo que tu diagrama no muestra** (board) — Para responder, mira algo que tu diagrama no muestra: entre el frontend y tu API casi siempre hay un intermediario. Tu hosting, Cloudflare o un nginx, que reciben el tráfico, ponen el HTTPS y se lo pasan a tu servidor. Se llama proxy.
   _Visual:_ Entre Frontend y API aparece de golpe "Proxy" (hosting · Cloudflare · nginx); zoom a él.

9. **Qué se rompe** (board) — Y un proxy no espera para siempre. Si la conexión pasa uno o dos minutos en silencio, la corta, para no quedarse atado a servidores colgados. Es como llamar a soporte y no decir nada: te cuelgan. Error 504: el proxy se cansó de esperar.
   _Visual:_ Paquete lento API → base; nota "nginx 60 s · AWS ALB 60 s", riser → proxy en rojo, paquete "504" de vuelta al frontend.

10. **¿Y si subo el timeout?** (board) — ¿Y subir el timeout? Podrías, pero tu servidor queda ocupado minutos con un solo pedido, el usuario mira un spinner, y si cierra la pestaña, se pierde todo el trabajo. El problema no es el número: es esperar en la misma conexión.
   _Visual:_ Foco en la API ocupada y el frontend esperando; nota "Más timeout = mismo problema" (caja registradora).

11. **La cuenta** (board) — Y hay una cuenta que lo empeora. Si piden un reporte por segundo y cada uno retiene una conexión cinco minutos, o sea trescientos segundos, tienes trescientos en curso a la vez. Tu API puede quedarse sin conexiones libres, y el resto de la aplicación se arrastra con ella.
   _Visual:_ Foco en la API; paquete "1 por s" Frontend → Proxy → API; notas "En curso = *pedidos/s × duración*" y "*1/s × 300 s* = 300 en curso" (caja registradora), API en ámbar; nota "Sin conexiones → *todo se arrastra*"; la cámara vuelve al sistema completo.

12. **Asíncrono** (board) — Cambiemos la idea. Como en un restaurante: te toman el pedido, te dan un número y te avisan cuando está listo. Eso es asíncrono. La API responde al instante con un 202, que significa recibido pero aún no listo, y un ID de trabajo: tu número de pedido.
   _Visual:_ Se va la flecha API → base; paquete API → Frontend "202 + jobId"; nota "202 = recibido, aún no listo".

13. **La cola** (board) — El pedido va a una cola: una lista de trabajos pendientes. ¿Por qué no hacerlo en segundo plano dentro de la API? Porque la cola guarda el pedido aunque tu servidor se reinicie, y si llegan muchos, esperan en fila en vez de tumbar la API.
   _Visual:_ Aparece la cola; paquete API → cola "jobId"; nota "Sobrevive a reinicios".

14. **El worker** (board) — Un worker es otro programa del backend: toma trabajos de la cola, lee las ventas de la base y genera el reporte. Así tu backend queda en dos partes: la API, libre para atender a todos, y el worker, que hace lo pesado a su ritmo. Ya da igual si tarda cinco minutos o una hora.
   _Visual:_ Aparece "Worker" con subtítulo "también backend"; cola → worker → base; worker "trabajando"; nota "Backend = API + worker".

15. **Dónde queda el archivo** (board) — El archivo pesa mucho, y la base de datos es para datos, no para archivos gigantes. Así que el worker lo guarda en S3, el almacenamiento de archivos de Amazon: barato, y hecho para descargas grandes.
   _Visual:_ Worker → S3 "reporte.csv"; nota "Archivos grandes → almacenamiento de objetos".

16. **Cómo te enteras** (board) — ¿Y cómo se entera el usuario? Lo más simple: el frontend pregunta cada pocos segundos si ya está, eso es polling. O el servidor se lo dice: con SSE, un canal de una sola vía, o con WebSocket, de ida y vuelta. Para esto, polling o SSE bastan.
   _Visual:_ Aviso → Frontend; nota "polling · SSE · WebSocket" (notificación).

17. **La descarga** (board) — Fíjate en ese enlace: no es el archivo, es un enlace temporal a S3. Antes de dártelo, la API comprueba que tengas permiso, y el enlace expira. El navegador descarga directo desde S3, sin pasar por tu servidor.
   _Visual:_ Notas "*Enlace temporal* a S3", "La API *comprueba permisos*", "El enlace *expira*"; paquete S3 → Frontend "reporte.csv" (frontend en verde); nota "El archivo *no pasa por tu API*".

18. **El flujo completo** (board) — Repasemos el flujo completo. El frontend pide, la API encola y responde al instante, el worker genera el archivo y lo guarda en S3, y el frontend se entera y lo descarga. Cada pieza hace una sola cosa, y ahora el reporte puede tardar lo que haga falta.
   _Visual:_ Vista del sistema completo; un paquete recorre Frontend → API → cola → worker → S3 → Frontend (la API comprueba permisos antes de dar el enlace).

### ¿Y si el worker falla?

19. **¿Y si falla?** (callout) — Y ahora, ¿qué pasa si el worker se cae a mitad del reporte, por un deploy o por falta de memoria?
   _Visual:_ "¿Y si falla? · el worker se cae a mitad del reporte" sobre el diagrama atenuado (sonido de impacto).

20. **Reintentos** (board) — Las colas suelen entregar al menos una vez: si un worker no confirma que terminó, el trabajo vuelve a la cola y otro lo reintenta. Y se reintenta con esperas cada vez mayores, para no martillar algo que ya está fallando.
   _Visual:_ Nota "Cola: entrega *al menos una vez*"; worker en error; paquete worker → cola "reintento" y de vuelta a otro worker "reintento"; nota "Reintentos con *espera creciente*" (reloj).

21. **Cola de errores** (board) — Pero si falla siempre, no puedes reintentar para siempre. Después de varios intentos, el trabajo pasa a una cola de errores, la dead letter queue, para que una persona lo revise sin frenar al resto.
   _Visual:_ Aparece la cola de errores (DLQ); worker en ámbar; paquete cola → DLQ "sin éxito"; notas "No se reintenta *para siempre*", "Cola de errores: *nada se pierde*", "Una persona *lo revisa*".

22. **Idempotente** (board) — Y como un trabajo puede ejecutarse dos veces, el worker debe ser idempotente: procesarlo dos veces da el mismo resultado, sin duplicar nada. Por ejemplo, el archivo se guarda siempre con el mismo nombre, así que la segunda vez lo sobrescribe.
   _Visual:_ Paquete cola → worker "job #8f2a" otra vez; notas "Puede llegar *2 veces*", "*Idempotente*: 2 veces = 1 resultado"; worker → S3 "reporte.csv"; nota "Mismo nombre → *se sobrescribe*".

### ¿Y si todos piden lo mismo?

23. **×200** (callout) — Ahora, ¿qué pasa si un lunes a las nueve, doscientas personas del equipo de ventas piden el mismo reporte?
   _Visual:_ "×200 · el mismo reporte, el lunes a las 9" sobre el diagrama atenuado.

24. **Su límite** (board) — Llegan doscientos pedidos y lo generas doscientas veces: el mismo trabajo pesado repetido, la cola crece y la base sufre. Y todo para doscientos archivos idénticos. No es un problema de tráfico: la API responde al instante. Es trabajo repetido.
   _Visual:_ Paquetes "×200" Frontend → API → cola; cola y base en rojo (alarma); notas "200 pedidos iguales = *200 × el trabajo*", "Mismo resultado: *¿para qué repetirlo?*", "No es tráfico: *es trabajo repetido*".

25. **Evitar trabajo repetido** (board) — Primero, deduplica. Guarda una clave por tipo de reporte y periodo, y si ya hay un trabajo en marcha, devuelve su ID en vez de encolar otro. Y limita cuántos reportes puede pedir cada usuario, para que nadie llene la cola de trabajo repetido.
   _Visual:_ Notas "*Deduplicar* pedidos iguales", "clave: *ventas-2025*"; paquete API → Frontend "mismo jobId"; notas "*1 trabajo* en vez de 200" y "Límite *por usuario*".

26. **Genéralo una vez** (board) — Y si el reporte es igual para todos, ni siquiera hace falta generarlo por pedido. Un cron, que es una tarea programada, lo prepara cada noche cuando casi nadie usa el sistema, y lo deja en S3. Todos lo descargan al instante, y nadie espera a que se genere.
   _Visual:_ Se oculta la cola, aparece el cron, cron → worker "00:00" → S3 → Frontend "descarga"; nota "1 vez para todos".

27. **Cuando cambia el reporte** (board) — Precalcular tiene un límite: si cada usuario filtra el reporte a su manera, no puedes tenerlos todos listos. Entonces vuelves a la cola, deduplicando por filtros, o mantienes tablas de resumen, para que el reporte vuelva a tardar segundos.
   _Visual:_ Notas "Precalcular *tiene un límite*", "Cada usuario, *sus filtros*" (paquete Frontend → API "filtros"); vuelve la cola ("Cola + *deduplicar por filtros*"); nota "Tablas de resumen: *segundos otra vez*".

28. **¿Cuándo basta lo simple?** (compare) — Ojo: nada de esto es obligatorio siempre. Si responde en uno o dos segundos y no lo piden muchos a la vez, quédate con lo síncrono: es más simple y tiene menos piezas que operar. Si supera el timeout, o no sabes cuánto va a tardar, asíncrono. En medio, depende del tráfico.
   _Visual:_ Dos paneles: "Síncrono basta" (responde en 1–3 s · pocos pedidos a la vez · menos piezas que operar) y "Asíncrono" (supera el timeout · duración impredecible · en medio: depende del tráfico).

29. **El camino** (summary) — Fíjate en el camino: empezamos simple, y cada pieza llegó cuando un problema real la pidió. Si tarda segundos, síncrono. Si tarda minutos, cola y worker. Si falla, reintentos e idempotencia. Si todos piden lo mismo, precalcúlalo. ¿Tú qué habrías hecho distinto?
   _Visual:_ Cuatro puntos: "Tarda segundos → *síncrono*", "Tarda minutos → *cola + worker*", "Falla → *reintentos + idempotencia*", "Todos piden lo mismo → *precalcular*" + "¿Tú qué habrías hecho distinto?".

30. **Antes de irte** (list, solo en videos largos de YouTube) — Déjame tu respuesta en los comentarios, y dime qué sistema quieres que diseñemos en el próximo video: un acortador de URLs, un chat, un sistema de pagos. Si te sirvió, un like y suscribirte ayudan muchísimo al canal. Nos vemos en el siguiente.
   _Visual:_ "Tu respuesta → *comentarios*", "Próximo video: *tú eliges el sistema*", "🔔 *Like* y *suscríbete* si te sirvió".

## Talking points (said, not shown)

- En una entrevista real te dan algo abierto (diseña la exportación de reportes) y tú mejoras el diseño según los requisitos que vas descubriendo: cuántos usuarios, cuántos datos, cuánto tarda, si el resultado es igual para todos. Decir en voz alta 'empiezo por lo simple y su límite es X' es exactamente lo que evalúan.
- Backend vs API: el backend es todo lo que corre en tu servidor (lógica, acceso a datos, workers); la API es su puerta, las rutas que expone al frontend. En la versión simple el backend es solo un servidor con su API, por eso suelen decirse como si fueran lo mismo. Con el worker, el backend ya son dos procesos: la API y el worker.
- Por qué el navegador no habla con la base: las credenciales quedarían en el código del cliente, cualquiera podría leer o borrar todo, y no tendrías dónde poner validaciones ni permisos por usuario.
- La versión simple también depende del tráfico (ley de Little): pedidos en curso = pedidos por segundo × duración. Con 10 pedidos/s que tardan 20 s tienes 200 pedidos ocupando conexiones e hilos a la vez, aunque ninguno llegue al timeout. Con 1 pedido por minuto de 20 s, casi nunca hay más de uno en curso.
- Lo más simple de verdad es una API REST y una base de datos, y no es mala práctica. Pero en producción casi siempre hay algo delante aunque no lo pongas tú: el router de tu hosting, Cloudflare, un nginx para HTTPS, el load balancer de tu nube. Todos tienen timeout: nginx (proxy_read_timeout 60 s por defecto, medido entre lecturas), un ALB de AWS (60 s de inactividad por defecto, configurable hasta 4000 s), API Gateway REST (29 s durante años; hoy ampliable en APIs regionales y privadas), Cloudflare (125 s, error 524).
- ¿Por qué no un hilo en segundo plano dentro de la API? Funciona para cosas pequeñas, pero si el proceso se reinicia (un deploy, un crash) el trabajo se pierde, y compite por CPU y memoria con las peticiones normales. La cola (SQS, RabbitMQ, Redis) persiste el pedido y desacopla la API del trabajo pesado.
- Cómo avisar: polling (GET /reportes/{jobId} cada pocos segundos; lo más simple y suele bastar), SSE (el servidor empuja eventos en un solo sentido sobre HTTP, con reconexión automática), WebSocket (bidireccional; excesivo solo para un aviso salvo que la app ya lo use) o email si el usuario ya se fue.
- S3 o cualquier almacenamiento de objetos (Google Cloud Storage, Azure Blob, Cloudflare R2). El frontend descarga con una URL prefirmada que expira, así el archivo no pasa por tu API.
- La versión con cola, robusta: deduplicar pedidos iguales con una clave de idempotencia (devuelve el jobId que ya existe), reintentos con backoff, dead letter queue para los trabajos que fallan siempre, timeout por trabajo y worker idempotente. El endpoint de estado devuelve pending, running, done o failed.
- Precalcular tiene límite: si cada usuario tiene sus propios filtros, no puedes precalcular todo; vuelves a la cola con deduplicación y caché por combinación de filtros, o mantienes agregados incrementales (vistas materializadas o tablas de resumen) para que el reporte vuelva a tardar segundos y a ser síncrono.
- Formato: un Excel admite como máximo 1.048.576 filas por hoja; para millones de filas, CSV o un reporte agregado.
- La cuenta de la conexión retenida (ley de Little): en curso = pedidos por segundo × duración. Con 1 pedido/s y 300 s son 300 conexiones abiertas a la vez; el límite real depende de tu servidor y de tu proxy, pero el patrón es siempre ese.
- El enlace de descarga es una URL prefirmada: la API comprueba el permiso antes de darla, expira en minutos y el navegador descarga directo de S3, así el archivo no ocupa ancho de banda ni conexiones de tu API.
- Una cola estándar (SQS, por ejemplo) entrega al menos una vez: si el worker no confirma, el mensaje reaparece; por eso el worker tiene que ser idempotente. Reintentos con espera creciente (backoff) y, tras N intentos (maxReceiveCount en SQS), el mensaje pasa a la cola de errores. Alarma sobre esa cola: si crece, algo falla.
- Idempotente no es "no repetir": es que repetir da el mismo estado final. Aquí, el mismo nombre de archivo (por tipo de reporte y periodo) hace que la segunda ejecución sobrescriba la primera.
- Los 200 pedidos iguales no son un problema de tráfico (la API responde al instante, es solo un 202): es trabajo repetido en el worker y en la base. La solución es deduplicar con una clave por tipo de reporte y periodo, y devolver el jobId existente.
- Límite por usuario: un rate limit (por ejemplo, N reportes por hora) responde 429 Too Many Requests, con la cabecera Retry-After si quieres decirle cuándo reintentar. Evita que un solo usuario o un bug llene la cola.
- Preguntas que suele hacer el entrevistador (el video ya responde las dos primeras): ¿qué pasa si el worker muere a mitad del trabajo?, ¿cómo limitas cuántos reportes pide un usuario?, ¿cuánto tiempo guardas los archivos generados?, ¿cómo te enteras de que algo está fallando (alarmas sobre la cola de errores y la antigüedad del trabajo más viejo)?
- Qué es un 202: aceptado para procesar, pero el procesamiento puede no haber terminado ni empezado, y puede fallar después (MDN, que remite a RFC 9110). Por eso la respuesta debe incluir el jobId o una URL para consultar el estado. Regla práctica sync/async: de 1 a 3 s, síncrono; entre unos segundos y el timeout, depende del tráfico y de lo predecible que sea la duración; si supera el timeout o es impredecible, asíncrono. Si el reporte es igual para todos, además del cron puedes servir el archivo desde un CDN.
