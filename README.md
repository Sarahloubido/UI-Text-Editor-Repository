# UI Text Extraction Tool

A powerful tool for extracting text content from UI prototypes (Figma, Bolt, Cursor/Vercel) with enhanced contextual information for content management workflows.

## Enhanced Features

### 🎯 Advanced Context Detection
- **Component Type Classification**: Automatically identifies buttons, headings, navigation, forms, and more
- **Screen Section Mapping**: Categorizes elements by header, footer, sidebar, main content, etc.
- **Hierarchy Tracking**: Full component hierarchy from page level down to individual elements
- **Priority Scoring**: Intelligent priority assignment based on position, size, and component type

### 📍 Rich Location Context
- **Nearby Elements**: Captures surrounding text for better context understanding
- **Interactive Detection**: Identifies clickable and interactive elements
- **Visual Properties**: Extracts font size, weight, and styling information
- **Spatial Positioning**: Precise bounding box coordinates and screen regions

### 🔌 Platform Support
- **Figma Integration**: Real Figma API support with fallback to enhanced mock data
- **Bolt.new Projects**: Extraction from Bolt-generated applications
- **Cursor/Vercel Apps**: Support for Cursor AI and Vercel deployed prototypes
- **HTML/React Files**: Enhanced parsing of uploaded prototype files
- **Image OCR**: Advanced text extraction from prototype screenshots

### 📊 Enhanced Spreadsheet Export
The exported CSV includes comprehensive context columns:

| Column | Description |
|--------|-------------|
| `original_text` | The extracted text content |
| `edited_text` | Space for content updates |
| `component_type` | button, heading, navigation, form, etc. |
| `screen_section` | header, footer, main, sidebar, modal |
| `hierarchy` | Full component path (e.g., "Page > Header > Navigation > Menu") |
| `priority` | high, medium, low based on importance scoring |
| `is_interactive` | Whether the element is clickable/interactive |
| `font_size` | Text size in pixels |
| `font_weight` | normal, bold, semibold, etc. |
| `nearby_elements` | Text of surrounding elements for context |
| `element_role` | ARIA role or semantic role |
| `extraction_confidence` | AI confidence score (0-1) |
| `extraction_source` | html, image, api, code |

### 🚀 Getting Started

1. **Import Prototype**: Upload files or paste URLs from Figma, Bolt, or Cursor
2. **Review Context**: See enhanced context information with visual indicators
3. **Export Spreadsheet**: Get comprehensive CSV with all contextual data
4. **Edit Content**: Make changes with full context understanding
5. **Apply Updates**: Push changes back to prototype (future feature)

### 🎨 Visual Enhancements
- Color-coded component types (buttons in blue, headings in purple, etc.)
- Priority indicators (high priority in red, medium in yellow)
- Interactive element markers
- Confidence indicators for extraction quality
- Screen section emojis for quick recognition

### 🔧 Setup for Real API Integration

To use real Figma API (optional):
1. Get a Figma access token from your Figma account settings
2. Set environment variable: `REACT_APP_FIGMA_ACCESS_TOKEN=your_token_here`
3. Restart the application

The tool works great with mock data if no API token is provided.

### 📝 Example Use Cases
- **Content Audits**: Identify all button text, headings, and navigation items
- **Localization**: Extract text with full context for translation workflows  
- **Design Reviews**: Understand text hierarchy and relationships
- **Copy Updates**: Make content changes with confidence about placement
- **Accessibility Audits**: Review interactive elements and their labels

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/Sarahloubido/UI-Text-Editor-Repository)