# Random Bookmark Opener

A Chrome extension that helps you rediscover your saved bookmarks by opening random ones from a folder of your choice. Perfect for exploring forgotten gems in your bookmark collection!

## Features

- **Smart Random Selection** - Opens random bookmarks while avoiding recently opened ones
- **Folder Selection** - Choose any bookmark folder (including subfolders)
- **Quick Delete** - Remove broken or unwanted bookmarks with a keyboard shortcut
- **Anti-Repetition** - Remembers the last 50 bookmarks to ensure variety
- **Persistent State** - Remembers your settings and history across browser sessions
- **Visual Feedback** - Badge notifications and tooltip showing the last opened folder path

## Installation

### From Source

1. Download or clone this repository
2. Create the required icon files (`icon16.png`, `icon48.png`, `icon128.png`) and place them in the extension folder
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" (toggle in the top-right corner)
5. Click "Load unpacked"
6. Select the folder containing the extension files

## Setup

1. After installation, right-click the extension icon and select "Options" (or click "Extension options" in the extensions page)
2. Select the bookmark folder you want to use from the tree view
3. Click "Save Settings"

## Usage

### Opening Random Bookmarks

- **Click the extension icon** - Opens a random bookmark from your selected folder in the current tab
- **Hover over the icon** - See the folder path of the last opened bookmark

### Deleting Bookmarks

- **Press `Cmd+Shift+X`** (Mac) or **`Ctrl+Shift+X`** (Windows/Linux) - Deletes the last opened bookmark
- A green checkmark (✓) badge will appear on the icon to confirm deletion

### Visual Indicators

- **Green checkmark (✓)** - Bookmark successfully deleted
- **Red exclamation (!)** - No bookmark to delete or settings needed
- **Red X (✗)** - Error deleting bookmark
- **Orange exclamation (!)** - Extension not configured (opens settings)

## How It Works

### Smart Randomization

The extension uses an intelligent anti-repetition system:

- Remembers the last 50 bookmarks you've opened
- Avoids showing those bookmarks until you've seen more variety
- Automatically manages the history - older entries drop off after 50+ uses
- If you've seen 80% of your bookmarks, it clears some history to provide fresh options

### Persistent Storage

- Your selected folder is saved and persists across browser sessions
- Recently opened bookmarks are tracked to avoid repetition
- Last opened bookmark is stored so you can delete it even if the extension restarts

## File Structure

```
random-bookmark-opener/
├── manifest.json          # Extension configuration
├── background.js          # Main extension logic
├── options.html           # Settings page interface
├── options.js             # Settings page logic
├── icon16.png            # 16x16 icon
├── icon48.png            # 48x48 icon
└── icon128.png           # 128x128 icon
```

## Permissions

The extension requires the following permissions:

- **bookmarks** - To read and delete bookmarks
- **tabs** - To open bookmarks in the current tab
- **storage** - To save your settings and history

## Customization

### Changing the Keyboard Shortcut

1. Go to `chrome://extensions/shortcuts`
2. Find "Random Bookmark Opener"
3. Click the pencil icon next to "Delete last opened bookmark"
4. Set your preferred keyboard shortcut

### Adjusting History Size

Edit `background.js` and change the `MAX_RECENT_HISTORY` constant (default: 50):

```javascript
const MAX_RECENT_HISTORY = 50; // Change this number
```

## Troubleshooting

### Bookmarks not opening

- Make sure you've selected a folder in the settings
- Check that the folder contains bookmarks (not just subfolders)

### Delete function not working

- Ensure you've opened a bookmark first
- Check that the keyboard shortcut isn't conflicting with other extensions
- Try customizing the shortcut in `chrome://extensions/shortcuts`

### Seeing repeated bookmarks

- The extension remembers the last 50 bookmarks
- With fewer than 50 total bookmarks, some repetition is expected
- The history resets automatically when you've seen most of your collection

## Privacy

This extension:

- Only accesses your bookmarks data
- Stores all data locally in your browser
- Does not send any data to external servers
- Does not track your browsing activity

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - feel free to use and modify as needed.

## Tips

- Use this extension to rediscover old bookmarks you've forgotten about
- Great for building a reading habit with saved articles
- Perfect for exploring new websites from your collection
- Quickly clean up broken bookmarks as you encounter them

## Version History

### 1.0
- Initial release
- Random bookmark selection with anti-repetition
- Keyboard shortcut for deleting bookmarks
- Folder selection with tree view
- Visual feedback with badges
- Persistent settings and history

## Built using Claude.AI
