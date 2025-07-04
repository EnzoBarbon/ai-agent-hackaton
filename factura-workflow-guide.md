# Factura Analysis Workflow

Este sistema proporciona un análisis completo e inteligente de facturas eléctricas mediante IA. El flujo de trabajo automatiza la extracción de texto, el análisis estructurado y responde preguntas específicas sobre el consumo y costos.

## 🏗️ Arquitectura del Sistema

### Componentes principales:

1. **Herramienta de Cálculo** (`calculation-tool.ts`)
   - Operaciones matemáticas básicas (suma, promedio, min, max, etc.)
   - Soporte para análisis de consumo y costos

2. **Agente de Análisis de Factura** (`factura-agente.ts`)
   - Extrae información estructurada de facturas eléctricas
   - Identifica datos del cliente, facturación y consumo
   - Convierte texto no estructurado en JSON estructurado

3. **Agente de Preguntas y Respuestas** (`factura-qa-agent.ts`)
   - Responde preguntas específicas sobre las facturas
   - Utiliza tanto datos estructurados como texto original
   - Incluye capacidad de cálculo para análisis complejos

4. **Flujo de Trabajo Completo** (`factura-analysis-workflow.ts`)
   - Orquesta todo el proceso de análisis
   - Maneja errores y proporciona retroalimentación detallada

## 🚀 Uso del Sistema

### Opción 1: Análisis Básico

Para extraer únicamente la información estructurada de una factura:

```bash
# Usando tsx directamente
tsx src/mastra/run-agents-cli/run-factura.ts ruta/a/tu/factura.pdf

# Usando npm script
npm run factura:analyze ruta/a/tu/factura.pdf
```

### Opción 2: Preguntas Personalizadas (Recomendado)

Para hacer preguntas específicas sobre la factura:

```bash
# Una pregunta
npm run factura:ask ruta/a/tu/factura.pdf "¿Cuál es mi IBAN?"

# Múltiples preguntas
npm run factura:ask ruta/a/tu/factura.pdf "¿Qué día consumí más?" "¿Cuánto pagué en impuestos?" "¿Cuál es mi consumo promedio?"

# Usando tsx directamente
tsx src/mastra/run-agents-cli/run-factura-ask.ts ./factura.pdf "¿Cuál es mi consumo promedio?"
```

### Opción 3: Análisis Completo con Preguntas Predefinidas

Para realizar el análisis completo incluyendo respuestas a preguntas predefinidas:

```bash
# Usando tsx directamente
tsx src/mastra/run-agents-cli/run-factura-workflow.ts ruta/a/tu/factura.pdf

# Usando npm script
npm run factura:workflow ruta/a/tu/factura.pdf
```

## ❓ Preguntas Predefinidas

El flujo de trabajo completo responde automáticamente estas preguntas:

1. ¿Qué día es el que más kWh he consumido?
2. ¿Qué mes tuve el mayor consumo promedio?
3. ¿Cuál es mi IBAN?
4. ¿Qué días de mayo consumí más de 5 kWh?
5. ¿Cuánto pagué en total por Derechos de acceso?
6. ¿En cuántos domicilios he vivido y cuántos días en cada uno?
7. Dime el consumo de todos los fines de semana de mayo
8. ¿Qué día es el que más kWh he consumido en horario Valle?
9. ¿Cuánto he pagado total en impuestos?

## 📊 Salida del Sistema

### Información Estructurada Extraída:

- **Cliente**: Nombre y dirección
- **Factura**: Número, fecha, período, tarifa, contrato, IBAN
- **Cargos**: Desglose detallado de todos los conceptos
- **Consumo**: Análisis diario, promedios, patrones

### Respuestas Inteligentes:

- Análisis de patrones de consumo
- Identificación de picos y valles
- Cálculos automáticos de totales y promedios
- Filtrado de datos por fechas y criterios específicos

### Archivo de Resultados:

El sistema genera automáticamente un archivo JSON con todos los resultados:

```
tu_factura_analysis_results.json
```

## 🔧 Configuración Requerida

1. **Variables de Entorno**:

   ```bash
   OPENROUTER_API_KEY=tu_api_key_aquí
   ```

2. **Dependencias**:
   - Node.js >= 20.9.0
   - Todas las dependencias se instalan con `npm install`

## 📋 Tipos de Archivo Soportados

- **PDF**: Extracción automática de texto
- **TXT**: Lectura directa (solo en análisis básico)

## ⚡ Ejemplos de Uso

```bash
# Hacer preguntas específicas (recomendado)
npm run factura:ask ./mi_factura_enero.pdf "¿Cuál es mi IBAN?" "¿Qué día consumí más kWh?"

# Analizar con preguntas predefinidas
npm run factura:workflow ./mi_factura_enero.pdf

# Solo extraer datos estructurados
npm run factura:analyze ./mi_factura_enero.pdf

# El sistema mostrará:
# 1. Extracción de texto del PDF
# 2. Análisis con IA para datos estructurados
# 3. Respuestas a las preguntas especificadas
# 4. Guardado de resultados en JSON
```

## 🔍 Capacidades de Análisis

El sistema puede:

- Identificar patrones de consumo estacionales
- Calcular promedios y totales automáticamente
- Filtrar datos por rangos de fechas
- Analizar consumo en horarios punta y valle
- Desglosar todos los conceptos de facturación
- Detectar cambios de domicilio
- Analizar consumo de fines de semana vs días laborables

## 🛠️ Personalización

### Preguntas Dinámicas

El sistema permite hacer cualquier pregunta sobre la factura usando el comando `factura:ask`. No necesitas modificar código, simplemente pasa las preguntas como argumentos.

### Preguntas Predefinidas

Si quieres modificar las preguntas predefinidas del flujo completo, edita el array `questions` en:

```typescript
src / mastra / run - agents - cli / run - factura - workflow.ts;
```

### Tipos de Preguntas Soportadas

El agente puede responder preguntas sobre:

- **Consumo**: patrones diarios, máximos, mínimos, promedios
- **Costos**: desglose de cargos, totales, impuestos
- **Fechas**: análisis por períodos específicos
- **Datos del cliente**: IBAN, dirección, información contractual
- **Análisis temporal**: fines de semana, meses específicos, horarios punta/valle

El agente utilizará automáticamente la herramienta de cálculo para responder preguntas que requieran operaciones matemáticas.
