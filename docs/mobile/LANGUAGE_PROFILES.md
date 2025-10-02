# Language Stack Profiles Guide

## Overview

Language Stack Profiles allow ModusFabrica to focus on 1-3 related languages at a time, dramatically reducing storage requirements and improving performance. Instead of downloading all language servers upfront, profiles enable on-demand loading of only the languages you need.

## Why Language Profiles?

### Traditional Approach Problems
- **Large Download**: All LSPs = ~250MB
- **Storage Overhead**: Many unused language servers
- **Slow Startup**: Loading all extensions takes time
- **Memory Waste**: Multiple inactive language servers

### Profile-Based Solution
- **Smaller Downloads**: 70-80MB per profile (73% reduction)
- **Focused Experience**: Only languages you're actively using
- **Fast Context Switching**: Switch profiles as needed
- **Efficient Resource Usage**: Load/unload LSPs dynamically

## Available Profiles

### 1. Java Full Stack Profile

**Use Case**: Backend Java development with web frontend and database work

**Languages**:
- **Java** - jdtls (Eclipse JDT Language Server)
- **SQL** - sql-language-server
- **JavaScript** - TypeScript Language Server
- **HTML** - vscode-html-languageserver
- **CSS** - vscode-css-languageserver

**Total Size**: ~80MB

**Example Projects**:
- Spring Boot REST APIs
- Java web applications
- Microservices with SQL databases

### 2. .NET Full Stack Profile

**Use Case**: C# backend development with modern web frontend

**Languages**:
- **C#** - OmniSharp
- **SQL** - sql-language-server
- **TypeScript** - TypeScript Language Server
- **HTML** - vscode-html-languageserver
- **CSS** - vscode-css-languageserver

**Total Size**: ~85MB

**Example Projects**:
- ASP.NET Core APIs
- Blazor applications
- Entity Framework projects

### 3. Mobile Development Profile

**Use Case**: iOS and Android app development

**Languages**:
- **Swift** - sourcekit-lsp
- **Kotlin** - kotlin-language-server
- **Dart** - dart-language-server (Flutter)
- **Java** - jdtls (Android)
- **XML** - lemminx (Android layouts)

**Total Size**: ~75MB

**Example Projects**:
- iOS apps (Swift/SwiftUI)
- Android apps (Kotlin)
- Flutter cross-platform apps

## Using Profiles

### Selecting a Profile on First Launch

When you first open ModusFabrica, you'll be prompted to select a language profile:

```
Welcome to ModusFabrica!

Choose your language profile:

  1. Java Full Stack
     Backend Java, SQL, Frontend JS/HTML/CSS
     ~80MB download

  2. .NET Full Stack
     C#, SQL, TypeScript, HTML/CSS
     ~85MB download

  3. Mobile Development
     Swift, Kotlin, Dart, Java, XML
     ~75MB download

[Select Profile]  [I'll choose later]
```

### Switching Profiles

You can switch profiles anytime from the settings menu:

1. Tap **Settings** (gear icon)
2. Select **Language Profile**
3. Choose new profile
4. Confirm profile switch

**Profile Switch Progress**:
```
Switching to .NET Full Stack...

[████████░░░░░░░░░░░░] 40%

Downloading: C# Language Server (23/50 MB)
```

The switch includes:
1. **Download** - Fetch LSPs not yet installed (~30s-2min)
2. **Install** - Extract and configure LSPs (~10s)
3. **Configure** - Update session settings (~5s)
4. **Ready** - Profile active

### Profile Information

View active profile details:

```
Settings → Language Profile → Info

Active Profile: Java Full Stack

Languages:
  ✓ Java            (jdtls)           32 MB
  ✓ SQL             (sql-ls)          12 MB
  ✓ JavaScript      (tsserver)        20 MB
  ✓ HTML            (html-ls)         8 MB
  ✓ CSS             (css-ls)          8 MB

Total: 80 MB
Last updated: 2 days ago

[Switch Profile]  [Update Languages]
```

## Behind the Scenes

### Profile Definition

Profiles are defined in the backend (`mobile-protocol.ts`):

