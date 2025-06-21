# DevOps w Paka Delivery App

## Architektura DevOps

Nasza architektura DevOps opiera się na następujących komponentach Azure:

1. **Azure Container Registry (ACR)** - przechowuje obrazy Docker naszej aplikacji
2. **Azure DevOps** - zarządza pipeline'ami CI/CD
3. **Azure Container Apps** - hostuje naszą aplikację w kontenerach
4. **Terraform** - zapewnia infrastrukturę jako kod (IaC)
5. **Azure Notification Hub** - obsługuje powiadomienia push dla kurierów

## Pipeline CI/CD

Pipeline CI/CD składa się z następujących etapów:

### 1. Build & Push
- Budowanie obrazu Docker z kodem źródłowym
- Publikowanie obrazu do Azure Container Registry
- Generowanie klienta Prisma
- Uruchamianie testów

### 2. Deployment
- Wdrażanie obrazu do Azure Container Apps
- Uruchamianie migracji bazy danych

### 3. Verification
- Sprawdzanie zdrowia aplikacji po wdrożeniu
- Automatyczne powiadamianie o statusie wdrożenia

## Infrastruktura jako kod (IaC)

Wszystkie zasoby są zarządzane przez Terraform:

- `main.tf` - konfiguracja dostawców i Azure Container Registry
- `container_app.tf` - konfiguracja Azure Container Apps
- `notification_hub.tf` - konfiguracja Azure Notification Hub
- `azure_devops.tf` - konfiguracja Azure DevOps (pipeline CI i połączenia serwisowe)
- `env_variables.tf` - zmienne środowiskowe dla aplikacji

## Jak korzystać

### Wymagania wstępne

1. **Azure DevOps PAT** - token dostępu osobistego z uprawnieniami do:
   - Build (Read & Execute)
   - Service Connections (Read & Query)
   - Code (Read & Write)

2. **GitHub PAT** - token dostępu osobistego z uprawnieniami do repozytorium

3. **Plik azure-pipelines.yml** - plik konfiguracyjny pipeline'u w głównym katalogu repozytorium

### Inicjalizacja infrastruktury

```bash
# Inicjalizacja Terraform
terraform init

# Zastosowanie konfiguracji
terraform apply -var-file="secrets.tfvars"
```

### Zmienne wymagane w secrets.tfvars

```hcl
# Zmienne Azure DevOps
azure_tenant_id      = "your-tenant-id"
azure_subscription_id = "your-subscription-id"
azure_devops_pat      = "your-azure-devops-pat"
github_pat           = "your-github-pat"
github_repo_id       = "your-username/your-repo"
azure_devops_user_id = "your-devops-user-id"

# Zmienne aplikacji
JWT_SECRET           = "your-jwt-secret"
ADMIN_LOGIN          = "admin"
ADMIN_PASSWORD       = "your-admin-password"
```

### Ręczna konfiguracja Azure DevOps

Ze względu na ograniczenia uprawnień, należy ręcznie skonfigurować:

1. **Azure Service Connection** - połączenie do subskrypcji Azure
   - W projekcie Azure DevOps: Project Settings > Service connections > New service connection
   - Wybierz Azure Resource Manager i skonfiguruj używając Workload Identity Federation
   - Ustaw nazwę połączenia na "Azure Subscription"

### Uruchomienie pipeline'u

Po skonfigurowaniu infrastruktury, pipeline CI/CD uruchamia się automatycznie po każdym push'u do repozytorium GitHub na branch `main`.

## Monitorowanie i zarządzanie

- **Monitoring aplikacji**: Azure Application Insights
- **Monitoring infrastruktury**: Azure Monitor
- **Zarządzanie sekretami**: Azure Key Vault

## Najlepsze praktyki DevOps

1. **Ciągła integracja (CI)** - każda zmiana kodu jest automatycznie budowana i testowana
2. **Ciągłe wdrażanie (CD)** - kod przechodzi automatycznie do środowisk produkcyjnych
3. **Infrastructure as Code (IaC)** - wszystkie zasoby infrastruktury są definiowane w kodzie
4. **Automatyczne testy** - testy jednostkowe i integracyjne uruchamiane przed wdrożeniem
5. **Monitorowanie i alarmowanie** - automatyczne wykrywanie problemów z aplikacją

## Diagram architektury

```
GitHub → Azure DevOps → Azure Container Registry → Azure Container Apps
   ↑                                                      ↓
   └──────────── Feedback and Monitoring ────────────────┘
```
