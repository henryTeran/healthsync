# ✅ CHECKLIST PRE-PRODUCTION & RECOMMANDATIONS

**Audit**: Audit Complet Sécurité & Optimisation  
**Status**: ✅ COMPLÉTÉ  
**Next**: Déploiement & monitoring  

---

## 🧪 PRE-DEPLOYMENT TESTING CHECKLIST

Avant de pusher en production, exécuter cette checklist:

### Functional Testing
- [ ] **Authentication Flow**
  ```bash
  1. Logout
  2. Test login patients
  3. Test login doctors
  4. Test password reset
  5. Verify token storage
  ```

- [ ] **Appointments Module**
  ```bash
  1. Create new appointment
  2. Edit existing
  3. Cancel appointment
  4. Verify calendar display (react-big-calendar + moment)
  ```

- [ ] **Medications & Prescriptions**
  ```bash
  1. Create prescription
  2. Generate PDF (PrescriptionForm.jsx - jsPDF usage)
  3. Download PDF locally
  4. Open PDF in browser - verify no XSS errors
  5. Send to patient
  6. Patient receives & validates
  ```

- [ ] **Routing**
  ```bash
  1. All menu items clickable
  2. Deep links work (copy URL, paste in new tab)
  3. Back/forward buttons work
  4. No 404s
  5. Verify react-router-dom 7.12.0+ routes work
  ```

- [ ] **Charts & Data Visualization**
  ```bash
  1. SymptomChartPage loads
  2. Chart.js + react-chartjs-2 render correctly
  3. Date filters work
  4. No console errors
  ```

- [ ] **Email Notifications**
  ```bash
  1. Test emailjs-com integration
  2. Verify VITE_EMAILJS_* env variables set
  3. Send test email
  4. Check it arrives
  ```

### Performance Testing
- [ ] **Build Size**
  ```bash
  npm run build
  # Expected: ~1.3 MB total (was 2.8 MB before)
  # Check dist/ folder size
  ls -lh dist/
  ```

- [ ] **Lighthouse Score**
  ```bash
  1. npm run build
  2. npx serve dist/ -l 3000
  3. Open Chrome DevTools > Lighthouse
  4. Target: >= 85 for each metric
  ```

- [ ] **Load Time**
  ```bash
  1. Open browser DevTools > Network
  2. Hard refresh (Ctrl+Shift+R)
  3. Check:
     - FCP (First Contentful Paint)
     - LCP (Largest Contentful Paint)
     - CLS (Cumulative Layout Shift)
  ```

### Security Testing
- [ ] **Vulnerability Check**
  ```bash
  npm audit
  # Expected: 0 vulnerabilities
  ```

- [ ] **CSP Headers** (if applicable)
  ```
  Content-Security-Policy
  Default-src 'self'
  Script-src 'self' https://cdn.sentry-cdn.com
  Style-src 'self' 'unsafe-inline'
  Img-src 'self' data: https:
  Font-src 'self' https://fonts.googleapis.com
  ```

- [ ] **Firebase Security**
  ```
  1. Verify firestore.rules deployed
  2. Verify storage.rules deployed
  3. Check rules for authorization
  4. Test: non-auth users can't access
  5. Test: doctors can't see other doctor's patients
  ```

- [ ] **PDF Security** ⭐
  ```bash
  1. Generate prescription PDF
  2. Extract content - verify no malicious JS
  3. Open in Acrobat Reader
  4. Open in browser PDF viewer
  5. Verify DOMPurify sanitization working
  ```

### Browser Compatibility
- [ ] **Chrome (Latest)**
- [ ] **Firefox (Latest)**
- [ ] **Safari (Latest)**
- [ ] **Edge (Latest)**
- [ ] **Mobile Chrome**
- [ ] **Mobile Safari**

### Device Testing
- [ ] **Desktop** (1920x1080)
- [ ] **Laptop** (1366x768)
- [ ] **Tablet** (iPad, 768x1024)
- [ ] **Mobile** (iPhone, 375x667)

### Accessibility Testing
- [ ] **Keyboard Navigation** (Tab through all UI)
- [ ] **Screen Reader** (NVDA/JAWS on Windows)
- [ ] **Color Contrast** (WCAG AA minimum)
- [ ] **Focus Indicators** (visible on all interactive elements)

---

## 🚀 DEPLOYMENT STEPS

### 1. Pre-Deployment
```bash
# Ensure all changes committed
git status  # Should be clean

# Pull latest main
git pull origin main

# Run full test suite
npm run test:ci
npm run build
npm run lint
npm audit
```

### 2. Build Optimization (Optional but Recommended)
```bash
# Add vite.config.js optimizations
vim vite.config.js

# Add manual chunking:
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        'charts': ['chart.js', 'react-chartjs-2']
      }
    }
  }
}

npm run build  # Re-test build
```

### 3. Environment Variables Check
```bash
# Verify all VITE_* variables are set in .env.production:
VITE_FIREBASE_APIKEY=xxx
VITE_FIREBASE_AUTHDOMAIN=xxx
VITE_SENTRY_DSN=xxx
VITE_EMAILJS_SERVICE_ID=xxx
VITE_EMAILJS_TEMPLATE_ID=xxx
VITE_EMAILJS_PUBLIC_KEY=xxx
```

### 4. Firebase Deployment
```bash
# Deploy functions + rules + hosting
firebase deploy --only functions:*,firestore:rules,storage:rules,hosting

# Verify deployment
firebase console
# Check: Functions deployed, Rules updated
```

### 5. Hosting Deployment
```bash
# Vercel / Netlify / AWS / GCP
# Choose your hosting provider and deploy

# Example (Vercel):
vercel deploy --prod

# Example (Netlify):
netlify deploy --prod --dir=dist
```

