# Testing Export Functionality in Vercel

## 🔧 Pre-Deploy Checklist

- [x] Build completes successfully (`npm run build`)
- [x] All TypeScript errors resolved
- [x] Environment variables configured for Vite
- [x] Debug component added for testing

## 🚀 Deploy to Vercel

### Option 1: GitHub Integration (Recommended)
1. Push your code to GitHub
2. Import the repository in Vercel
3. Deploy automatically

### Option 2: Vercel CLI
```bash
npm install -g vercel
vercel --prod
```

## 🧪 Testing Steps in Vercel

### 1. Basic App Loading
- [ ] App loads without console errors
- [ ] Navigation workflow displays correctly
- [ ] All UI components render properly

### 2. Debug Testing (Built-in)
- [ ] Click "Show Debug Tests" button
- [ ] Run each test button:
  - [ ] **Test CSV Generation** - Should show CSV output
  - [ ] **Test HTML Extraction** - Should extract text elements
  - [ ] **Test Direct DOM** - Should parse DOM elements
  - [ ] **Test CSV Download** - Should download a file

### 3. File Upload Testing
Create and upload these test files:

#### Test File 1: `simple-test.html`
```html
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
    <h1>Welcome to Our App</h1>
    <p>This is a test paragraph.</p>
    <button>Get Started</button>
    <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
    </nav>
</body>
</html>
```

#### Test File 2: `complex-test.html`
```html
<!DOCTYPE html>
<html>
<head><title>Complex Test</title></head>
<body>
    <header>
        <h1>Main Title</h1>
        <nav>
            <a href="/">Home</a>
            <a href="/products">Products</a>
            <a href="/contact">Contact</a>
        </nav>
    </header>
    <main>
        <section>
            <h2>Features</h2>
            <p>Our app provides amazing functionality for text extraction and export.</p>
            <button class="cta-primary">Try Now</button>
            <button class="cta-secondary">Learn More</button>
        </section>
        <form>
            <label for="email">Email Address</label>
            <input type="email" id="email" placeholder="Enter your email">
            <label for="message">Message</label>
            <textarea id="message" placeholder="Your message here"></textarea>
            <button type="submit">Send Message</button>
        </form>
    </main>
    <footer>
        <p>&copy; 2024 Test Company</p>
        <a href="/privacy">Privacy Policy</a>
    </footer>
</body>
</html>
```

### 4. Expected Results

#### Upload Test 1 (simple-test.html)
- [ ] Should extract 5 text elements:
  - "Welcome to Our App" (heading)
  - "This is a test paragraph." (content)
  - "Get Started" (button)
  - "Home" (link)
  - "About" (link)

#### Upload Test 2 (complex-test.html)
- [ ] Should extract 15+ text elements including:
  - Headings (h1, h2)
  - Navigation links
  - Buttons with different types
  - Form labels and placeholders
  - Footer content

### 5. Export Testing
- [ ] Can select/deselect elements
- [ ] Search functionality works
- [ ] CSV export button downloads file
- [ ] Downloaded CSV contains correct columns:
  - id, original_text, edited_text, frame_name, component_path
  - component_type, screen_section, hierarchy, priority
  - is_interactive, font_size, font_weight, etc.

### 6. URL Testing
Test these URL formats:
- [ ] Figma URL: `https://www.figma.com/file/test123/Sample-Design`
- [ ] Bolt URL: `https://bolt.new/project123`
- [ ] General URL: `https://example.com`

Should show mock data with realistic text elements.

## 🐛 Debugging in Production

### Browser Console Checks
Open browser dev tools and check for:
- [ ] No JavaScript errors in Console
- [ ] Network requests complete successfully
- [ ] Local storage works for file processing

### Common Issues to Check

#### 1. File Upload Issues
- Check if FileReader API works
- Verify blob/file processing
- Look for CORS issues

#### 2. CSV Download Issues
- Verify blob creation
- Check download attribute support
- Test in different browsers

#### 3. Text Extraction Issues
- Check DOM parsing works
- Verify text extraction logic
- Look for missing elements

### 7. Performance Testing
- [ ] Large HTML files (>1MB) process within 10 seconds
- [ ] CSV export completes quickly
- [ ] No memory leaks during file processing

## 📊 Success Criteria

✅ **Fully Working** if:
- Debug tests all pass
- File uploads extract text correctly
- CSV exports download successfully
- No console errors
- All major browsers work (Chrome, Firefox, Safari, Edge)

⚠️ **Partial Success** if:
- Basic functionality works
- Some file types fail
- Minor UI issues

❌ **Not Working** if:
- App fails to load
- No text extraction occurs
- CSV export fails completely

## 🔍 Vercel-Specific Checks

### Environment Variables
Check that these are NOT needed (we removed dependencies):
- VITE_FIGMA_ACCESS_TOKEN (optional)
- VITE_BOLT_API_KEY (optional)
- VITE_CURSOR_API_KEY (optional)

### Build Logs
In Vercel dashboard, check:
- [ ] Build completed without errors
- [ ] All assets generated correctly
- [ ] No TypeScript compilation errors

### Function Logs (if using Vercel Functions)
- [ ] No serverless function errors
- [ ] API routes work correctly (if any)

## 🎯 Quick Verification Commands

Run these in browser console on your Vercel deployment:

```javascript
// Test CSV generation
console.log('Testing CSV generation...');
window.testCSV = () => {
  const data = [{id: '1', text: 'Hello', frame: 'Test'}];
  const csv = Object.keys(data[0]).join(',') + '\n' + 
    Object.values(data[0]).map(v => `"${v}"`).join(',');
  console.log('CSV generated:', csv);
  return csv;
};
window.testCSV();

// Test file download
console.log('Testing download...');
window.testDownload = () => {
  const blob = new Blob(['test'], {type: 'text/plain'});
  const url = URL.createObjectURL(blob);
  console.log('Download URL created:', url);
  return url;
};
window.testDownload();

// Test DOM parsing
console.log('Testing DOM parsing...');
const testHTML = '<h1>Test</h1><p>Content</p>';
const parser = new DOMParser();
const doc = parser.parseFromString(testHTML, 'text/html');
console.log('Parsed elements:', doc.querySelectorAll('*').length);
```

Run these tests and verify they work in the Vercel deployment!