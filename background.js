// Configuration: Set your bookmark folder name here
const FOLDER_NAME = "Dushyant"; // Change this to your folder name

// Store the last opened bookmark
let lastOpenedBookmark = null;

// Get all bookmarks from a specific folder by name (including subfolders)
async function getBookmarksFromFolderByName(folderName) {
  return new Promise((resolve) => {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      let targetFolder = null;
      
      // Recursive function to find folder by name
      function findFolder(nodes) {
        for (const node of nodes) {
          if (node.title === folderName && node.children) {
            targetFolder = node;
            return true;
          }
          if (node.children && findFolder(node.children)) {
            return true;
          }
        }
        return false;
      }
      
      findFolder(bookmarkTreeNodes);
      
      if (!targetFolder) {
        resolve([]);
        return;
      }
      
      // Recursively collect all bookmarks from this folder and its subfolders
      const bookmarks = [];
      
      function collectBookmarks(nodes) {
        for (const node of nodes) {
          if (node.url) {
            // This is a bookmark
            bookmarks.push(node);
          } else if (node.children) {
            // This is a folder, recurse into it
            collectBookmarks(node.children);
          }
        }
      }
      
      collectBookmarks(targetFolder.children);
      resolve(bookmarks);
    });
  });
}

// Open a random bookmark in the current tab
async function openRandomBookmark() {
  const bookmarks = await getBookmarksFromFolderByName(FOLDER_NAME);
  
  if (bookmarks.length === 0) {
    console.error(`No bookmarks found in folder: ${FOLDER_NAME}`);
    return;
  }
  
  // Pick a random bookmark
  const randomIndex = Math.floor(Math.random() * bookmarks.length);
  const randomBookmark = bookmarks[randomIndex];
  
  // Store the last opened bookmark
  lastOpenedBookmark = randomBookmark;
  
  // Reset icon to default
  chrome.action.setBadgeText({ text: "" });
  
  // Get the current active tab and update its URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.update(tabs[0].id, { url: randomBookmark.url });
    }
  });
}

// Delete the last opened bookmark
async function deleteLastBookmark() {
  if (!lastOpenedBookmark) {
    console.log('No bookmark to delete');
    // Show red badge briefly to indicate no bookmark to delete
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "" });
    }, 1500);
    return;
  }
  
  try {
    const deletedTitle = lastOpenedBookmark.title;
    await chrome.bookmarks.remove(lastOpenedBookmark.id);
    console.log(`Deleted bookmark: ${deletedTitle}`);
    lastOpenedBookmark = null;
    
    // Show green checkmark badge briefly to confirm deletion
    chrome.action.setBadgeText({ text: "✓" });
    chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
    
    // Clear badge after 2 seconds
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "" });
    }, 2000);
    
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    // Show red X badge on error
    chrome.action.setBadgeText({ text: "✗" });
    chrome.action.setBadgeBackgroundColor({ color: "#F44336" });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "" });
    }, 2000);
  }
}

// Listen for clicks on the extension icon
chrome.action.onClicked.addListener(() => {
  openRandomBookmark();
});

// Listen for keyboard shortcut commands
chrome.commands.onCommand.addListener((command) => {
  if (command === 'delete-last-bookmark') {
    deleteLastBookmark();
  }
});