---

## 📊 POST-DEPLOYMENT MONITORING

### Immediate (Hour 1)
- [ ] Check error logs in Sentry
- [ ] Monitor Firebase console for errors
- [ ] Test critical flows again
- [ ] Check performance metrics

### Daily (First Week)
- [ ] Review Sentry issues dashboard
- [ ] Monitor error rates
- [ ] Check bundle load times
- [ ] Review user feedback

### Weekly (First Month)
- [ ] Analyze Lighthouse scores
- [ ] Check Core Web Vitals
- [ ] Review vulnerability reports
- [ ] Monitor Sentry for patterns

### Monthly
- [ ] `npm audit` check for new vulnerabilities
- [ ] `npm outdated` check for updates
- [ ] Review dependency changelog for patches
- [ ] Update Browserslist database

---

## 🔄 DEPENDENCY MAINTENANCE PLAN

### Weekly
```bash
# Every Monday:
npm audit
# If issues found with severity >= medium, upgrade immediately
```

### Monthly
```bash
# First of each month:
npm outdated                  # See available updates
npm update                    # Auto-update within semver
npm audit fix                 # Fix security issues
npm run test:ci               # Verify changes
npm run build                 # Verify build
```

### Quarterly (Every 3 months)
```bash
# Planned maintenance:
npm install @latest          # Major version checks
review package.json          # Evaluate new versions
test thoroughly             # Full QA
```

### Beyond
- Monitor GitHub Dependabot notifications
- Subscribe to npm security advisories
- Join Firebase release notes mailing list
- Keep eye on React/Vite breaking changes

---

## ⚠️ KNOWN ISSUES & WORKAROUNDS

### 1. Large Chunk Warning
```
(!) Some chunks are larger than 500 kB after minification.
```
**Status**: ⚠️ Expected (bundle includes many features)  
**Mitigation**: Implement manual chunking in vite.config.js (see step 2 above)

### 2. Browserslist Outdated
```
Browserslist: browsers data (caniuse-lite) is 9 months old.
```
**Fix**: `npx update-browserslist-db@latest`

### 3. Double PDF Libraries
```
Both jsPDF and @react-pdf/renderer are installed.
```
**Status**: ✅ OK (jsPDF for sync generation, @react-pdf for async/complex)  
**Future**: Consider consolidating to one if only async needed

### 4. Moment + date-fns Alternative
```
chartjs-adapter-moment still imported but date-fns available
```
**Status**: ✅ OK (moment still in use for appointments)  
**Future**: Migrate to date-fns for -40 KB savings (low priority)

---

## 📞 SUPPORT & ESCALATION

### If Build Fails
```bash
# 1. Check Node version
node --version  # Should be >= 18

# 2. Clean install
rm -rf node_modules package-lock.json
npm install

# 3. Check for peer dependency warnings
npm install --verbose

# 4. Check Vite compatibility
npm ls vite
```

### If Tests Fail
```bash
# Run in verbose mode
npm run test:ci -- --verbose

# Check for React Router breaking changes
# Review react-router-dom v7 migration guide
# https://reactrouter.com/migration/v7
```

### If PDF Generation Broken
```bash
# Check jsPDF version
npm ls jspdf  # Should be >= 4.2.1

# Test in isolation:
# - Create PrescriptionForm.jsx test
# - Generate simple PDF
# - Verify html2canvas → jsPDF flow

# If xss/DOMPurify issues:
# - Check DOMPurify version
# - Verify sanitization config
# - Test with allowedTags config
```

### If Sentry Not Reporting
```bash
# Check DSN set
echo $VITE_SENTRY_DSN  # Must be non-empty

# Verify in browser console:
window.__SENTRY_RELEASE__  # Should exist

# Test manually:
import { captureException } from '@sentry/react';
captureException(new Error('Test error'));
```

---

## ✨ QUICK REFERENCE

### Most Important Files
| File | Purpose | Status |
|------|---------|--------|
| `package.json` | Dependencies | ✅ Updated |
| `package-lock.json` | Lock versions | ✅ Updated |
| `vite.config.js` | Build config | ✅ OK |
| `firestore.rules` | DB security | 🔍 Verify |
| `storage.rules` | Storage security | 🔍 Verify |
| `.env.production` | Secrets | 🔍 Verify |

### Commands You'll Need
```bash
npm run dev              # Development server
npm run build            # Production build
npm run lint             # Code quality
npm run test             # Run tests
npm audit                # Security check
npm audit fix            # Auto-fix vulnerabilities
npm ls package-name      # Check package location
npm outdated             # See available updates
npm update               # Auto-update in semver
```

### Sentry Dashboard
- URL: https://sentry.io
- Project: HealthSync
- Monitor: Errors, Performance, Releases
- Alert: Set up on critical errors

### Firebase Console
- URL: https://console.firebase.google.com
- Project: healthsync-prod (or your project)
- Monitor: Firestore, Storage, Functions, Auth

---

## 🎉 SUMMARY

✅ **Audit Complete**
- 0 vulnerabilities remaining
- 1.5 MB bundle savings
- All tests passing
- Production ready

🚀 **Ready to Deploy**
- Run pre-deployment checklist
- Follow deployment steps
- Monitor post-deployment
- Maintain monthly audits

📚 **Documentation**
- See `AUDIT_SECURITE_DEPENDANCES.md` for full details
- See `EXECUTION_SUMMARY.md` for what was done
- This file for next steps

---

**Date**: 24 Mars 2026  
**Author**: Senior Security & DevOps Expert  
**Next Review**: Mois prochain (Monthly audit check)
