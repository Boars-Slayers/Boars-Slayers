# 🔍 Diagnóstico de APIs de Age of Empires 2

**Fecha:** 2026-01-28
**Estado:** ❌ Crítico - Ninguna API está funcionando correctamente

---

## ❌ Problemas Identificados

### 1. **aoe2.net - DESCONTINUADADO**
- **Estado:** ❌ OFFLINE (Cerrado oficialmente)
- **Mensaje oficial:** "aoe2.net has been sunset. The website, including the API, is no longer functional."
- **Impacto:** API principal que usaba la mayoría de la comunidad ya no existe

### 2. **aoe2companion.com**
- **Estado:** ⚠️ Limitado
- **Endpoint probado:** `https://data.aoe2companion.com/api/profiles?search={steamId}`
- **Problema:** NO acepta Steam ID directamente, solo nombres de usuario
- **Respuesta actual:** `{"profiles":[]}`
- **Necesita:** Convertir Steam ID a nombre de usuario primero

### 3. **AoE Insights** 
- **Estado:** ✅ Funcional (con scraping)
- **Edge Function:** Ya implementada en `supabase/functions/proxy-match-history`
- **Problema:** Requiere web scraping, es frágil ante cambios en el HTML

### 4. **World's Edge Link API**
- **Estado:** ⚠️ Requiere parámetros específicos
- **Endpoint:** `https://aoe-api.worldsedgelink.com/community/leaderboard/getLeaderBoard2`
- **Problema:** Error 400 - Requiere parámetro `title` y formato específico

---

## ✅ Soluciones Propuestas

### **Opción A: Usar World's Edge API (OFICIAL)**
- **Ventaja:** API oficial de Microsoft
- **Requiere:** 
  - Investigar parámetros correctos
  - Convertir Steam ID a Profile ID correcto
  - Agregar API key si es necesario

### **Opción B: Usar aoe2.de API**
- **Endpoint:** Investigar si existe alternativa community-driven
- **Estado:** Por verificar

### **Opción C: Hybrid Approach (RECOMENDADO)**
1. **Para estadísticas de leaderboard:** Usar API oficial de World's Edge
2. **Para match history:** Continuar usando scraping de AoE Insights  
3. **Para datos de civilizaciones:** Usar APIs estáticas (aoe2techtree)

### **Opción D: Steam Web API**
- **Endpoint:** `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`
- **Requiere:** Steam API Key
- **Datos disponibles:** Horas jugadas, información del perfil
- **Limitación:** No ofrece stats específicos de AoE2, solo datos generales de Steam

---

## 🎯 Plan de Acción Inmediato

1. **Investigar World's Edge API correctamente** ✅ Próxima tarea
2. **Implementar fallback con múltiples fuentes**
3. **Agregar cache en Supabase para reducir llamadas a APIs**
4. **Actualizar Edge Function para soportar múltiples endpoints**

---

## 📊 APIs Alternativas por Funcionalidad

| Funcionalidad | API Disponible | Estado | Notas |
|--------------|---------------|--------|-------|
| Ranking/ELO | World's Edge | ⚠️ Por configurar | API oficial |
| Match History | AoE Insights | ✅ Scraping | Frágil |
| Player Search | aoe2companion | ⚠️ Solo por nombre | Limitado |
| Horas jugadas | Steam API | ✅ Disponible | Requiere API key |
| Civs/Units | aoe2techtree | ✅ Estático | No requiere auth |

---

## 🔗 Enlaces Útiles
- [aoestats.io](https://aoestats.io/) - Estadísticas de civilizaciones
- [aoe2techtree](https://github.com/aoe2techtree) - Datos estáticos
- [Steam API Docs](https://steamcommunity.com/dev)
