# 🔧 Debug CSV Download Issue

## 🎯 Quick Tests to Run

### 1. **Test the Simple Download Button**
I added a "Test Download" button next to the main export button.
- Click it first to see if basic downloads work
- It should download a simple `test.csv` file
- If this works, the issue is with the CSV content generation
- If this doesn't work, it's a browser/permission issue

### 2. **Check Browser Console**
Open Developer Tools (F12) and look for these messages:
```
🔄 Starting CSV export...
✅ CSV content generated, length: [number]
📄 CSV preview: [content preview]
📁 Filename: [filename]
🔄 Trying Method 1: Standard blob download
🖱️ Clicking download link...
```

### 3. **Browser-Specific Issues**

#### **Chrome/Edge:**
- Check if downloads are blocked (look for download icon in address bar)
- Go to Settings → Privacy → Site Settings → Downloads
- Make sure "Ask where to save each file" is enabled or disabled consistently

#### **Firefox:**
- Check if pop-ups are blocked
- Go to Preferences → General → Downloads
- Make sure download folder is set

#### **Safari:**
- Check Downloads preferences
- Make sure download location is set

#### **Any Browser:**
- Try in an Incognito/Private window
- Check if ad blockers are interfering
- Disable browser extensions temporarily

## 🛠️ Manual Test Commands

### Test 1: Basic Browser Download Support
Paste this in browser console:
```javascript
// Test basic download functionality
const testDownload = () => {
  console.log('Testing basic download...');
  const content = 'id,text\ntest1,Hello World\ntest2,Another Row';
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'manual-test.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  console.log('Download attempted');
};
testDownload();
```

### Test 2: Check CSV Generation
```javascript
// Test CSV content generation (when on export page)
if (window.location.pathname.includes('export')) {
  console.log('Testing CSV generation...');
  // This will work when you're on the export page
  console.log('Current prototype data available');
}
```

## 🔍 Common Issues & Solutions

### Issue 1: "Nothing happens when I click download"
**Cause**: Browser blocking downloads
**Solution**: 
- Check browser download settings
- Try different browser
- Use the "Test Download" button first

### Issue 2: "File downloads but is empty"
**Cause**: CSV generation issue
**Solution**: Check console for CSV content length and preview

### Issue 3: "Downloads as .txt instead of .csv"
**Cause**: File type association
**Solution**: 
- Rename file extension to .csv
- Change default app for CSV files

### Issue 4: "Permission denied" or security errors
**Cause**: Browser security restrictions
**Solution**:
- Try incognito mode
- Check site permissions
- Use fallback clipboard method

## 🚨 Fallback Methods Built-in

If download fails, the system will automatically:

1. **Copy to Clipboard**: CSV content copied, paste into text editor
2. **Show Manual Dialog**: Pop-up with CSV content to copy
3. **Console Output**: CSV content logged for manual copy

## 📋 Expected CSV Format

Your downloaded file should look like this:
```csv
id,original_text,edited_text,frame_name,component_path,component_type,screen_section,hierarchy,priority,is_interactive,font_size,font_weight,nearby_elements,element_role,extraction_confidence,extraction_source,context_notes,image
figma_0,Welcome to Our Platform,,Hero Section,Hero Section/heading,heading,header,Figma Design > Hero Section > heading,high,No,,,,,0.92,api,Extracted from Figma Design - heading in header,
figma_1,Get Started Free,,Hero Section,Hero Section/button,button,main,Figma Design > Hero Section > button,high,Yes,,,,,0.92,api,Extracted from Figma Design - button in main,
```

## 🎯 Step-by-Step Debug Process

1. **Deploy to Vercel** (if not already done)
2. **Import a Figma URL** to get text elements
3. **Click "Test Download"** - does a simple file download?
4. **If yes**: Click main "Export" button and check console
5. **If no**: Check browser settings and permissions
6. **Check Downloads folder** for files
7. **Try different browser** if issues persist

## 💡 Immediate Workarounds

If download still doesn't work:

1. **Use the fallback**: When download fails, content will be copied to clipboard
2. **Manual copy**: Open browser console, find the CSV content in logs
3. **Console method**: 
   ```javascript
   // Paste this in console to get CSV content
   console.log(document.querySelector('[data-csv-content]')?.textContent);
   ```

The enhanced download function now has multiple fallback methods, so you should always be able to get your CSV content one way or another!

**Try the "Test Download" button first to isolate the issue!** 🧪