```typescript
export interface LanguageStackProfile {
  id: string;                     // 'java-fullstack'
  name: string;                   // 'Java Full Stack'
  description: string;
  languages: LanguageConfig[];
  estimatedSize: number;          // Total bytes
  icon: string;
}

export interface LanguageConfig {
  id: string;                     // 'java'
  name: string;                   // 'Java'
  extensions: string[];           // ['.java']
  lspServer: string;              // 'jdtls'
  treeSitterGrammar: string;      // 'tree-sitter-java'
  downloadUrl: string;
  size: number;                   // Bytes
}
```

### Profile Switching Process

```
1. User selects profile
   ↓
2. Client sends RPC: mobile/switchProfile
   ↓
3. Backend checks which LSPs are missing
   ↓
4. Backend downloads missing LSPs
   ↓
5. Backend sends progress notifications
   ↓
6. Backend updates session profile
   ↓
7. Backend sends completion notification
   ↓
8. Client updates UI
```

### RPC Protocol

**Switch Profile Request**:
```json
{
  "id": "1",
  "method": "mobile/switchProfile",
  "params": [{
    "profileId": "dotnet-fullstack",
    "sessionId": "session-123"
  }]
}
```

**Progress Notifications**:
```json
{
  "method": "mobile/profileSwitchProgress",
  "params": [{
    "profileId": "dotnet-fullstack",
    "stage": "downloading",
    "percentage": 45,
    "currentLanguage": "C#",
    "message": "Downloading OmniSharp (23/50 MB)"
  }]
}
```

**Completion**:
```json
{
  "method": "mobile/profileSwitchProgress",
  "params": [{
    "profileId": "dotnet-fullstack",
    "stage": "complete",
    "percentage": 100,
    "message": "Profile switch complete"
  }]
}
```

## Creating Custom Profiles

### Backend Configuration

**Step 1**: Define new profile in `mobile-protocol.ts`:

```typescript
export namespace LanguageProfiles {
  export const PYTHON_DATA_SCIENCE: LanguageStackProfile = {
    id: 'python-datascience',
    name: 'Python Data Science',
    description: 'Python, Jupyter, SQL for data analysis',
    languages: [
      {
        id: 'python',
        name: 'Python',
        extensions: ['.py'],
        lspServer: 'pyright',
        treeSitterGrammar: 'tree-sitter-python',
        downloadUrl: 'https://example.com/pyright.tar.gz',
        size: 45_000_000
      },
      {
        id: 'sql',
        name: 'SQL',
        extensions: ['.sql'],
        lspServer: 'sql-language-server',
        treeSitterGrammar: 'tree-sitter-sql',
        downloadUrl: 'https://example.com/sql-ls.tar.gz',
        size: 12_000_000
      }
    ],
    estimatedSize: 57_000_000,
    icon: 'python-icon'
  };

  export const ALL_PROFILES = [
    JAVA_FULL_STACK,
    DOTNET_FULL_STACK,
    MOBILE_DEV,
    PYTHON_DATA_SCIENCE  // Add new profile
  ];
}
```

**Step 2**: Register profile in `LanguageProfileManager`:

```typescript
@injectable()
export class LanguageProfileManager {
  getAvailableProfiles(): LanguageStackProfile[] {
    return LanguageProfiles.ALL_PROFILES;
  }

  async switchProfile(profileId: string, sessionId: string): Promise<void> {
    const profile = LanguageProfiles.ALL_PROFILES.find(p => p.id === profileId);
    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    // Download and configure LSPs
    for (const lang of profile.languages) {
      await this.downloadLanguageServer(lang);
    }

    // Update session
    await this.sessionManager.updateProfile(sessionId, profileId);
  }
}
```

### iOS UI Update

Add profile to selection screen (`ProfileSelectionView.kt`):

```kotlin
@Composable
fun ProfileSelectionView(
    profiles: List<LanguageStackProfile>,
    onProfileSelected: (String) -> Unit
) {
    LazyColumn {
        items(profiles) { profile ->
            ProfileCard(
                profile = profile,
                onClick = { onProfileSelected(profile.id) }
            )
        }
    }
}

@Composable
fun ProfileCard(profile: LanguageStackProfile, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp)
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(profile.name, style = MaterialTheme.typography.headlineSmall)
            Text(profile.description, style = MaterialTheme.typography.bodyMedium)

            Spacer(Modifier.height(8.dp))

            // Languages
            profile.languages.forEach { lang ->
                Row {
                    Icon(Icons.Default.Check, null)
                    Text(lang.name)
                }
            }

            Spacer(Modifier.height(8.dp))

            Text(
                "~${profile.estimatedSize / 1_000_000}MB download",
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}
```

