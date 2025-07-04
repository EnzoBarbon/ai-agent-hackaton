# 📄 Sistema de Análisis Inteligente de Facturas Eléctricas

Analiza facturas eléctricas con IA y responde preguntas específicas sobre consumo, costos y patrones de uso.

## 🚀 Uso Rápido

### Hacer Preguntas Personalizadas (Recomendado)

```bash
# Una pregunta
npm run factura:ask ./mi_factura.pdf "¿Cuál es mi IBAN?"

# Múltiples preguntas
npm run factura:ask ./mi_factura.pdf "¿Qué día consumí más?" "¿Cuánto pagué en impuestos?" "¿Cuál es mi consumo promedio?"
```

### Otros Comandos Disponibles

```bash
# Análisis con preguntas predefinidas
npm run factura:workflow ./mi_factura.pdf

# Solo extracción de datos estructurados
npm run factura:analyze ./mi_factura.pdf
```

## ❓ Ejemplos de Preguntas

**Consumo:**

- "¿Qué día es el que más kWh he consumido?"
- "¿Cuál es mi consumo promedio diario?"
- "¿Qué días de mayo consumí más de 5 kWh?"
- "Dime el consumo de todos los fines de semana de mayo"

**Costos:**

- "¿Cuánto pagué en total por Derechos de acceso?"
- "¿Cuánto he pagado total en impuestos?"
- "¿Cuál es el desglose completo de cargos?"

**Información del Cliente:**

- "¿Cuál es mi IBAN?"
- "¿En cuántos domicilios he vivido y cuántos días en cada uno?"

**Análisis Temporal:**

- "¿Qué mes tuve el mayor consumo promedio?"
- "¿Qué día es el que más kWh he consumido en horario Valle?"

## 📊 Salida del Sistema

- **Análisis estructurado**: Datos del cliente, factura, consumo y costos
- **Respuestas inteligentes**: Análisis específico según tus preguntas
- **Archivo JSON**: Resultados guardados automáticamente

## ⚙️ Configuración

1. Instalar dependencias: `npm install`
2. Configurar API key: `OPENROUTER_API_KEY=tu_api_key` en `.env`
3. ¡Usar cualquier PDF de factura eléctrica!

## 🔧 Componentes

- **Extracción inteligente**: Convierte PDF → datos estructurados
- **Agente Q&A**: Responde preguntas usando IA + herramientas de cálculo
- **Workflow flexible**: Acepta cualquier pregunta como entrada

---

Ver documentación completa en: `factura-workflow-guide.md`
