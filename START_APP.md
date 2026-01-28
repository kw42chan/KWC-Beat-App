# How to Start the App

## The Issue

Cursor can run commands, but there's an npm cache configuration issue preventing automatic package installation. This is a system-level npm configuration problem, not a Cursor limitation.

## Solution: Run Commands Manually

### Option 1: Use Terminal in Cursor

1. **Open Terminal in Cursor**: Press `` Ctrl+` `` (backtick) or go to Terminal → New Terminal

2. **Navigate to project**:
   ```bash
   cd "c:\Development Projects\New folder\KWC-Beat-App"
   ```

3. **Fix npm cache** (if needed):
   ```bash
   npm cache clean --force
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Start dev server**:
   ```bash
   npm run dev
   ```

### Option 2: Use External Terminal

1. Open PowerShell or Command Prompt
2. Navigate to the project folder
3. Run the commands above

### Option 3: Use VS Code Terminal

If Cursor's terminal has issues, you can:
1. Open the project in VS Code
2. Use VS Code's integrated terminal
3. Run `npm install` then `npm run dev`

## Why Cursor Can't Auto-Install

The error `cache mode is 'only-if-cached'` indicates npm is configured to only use cached packages and won't download new ones. This is likely due to:
- Network/firewall restrictions
- npm configuration file settings
- Corporate proxy settings

## Quick Check

To see if dependencies are already installed:
```bash
Test-Path "node_modules\vite"
```

If it returns `True`, you can skip `npm install` and just run:
```bash
npm run dev
```

## Expected Result

Once running, you should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

The browser should automatically open to `http://localhost:3000`