## Performance Optimization

### Caching Downloaded LSPs

Language servers are downloaded once and cached locally:

**iOS Storage**:
```
~/Library/Application Support/ModusFabrica/lsp/
├── jdtls/
├── omni-sharp/
├── typescript-language-server/
└── ...
```

**Cache Management**:
- Downloaded LSPs persist across app launches
- Profile switches reuse cached LSPs (no re-download)
- Manually clear cache: Settings → Storage → Clear LSP Cache

### Background Downloads

LSPs download in background when switching profiles:

```kotlin
class ProfileManager {
    suspend fun switchProfile(profileId: String) = withContext(Dispatchers.IO) {
        val profile = getProfile(profileId)

        profile.languages.forEach { lang ->
            launch {
                downloadLanguageServer(lang) { progress ->
                    // Update UI with progress
                    _downloadProgress.emit(progress)
                }
            }
        }
    }
}
```

### Pre-fetching

For common profile switches, pre-fetch LSPs during idle time:

```kotlin
class ProfilePreloader {
    suspend fun preloadCommonProfiles() {
        if (isIdle() && hasWifi()) {
            // Pre-download popular profiles
            profiles.filter { it.id in commonProfiles }
                .forEach { profile ->
                    profile.languages.forEach { lang ->
                        if (!isCached(lang)) {
                            downloadLanguageServer(lang)
                        }
                    }
                }
        }
    }
}
```

## Troubleshooting

### Profile Download Fails

**Symptoms**:
- "Download failed" error during profile switch
- Progress stuck at specific percentage

**Solutions**:
1. Check network connection
2. Verify backend is running and accessible
3. Check available storage space
4. Retry download: Settings → Language Profile → Retry Failed Downloads

### LSP Not Working After Profile Switch

**Symptoms**:
- No completions in new language
- Diagnostics not showing

**Solutions**:
1. Verify LSP downloaded: Settings → Language Profile → Info
2. Check file extension matches language (e.g., `.cs` for C#)
3. Restart app
4. Clear LSP cache and re-download

### Storage Issues

**Symptoms**:
- "Not enough storage" during download

**Solutions**:
1. Free up space on device
2. Remove unused profiles: Settings → Storage → Manage Profiles
3. Use smaller profile (e.g., Mobile Dev instead of Java Full Stack)

### Slow Profile Switching

**Symptoms**:
- Profile switch takes >5 minutes

**Solutions**:
1. Switch to WiFi (instead of cellular)
2. Close other apps to free resources
3. Check backend logs for LSP download issues
4. Use cached profiles (avoid downloading new profiles on slow connections)

## Best Practices

### 1. Choose the Right Profile

Select the profile matching your current work:
- Working on Spring Boot app? → Java Full Stack
- Building ASP.NET API? → .NET Full Stack
- Developing iOS app? → Mobile Development

### 2. Pre-download Profiles

If you frequently switch between two profiles, pre-download both:

Settings → Language Profile → Manage → Pre-download:
- ✓ Java Full Stack (cached)
- ✓ .NET Full Stack (cached)
- ☐ Mobile Development

### 3. Update Profiles Regularly

Language servers receive updates. Update your profiles monthly:

Settings → Language Profile → Check for Updates

### 4. Use WiFi for Initial Setup

First-time profile download can be large (70-85MB). Use WiFi to avoid cellular data charges.

## Roadmap

### Phase 2 (Current - Q1 2026)
- [x] Profile type definitions
- [ ] Profile manager service
- [ ] On-demand LSP downloads
- [ ] Profile switching UI
- [ ] Progress tracking

### Phase 3 (Q2 2026)
- [ ] Custom profile builder (UI)
- [ ] Profile sharing (export/import)
- [ ] Automatic profile recommendations
- [ ] Machine learning based language detection

### Phase 4 (Q3 2026)
- [ ] Collaborative profiles (team sharing)
- [ ] Cloud-synced profiles
- [ ] Project-specific profiles
- [ ] Profile templates marketplace

## See Also

- [Architecture Overview](../architecture/OVERVIEW.md)
- [RPC Protocol](../api/RPC_PROTOCOL.md)
- [Backend Setup](BACKEND_SETUP.md)
