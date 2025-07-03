1.Experto en informes de inteligencia
El objetivo es desarrollar un agente que actúa como un analista de ciberseguridad junior.
Debe leer informes de inteligencia de amenazas y extraer automática y únicamente los
Indicadores de Compromiso (IOCs). Los IOCs son las "huellas digitales" que los
ciberdelincuentes dejan tras de sí durante o después de un ataque.
Entrada
Análisis de la reciente campaña de espionaje atribuida al grupo APT "Silent Serpent". El
vector de entrada principal fue la explotación de la vulnerabilidad CVE-2024-30103 en
servidores de correo.
Una vez dentro, los actores desplegaron un malware dropper. El fichero,
'update_installer.dll', presenta el siguiente hash SHA256:
a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
La comunicación con el servidor de Comando y Control (C2) se estableció con los
siguientes dominios:

- system-update.ddns.net
- cdn.content-delivery.org
  Se observó tráfico de red hacia la dirección IP 185.22.15.6. El análisis de un segundo
  artefacto, 'connector.exe' (MD5: f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4), reveló conexiones
  adicionales a auth.internal-service.net y a la IP 8.8.4.4.
  Salida esperada
  El agente debe ser capaz de procesar un texto similar y devolver un listado estructurado en
  formato JSON de los IOCs encontrados, clasificados por tipo:
- Direcciones IP (IPv4)
- Dominios (p.e.: ejemplo.com, sub.dominio.net)
- Hashes de fichero (MD5, SHA1 o SHA256)
- Identificadores CVE – Common Vulnerabilities and Exposures (p.e.: CVE-2023-
  12345).
  La solución para el fichero de entrenamiento sería:
  {
  "ips": [
  "185.22.15.6",
  "8.8.4.4",
  "199.59.243.222",
  "45.137.21.53"
  ],
  "domains": [
  "system-update.ddns.net",
  "cdn.content-delivery.org",
  "auth.internal-service.net",
  "your-special-reward.com",
  "login.micr0soft.security-access.com"
  ],
  "hashes": [
  "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4",
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "9876543210fedcba9876543210fedcba"
  f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
  ],
  "cves": [
  "CVE-2024-30103",
  "CVE-2023-99999"
  ]
  }

# 2.Detector de hashes

El objetivo es desarrollar un agente especializado que analice informes técnicos y
clasifique con precisión cada hash de fichero que encuentre.
Entrada
**_ Notas de Análisis de Malware - 20250630 _**
Muestra 1: 'payload.dll'
El hash MD5 del fichero es d41d8cd98f00b204e9800998ecf8427e.
También hemos calculado el SHA-1: da39a3ee5e6b4b0d3255bfef95601890afd80709.
Muestra 2: 'installer.msi'
Este instalador es más complejo. El análisis de VirusTotal muestra un hash principal (SHA256) de e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.
Un analista apuntó este hash como SHA-1:
5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a.
Muestra 3: 'kernel_driver.sys'
Hash de alta entropía detectado, 128 caracteres de longitud:
cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5
d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e
El hash difuso (ssdeep) para comparar similitudes es: 3072:Z3z1y2xWv... (el resto no es
relevante para el análisis).
Muestra 4: Log de sistema
El log muestra una entrada truncada del hash del proceso: "firwall block for process with
hash 900150983cd24fb0d696...".
Salida esperada
El agente debe ser capaz de procesar un texto similar y devolver un listado estructurado en
formato JSON con dos claves:

- “valor”: el hash encontrado (string).
- “tipo”: la clasificación del hash (string).
  Tipos de Hash a Clasificar:
- MD5 (128 bits, 32 caracteres hexadecimales).
- SHA-1 (160 bits, 40 caracteres hexadecimales).
- SHA-256 (256 bits, 64 caracteres hexadecimales).
- SHA-512 (512 bits, 128 caracteres hexadecimales).
- ssdeep (Hash difuso/fuzzy, formato variable, ej: "192:abc:xyz").
- parcial_desconocido (Si el hash está claramente truncado o no encaja en ningún
  patrón conocido).
  La solución para el fichero de entrenamiento sería:
  [
  {
  "valor": "d41d8cd98f00b204e9800998ecf8427e",
  "tipo": "MD5"
  },
  {
  "valor": "da39a3ee5e6b4b0d3255bfef95601890afd80709",
  "tipo": "SHA-1"
  },
  {
  "valor":
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "tipo": "SHA-256"
  },
  {
  "valor": "5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a",
  "tipo": "SHA-1"
  },
  {
  "valor":
  "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f
  2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e",
  "tipo": "SHA-512"
  },
  {
  "valor": "3072:Z3z1y2xWv...",
  "tipo": "ssdeep"
  },
  {
  "valor": "900150983cd24fb0d696...",
  "tipo": "parcial_desconocido"
  }
  ]

# 3. Criptoanalista

El objetivo es desarrollar un agente especializado que debe descifrar una serie de mensajes
secretos. Sabemos que el texto original está en español y que se han usado diferentes
técnicas de cifrado clásico. La misión es recuperar el texto original en español.
Entrada
Cifrado César
Texto Cifrado: HO VRÑ EUÑOD HQ OD SODCD PDÑRU.
Sustitución Simple
Texto Cifrado: SQ YOSQ SFXLQETGXOQ RT SQ ZCQRSQ.
Vigenère
Texto Cifrado: ZI BIKLOÑG IOÑÁ ÁS ÁGÍS Á ZQG GIÑÁI.
Salida esperada
El agente debe ser capaz de procesar un texto similar y devolver el texto original en español:
La solución para el fichero de entrenamiento sería:
Cifrado César
Texto Cifrado: HO VRÑ EUÑOD HQ OD SODCD PDÑRU.
Texto Original: EL SOL BRILLA EN LA PLAZA MAYOR.
Sustitución Simple
Texto Cifrado: SQ YOSQ SFXLQETGXOQ RT SQ ZCQRSQ.
Texto Original: LA CITA SECRETA ES EL JUEVES.
Vigenère
Texto Cifrado: ZI BIKLOÑG IOÑÁ ÁS ÁGÍS Á ZQG GIÑÁI.
Texto Original: LA REUNION SERA EN DOS HORAS.
