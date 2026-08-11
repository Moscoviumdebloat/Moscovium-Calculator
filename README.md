# Moscovium Calculator

A compact Material calculator that follows the operating system's light or dark theme. It includes standard, scientific, graphing, programmer, date, currency, and unit-conversion modes.

## Downloads built by GitHub Actions

The `Build native apps` workflow produces:

- Windows x64 installer (`.exe`)
- Windows x64 portable archive (`.zip`)
- macOS Intel and Apple Silicon disk images (`.dmg`) and archives (`.zip`)
- Linux x64 AppImage, RPM, and DEB packages
- Android installable debug APK

Run the workflow manually from the Actions tab, or push a tag such as `v2.2.0`.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run desktop:start
```

Build the Windows installer and portable ZIP locally:

```bash
npm run desktop:package
```

Sync the calculator into the native Android project, then open it in Android Studio:

```bash
npm run android:open
```

## License

[MIT](LICENSE)
