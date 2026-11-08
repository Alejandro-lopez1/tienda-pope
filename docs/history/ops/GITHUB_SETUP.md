# Configuración de GitHub

## Estado Actual

El repositorio local está configurado con:
- ✅ Rama `master` - Especificaciones iniciales
- ✅ Rama `develop` - Base para desarrollo (3 commits)
- ✅ .gitignore configurado
- ✅ README.md documentado
- ✅ .env.example preparado

## Próximos Pasos: Push a GitHub

### Opción 1: Usar GitHub CLI (Recomendado)

```bash
# Instalar GitHub CLI si no lo tiene
# Windows: choco install gh
# O descargar desde https://cli.github.com/

# Autenticar con GitHub
gh auth login

# Crear repositorio en GitHub
gh repo create tienda-pope --source=. --remote=origin --push

# Esto hará:
# ✓ Crear repositorio en https://github.com/Alejandro-lopez1/tienda-pope
# ✓ Configurar origin remoto
# ✓ Hacer push de master y develop
```

### Opción 2: Manual con Git + Token

```bash
# Crear token en GitHub
# 1. Ir a https://github.com/settings/tokens
# 2. Click en "Generate new token"
# 3. Seleccionar scopes: repo, workflow
# 4. Copiar token

# Agregar remote
git remote add origin https://github.com/Alejandro-lopez1/tienda-pope.git

# Hacer push a master
git push -u origin master

# Hacer push a develop
git push -u origin develop

# Si pide autenticación:
# Usuario: Alejandro-lopez1
# Contraseña: <pegar token>
```

### Opción 3: SSH (Si ya tienes SSH key configurada)

```bash
# Agregar remote SSH
git remote add origin git@github.com:Alejandro-lopez1/tienda-pope.git

# Hacer push
git push -u origin master
git push -u origin develop
```

## Verificar que Funcionó

```bash
# Ver remotes configurados
git remote -v

# Debería mostrar:
# origin  https://github.com/Alejandro-lopez1/tienda-pope.git (fetch)
# origin  https://github.com/Alejandro-lopez1/tienda-pope.git (push)
```

## Configurar Ramas Protegidas (GitHub Web)

Una vez en GitHub, recomendamos:

1. **Proteger rama `master`:**
   - Ir a Settings → Branches → Branch protection rules
   - Agregar regla para `master`
   - Requerir pull request reviews antes de merge

2. **Configurar `develop` como rama por defecto (opcional):**
   - Ir a Settings → Default branch
   - Cambiar a `develop`

## Flujo Recomendado

```bash
# Crear feature branch desde develop
git checkout develop
git pull origin develop
git checkout -b feature/nombre-feature

# Trabajar, commitear, push
git push -u origin feature/nombre-feature

# En GitHub: crear Pull Request
# Revisar, aprobar, mergear a develop
# DELETE la feature branch después del merge

# Cuando develop está listo para producción:
# Crear PR de develop a master
# Revisar, mergear con message importante

# En local:
git checkout master
git pull origin master
```

## Comandos Útiles

```bash
# Ver remotes
git remote -v

# Agregar remote
git remote add origin <url>

# Cambiar URL de remote
git remote set-url origin <nueva-url>

# Hacer push de rama
git push -u origin develop

# Hacer push de todas las ramas
git push -u origin --all

# Ver ramas remotas
git branch -r

# Traer cambios del remote
git fetch origin
git pull origin develop
```

## Checkpoints de Progreso

- [ ] GitHub CLI instalado (o token generado)
- [ ] Repositorio creado en GitHub
- [ ] Ramas `master` y `develop` pusheadas
- [ ] .gitignore pusheado
- [ ] README.md visible en GitHub
- [ ] Branch `develop` como rama de trabajo

## Problemas Comunes

### "fatal: 'origin' does not appear to be a 'git' repository"

```bash
# Agregar origin correcto
git remote add origin https://github.com/Alejandro-lopez1/tienda-pope.git
git push -u origin master
git push -u origin develop
```

### "error: failed to push some refs to 'origin'"

```bash
# Hay conflictos, traer cambios primero
git fetch origin
git pull origin master
# Resolver conflictos si hay
git push origin master
```

### Authentication failed

```bash
# Usar token en lugar de contraseña
# En GitHub Settings → Developer settings → Personal access tokens
# Generar token con scopes: repo, workflow
# Usar token como contraseña
```

---

**Una vez completado el push a GitHub, la rama `develop` será la base para toda el trabajo futuro.**
