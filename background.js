// Store recently opened bookmark URLs to avoid repeats
const MAX_RECENT_HISTORY = 50; // Remember the last 50 opened bookmarks

// Get recently opened bookmarks from storage
async function getRecentlyOpened() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['recentlyOpened'], (result) => {
      resolve(result.recentlyOpened || []);
    });
  });
}

// Save recently opened bookmarks to storage
async function saveRecentlyOpened(recentlyOpened) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ recentlyOpened: recentlyOpened }, resolve);
  });
}

// Get the folder path for a bookmark
async function getBookmarkFolderPath(bookmarkId) {
  return new Promise((resolve) => {
    chrome.bookmarks.get(bookmarkId, (results) => {
      if (!results || results.length === 0) {
        resolve('Unknown');
        return;
      }
      
      const bookmark = results[0];
      const parentId = bookmark.parentId;
      
      if (!parentId) {
        resolve('Root');
        return;
      }
      
      // Build the path by traversing up the tree
      const path = [];
      
      function buildPath(nodeId) {
        chrome.bookmarks.get(nodeId, (nodes) => {
          if (!nodes || nodes.length === 0) {
            resolve(path.reverse().join(' > '));
            return;
          }
          
          const node = nodes[0];
          if (node.title) {
            path.push(node.title);
          }
          
          if (node.parentId) {
            buildPath(node.parentId);
          } else {
            resolve(path.reverse().join(' > '));
          }
        });
      }
      
      buildPath(parentId);
    });
  });
}

// Get the selected folder name from storage
async function getSelectedFolder() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['selectedFolder'], (result) => {
      resolve(result.selectedFolder || null);
    });
  });
}

// Get the last opened bookmark from storage
async function getLastOpenedBookmark() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['lastOpenedBookmark'], (result) => {
      resolve(result.lastOpenedBookmark || null);
    });
  });
}

// Save the last opened bookmark to storage
async function saveLastOpenedBookmark(bookmark) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ lastOpenedBookmark: bookmark }, resolve);
  });
}

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

// Select a random bookmark avoiding recently opened ones
async function selectRandomBookmark(bookmarks) {
  // Get the list of recently opened bookmarks
  const recentlyOpened = await getRecentlyOpened();
  
  // If we have very few bookmarks, just pick randomly
  if (bookmarks.length <= 10) {
    const randomIndex = Math.floor(Math.random() * bookmarks.length);
    return bookmarks[randomIndex];
  }
  
  // Filter out recently opened bookmarks
  const availableBookmarks = bookmarks.filter(
    bookmark => !recentlyOpened.includes(bookmark.url)
  );
  
  // If we've filtered out too many (less than 20% remaining), clear some history
  if (availableBookmarks.length < bookmarks.length * 0.2) {
    // Keep only the most recent 10 in history
    const newRecent = recentlyOpened.slice(-10);
    await saveRecentlyOpened(newRecent);
    return await selectRandomBookmark(bookmarks); // Try again with cleared history
  }
  
  // If all bookmarks have been opened recently, clear history and start fresh
  if (availableBookmarks.length === 0) {
    await saveRecentlyOpened([]);
    const randomIndex = Math.floor(Math.random() * bookmarks.length);
    return bookmarks[randomIndex];
  }
  
  // Pick randomly from available (non-recent) bookmarks
  const randomIndex = Math.floor(Math.random() * availableBookmarks.length);
  return availableBookmarks[randomIndex];
}

// Open a random bookmark in the current tab
async function openRandomBookmark() {
  const folderName = await getSelectedFolder();
  
  if (!folderName) {
    console.error('No folder selected. Please configure the extension in settings.');
    // Show badge to indicate settings needed
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#FFA500" });
    
    // Open options page
    chrome.runtime.openOptionsPage();
    return;
  }
  
  const bookmarks = await getBookmarksFromFolderByName(folderName);
  
  if (bookmarks.length === 0) {
    console.error(`No bookmarks found in folder: ${folderName}`);
    chrome.action.setBadgeText({ text: "0" });
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "" });
    }, 2000);
    return;
  }
  
  // Pick a random bookmark avoiding recent ones
  const randomBookmark = await selectRandomBookmark(bookmarks);
  
  // Store the last opened bookmark in storage (persists across service worker restarts)
  await saveLastOpenedBookmark(randomBookmark);
  
  // Get the folder path for the bookmark
  const folderPath = await getBookmarkFolderPath(randomBookmark.id);
  
  // Update the tooltip to show the actual folder path
  chrome.action.setTitle({ title: `Last opened from: ${folderPath}` });
  
  // Add to recently opened history
  const recentlyOpened = await getRecentlyOpened();
  recentlyOpened.push(randomBookmark.url);
  
  // Keep history size manageable
  if (recentlyOpened.length > MAX_RECENT_HISTORY) {
    recentlyOpened.shift(); // Remove oldest entry
  }
  
  // Save updated history
  await saveRecentlyOpened(recentlyOpened);
  
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
  console.log('Delete function called');
  
  const lastOpenedBookmark = await getLastOpenedBookmark();
  console.log('Last opened bookmark:', lastOpenedBookmark);
  
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
    const deletedUrl = lastOpenedBookmark.url;
    const deletedId = lastOpenedBookmark.id;
    
    console.log('Attempting to delete:', deletedTitle, deletedId);
    
    await chrome.bookmarks.remove(deletedId);
    console.log(`Successfully deleted bookmark: ${deletedTitle}`);
    
    // Remove from recently opened history
    const recentlyOpened = await getRecentlyOpened();
    const updatedRecent = recentlyOpened.filter(url => url !== deletedUrl);
    await saveRecentlyOpened(updatedRecent);
    
    // Clear the stored last opened bookmark
    await chrome.storage.local.remove(['lastOpenedBookmark']);
    
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