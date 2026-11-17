# Antseed — lo que **tú** haces (después del setup en VPS)

El gateway ya corre en **vps-brahma** (`127.0.0.1:8379`, buyer `8377`). Seller RootRouter sigue aparte.

## 1. Reclamar la consola (obligatorio, ~5 min)

En **tu Mac**, abre un túnel y el link de setup (el link caduca en 1 hora; si expira, en el VPS: `antseed gateway console-link`):

```bash
ssh -N -L 8379:127.0.0.1:8379 vps-brahma
```

En el navegador (misma Mac):

1. Pega el link de **setup** que te pasemos (formato `http://localhost:8379/console/setup#…`).
2. **Create a passkey** o **Sign in with wallet** — tú quedas como owner.
3. No compartas ese link; es de un solo uso.

## 2. Fondos (para modelos de pago y puntos)

En la consola → **Wallet & Funding** → **Add funds** (tarjeta o USDC en Base al wallet del workspace).

- Sin saldo, los modelos de pago fallan con `402 insufficient_deposits`.
- Los **puntos** solo cuentan en uso **de pago** con provider con **boost > 0**.

## 3. Rewards wallet (puntos → ANTS)

En la consola → **Rewards** (o workspace operator):

- **Authorized wallet** = la que conectas en [antseedpoints.com](https://antseedpoints.com) (p. ej. `0x59c6…0dbc`).

## 4. Crear API key

Consola → **Keys** → Create key → copia `antseed_…` (solo se muestra una vez).

O en el VPS:

```bash
antseed gateway key create --label "cursor-rewards"
```

## 5. Usar el gateway (no el relayer solo)

Para que valga el routing por boost, tus herramientas deben apuntar al gateway:

```bash
export OPENAI_BASE_URL=http://localhost:8379/v1   # con túnel SSH activo
export OPENAI_API_KEY="antseed_…"
```

O en Cursor/agent: misma base URL + bearer key.

## 6. Aprobar routing por boost (rewards-skill)

Cuando te mostremos una tabla **Provider | precio | boost** por modelo, responde **sí** por modelo. Entonces aplicamos:

`antseed gateway routing set --merge --file …`

(Sin tu sí no se cambia la policy.)

## 7. Provider RootRouter (aparte)

Stake ANTS / lANTS en agent **1165698** cuando tengas tokens o whitelist — sube vuestro boost en antseedpoints.

---

**Reiniciar gateway tras reboot VPS:**

```bash
bash ~/RootRouter/scripts/antseed-gateway-restart.sh
```

**Skills oficiales:** [antseed.com/skill.md](https://antseed.com/skill.md) · [rewards-skill.md](https://antseedpoints.com/rewards-skill.md)