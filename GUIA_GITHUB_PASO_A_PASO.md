# Guía: Subir OirConecta a GitHub (monorepo)

Sigue estos pasos **en orden**. Ejecuta los comandos en la **Terminal** (Mac) o **PowerShell** (Windows), **fuera de Cursor**, para evitar problemas de permisos con `.git`.

---

## Paso 0: Tener Git y cuenta de GitHub

- **Git:** `git --version` en la terminal.
- **GitHub:** Cuenta en [github.com](https://github.com). Verifica tu email.

---

## Paso 1: Crear el repositorio en GitHub

1. Entra a [github.com](https://github.com) → **"+"** → **"New repository"**.
2. **Repository name:** `oirconecta` (o el que quieras).
3. **Public.** **No** marques README, .gitignore ni license.
4. **Create repository**.
5. Copia la URL del repo, por ejemplo:
   - `https://github.com/TU_USUARIO/oirconecta.git`
   - o `git@github.com:TU_USUARIO/oirconecta.git` (SSH)

Guárdala para el Paso 5.

---

## Paso 2: Preparar la carpeta (quitar todos los `.git`)

Abre **Terminal** (o PowerShell) y ejecuta:

```bash
cd "/Users/rafaelparada/Desktop/Cursor OirConecta"
rm -rf .git oirconecta/.git backend/.git
```

Con esto:
- Se borra el repo de la raíz (estaba en mal estado).
- Se borran los repos de `oirconecta` y `backend`.

A partir de aquí habrá **un solo repo** en la raíz.

> Si da error de permisos, cierra Cursor, abre solo la Terminal y vuelve a ejecutarlo.

---

## Paso 3: Comprobar `.gitignore` en la raíz

En la raíz del proyecto ya hay un `.gitignore` que ignora:

- `node_modules/`, `.env`, `dist/`, `build/`, etc.
- Las carpetas `oirconecta/.git/` y `backend/.git/` (por si no se borraron).

No hace falta cambiar nada. Si más adelante añades carpetas o archivos que no deban subirse, puedes editarlo.

---

## Paso 4: Inicializar Git y primer commit

En la misma terminal:

```bash
cd "/Users/rafaelparada/Desktop/Cursor OirConecta"

git init
git branch -M main
git add .
git status
git commit -m "Monorepo inicial: frontend (oirconecta) + backend (API)"
```

- `git status` muestra qué se va a subir. Revisa que no aparezca `.env` ni `node_modules/`.
- Con el `commit` ya tienes un solo historial para todo el proyecto.

---

## Paso 5: Conectar con GitHub y subir

Sustituye `TU_USUARIO` por tu usuario de GitHub y `oirconecta` si usaste otro nombre de repo:

```bash
git remote add origin https://github.com/TU_USUARIO/oirconecta.git
git push -u origin main
```

- Si pide usuario y contraseña: la **contraseña** es un **Personal Access Token**, no la de tu cuenta. Crear en: GitHub → Settings → Developer settings → Personal access tokens.
- Si usas SSH: `git remote add origin git@github.com:TU_USUARIO/oirconecta.git` y luego `git push -u origin main`.

Después del `git push`, el código estará en GitHub.

---

## Paso 6: Comprobar

1. Refresca la página del repo en GitHub.
2. Deberías ver `oirconecta/`, `backend/`, `GUIA_GITHUB_PASO_A_PASO.md`, etc.

---

## Resumen: todos los comandos (copiar y pegar)

```bash
cd "/Users/rafaelparada/Desktop/Cursor OirConecta"
rm -rf .git oirconecta/.git backend/.git
git init
git branch -M main
git add .
git status
git commit -m "Monorepo inicial: frontend (oirconecta) + backend (API)"
git remote add origin https://github.com/TU_USUARIO/oirconecta.git
git push -u origin main
```

**Antes de ejecutar:** crea el repo vacío en GitHub (Paso 1) y cambia `TU_USUARIO` (y `oirconecta` si aplica) en la URL del `remote`.

---

## La próxima vez que cambies algo

```bash
cd "/Users/rafaelparada/Desktop/Cursor OirConecta"
git add .
git status
git commit -m "Breve descripción de los cambios"
git push
```
